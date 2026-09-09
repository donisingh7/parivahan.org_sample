import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyToken, JWTPayload } from "@/lib/auth";
import PortalUser, { IPortalUser } from "@/models/PortalUser";

// Header text for the per-account "you're about to be disabled" countdown.
// Mirrors the wording used by the site-wide HostingWarningBanner.
export const DEFAULT_DISABLE_MSG = "Your account will be disabled — hosting issue!";

const DAY_MS = 24 * 60 * 60 * 1000;

// If a scheduled auto-disable moment has passed, flip the account off now.
// Returns true when it disabled the account on this call. Safe to call often —
// it only writes once (the second call sees isActive already false).
export async function runScheduledDisable(user: IPortalUser): Promise<boolean> {
  if (!user.disableScheduledAt) return false;
  if (Date.now() < new Date(user.disableScheduledAt).getTime()) return false;
  if (!user.isActive) {
    // Timer already fired on a previous request — just clear the stale marker.
    user.disableScheduledAt = null;
    await user.save();
    return false;
  }
  user.isActive           = false;
  user.disableScheduledAt = null;
  user.sessionId          = "";
  user.sessionExpiresAt   = null;
  await user.save();
  return true;
}

/**
 * Resolve the portal user behind the `user_token` on a request, enforcing every
 * DB-backed rule in one place:
 *   - valid signed token (role "user")
 *   - scheduled auto-disable has not elapsed
 *   - account is active
 *   - the token's `sid` still matches the account's one live session
 *
 * Throws `Error("Unauthorized: …")` on any failure. Callers map that to 401.
 */
export async function resolvePortalUser(
  req: NextRequest
): Promise<{ user: IPortalUser; payload: JWTPayload }> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : req.cookies.get("user_token")?.value ?? null;
  if (!token) throw new Error("Unauthorized: no token");

  const payload = await verifyToken(token);
  if (payload.role !== "user") throw new Error("Unauthorized: not a portal user");

  await connectDB();
  const user = await PortalUser.findById(payload.userId);
  if (!user) throw new Error("Unauthorized: account not found");

  await runScheduledDisable(user);

  if (!user.isActive) throw new Error("Unauthorized: account disabled");
  if ((payload.sid ?? "") !== (user.sessionId ?? "")) {
    throw new Error("Unauthorized: session superseded");
  }

  return { user, payload };
}

export interface AccountStatus {
  warningActive:   boolean;
  daysRemaining:   number;
  message:         string;
  cooldownActive:  boolean;
  cooldownMinutes: number;
  nextAllowedAt:   string | null;
  remainingMs:     number;
}

// Pure derivation of the banner + gateway-countdown state from a user doc.
export function accountStatus(user: IPortalUser): AccountStatus {
  const now = Date.now();

  const schedAt = user.disableScheduledAt ? new Date(user.disableScheduledAt).getTime() : 0;
  const warningActive = schedAt > now;
  const daysRemaining = warningActive ? Math.max(1, Math.ceil((schedAt - now) / DAY_MS)) : 0;

  const cd = user.bookingCooldownMinutes || 0;
  const lastAt = user.lastBookingAt ? new Date(user.lastBookingAt).getTime() : 0;
  const nextAt = cd > 0 && lastAt ? lastAt + cd * 60_000 : 0;
  const cooldownActive = nextAt > now;

  return {
    warningActive,
    daysRemaining,
    message: DEFAULT_DISABLE_MSG,
    cooldownActive,
    cooldownMinutes: cd,
    nextAllowedAt: cooldownActive ? new Date(nextAt).toISOString() : null,
    remainingMs: cooldownActive ? nextAt - now : 0,
  };
}
