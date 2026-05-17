import { SignJWT, jwtVerify } from "jose";

// QR tokens reuse the platform JWT_SECRET — they're cryptographically
// identical to login tokens but with a different `typ` to make role-confusion
// attacks impossible: a leaked QR token cannot be replayed as an admin token.
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "parivahan_super_secret_jwt_key_change_in_production"
);

const TOKEN_TYPE = "qr-receipt";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 3; // 3 days

export interface QrTokenPayload {
  /** transactionId of the booking this QR belongs to */
  tid: string;
  /** S3 object key of the receipt PDF (cached on the token to avoid an extra DB read in the hot PDF route) */
  s3:  string;
  /** Two-letter state code so /r/<token> can hit the right per-state collection without scanning */
  st:  string;
  /** Token type discriminator — refuses login tokens replayed as QR tokens */
  typ: string;
  iat?: number;
  exp?: number;
}

/**
 * Sign a 3-day-valid token that proves "the bearer is allowed to download
 * exactly this receipt PDF" — embedded in the QR code on the printed receipt.
 */
export async function signQrToken(input: {
  tid: string;
  s3:  string;
  st:  string;
}): Promise<string> {
  return new SignJWT({ tid: input.tid, s3: input.s3, st: input.st, typ: TOKEN_TYPE })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(secret);
}

/**
 * Verifies a QR token. Throws when the token is malformed, expired, or signed
 * with a different secret. Caller is expected to translate the error into a
 * "link expired" page.
 */
export async function verifyQrToken(token: string): Promise<QrTokenPayload> {
  const { payload } = await jwtVerify(token, secret);
  if ((payload as { typ?: string }).typ !== TOKEN_TYPE) {
    throw new Error("Invalid token type");
  }
  return payload as unknown as QrTokenPayload;
}

/** TTL we advertise to admins/users — keep in sync with TOKEN_TTL_SECONDS. */
export const QR_TOKEN_TTL_DAYS = 3;

/**
 * Build the absolute URL that goes inside the QR code. Centralised so both
 * /api/payment (issuing) and /api/receipt fallback (re-issuing) produce the
 * exact same shape.
 */
export function buildQrPageUrl(token: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ??
    "http://localhost:3000";
  return `${base}/r/${token}`;
}
