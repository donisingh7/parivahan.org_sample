import { connectDB } from "@/lib/mongodb";
import SiteSettings, { ISiteSettings } from "@/models/SiteSettings";

const WARNING_WINDOW_DAYS = 7;

// Fetches the singleton settings row, creating it with defaults on first use.
export async function getSiteSettings(): Promise<ISiteSettings> {
  await connectDB();
  const settings = await SiteSettings.findOneAndUpdate(
    { key: "default" },
    { $setOnInsert: { key: "default" } },
    { new: true, upsert: true }
  );
  return settings;
}

export function getWarningExpiryDate(startDate: Date): Date {
  return new Date(startDate.getTime() + WARNING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

// Whole days left until the 7-day window from `startDate` runs out (0 once it has).
export function getDaysRemaining(startDate: Date): number {
  const msLeft = getWarningExpiryDate(startDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
}

// True once `lockoutEnabled` is on and the 7-day window since `warningStartDate` has elapsed.
export function isLockoutActive(settings: ISiteSettings): boolean {
  if (!settings.lockoutEnabled) return false;
  return Date.now() >= getWarningExpiryDate(settings.warningStartDate).getTime();
}
