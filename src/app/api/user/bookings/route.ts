import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUserAuth } from "@/lib/auth";
import { getAllStateServers } from "@/lib/states/registry.server";
import { stateLabel } from "@/lib/states/registry";
import type { TransactionDoc } from "@/lib/states/types";

export const runtime = "nodejs";

interface BookingRow {
  transactionId: string;
  receiptNo:     string;
  state:         string;   // state code, e.g. "PB"
  stateLabel:    string;   // human label, e.g. "Punjab"
  vehicleNo:     string;
  ownerName:     string;
  vehicleType:   string;
  checkpostName: string;
  taxFrom:       string | null;
  taxTo:         string | null;
  amount:        number;
  status:        "PENDING" | "SUCCESS" | "FAILED";
  paymentMethod: string;
  bankRefNo:     string;
  paidAt:        string | null;
  createdAt:     string | null;
}

function iso(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
}

/**
 * GET /api/user/bookings
 *
 * Returns the logged-in portal user's own bookings, drawn from every per-state
 * collection and tagged with the state code so the UI can deep-link each row to
 * its receipt PDF (/api/receipt/{transactionId}?state=XX). Auth comes from the
 * `user_token` cookie; we filter on `userIdLabel` — the portal login ID copied
 * onto every transaction at payment time.
 */
export async function GET(req: NextRequest) {
  try {
    const payload = await requireUserAuth(req);

    // Identity comes ONLY from the verified token — never a client-supplied
    // param — so one user can never query another's bookings. We scope by the
    // immutable account id (Mongo _id), which can never match the empty value
    // anonymous/guest bookings carry, so those are excluded too.
    const accountId = payload.userId; // Mongo _id of the PortalUser
    const label     = payload.email;  // portal login ID, e.g. "UP12345"
    if (!accountId) {
      return NextResponse.json({ success: true, data: [], pagination: { page: 1, limit: 20, total: 0, pages: 1 }, stats: emptyStats() });
    }

    await connectDB();

    const page   = Math.max(1, parseInt(req.nextUrl.searchParams.get("page")  ?? "1"));
    const limit  = Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") ?? "20"));
    const status = req.nextUrl.searchParams.get("status");

    // Match this account's transactions by immutable id; also accept the login
    // label for rows tagged before the id was stored. Both keys are unique to
    // this one account and are guarded against empty values, so neither can
    // leak another user's or an anonymous booking.
    const idKeys: Record<string, unknown>[] = [{ userId: accountId }];
    if (label) idKeys.push({ userIdLabel: label });
    const query: Record<string, unknown> = { $or: idKeys };
    if (status) query.status = status;

    // Fan out across every state collection; volume per user is small.
    const servers = getAllStateServers();
    const lists = await Promise.all(
      servers.map(async (s) => {
        const docs = await s.getModel().find(query).lean<TransactionDoc[]>();
        return docs.map((d) => ({ doc: d, code: s.code }));
      })
    );

    const merged = lists.flat().sort((a, b) => {
      const ta = a.doc.createdAt ? new Date(a.doc.createdAt).getTime() : 0;
      const tb = b.doc.createdAt ? new Date(b.doc.createdAt).getTime() : 0;
      return tb - ta;
    });

    const rows: BookingRow[] = merged.map(({ doc, code }) => ({
      transactionId: doc.transactionId,
      receiptNo:     doc.receiptNo || "",
      state:         code,
      stateLabel:    stateLabel(code),
      vehicleNo:     doc.vehicleNo || "",
      ownerName:     doc.ownerName || "",
      vehicleType:   doc.vehicleType || "",
      checkpostName: doc.checkpostName || doc.borderDistrict || "",
      taxFrom:       iso(doc.taxFrom),
      taxTo:         iso(doc.taxTo),
      amount:        Number(doc.amount) || 0,
      status:        doc.status,
      paymentMethod: doc.paymentMethod || "ONLINE",
      bankRefNo:     doc.orderRef || "",
      paidAt:        iso(doc.paidAt),
      createdAt:     iso(doc.createdAt),
    }));

    const total = rows.length;
    const start = (page - 1) * limit;
    const data  = rows.slice(start, start + limit);

    const stats = {
      totalCount:   total,
      successCount: rows.filter((r) => r.status === "SUCCESS").length,
      pendingCount: rows.filter((r) => r.status === "PENDING").length,
      failedCount:  rows.filter((r) => r.status === "FAILED").length,
      totalAmount:  rows.reduce((s, r) => s + r.amount, 0),
      successAmount: rows.filter((r) => r.status === "SUCCESS").reduce((s, r) => s + r.amount, 0),
    };

    return NextResponse.json({
      success: true,
      user: { userId: label, name: payload.email },
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
      stats,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    const httpStatus = msg.startsWith("Unauthorized") ? 401 : 500;
    console.error("GET /api/user/bookings error:", err);
    return NextResponse.json({ success: false, message: msg }, { status: httpStatus });
  }
}

function emptyStats() {
  return { totalCount: 0, successCount: 0, pendingCount: 0, failedCount: 0, totalAmount: 0, successAmount: 0 };
}
