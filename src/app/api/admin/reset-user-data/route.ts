import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import PortalUser from "@/models/PortalUser";
import { requireAuth } from "@/lib/auth";
import { getAllStateServers } from "@/lib/states/registry.server";
import { deleteReceipts } from "@/lib/aws/s3";

export const runtime = "nodejs";

// Only these portal-user types may be reset from the admin panel. Enforced
// server-side so the UI restriction can't be bypassed.
const RESETTABLE_TYPES = ["family", "test"];

/**
 * POST /api/admin/reset-user-data
 * Body: { userId: string, deleteTransactions?: boolean, deleteReceipts?: boolean }
 *
 * Admin-only. "Reset" a family/test portal user's history:
 *   • deleteReceipts     — delete the user's receipt PDFs from S3
 *   • deleteTransactions — delete the user's booking rows from every state
 *                          collection (this is what drops their amount to ₹0
 *                          and clears their booking history)
 *
 * The PortalUser account itself is never touched — it stays active so the user
 * can start booking again. This is irreversible (no backup is taken).
 */
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);

    const body = await req.json().catch(() => ({}));
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    const doTxns = body.deleteTransactions === true;
    const doReceipts = body.deleteReceipts === true;

    if (!userId) {
      return NextResponse.json({ success: false, message: "userId is required" }, { status: 400 });
    }
    if (!doTxns && !doReceipts) {
      return NextResponse.json(
        { success: false, message: "Select at least one thing to delete" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await PortalUser.findOne({ id: userId });
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }
    const type = (user.type || "").toLowerCase();
    if (!RESETTABLE_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, message: `Only ${RESETTABLE_TYPES.join(" / ")} users can be reset` },
        { status: 403 }
      );
    }

    const servers = getAllStateServers();

    // 1. Collect this user's S3 receipt keys BEFORE deleting the rows (deleting
    //    the transactions first would lose the keys).
    let deletedReceipts = 0;
    if (doReceipts) {
      const keyLists = await Promise.all(
        servers.map(async (s) => {
          const rows = await s
            .getModel()
            .find({ userIdLabel: userId, s3Key: { $ne: "" } }, { s3Key: 1 })
            .lean<{ s3Key: string }[]>();
          return rows.map((r) => r.s3Key).filter(Boolean);
        })
      );
      const allKeys = keyLists.flat();
      deletedReceipts = await deleteReceipts(allKeys);
    }

    // 2. Delete the booking transactions across every state collection.
    let deletedTransactions = 0;
    if (doTxns) {
      const results = await Promise.all(
        servers.map((s) => s.getModel().deleteMany({ userIdLabel: userId }))
      );
      deletedTransactions = results.reduce((sum, r) => sum + (r.deletedCount ?? 0), 0);
    }

    return NextResponse.json({
      success: true,
      userId,
      deletedTransactions,
      deletedReceipts,
      message: `Reset ${userId}: ${deletedTransactions} transaction(s), ${deletedReceipts} receipt(s) deleted`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    const httpStatus = msg.startsWith("Unauthorized") ? 401 : 500;
    console.error("POST /api/admin/reset-user-data error:", err);
    return NextResponse.json({ success: false, message: msg }, { status: httpStatus });
  }
}
