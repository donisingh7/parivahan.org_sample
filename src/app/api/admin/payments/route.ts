import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { requireAuth } from "@/lib/auth";

// GET /api/admin/payments — list all transactions (paginated)
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req); // throws if not authenticated

    await connectDB();

    const page   = parseInt(req.nextUrl.searchParams.get("page")  ?? "1");
    const limit  = parseInt(req.nextUrl.searchParams.get("limit") ?? "20");
    const status = req.nextUrl.searchParams.get("status");
    const search = req.nextUrl.searchParams.get("search");

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ vehicleNo: re }, { ownerName: re }, { transactionId: re }];
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(query),
    ]);

    // Summary stats
    const [stats] = await Transaction.aggregate([
      { $group: {
        _id: null,
        totalAmount:  { $sum: "$amount" },
        totalCount:   { $sum: 1 },
        successCount: { $sum: { $cond: [{ $eq: ["$status","SUCCESS"] }, 1, 0] } },
        pendingCount: { $sum: { $cond: [{ $eq: ["$status","PENDING"] }, 1, 0] } },
        failedCount:  { $sum: { $cond: [{ $eq: ["$status","FAILED"]  }, 1, 0] } },
      }},
    ]);

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: stats ?? { totalAmount:0, totalCount:0, successCount:0, pendingCount:0, failedCount:0 },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    const status = msg.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
