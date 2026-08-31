import { NextRequest, NextResponse } from "next/server";
import { requireDoniAuth } from "@/lib/auth";
import { getSiteSettings, getWarningExpiryDate, isLockoutActive } from "@/lib/siteSettings";
import SiteSettings from "@/models/SiteSettings";

export const runtime = "nodejs";

// GET /api/doni/site-settings — doni-panel only. Full settings for the /doni/dashboard control panel.
export async function GET(req: NextRequest) {
  try {
    await requireDoniAuth(req);
  } catch {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await getSiteSettings();
    return NextResponse.json({
      success: true,
      warningEnabled: settings.warningEnabled,
      warningMessage: settings.warningMessage,
      warningStartDate: settings.warningStartDate,
      lockoutEnabled: settings.lockoutEnabled,
      warningExpiryDate: getWarningExpiryDate(settings.warningStartDate),
      lockoutActive: isLockoutActive(settings),
    });
  } catch (err) {
    console.error("GET /api/doni/site-settings error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

// PUT /api/doni/site-settings — doni-panel only. Body may include any subset of:
// { warningEnabled, warningMessage, warningStartDate, lockoutEnabled }
export async function PUT(req: NextRequest) {
  try {
    await requireDoniAuth(req);
  } catch {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    await getSiteSettings(); // ensures the singleton row exists

    const body = await req.json().catch(() => ({}));
    const update: Record<string, unknown> = {};

    if (typeof body.warningEnabled === "boolean") update.warningEnabled = body.warningEnabled;
    if (typeof body.lockoutEnabled === "boolean") update.lockoutEnabled = body.lockoutEnabled;
    if (typeof body.warningMessage === "string" && body.warningMessage.trim()) {
      update.warningMessage = body.warningMessage.trim();
    }
    if (typeof body.warningStartDate === "string" && body.warningStartDate) {
      const parsed = new Date(body.warningStartDate);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ success: false, message: "Invalid warningStartDate" }, { status: 400 });
      }
      update.warningStartDate = parsed;
    }

    const settings = await SiteSettings.findOneAndUpdate(
      { key: "default" },
      { $set: update },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      warningEnabled: settings!.warningEnabled,
      warningMessage: settings!.warningMessage,
      warningStartDate: settings!.warningStartDate,
      lockoutEnabled: settings!.lockoutEnabled,
      warningExpiryDate: getWarningExpiryDate(settings!.warningStartDate),
      lockoutActive: isLockoutActive(settings!),
    });
  } catch (err) {
    console.error("PUT /api/doni/site-settings error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
