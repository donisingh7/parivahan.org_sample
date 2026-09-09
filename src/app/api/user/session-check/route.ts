import { NextRequest, NextResponse } from "next/server";
import { resolvePortalUser } from "@/lib/portalAuth";

export const runtime = "nodejs";

// GET /api/user/session-check — internal, called by middleware only.
// Returns { valid } after running the full DB-backed portal check (token +
// scheduled auto-disable + isActive + single-session sid match).
export async function GET(req: NextRequest) {
  try {
    await resolvePortalUser(req);
    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json({ valid: false }, { status: 401 });
  }
}
