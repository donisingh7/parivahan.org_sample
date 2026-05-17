import { getStateServer } from "@/lib/states/registry.server";
import { isSupportedState } from "@/lib/states/registry";
import type { StateCode } from "@/lib/states/types";

/**
 * Render the receipt PDF for a Mongo transaction document, using the
 * per-state buildReceiptData + generateReceipt registered in the state
 * server registry. Returns a Buffer ready to upload to S3 or stream to
 * the client.
 *
 * `opts.qrUrl` overrides the default `kms.parivahan.gov.in` URL embedded
 * in the QR — the payment route uses this to inject our own /r/<token>
 * link so scanners land on this app's public receipt page.
 */
export async function buildReceiptPdf(
  state: StateCode | string,
  txn: Record<string, unknown>,
  opts: { qrUrl?: string } = {}
): Promise<Buffer> {
  if (!isSupportedState(state)) {
    throw new Error(`Unsupported state code: ${state}`);
  }
  const server = getStateServer(state);

  const data = server.buildReceiptData(txn);

  // Forward the full ReceiptData object so per-state PDF generators can
  // read whatever extra fields they need (Haryana reads vehicleCategory,
  // fitnessValidity, insuranceValidity, puccValidity, etc.). The QR URL
  // override has to happen here because /api/payment mints a per-receipt
  // /r/<token> link that buildReceiptData doesn't know about.
  return server.generateReceipt({
    ...data,
    qrUrl: opts.qrUrl ?? data.qrUrl,
  });
}
