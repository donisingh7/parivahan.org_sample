import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── 1. Protect admin dashboard ──────────────────────────────────────────────
  if (pathname.startsWith("/admin/dashboard")) {
    const token = req.cookies.get("admin_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    try {
      await verifyToken(token);
    } catch {
      const res = NextResponse.redirect(new URL("/admin", req.url));
      res.cookies.set("admin_token", "", { maxAge: 0, path: "/" });
      return res;
    }
  }

  // ── 2. Protect checkpost + payment-gateway pages — require user login ──────
  // /payment/sbi is added so a user cannot deep-link past the form into the
  // gateway and then submit a transaction without ever logging in.
  const isCheckpost =
    pathname === "/en/node/579" ||
    pathname === "/checkpost" ||
    pathname.startsWith("/checkpost/") ||
    pathname.startsWith("/payment/sbi");

  if (isCheckpost) {
    const token = req.cookies.get("user_token")?.value;
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname + req.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
    try {
      await verifyToken(token);
    } catch {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.set("user_token", "", { maxAge: 0, path: "/" });
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/dashboard/:path*",
    "/en/node/579",
    "/checkpost",
    "/checkpost/:path*",
    "/payment/sbi",
    "/payment/sbi/:path*",
  ],
};
