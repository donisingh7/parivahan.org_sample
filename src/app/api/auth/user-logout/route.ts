import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import PortalUser from "@/models/PortalUser";

export const runtime = "nodejs";

// POST /api/auth/user-logout
// Clears the cookie AND the server-side live session, so a clean logout never
// leaves a "session still live" marker that would lock the account on next login.
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("user_token")?.value;
    if (token && process.env.MOCK_DB !== "true") {
      const payload = await verifyToken(token).catch(() => null);
      if (payload?.userId) {
        await connectDB();
        await PortalUser.updateOne(
          { _id: payload.userId, sessionId: payload.sid ?? "" },
          { $set: { sessionId: "", sessionExpiresAt: null } }
        );
      }
    }
  } catch (err) {
    console.error("POST /api/auth/user-logout error:", err);
    // fall through — always clear the cookie
  }

  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.set("user_token", "", { maxAge: 0, path: "/" });
  return response;
}
