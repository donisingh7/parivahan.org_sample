import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { signToken } from "@/lib/auth";

export const runtime = "nodejs";

// Hardcoded credentials for the /doni control panel — intentionally separate
// from the admin_token / User model login used by /admin.
const DONI_ID       = "doni";
const DONI_PASSWORD = "doni1";

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

// POST /api/doni/login — body: { id, password }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const id       = typeof body.id === "string" ? body.id.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!safeEqual(id, DONI_ID) || !safeEqual(password, DONI_PASSWORD)) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
    }

    const token = await signToken({ userId: DONI_ID, email: DONI_ID, role: "doni" });

    const response = NextResponse.json({ success: true });
    response.cookies.set("doni_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });
    return response;
  } catch (err) {
    console.error("POST /api/doni/login error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
