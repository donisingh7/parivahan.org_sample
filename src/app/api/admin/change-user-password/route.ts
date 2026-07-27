import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import PortalUser from "@/models/PortalUser";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";

// Only these portal-user types may have their password changed from the admin
// panel. Enforced server-side so the UI restriction can't be bypassed.
const CHANGEABLE_TYPES = ["family", "test"];

/**
 * POST /api/admin/change-user-password
 * Body: { userId: string (login id), newPassword: string }
 *
 * Admin-only. Sets a new password for a family/test portal user. The password
 * is bcrypt-hashed by the PortalUser pre-save hook — never stored in plaintext.
 */
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    await connectDB();

    const body = await req.json().catch(() => ({}));
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!userId) {
      return NextResponse.json({ success: false, message: "userId is required" }, { status: 400 });
    }
    if (newPassword.length < 4) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 4 characters" },
        { status: 400 }
      );
    }

    const user = await PortalUser.findOne({ id: userId });
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const type = (user.type || "").toLowerCase();
    if (!CHANGEABLE_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, message: `Password can only be changed for ${CHANGEABLE_TYPES.join(" / ")} users` },
        { status: 403 }
      );
    }

    // Assigning + save() triggers the bcrypt pre-save hook (see PortalUser model).
    user.password = newPassword;
    await user.save();

    return NextResponse.json({ success: true, message: `Password updated for ${userId}` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    const httpStatus = msg.startsWith("Unauthorized") ? 401 : 500;
    console.error("POST /api/admin/change-user-password error:", err);
    return NextResponse.json({ success: false, message: msg }, { status: httpStatus });
  }
}
