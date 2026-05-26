import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import PortalUser from "@/models/PortalUser";
import { verifyToken } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * POST /api/auth/verify-payment-credentials
 *
 * Used by the SBI gateway "Verify Your Identity" step. Enforces that the
 * credentials entered there match the SAME portal account that's currently
 * logged in (via the user_token cookie). This stops a logged-in user from
 * paying with someone else's User ID — every transaction is tied to exactly
 * one identity end-to-end.
 *
 * Returns:
 *   200 { success: true }              when both checks pass
 *   401 { success: false, message: …, code: "USERID_MISMATCH" | "INVALID_PASSWORD" | "NOT_LOGGED_IN" }
 *   400 { success: false, message: … } on a missing field
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, password } = await req.json();
    if (!userId || !password) {
      return NextResponse.json(
        { success: false, message: "User ID and password are required" },
        { status: 400 }
      );
    }

    // ── Mock mode: just verify the session cookie exists, skip DB lookup ─────
    if (process.env.MOCK_DB === "true") {
      const cookieToken = req.cookies.get("user_token")?.value;
      if (!cookieToken) {
        return NextResponse.json(
          { success: false, code: "NOT_LOGGED_IN", message: "Your portal session has expired. Please log in again." },
          { status: 401 }
        );
      }
      return NextResponse.json({ success: true });
    }

    const cookieToken = req.cookies.get("user_token")?.value;
    if (!cookieToken) {
      return NextResponse.json(
        {
          success: false,
          code: "NOT_LOGGED_IN",
          message: "Your portal session has expired. Please log in again.",
        },
        { status: 401 }
      );
    }

    let payload;
    try {
      payload = await verifyToken(cookieToken);
    } catch {
      return NextResponse.json(
        {
          success: false,
          code: "NOT_LOGGED_IN",
          message: "Your portal session has expired. Please log in again.",
        },
        { status: 401 }
      );
    }

    // payload.email holds the human portal login (set in /api/auth/user-login)
    const cookieUserId = (payload.email ?? "").toString().trim();
    const submittedUserId = String(userId).trim();

    if (cookieUserId.toLowerCase() !== submittedUserId.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          code: "USERID_MISMATCH",
          message:
            "The User ID must match the one you used to log in to the portal. Please re-enter your own credentials.",
        },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await PortalUser.findOne({ userId: submittedUserId });
    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, code: "INVALID_PASSWORD", message: "Invalid credentials." },
        { status: 401 }
      );
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return NextResponse.json(
        { success: false, code: "INVALID_PASSWORD", message: "Invalid password." },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/auth/verify-payment-credentials error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
