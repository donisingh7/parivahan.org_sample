import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import PortalUser from "@/models/PortalUser";
import { requireAuth } from "@/lib/auth";
import { getAllStateServers } from "@/lib/states/registry.server";

export const runtime = "nodejs";

interface UserBookingRow {
  portalUserId:   string;   // login ID
  type:           string;
  isActive:       boolean;
  bookingCount:   number;
  successCount:   number;
  pendingCount:   number;
  failedCount:    number;
  totalAmount:    number;
  successAmount:  number;   // sum of amount for SUCCESS rows only
  firstBookingAt: string | null;
  lastBookingAt:  string | null;
}

interface AggRow {
  _id:            string;
  bookingCount:   number;
  totalAmount:    number;
  successCount:   number;
  pendingCount:   number;
  failedCount:    number;
  successAmount:  number;
  firstBookingAt: Date;
  lastBookingAt:  Date;
}

// Combine two AggRow values (used to fold per-state aggregations into a single
// per-user row). Keeps the shape unchanged so the rest of the route is
// state-blind.
function mergeAgg(a: AggRow, b: AggRow): AggRow {
  return {
    _id:            a._id,
    bookingCount:   a.bookingCount   + b.bookingCount,
    totalAmount:    a.totalAmount    + b.totalAmount,
    successCount:   a.successCount   + b.successCount,
    pendingCount:   a.pendingCount   + b.pendingCount,
    failedCount:    a.failedCount    + b.failedCount,
    successAmount:  a.successAmount  + b.successAmount,
    firstBookingAt: a.firstBookingAt < b.firstBookingAt ? a.firstBookingAt : b.firstBookingAt,
    lastBookingAt:  a.lastBookingAt  > b.lastBookingAt  ? a.lastBookingAt  : b.lastBookingAt,
  };
}

const GROUP_STAGE = {
  $group: {
    _id:            "$userIdLabel",
    bookingCount:   { $sum: 1 },
    totalAmount:    { $sum: "$amount" },
    successCount:   { $sum: { $cond: [{ $eq: ["$status", "SUCCESS"] }, 1, 0] } },
    pendingCount:   { $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] } },
    failedCount:    { $sum: { $cond: [{ $eq: ["$status", "FAILED"]  }, 1, 0] } },
    successAmount:  { $sum: { $cond: [{ $eq: ["$status", "SUCCESS"] }, "$amount", 0] } },
    firstBookingAt: { $min: "$createdAt" },
    lastBookingAt:  { $max: "$createdAt" },
  },
};

const ANON_GROUP_STAGE = {
  $group: {
    ...GROUP_STAGE.$group,
    _id: null,
  },
};

/**
 * GET /api/admin/users-bookings
 *
 * Per-portal-user booking breakdown for the admin dashboard. Aggregates the
 * same pipeline against every per-state collection in parallel and folds the
 * partial results back into a single per-user row, so a portal user who paid
 * tax in three different states still shows up as one entry with the totals
 * summed.
 */
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    await connectDB();

    // ── 1. Pull all portal users so zero-booking users are included ─────
    const users = await PortalUser.find(
      {},
      { id: 1, type: 1, isActive: 1 }
    )
      .sort({ id: 1 })
      .lean();

    // ── 2. Aggregate bookings per user across every state collection ────
    const servers = getAllStateServers();
    const perStateAgg = await Promise.all(
      servers.map((s) =>
        s.getModel().aggregate([
          { $match: { userIdLabel: { $ne: "" } } },
          GROUP_STAGE,
        ]) as Promise<AggRow[]>
      )
    );

    // Fold all per-state results into a single map keyed by login ID.
    const aggByUser = new Map<string, AggRow>();
    for (const list of perStateAgg) {
      for (const row of list) {
        const existing = aggByUser.get(row._id);
        aggByUser.set(row._id, existing ? mergeAgg(existing, row) : row);
      }
    }

    // ── 3. Anonymous bookings — payments where no portal user was logged in.
    const perStateAnon = await Promise.all(
      servers.map((s) =>
        s.getModel().aggregate([
          { $match: { userIdLabel: "" } },
          ANON_GROUP_STAGE,
        ]) as Promise<AggRow[]>
      )
    );
    let anonAgg: AggRow | null = null;
    for (const list of perStateAnon) {
      for (const row of list) {
        const normalized: AggRow = {
          _id:            "",
          bookingCount:   row.bookingCount,
          totalAmount:    row.totalAmount,
          successCount:   row.successCount,
          pendingCount:   row.pendingCount,
          failedCount:    row.failedCount,
          successAmount:  row.successAmount,
          firstBookingAt: row.firstBookingAt,
          lastBookingAt:  row.lastBookingAt,
        };
        anonAgg = anonAgg ? mergeAgg(anonAgg, normalized) : normalized;
      }
    }

    // ── 4. Stitch portal users + their booking stats together ───────────
    const rows: UserBookingRow[] = users.map((u) => {
      const a = aggByUser.get(u.id);
      return {
        portalUserId:   u.id,
        type:           u.type,
        isActive:       u.isActive,
        bookingCount:   a?.bookingCount  ?? 0,
        successCount:   a?.successCount  ?? 0,
        pendingCount:   a?.pendingCount  ?? 0,
        failedCount:    a?.failedCount   ?? 0,
        totalAmount:    a?.totalAmount   ?? 0,
        successAmount:  a?.successAmount ?? 0,
        firstBookingAt: a?.firstBookingAt ? new Date(a.firstBookingAt).toISOString() : null,
        lastBookingAt:  a?.lastBookingAt  ? new Date(a.lastBookingAt).toISOString()  : null,
      };
    });

    // Sort: most active users first, then by name as tie-breaker.
    rows.sort((a, b) => b.bookingCount - a.bookingCount || a.portalUserId.localeCompare(b.portalUserId));

    // ── 5. Top-level summary across every portal-user booking ───────────
    const summary = {
      totalUsers:         users.length,
      activeUserCount:    rows.filter((r) => r.bookingCount > 0).length,
      totalBookings:      rows.reduce((s, r) => s + r.bookingCount, 0),
      totalAmount:        rows.reduce((s, r) => s + r.totalAmount,  0),
      totalSuccessAmount: rows.reduce((s, r) => s + r.successAmount, 0),
    };

    return NextResponse.json({
      success:   true,
      users:     rows,
      anonymous: anonAgg
        ? {
            bookingCount:   anonAgg.bookingCount,
            totalAmount:    anonAgg.totalAmount,
            successCount:   anonAgg.successCount,
            pendingCount:   anonAgg.pendingCount,
            failedCount:    anonAgg.failedCount,
            successAmount:  anonAgg.successAmount,
            firstBookingAt: anonAgg.firstBookingAt
              ? new Date(anonAgg.firstBookingAt).toISOString()
              : null,
            lastBookingAt:  anonAgg.lastBookingAt
              ? new Date(anonAgg.lastBookingAt).toISOString()
              : null,
          }
        : null,
      summary,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    const httpStatus = msg.startsWith("Unauthorized") ? 401 : 500;
    console.error("GET /api/admin/users-bookings error:", err);
    return NextResponse.json({ success: false, message: msg }, { status: httpStatus });
  }
}
