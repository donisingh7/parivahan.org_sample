import { buildReceiptData } from "@/lib/receipt/buildReceiptData";

// Static relative require so webpack bundles generateReceiptRajasthan.js and
// nft automatically traces pdfkit / sharp / qrcode / moment (and all their
// transitive deps) into the Vercel function bundle. Mirrors the require in
// /api/receipt/[transactionId]/route.ts so both routes share one bundle.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { generateReceiptRajasthan } = require(
  "./rajasthan/generateReceiptRajasthan"
) as { generateReceiptRajasthan: (data: unknown) => Promise<Buffer> };

/**
 * Build the receipt PDF for a Mongo transaction document. Returns a Buffer
 * ready to upload to S3 or stream straight to the client.
 *
 * `opts.qrUrl` overrides the default `kms.parivahan.gov.in` URL embedded in
 * the QR — the payment route uses this to inject our own /r/<token> link so
 * scanners land on this app's public receipt page.
 */
export async function buildReceiptPdf(
  txn: Record<string, unknown>,
  opts: { qrUrl?: string } = {}
): Promise<Buffer> {
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
    qrUrl:           opts.qrUrl ?? data.qrUrl,
    taxItems:        data.taxItems,
  };
  return generateReceiptRajasthan(receiptData);
}
