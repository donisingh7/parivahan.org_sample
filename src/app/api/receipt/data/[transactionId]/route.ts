import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { buildReceiptData } from "@/lib/receipt/buildReceiptData";

export const runtime = "nodejs";

/**
 * GET /api/receipt/data/[transactionId]
 *
 * Returns the unified ReceiptData JSON for a transaction. This is what the
 * on-screen <RajasthanReceipt /> renders — the exact same shape that the PDF
 * endpoint feeds to receipt-generator/generateReceipt.js.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await params;
    await connectDB();

    const txn = await Transaction.findOne({ transactionId }).lean();
    if (!txn) {
      return NextResponse.json(
        { success: false, message: "Transaction not found" },
        { status: 404 }
      );
    }

    const data = buildReceiptData(txn as unknown as Record<string, unknown>);

    return NextResponse.json(
      { success: true, data },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("GET /api/receipt/data/[transactionId] error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to load receipt data" },
      { status: 500 }
    );
  }
}
