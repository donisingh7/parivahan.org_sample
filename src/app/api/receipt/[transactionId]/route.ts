import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { fetchReceipt, uploadReceipt, buildReceiptS3Key } from "@/lib/aws/s3";
import { buildReceiptPdf } from "@/lib/receipt/generatePdf";
import { signQrToken, buildQrPageUrl } from "@/lib/qrToken";

export const runtime = "nodejs";

/**
 * GET /api/receipt/[transactionId]
 *
 * Streams the Rajasthan checkpost-tax PDF straight from S3 (the canonical
 * source after a successful payment). When the object isn't in S3 yet — e.g.
 * a legacy transaction or a payment whose post-save upload failed — we fall
 * back to generating it on the fly, mint a fresh QR token, and back-fill S3
 * so subsequent requests are served from S3.
 *
 * Pass `?download=1` to force a save dialog instead of inline view.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await params;
    const forceDownload = req.nextUrl.searchParams.get("download") === "1";
    await connectDB();

    const txn = await Transaction.findOne({ transactionId }).lean();
    if (!txn) {
      return NextResponse.json(
        { success: false, message: "Transaction not found" },
        { status: 404 }
      );
    }

    // Prefer the key persisted on the transaction; fall back to recomputing
    // it so legacy rows (where s3Key was never written) still resolve.
    const txnAny = txn as unknown as {
      s3Key?:        string;
      userIdLabel?:  string;
      paidAt?:       Date | string | null;
    };
    const s3Key = txnAny.s3Key && txnAny.s3Key.length > 0
      ? txnAny.s3Key
      : buildReceiptS3Key({
          portalUserId:  txnAny.userIdLabel ?? "",
          paidAt:        txnAny.paidAt ?? null,
          transactionId,
        });

    let pdfBuffer = await fetchReceipt(s3Key).catch((err) => {
      console.error("[receipt] S3 fetch failed, will regenerate:", err);
      return null;
    });

    if (!pdfBuffer) {
      // Regenerate with a fresh QR token so the printed link is guaranteed
      // to work for the next 3 days.
      const qrToken = await signQrToken({ tid: transactionId, s3: s3Key });
      const qrUrl   = buildQrPageUrl(qrToken);
      pdfBuffer = await buildReceiptPdf(
        txn as unknown as Record<string, unknown>,
        { qrUrl }
      );
      // Best-effort backfill so the next request hits S3.
      uploadReceipt(s3Key, pdfBuffer)
        .then(() => Transaction.updateOne({ transactionId }, { $set: { s3Key } }))
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
