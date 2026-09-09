import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { connectDB } from "@/lib/mongodb";
import PortalUser from "@/models/PortalUser";
import { signToken, verifyToken } from "@/lib/auth";
import { runScheduledDisable } from "@/lib/portalAuth";

export const runtime = "nodejs";

const SESSION_MS = 8 * 60 * 60 * 1000; // 8 hours — matches the cookie/JWT lifetime

// POST /api/auth/user-login
export async function POST(req: NextRequest) {
  try {
    const { userId, password } = await req.json();

    if (!userId || !password) {
      return NextResponse.json(
        { success: false, message: "User ID and password are required" },
        { status: 400 }
      );
    }

    // ── Mock mode: bypass DB, return a real JWT so the full UI flow works ────
    if (process.env.MOCK_DB === "true") {
      const token = await signToken({ userId: "mock-user", email: userId.trim(), role: "user" });
      const response = NextResponse.json({
        success: true,
        token,
        user: { userId: userId.trim(), name: "Mock User", mobileNo: "9999999999" },
      });
      response.cookies.set("user_token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 60 * 60 * 8,
        path: "/",
      });
      return response;
    }

    await connectDB();

    const user = await PortalUser.findOne({ id: userId.trim() });
    if (!user) {
      return NextResponse.json({ success: false, message: "Invalid User ID or password" }, { status: 401 });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return NextResponse.json({ success: false, message: "Invalid User ID or password" }, { status: 401 });
    }

    // A scheduled auto-disable that has already elapsed takes effect now.
    await runScheduledDisable(user);

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, code: "ACCOUNT_DISABLED", message: "Your account has been disabled. Contact the administrator." },
        { status: 401 }
      );
    }

    // ── Strict single session ────────────────────────────────────────────────
    // If a live session already exists on this account and the current request
    // is NOT that same session re-authenticating (matching sid in the cookie),
    // a second device/location is logging in → lock the whole account.
    const sessionLive =
      !!user.sessionId &&
      !!user.sessionExpiresAt &&
      new Date(user.sessionExpiresAt).getTime() > Date.now();

    let incomingSid = "";
    const existingCookie = req.cookies.get("user_token")?.value;
    if (existingCookie) {
      try {
        const p = await verifyToken(existingCookie);
        incomingSid = p.sid ?? "";
      } catch { /* stale/invalid cookie — treated as a different session */ }
    }
    const sameSession = sessionLive && incomingSid !== "" && incomingSid === user.sessionId;

    if (sessionLive && !sameSession) {
      user.isActive         = false;
      user.sessionId        = "";
      user.sessionExpiresAt = null;
      await user.save();
      return NextResponse.json(
        {
          success: false,
          code: "ACCOUNT_LOCKED",
          message:
            "Account locked — it was signed in from another device or location. Contact the administrator.",
        },
        { status: 403 }
      );
    }

    const sid = randomUUID();
    user.sessionId        = sid;
    user.sessionExpiresAt = new Date(Date.now() + SESSION_MS);
    await user.save();

    const token = await signToken({ userId: user._id.toString(), email: user.id, role: "user", sid });

    const response = NextResponse.json({
      success: true,
      token,
      user: { userId: user.id, type: user.type },
    });

    response.cookies.set("user_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("POST /api/auth/user-login error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
