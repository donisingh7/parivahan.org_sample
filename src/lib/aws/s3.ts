import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectsCommand,
  S3ServiceException,
} from "@aws-sdk/client-s3";

// Single shared client. AWS SDK v3 picks up AWS_ACCESS_KEY_ID,
// AWS_SECRET_ACCESS_KEY and AWS_REGION from process.env automatically, but we
// pass them explicitly so missing-env failures surface early instead of
// blowing up at the first request.
let _client: S3Client | null = null;
function client(): S3Client {
  if (_client) return _client;
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "AWS credentials missing — set AWS_REGION, AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.local"
    );
  }
  _client = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
  return _client;
}

function bucket(): string {
  const name = process.env.S3_BUCKET_NAME;
  if (!name) throw new Error("S3_BUCKET_NAME missing in .env.local");
  return name;
}

// ── Folder structure ───────────────────────────────────────────────────────
// <stateCode>/<portalUserId>/<MonthName>/<transactionId>.pdf
//   e.g.  RJ/UP12345/May/TXN1ABCDXYZ.pdf
//
// State is the primary partition so admins can navigate by state in the S3
// console; user goes second so per-user receipts stay grouped within a state.
// Hard-coded month names so the key is the same regardless of server timezone.
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function sanitizeSegment(s: string): string {
  // S3 key segments must not contain "/" — strip everything weird and fall
  // back to "anonymous" / "unknown" so we never produce a malformed key.
  const cleaned = (s ?? "").trim().replace(/[^a-zA-Z0-9._-]/g, "");
  return cleaned || "unknown";
}

/**
 * Build the canonical S3 key for a receipt PDF.
 * Anonymous (no-login) bookings land under the "anonymous" prefix so they
 * never collide with a real portal user's folder.
 *
 * The state segment uses the two-letter visiting-state code ("RJ", "BR", …);
 * unknown states fall back to "STATE" so receipts are still uploadable while
 * the deployment catches up to a new state being added.
 */
export function buildReceiptS3Key(opts: {
  state:        string;        // two-letter state code ("RJ" / "BR" / …)
  portalUserId: string;        // human login ID like "UP12345" — empty = anonymous
  paidAt:       Date | string | null | undefined;
  transactionId:string;
}): string {
  const stateSegment = opts.state ? sanitizeSegment(opts.state.toUpperCase()) : "STATE";
  const userSegment  = opts.portalUserId
    ? sanitizeSegment(opts.portalUserId)
    : "anonymous";
  const date = opts.paidAt ? new Date(opts.paidAt) : new Date();
  const month = MONTH_NAMES[Number.isNaN(date.getTime()) ? new Date().getUTCMonth() : date.getUTCMonth()];
  const txnSegment = sanitizeSegment(opts.transactionId);
  return `${stateSegment}/${userSegment}/${month}/${txnSegment}.pdf`;
}

/**
 * Uploads a receipt PDF to S3 at the given key. Returns the key on success.
 * Throws on failure — caller decides whether to swallow the error so the
 * payment flow can continue.
 */
export async function uploadReceipt(key: string, pdf: Buffer): Promise<string> {
  await client().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: pdf,
      ContentType: "application/pdf",
      ContentDisposition: `inline; filename="${key.split("/").pop() ?? "receipt.pdf"}"`,
      CacheControl: "private, max-age=0, no-store",
    })
  );
  return key;
}

/** Returns true when the receipt PDF already exists at this key. */
export async function receiptExists(key: string): Promise<boolean> {
  try {
    await client().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
    return true;
  } catch (err) {
    if (err instanceof S3ServiceException && err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    if ((err as { name?: string })?.name === "NotFound") return false;
    throw err;
  }
}

/**
 * Deletes receipt PDFs from S3 in batches (S3 caps DeleteObjects at 1000 keys
 * per request). Empty/blank keys are skipped. Returns the number of objects
 * S3 confirmed deleted. Used by the admin "reset account" action.
 */
export async function deleteReceipts(keys: string[]): Promise<number> {
  const valid = keys.filter((k) => k && k.trim().length > 0);
  if (valid.length === 0) return 0;
  let deleted = 0;
  for (let i = 0; i < valid.length; i += 1000) {
    const batch = valid.slice(i, i + 1000).map((Key) => ({ Key }));
    const out = await client().send(
      new DeleteObjectsCommand({
        Bucket: bucket(),
        Delete: { Objects: batch, Quiet: false },
      })
    );
    deleted += (out.Deleted ?? []).length;
    if (out.Errors && out.Errors.length > 0) {
      console.error("[s3] deleteReceipts errors:", JSON.stringify(out.Errors));
    }
  }
  return deleted;
}

/**
 * Downloads a receipt PDF from S3 as a Buffer. Returns null when the object
 * doesn't exist — the route handler can then regenerate + re-upload as a
 * recovery path.
 */
export async function fetchReceipt(key: string): Promise<Buffer | null> {
  try {
    const out = await client().send(
      new GetObjectCommand({ Bucket: bucket(), Key: key })
    );
    if (!out.Body) return null;
    const bytes = await out.Body.transformToByteArray();
    return Buffer.from(bytes);
  } catch (err) {
    if (err instanceof S3ServiceException && err.$metadata?.httpStatusCode === 404) {
      return null;
    }
    if ((err as { name?: string })?.name === "NoSuchKey") return null;
    throw err;
  }
}
