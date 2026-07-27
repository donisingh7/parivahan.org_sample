import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { connectDB } from "@/lib/mongodb";
import PortalUser from "@/models/PortalUser";
import { requireAuth } from "@/lib/auth";
import { getAllStateServers } from "@/lib/states/registry.server";
import { deleteReceipts } from "@/lib/aws/s3";

export const runtime = "nodejs";

// Only these portal-user types may be reset from the admin panel. Enforced
// server-side so the UI restriction can't be bypassed.
const RESETTABLE_TYPES = ["family", "test", "reselling"];

// Reselling accounts need an extra layer: the admin must supply an
// authentication password (RESELLING_AUTH_PASSWORD env) on top of being a
// logged-in admin before a reselling user can be reset. Family / test don't.
const AUTH_REQUIRED_TYPES = ["reselling"];

// Constant-time string compare so a wrong auth password can't be timed out.
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

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
    const authPassword = typeof body.authPassword === "string" ? body.authPassword : "";

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

    // Extra auth layer for reselling accounts.
    if (AUTH_REQUIRED_TYPES.includes(type)) {
      const expected = process.env.RESELLING_AUTH_PASSWORD ?? "";
      if (!expected) {
        return NextResponse.json(
          { success: false, message: "Reselling auth password is not configured on the server" },
          { status: 500 }
        );
      }
      if (!authPassword || !safeEqual(authPassword, expected)) {
        return NextResponse.json(
          { success: false, message: "Invalid authentication password" },
          { status: 401 }
        );
      }
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
