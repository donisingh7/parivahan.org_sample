import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { isSupportedState } from "@/lib/states/registry";
import {
  findTransactionAcrossStates,
  getStateServer,
} from "@/lib/states/registry.server";

export const runtime = "nodejs";

/**
 * GET /api/receipt/data/[transactionId][?state=XX]
 *
 * Returns the unified ReceiptData JSON for a transaction. This is what the
 * on-screen state-specific ReceiptTemplate renders — the exact same shape
 * that the PDF endpoint feeds to the per-state generateReceipt.js.
 *
 * Multi-state aware: pass `?state=XX` to skip the cross-collection scan.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await params;
    const stateHint = req.nextUrl.searchParams.get("state");
    await connectDB();

    let txn: Record<string, unknown>;
    let stateCode: string;

    if (stateHint && isSupportedState(stateHint)) {
      const Model = getStateServer(stateHint).getModel();
      const found = await Model.findOne({ transactionId }).lean();
      if (!found) {
        return NextResponse.json(
          { success: false, message: "Transaction not found" },
          { status: 404 }
        );
      }
      txn = found as unknown as Record<string, unknown>;
      stateCode = stateHint;
    } else {
      const found = await findTransactionAcrossStates(transactionId);
      if (!found) {
        return NextResponse.json(
          { success: false, message: "Transaction not found" },
          { status: 404 }
        );
      }
      txn = found.doc as unknown as Record<string, unknown>;
      stateCode = found.state;
    }

    if (!isSupportedState(stateCode)) {
      return NextResponse.json(
        { success: false, message: `Unsupported state: ${stateCode}` },
        { status: 400 }
      );
    }
    const data = getStateServer(stateCode).buildReceiptData(txn);

    return NextResponse.json(
      { success: true, data, state: stateCode },
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
