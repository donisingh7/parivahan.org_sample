import { NextRequest, NextResponse } from "next/server";
import { requireDoniAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import PortalUser from "@/models/PortalUser";

export const runtime = "nodejs";

// Portal-user account management for the /doni control panel. Fully separate
// from the /admin change-user-password flow — this one has no reselling
// auth-password gate because the doni panel is already the top-level gate.
const ALLOWED_TYPES = ["family", "test", "reselling"];

async function guard(req: NextRequest): Promise<NextResponse | null> {
  try {
    await requireDoniAuth(req);
    return null;
  } catch {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
}

// Clamp an incoming numeric field to a non-negative integer, or null if absent.
function toIntOrNull(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// GET /api/doni/portal-users — list every portal user (no password hashes).
export async function GET(req: NextRequest) {
  const denied = await guard(req);
  if (denied) return denied;

  try {
    await connectDB();
    const rows = await PortalUser.find(
      {},
      { id: 1, type: 1, isActive: 1, disableScheduledAt: 1, bookingCooldownMinutes: 1, sessionId: 1, sessionExpiresAt: 1, lastBookingAt: 1, _id: 0 }
    )
      .sort({ type: 1, id: 1 })
      .lean();

    const now = Date.now();
    const users = rows.map((u) => ({
      id: u.id,
      type: u.type,
      isActive: u.isActive,
      disableScheduledAt: u.disableScheduledAt ?? null,
      bookingCooldownMinutes: u.bookingCooldownMinutes ?? 0,
      lastBookingAt: u.lastBookingAt ?? null,
      sessionActive:
        !!u.sessionId && !!u.sessionExpiresAt && new Date(u.sessionExpiresAt).getTime() > now,
    }));

    return NextResponse.json({ success: true, users });
  } catch (err) {
    console.error("GET /api/doni/portal-users error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

// POST /api/doni/portal-users — create an account.
// Body: { id, password, type, bookingCooldownMinutes? }
export async function POST(req: NextRequest) {
  const denied = await guard(req);
  if (denied) return denied;

  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const type = typeof body.type === "string" ? body.type.trim().toLowerCase() : "";
    const bookingCooldownMinutes = toIntOrNull(body.bookingCooldownMinutes) ?? 0;

    if (!id) {
      return NextResponse.json({ success: false, message: "Login ID is required" }, { status: 400 });
    }
    if (password.length < 4) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 4 characters" },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, message: `Type must be one of ${ALLOWED_TYPES.join(" / ")}` },
        { status: 400 }
      );
    }

    const existing = await PortalUser.findOne({ id }).lean();
    if (existing) {
      return NextResponse.json({ success: false, message: `Login ID "${id}" already exists` }, { status: 409 });
    }

    // new + save() triggers the bcrypt pre-save hook (see PortalUser model).
    const user = new PortalUser({ id, password, type, isActive: true, bookingCooldownMinutes });
    await user.save();

    return NextResponse.json({
      success: true,
      message: `Account "${id}" created`,
      user: { id: user.id, type: user.type, isActive: user.isActive },
    });
  } catch (err) {
    console.error("POST /api/doni/portal-users error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

// PATCH /api/doni/portal-users — update one account. Body: { id, ...changes }
// where changes is any subset of:
//   isActive: boolean               enable / disable now (Enable also clears the
//                                   single-session lock so the user can sign in
//                                   fresh; Disable also cancels a pending schedule)
//   disableInDays: number | null    arm auto-disable N days out; null / 0 cancels
//   bookingCooldownMinutes: number  min minutes between bookings (0 = off)
export async function PATCH(req: NextRequest) {
  const denied = await guard(req);
  if (denied) return denied;

  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) {
      return NextResponse.json({ success: false, message: "Login ID is required" }, { status: 400 });
    }

    const set: Record<string, unknown> = {};
    const changes: string[] = [];

    if ("isActive" in body) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json({ success: false, message: "isActive must be a boolean" }, { status: 400 });
      }
      set.isActive = body.isActive;
      changes.push(body.isActive ? "enabled" : "disabled");
      if (body.isActive) {
        // Re-enabling a locked/disabled account: drop the live-session marker so
        // the next login is treated as a clean first session, not a 2nd device.
        set.sessionId = "";
        set.sessionExpiresAt = null;
      } else {
        // Manual disable supersedes any pending scheduled disable.
        set.disableScheduledAt = null;
        set.sessionId = "";
        set.sessionExpiresAt = null;
      }
    }

    if ("disableInDays" in body) {
      const days = body.disableInDays;
      if (days === null || days === 0 || days === "0") {
        set.disableScheduledAt = null;
        changes.push("schedule cleared");
      } else {
        const n = Number(days);
        if (!Number.isFinite(n) || n <= 0) {
          return NextResponse.json({ success: false, message: "disableInDays must be a positive number or null" }, { status: 400 });
        }
        set.disableScheduledAt = new Date(Date.now() + n * 24 * 60 * 60 * 1000);
        changes.push(`auto-disable in ${n} day(s)`);
      }
    }

    if ("bookingCooldownMinutes" in body) {
      const mins = toIntOrNull(body.bookingCooldownMinutes);
      if (mins === null) {
        return NextResponse.json({ success: false, message: "bookingCooldownMinutes must be a non-negative integer" }, { status: 400 });
      }
      set.bookingCooldownMinutes = mins;
      changes.push(`cooldown ${mins}m`);
    }

    if (Object.keys(set).length === 0) {
      return NextResponse.json({ success: false, message: "No recognised fields to update" }, { status: 400 });
    }

    const user = await PortalUser.findOneAndUpdate({ id }, { $set: set }, { new: true });
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `${id}: ${changes.join(", ")}`,
      user: {
        id: user.id,
        type: user.type,
        isActive: user.isActive,
        disableScheduledAt: user.disableScheduledAt ?? null,
        bookingCooldownMinutes: user.bookingCooldownMinutes ?? 0,
      },
    });
  } catch (err) {
    console.error("PATCH /api/doni/portal-users error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
