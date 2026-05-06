import { NextResponse } from "next/server";

// POST /api/auth/user-logout
export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.set("user_token", "", { maxAge: 0, path: "/" });
  return response;
}
