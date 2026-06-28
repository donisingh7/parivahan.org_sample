import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { fetchReceipt, uploadReceipt, buildReceiptS3Key } from "@/lib/aws/s3";
import { buildReceiptPdf } from "@/lib/receipt/generatePdf";
import { signQrToken, buildQrPageUrl } from "@/lib/qrToken";
import { isSupportedState } from "@/lib/states/registry";
import {
  findTransactionAcrossStates,
  getStateServer,
} from "@/lib/states/registry.server";
import type { StateCode } from "@/lib/states/types";

export const runtime = "nodejs";

/**
 * GET /api/receipt/[transactionId][?state=XX][&download=1]
 *
 * Streams the checkpost-tax PDF straight from S3 (the canonical source after
 * a successful payment). When the object isn't in S3 yet — e.g. a legacy
 * transaction or a payment whose post-save upload failed — we fall back to
 * regenerating it on the fly using the per-state PDF generator, mint a
 * fresh QR token, and back-fill S3 so subsequent requests are served
 * straight from S3.
 *
 * Multi-state aware: pass `?state=XX` to skip the cross-collection scan.
 * Production callers (admin, success screen) should always pass it.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await params;
    const forceDownload = req.nextUrl.searchParams.get("download") === "1";
    // ?refresh=1 bypasses the cached S3 copy and rebuilds the PDF with the
    // current code (e.g. to re-stamp Printed On / Payment Confirmation in IST
    // on receipts that were baked before the timezone fix), then overwrites S3.
    const forceRefresh  = req.nextUrl.searchParams.get("refresh") === "1";
    const stateHint     = req.nextUrl.searchParams.get("state");
    await connectDB();

    let stateCode: StateCode;
    let txn: Record<string, unknown>;

    if (stateHint && isSupportedState(stateHint)) {
      stateCode = stateHint;
      const Model = getStateServer(stateCode).getModel();
      const found = await Model.findOne({ transactionId }).lean();
      if (!found) {
        return NextResponse.json(
          { success: false, message: "Transaction not found" },
          { status: 404 }
        );
      }
      txn = found as unknown as Record<string, unknown>;
    } else {
      const found = await findTransactionAcrossStates(transactionId);
      if (!found) {
        return NextResponse.json(
          { success: false, message: "Transaction not found" },
          { status: 404 }
        );
      }
      stateCode = found.state;
      txn = found.doc as unknown as Record<string, unknown>;
    }

    // Prefer the key persisted on the transaction; fall back to recomputing
    // it so legacy rows (where s3Key was never written) still resolve.
    const txnAny = txn as {
      s3Key?:        string;
      userIdLabel?:  string;
      paidAt?:       Date | string | null;
    };
    const s3Key = txnAny.s3Key && txnAny.s3Key.length > 0
      ? txnAny.s3Key
      : buildReceiptS3Key({
          state:         stateCode,
          portalUserId:  txnAny.userIdLabel ?? "",
          paidAt:        txnAny.paidAt ?? null,
          transactionId,
        });

    let pdfBuffer = forceRefresh
      ? null
      : await fetchReceipt(s3Key).catch((err) => {
          console.error("[receipt] S3 fetch failed, will regenerate:", err);
          return null;
        });

    if (!pdfBuffer) {
      // Regenerate with a fresh QR token so the printed link is guaranteed
      // to work for the next 3 days.
      const qrToken = await signQrToken({ tid: transactionId, s3: s3Key, st: stateCode });
      const qrUrl   = buildQrPageUrl(qrToken);
      pdfBuffer = await buildReceiptPdf(stateCode, txn, { qrUrl });
      // Best-effort backfill so the next request hits S3.
      const Model = getStateServer(stateCode).getModel();
      uploadReceipt(s3Key, pdfBuffer)
        .then(() => Model.updateOne({ transactionId }, { $set: { s3Key } }))
        .catch((err) => console.error("[receipt] backfill upload failed:", err));
    }

    const disposition = forceDownload ? "attachment" : "inline";
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `${disposition}; filename="receipt_${transactionId}.pdf"`,
        "Cache-Control":       "no-store, no-cache, must-revalidate",
        "Pragma":              "no-cache",
        "X-Frame-Options":     "SAMEORIGIN",
      },
    });
  } catch (err) {
    console.error("GET /api/receipt/[transactionId] error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to load receipt" },
      { status: 500 }
    );
  }
}
