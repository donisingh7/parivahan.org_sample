import { NextRequest, NextResponse } from "next/server";
import { resolvePortalUser, accountStatus } from "@/lib/portalAuth";

export const runtime = "nodejs";

// Fail-soft empty status — a banner / gateway must never hard-error on this.
const EMPTY = {
  success: true,
  warningActive: false,
  daysRemaining: 0,
  message: "",
  cooldownActive: false,
  cooldownMinutes: 0,
  nextAllowedAt: null as string | null,
  remainingMs: 0,
};

// GET /api/user/account-status — for the logged-in portal user.
// Drives the per-account disable-countdown header banner and the booking
// cooldown block on the /payment/sbi gateway.
export async function GET(req: NextRequest) {
  try {
    const { user } = await resolvePortalUser(req);
    return NextResponse.json({ success: true, ...accountStatus(user) });
  } catch {
    return NextResponse.json(EMPTY);
  }
}
