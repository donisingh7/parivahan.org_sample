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

  // ── 1b. Protect /doni/dashboard — fully separate from admin_token ──────────
  if (pathname === "/doni/dashboard" || pathname.startsWith("/doni/dashboard/")) {
    const token = req.cookies.get("doni_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/doni", req.url));
    }
    try {
      await verifyToken(token);
    } catch {
      const res = NextResponse.redirect(new URL("/doni", req.url));
      res.cookies.set("doni_token", "", { maxAge: 0, path: "/" });
      return res;
    }
  }

  // ── 2. Protect checkpost + payment-gateway pages — require user login ──────
  // /payment/sbi is added so a user cannot deep-link past the form into the
  // gateway and then submit a transaction without ever logging in.
  const isCheckpost =
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

  // ── 3. Site-wide lockout — controlled from /doni/dashboard ──────────────────
  // Once lockoutEnabled is flipped on and the 7-day warning window has
  // elapsed, the public-facing pages redirect to /site-unavailable. The
  // /doni and /admin panels stay reachable so the lockout can be turned off.
  const isLockGuarded =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/en/node/579" ||
    isCheckpost;

  if (isLockGuarded) {
    try {
      const statusRes = await fetch(new URL("/api/site-status", req.url));
      const status = await statusRes.json();
      if (status?.lockoutActive) {
        return NextResponse.redirect(new URL("/site-unavailable", req.url));
      }
    } catch {
      // Fail open — a status-check hiccup should never take the whole site down.
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/en/node/579",
    "/admin/dashboard/:path*",
    "/doni/dashboard",
    "/doni/dashboard/:path*",
    "/checkpost",
    "/checkpost/:path*",
    "/payment/sbi",
    "/payment/sbi/:path*",
  ],
};
