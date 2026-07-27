import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { connectDB } from "@/lib/mongodb";
import PortalUser from "@/models/PortalUser";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";

// Only these portal-user types may have their password changed from the admin
// panel. Enforced server-side so the UI restriction can't be bypassed.
const CHANGEABLE_TYPES = ["family", "test", "reselling"];

// Reselling accounts need an extra layer: the admin must supply an
// authentication password (RESELLING_AUTH_PASSWORD env var) on top of being a
// logged-in admin before a reselling user's password can be changed. Family /
// test users don't need it.
const AUTH_REQUIRED_TYPES = ["reselling"];

// Constant-time string compare so a wrong auth password can't be timed out.
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/**
 * POST /api/admin/change-user-password
 * Body: { userId: string (login id), newPassword: string, authPassword?: string }
 *
 * Admin-only. Sets a new password for a family / test / reselling portal user.
 * Reselling users require a valid `authPassword` (RESELLING_AUTH_PASSWORD env).
 * The password is bcrypt-hashed by the PortalUser pre-save hook — never stored
 * in plaintext.
 */
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    await connectDB();

    const body = await req.json().catch(() => ({}));
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
    const authPassword = typeof body.authPassword === "string" ? body.authPassword : "";

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
