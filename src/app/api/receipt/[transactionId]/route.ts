import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { buildReceiptData } from "@/lib/receipt/buildReceiptData";
import path from "path";
import os from "os";
import fs from "fs";
import { execFile } from "child_process";
import { promisify } from "util";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

/**
 * GET /api/receipt/[transactionId]
 *
 * Generates the Rajasthan checkpost-tax PDF using
 * `receipt-generator/generateReceipt.js` (the file that owns the canonical
 * design). The same URL serves both the inline view (iframe) and the file
 * download — pass `?download=1` to force a save dialog. Receipt fields are
 * built from the Mongo Transaction by the shared `buildReceiptData()` lib.
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

    // generateReceipt.js field names (kept in sync with receipt-generator/test.js).
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

    // Hand off to a fresh Node.js child process — bypasses webpack/module
    // caching so generateReceipt.js is read from disk every time.
    const stamp    = Date.now();
    const dataFile = path.join(os.tmpdir(), `receipt_data_${transactionId}_${stamp}.json`);
    const pdfFile  = path.join(os.tmpdir(), `receipt_pdf_${transactionId}_${stamp}.pdf`);
    fs.writeFileSync(dataFile, JSON.stringify(receiptData));

    const runnerPath = path.join(process.cwd(), "receipt-generator", "receipt-runner.js");
    try {
      await execFileAsync("node", [runnerPath, dataFile, pdfFile]);
      const pdfBuffer = fs.readFileSync(pdfFile);

      const disposition = forceDownload ? "attachment" : "inline";
      return new NextResponse(pdfBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type":        "application/pdf",
          "Content-Disposition": `${disposition}; filename="receipt_${transactionId}.pdf"`,
          "Cache-Control":       "no-store, no-cache, must-revalidate",
          "Pragma":              "no-cache",
          // Allow embedding the PDF in our own iframe.
          "X-Frame-Options":     "SAMEORIGIN",
        },
      });
    } finally {
      for (const f of [dataFile, pdfFile]) {
        try { fs.unlinkSync(f); } catch { /* ignore */ }
      }
    }
  } catch (err) {
    console.error("GET /api/receipt/[transactionId] error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to generate receipt" },
      { status: 500 }
    );
  }
}
