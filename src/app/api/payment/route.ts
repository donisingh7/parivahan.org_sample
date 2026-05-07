import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { verifyToken } from "@/lib/auth";
import { buildReceiptPdf } from "@/lib/receipt/generatePdf";
import { uploadReceipt, buildReceiptS3Key } from "@/lib/aws/s3";
import { sendReceiptSms } from "@/lib/aws/sns";
import { signQrToken, buildQrPageUrl } from "@/lib/qrToken";

export const runtime = "nodejs";

function makeTransactionId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TXN${ts}${rand}`;
}

// Decode the portal user from the user_token cookie if present. Returns
// { userId, userIdLabel } so the receipt can identify who paid. Failures are
// soft — an unauthenticated request still gets a transaction saved (with
// empty userId) so the user always sees their receipt.
async function readPortalUser(req: NextRequest): Promise<{ userId: string; userIdLabel: string }> {
  try {
    const token = req.cookies.get("user_token")?.value;
    if (!token) return { userId: "", userIdLabel: "" };
    const payload = await verifyToken(token);
    return { userId: payload.userId ?? "", userIdLabel: payload.email ?? "" };
  } catch {
    return { userId: "", userIdLabel: "" };
  }
}

// Coerce a possibly-empty date-ish input into a Date or null.
function toDateOrNull(v: unknown): Date | null {
  if (!v || typeof v !== "string" || v.trim() === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

// POST /api/payment — create a new payment transaction.
// Accepts every field the checkpost-tax form collects so MongoDB is the
// single source of truth for both the on-screen receipt and the PDF.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      vehicleNo, chassisNo, ownerName, mobileNo,
      visitingState, fromState,
      vehicleType, vehicleClass,
      permitType, districtEntering,
      checkpostName, purposeOfVisit,
      aitpValidity, aitpAuthValidity,
      taxFrom, taxTo, taxMode, noOfPeriods,
      seatingCap, sleeperCap,
      receiptNo, orderRef,
      amount, paymentMethod, bankName,
    } = body;

    const missing: string[] = [];
    if (!vehicleNo)                                          missing.push("vehicleNo");
    if (!taxFrom)                                            missing.push("taxFrom");
    if (!taxTo)                                              missing.push("taxTo");
    if (amount === undefined || amount === null || amount === "") missing.push("amount");
    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, message: `Missing required field(s): ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    await connectDB();

    const transactionId = body.transactionId && typeof body.transactionId === "string"
      ? body.transactionId
      : makeTransactionId();
    const { userId, userIdLabel } = await readPortalUser(req);

    const txn = await Transaction.create({
      transactionId,
      userId,
      userIdLabel,
      receiptNo:        receiptNo        ?? "",
      orderRef:         orderRef         ?? "",
      vehicleNo:        String(vehicleNo).toUpperCase().trim(),
      chassisNo:        chassisNo        ?? "",
      ownerName:        ownerName        ?? "",
      mobileNo:         mobileNo         ?? "",
      visitingState:    visitingState    ?? "",
      fromState:        fromState        ?? "",
      vehicleType:      vehicleType      ?? "",
      vehicleClass:     vehicleClass     ?? "",
      permitType:       permitType       ?? "",
      districtEntering: districtEntering ?? "",
      checkpostName:    checkpostName    ?? "",
      purposeOfVisit:   purposeOfVisit   ?? "",
      aitpValidity:     toDateOrNull(aitpValidity),
      aitpAuthValidity: toDateOrNull(aitpAuthValidity),
      taxFrom:          new Date(taxFrom),
      taxTo:            new Date(taxTo),
      taxMode:          taxMode          ?? "",
      noOfPeriods:      Number(noOfPeriods) || 1,
      seatingCap:       parseInt(seatingCap) || 0,
      sleeperCap:       parseInt(sleeperCap) || 0,
      amount:           parseFloat(amount),
      paymentMethod:    paymentMethod    ?? "ONLINE",
      bankName:         bankName         ?? "",
      status:           "SUCCESS",
      paidAt:           new Date(),
    });

    // ── Side-effects after a successful save ──────────────────────────────
    // 1. Compute the canonical S3 key  <portalUserId>/<MonthName>/<txnId>.pdf
    //    so receipts are foldered per portal user and per month.
    // 2. Mint a 3-day QR token that resolves to /r/<token> on this app — that
    //    public page streams the PDF from S3 without requiring login.
    // 3. Render the receipt PDF with the QR encoding the /r/<token> URL, so
    //    scanning the printed receipt opens our portal page.
    // 4. Upload the PDF to S3.
    // 5. Publish the post-payment SMS via SNS.
    //
    // S3 upload is awaited so the iframe on the success screen has something
    // to show. SMS failures are logged but never propagate — payments must
    // never roll back because of a downstream notification glitch.
    const s3Key = buildReceiptS3Key({
      portalUserId:  userIdLabel,
      paidAt:        txn.paidAt,
      transactionId,
    });
    const qrToken = await signQrToken({ tid: transactionId, s3: s3Key });
    const qrUrl   = buildQrPageUrl(qrToken);

    let storedS3Key = "";
    let smsMessageId = "";
    try {
      const pdf = await buildReceiptPdf(
        txn.toObject() as unknown as Record<string, unknown>,
        { qrUrl }
      );
      storedS3Key = await uploadReceipt(s3Key, pdf);
    } catch (s3Err) {
      console.error("[payment] receipt upload to S3 failed:", s3Err);
    }
    try {
      const id = await sendReceiptSms({
        mobileNo:      String(mobileNo ?? ""),
        vehicleNo:     String(vehicleNo).toUpperCase().trim(),
        amount:        parseFloat(amount),
        receiptNo:     String(receiptNo ?? ""),
        transactionId,
      });
      smsMessageId = id ?? "";
    } catch (smsErr) {
      console.error("[payment] SMS publish failed:", smsErr);
    }

    if (storedS3Key || smsMessageId) {
      await Transaction.updateOne(
        { transactionId },
        { $set: { s3Key: storedS3Key, smsMessageId } }
      ).catch((e) => console.error("[payment] failed to persist s3Key/smsMessageId:", e));
    }

    return NextResponse.json(
      {
        success: true,
        transactionId,
        data: txn,
        s3Key: storedS3Key,
        smsMessageId,
        qrUrl,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/payment error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

// GET /api/payment?txnId=XXX — get payment by transaction ID
export async function GET(req: NextRequest) {
  try {
    const txnId = req.nextUrl.searchParams.get("txnId");
    const vehicleNo = req.nextUrl.searchParams.get("vehicleNo");

    if (!txnId && !vehicleNo) {
      return NextResponse.json({ success: false, message: "txnId or vehicleNo required" }, { status: 400 });
    }

    await connectDB();

    let result;
    if (txnId) {
      result = await Transaction.findOne({ transactionId: txnId }).lean();
      if (!result) return NextResponse.json({ success: false, message: "Transaction not found" }, { status: 404 });
      return NextResponse.json({ success: true, data: result });
    } else {
      result = await Transaction.find({ vehicleNo: vehicleNo!.toUpperCase() }).sort({ createdAt: -1 }).lean();
      return NextResponse.json({ success: true, data: result });
    }
  } catch (err) {
    console.error("GET /api/payment error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
