import { NextResponse } from "next/server";

// POST /api/auth/logout — clear the cookie
export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.set("admin_token", "", { maxAge: 0, path: "/" });
  return response;
}
