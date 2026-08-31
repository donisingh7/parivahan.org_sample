import { NextResponse } from "next/server";
import { getSiteSettings, getDaysRemaining, isLockoutActive } from "@/lib/siteSettings";

export const runtime = "nodejs";

// GET /api/site-status — public, read-only.
// Used by the login page (to render the warning popup) and by middleware
// (to decide whether the site should be locked out). Deliberately exposes
// only what's needed publicly, not the raw start date / lockout toggle.
export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json({
      success: true,
      warningEnabled: settings.warningEnabled,
      warningMessage: settings.warningMessage,
      daysRemaining: getDaysRemaining(settings.warningStartDate),
      lockoutActive: isLockoutActive(settings),
    });
  } catch (err) {
    console.error("GET /api/site-status error:", err);
    // Fail open on warning/lockout so a DB hiccup never blocks real login.
    return NextResponse.json({
      success: false,
      warningEnabled: false,
      warningMessage: "",
      daysRemaining: 0,
      lockoutActive: false,
    });
  }
}
