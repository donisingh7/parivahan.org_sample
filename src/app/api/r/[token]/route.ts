import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { fetchReceipt, uploadReceipt, buildReceiptS3Key } from "@/lib/aws/s3";
import { buildReceiptPdf } from "@/lib/receipt/generatePdf";
import { verifyQrToken, signQrToken, buildQrPageUrl } from "@/lib/qrToken";

export const runtime = "nodejs";

/**
 * GET /api/r/[token]
 *
 * Public, no-auth PDF stream for QR scans. The QR-token JWT proves the bearer
 * is allowed to access exactly the receipt baked into the token. Tokens are
 * valid for 3 days from issue (handled by `verifyQrToken` via the `exp`
 * claim) — after that, scanners get a 410 "Gone" response and the public
 * receipt page renders an "expired" view.
 *
 * Query params:
 *   ?download=1  → forces a save dialog
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const forceDownload = req.nextUrl.searchParams.get("download") === "1";

  let payload;
  try {
    payload = await verifyQrToken(token);
  } catch {
    return NextResponse.json(
      {
        success: false,
        message:
          "This receipt link has expired or is invalid. QR codes are valid for 3 days from the date of payment.",
      },
      { status: 410 } // 410 Gone — semantically correct for an expired link
    );
  }

  try {
    await connectDB();
    const txn = await Transaction.findOne({ transactionId: payload.tid }).lean();
    if (!txn) {
      return NextResponse.json(
        { success: false, message: "Receipt not found" },
        { status: 404 }
      );
    }

    // Prefer the key in the token (immutable since the token was issued).
    // Fall back to the txn's saved key, then to a recomputed one — covers
    // legacy / partially-migrated rows.
    const txnAny = txn as unknown as {
      s3Key?:        string;
      userIdLabel?:  string;
      paidAt?:       Date | string | null;
    };
    const s3Key =
      payload.s3 ||
      (txnAny.s3Key && txnAny.s3Key.length > 0 ? txnAny.s3Key : "") ||
      buildReceiptS3Key({
        portalUserId:  txnAny.userIdLabel ?? "",
        paidAt:        txnAny.paidAt ?? null,
        transactionId: payload.tid,
      });

    let pdf = await fetchReceipt(s3Key).catch(() => null);
    if (!pdf) {
      // Backfill — re-render with a token that still mirrors *this* link so
      // the QR inside the regenerated PDF stays consistent with what was
      // printed.
      const freshToken = await signQrToken({ tid: payload.tid, s3: s3Key });
      const qrUrl = buildQrPageUrl(freshToken);
      pdf = await buildReceiptPdf(
        txn as unknown as Record<string, unknown>,
        { qrUrl }
      );
      uploadReceipt(s3Key, pdf)
        .then(() => Transaction.updateOne({ transactionId: payload.tid }, { $set: { s3Key } }))
        .catch((err) => console.error("[/api/r] backfill upload failed:", err));
    }

    const disposition = forceDownload ? "attachment" : "inline";
    return new NextResponse(pdf as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `${disposition}; filename="receipt_${payload.tid}.pdf"`,
        // 5 minutes of browser cache is fine — token already controls expiry.
        "Cache-Control":       "private, max-age=300",
        "X-Frame-Options":     "SAMEORIGIN",
      },
    });
  } catch (err) {
    console.error("GET /api/r/[token] error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to load receipt" },
      { status: 500 }
    );
  }
}
