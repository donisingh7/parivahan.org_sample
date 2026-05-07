import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { buildReceiptData } from "@/lib/receipt/buildReceiptData";

export const runtime = "nodejs";

// Static relative require so webpack bundles generateReceiptRajasthan.js and
// nft automatically traces pdfkit / sharp / qrcode / moment (and all their
// transitive deps) into the Vercel function bundle.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { generateReceiptRajasthan } = require(
  "../../../../lib/receipt/rajasthan/generateReceiptRajasthan"
) as { generateReceiptRajasthan: (data: unknown) => Promise<Buffer> };

/**
 * GET /api/receipt/[transactionId]
 *
 * Generates the Rajasthan checkpost-tax PDF using generateReceiptRajasthan.js.
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

    const data = buildReceiptData(txn as unknown as Record<string, unknown>);

    const receiptData = {
      registrationNo:  data.registrationNo,
      receiptNo:       data.receiptNo,
      paymentDate:     data.paymentDate,
      ownerName:       data.ownerName,
      chassisNo:       data.chassisNo,
      taxMode:         data.taxMode,
      vehicleType:     data.vehicleType,
      vehicleClass:    data.vehicleClass,
      mobileNo:        data.mobileNo,
      checkpostName:   data.checkpostName,
      sleeperCap:      data.sleeperCap,
      seatingCapacity: data.seatingCapacity,
      bankRefNo:       data.bankRefNo,
      paymentMode:     data.paymentMode,
      serviceType:     data.serviceType,
      permitType:      data.permitType,
      permitCategory:  data.permitCategory,
      qrUrl:           data.qrUrl,
      taxItems:        data.taxItems,
    };

    const pdfBuffer = await generateReceiptRajasthan(receiptData);

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
      { success: false, message: "Failed to generate receipt" },
      { status: 500 }
    );
  }
}
