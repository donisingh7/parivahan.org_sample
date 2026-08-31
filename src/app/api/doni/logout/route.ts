import { NextResponse } from "next/server";

// POST /api/doni/logout — clear the doni_token cookie
export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.set("doni_token", "", { maxAge: 0, path: "/" });
  return response;
}
