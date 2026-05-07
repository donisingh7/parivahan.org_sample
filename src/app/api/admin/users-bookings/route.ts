import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import PortalUser from "@/models/PortalUser";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";

interface UserBookingRow {
  portalUserId:   string;   // human login ID, e.g. "UP12345"
  name:           string;
  mobileNo:       string;
  email:          string;
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

/**
 * GET /api/admin/users-bookings
 *
 * Per-portal-user booking breakdown for the admin dashboard. We start from the
 * full PortalUser collection (so users with zero bookings still appear) and
 * left-join the aggregated booking stats keyed on `userIdLabel` (the human
 * login ID we copy onto every Transaction at /api/payment time).
 */
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    await connectDB();

    // ── 1. Pull all portal users so zero-booking users are included ─────
    const users = await PortalUser.find(
      {},
      { userId: 1, name: 1, mobileNo: 1, email: 1, isActive: 1 }
    )
      .sort({ name: 1 })
      .lean();

    // ── 2. Aggregate bookings grouped by the login ID we stored on the txn ─
    // We group on `userIdLabel` because that matches PortalUser.userId 1-to-1
    // and survives even if the Mongo _id shape changes in legacy data.
    type Agg = {
      _id:            string;
      bookingCount:   number;
      totalAmount:    number;
      successCount:   number;
      pendingCount:   number;
      failedCount:    number;
      successAmount:  number;
      firstBookingAt: Date;
      lastBookingAt:  Date;
    };
    const agg = (await Transaction.aggregate([
      { $match: { userIdLabel: { $ne: "" } } },
      {
        $group: {
          _id:            "$userIdLabel",
          bookingCount:   { $sum: 1 },
          totalAmount:    { $sum: "$amount" },
          successCount:   { $sum: { $cond: [{ $eq: ["$status", "SUCCESS"] }, 1, 0] } },
          pendingCount:   { $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] } },
          failedCount:    { $sum: { $cond: [{ $eq: ["$status", "FAILED"]  }, 1, 0] } },
          successAmount:  {
            $sum: { $cond: [{ $eq: ["$status", "SUCCESS"] }, "$amount", 0] },
          },
          firstBookingAt: { $min: "$createdAt" },
          lastBookingAt:  { $max: "$createdAt" },
        },
      },
    ])) as Agg[];

    // Index aggregation rows by login ID for O(1) merge with the user list.
    const aggByUser = new Map<string, Agg>();
    for (const row of agg) aggByUser.set(row._id, row);

    // ── 3. Anonymous bookings — payments where no portal user was logged in.
    // Surfacing this lets admins notice a misconfiguration where the SBI step
    // is somehow being reached without authentication.
    const [anonAgg] = (await Transaction.aggregate([
      { $match: { userIdLabel: "" } },
      {
        $group: {
          _id: null,
          bookingCount:   { $sum: 1 },
          totalAmount:    { $sum: "$amount" },
          successCount:   { $sum: { $cond: [{ $eq: ["$status", "SUCCESS"] }, 1, 0] } },
          pendingCount:   { $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] } },
          failedCount:    { $sum: { $cond: [{ $eq: ["$status", "FAILED"]  }, 1, 0] } },
          successAmount:  {
            $sum: { $cond: [{ $eq: ["$status", "SUCCESS"] }, "$amount", 0] },
          },
          firstBookingAt: { $min: "$createdAt" },
          lastBookingAt:  { $max: "$createdAt" },
        },
      },
    ])) as (Agg | undefined)[];

    // ── 4. Stitch portal users + their booking stats together ───────────
    const rows: UserBookingRow[] = users.map((u) => {
      const a = aggByUser.get(u.userId);
      return {
        portalUserId:   u.userId,
        name:           u.name,
        mobileNo:       u.mobileNo ?? "",
        email:          u.email ?? "",
        isActive:       u.isActive,
        bookingCount:   a?.bookingCount ?? 0,
        successCount:   a?.successCount ?? 0,
        pendingCount:   a?.pendingCount ?? 0,
        failedCount:    a?.failedCount  ?? 0,
        totalAmount:    a?.totalAmount  ?? 0,
        successAmount:  a?.successAmount ?? 0,
        firstBookingAt: a?.firstBookingAt ? new Date(a.firstBookingAt).toISOString() : null,
        lastBookingAt:  a?.lastBookingAt  ? new Date(a.lastBookingAt).toISOString()  : null,
      };
    });

    // Sort: most active users first, then by name as tie-breaker.
    rows.sort((a, b) => b.bookingCount - a.bookingCount || a.name.localeCompare(b.name));

    // ── 5. Top-level summary across every portal-user booking ───────────
    const summary = {
      totalUsers:       users.length,
      activeUserCount:  rows.filter((r) => r.bookingCount > 0).length,
      totalBookings:    rows.reduce((s, r) => s + r.bookingCount, 0),
      totalAmount:      rows.reduce((s, r) => s + r.totalAmount,  0),
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
    const status = msg.startsWith("Unauthorized") ? 401 : 500;
    console.error("GET /api/admin/users-bookings error:", err);
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
