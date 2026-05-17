import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";
import { isSupportedState } from "@/lib/states/registry";
import {
  getAllStateServers,
  getStateServer,
} from "@/lib/states/registry.server";
import type { TransactionDoc } from "@/lib/states/types";

// GET /api/admin/payments — list transactions across every state
//
// Multi-state aware: aggregates rows from every per-state collection in
// parallel, sorts by createdAt, then paginates the merged list. Stats are
// computed on the merged list so the dashboard's headline numbers always
// describe the rows currently visible after filtering.
//
// Optional `?state=XX` restricts to a single state's collection (skipping
// the fan-out); other filters (status, search, userId) work the same way as
// before.
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req); // throws if not authenticated

    await connectDB();

    const page      = parseInt(req.nextUrl.searchParams.get("page")  ?? "1");
    const limit     = parseInt(req.nextUrl.searchParams.get("limit") ?? "20");
    const status    = req.nextUrl.searchParams.get("status");
    const search    = req.nextUrl.searchParams.get("search");
    // Filter by the human portal-login ID we copied onto every transaction
    // (e.g. "UP12345"). Lets the admin dashboard drill into one user's bookings
    // without needing to know the Mongo _id behind that login.
    const userId    = req.nextUrl.searchParams.get("userId");
    const stateHint = req.nextUrl.searchParams.get("state");

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (userId) query.userIdLabel = userId;
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ vehicleNo: re }, { ownerName: re }, { transactionId: re }];
    }

    // Pick the collections we'll query in parallel.
    const servers = stateHint && isSupportedState(stateHint)
      ? [getStateServer(stateHint)]
      : getAllStateServers();

    // Fetch matching rows from every selected collection. Admin volume is low
    // so pulling everything and slicing client-side is fine and keeps the
    // per-collection aggregation logic simple.
    const lists = await Promise.all(
      servers.map((s) => s.getModel().find(query).lean<TransactionDoc[]>())
    );
    const merged = lists.flat().sort((a, b) => {
      const ta = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
      const tb = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
      return tb - ta;
    });

    const total = merged.length;
    const start = (page - 1) * limit;
    const transactions = merged.slice(start, start + limit);

    // Summary stats — honour the same filters as the table so the totals on
    // the dashboard always describe the rows currently visible. Computed from
    // the merged list rather than running another round of aggregations.
    const stats = {
      totalAmount:  merged.reduce((s, t) => s + (Number(t.amount) || 0), 0),
      totalCount:   total,
      successCount: merged.filter((t) => t.status === "SUCCESS").length,
      pendingCount: merged.filter((t) => t.status === "PENDING").length,
      failedCount:  merged.filter((t) => t.status === "FAILED").length,
    };

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
      stats,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    const httpStatus = msg.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, message: msg }, { status: httpStatus });
  }
}
