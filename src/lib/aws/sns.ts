import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

let _client: SNSClient | null = null;
function client(): SNSClient {
  if (_client) return _client;
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "AWS credentials missing — set AWS_REGION, AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.local"
    );
  }
  _client = new SNSClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
  return _client;
}

/**
 * Normalise the user-entered mobile number to E.164 — SNS Publish requires it.
 * The form only accepts digits (see TaxCollectionForm.tsx) so we treat any
 * 10-digit input as Indian and prefix +91. Pre-formatted "+<country><number>"
 * inputs are left untouched.
 */
export function toE164(raw: string): string | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("+")) {
    return /^\+\d{8,15}$/.test(trimmed) ? trimmed : null;
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return null;
}

export interface ReceiptSmsPayload {
  mobileNo:      string;
  vehicleNo:     string;
  amount:        number;
  receiptNo:     string;
  transactionId: string;
}

/**
 * Sends the post-payment confirmation SMS via SNS.
 * Returns the SNS MessageId on success, or null when the number is invalid /
 * publishing fails — failures must never block the payment flow because the
 * receipt itself is the primary deliverable.
 */
export async function sendReceiptSms(p: ReceiptSmsPayload): Promise<string | null> {
  const PhoneNumber = toE164(p.mobileNo);
  if (!PhoneNumber) {
    console.warn(`[sns] skipping SMS — invalid/empty mobile number: "${p.mobileNo}"`);
    return null;
  }

  const amountStr = Number(p.amount).toFixed(2);
  const Message =
    `Dear Customer, your Checkpost Tax payment of Rs. ${amountStr} for vehicle ${p.vehicleNo} ` +
    `has been received successfully. Receipt No: ${p.receiptNo}. ` +
    `Txn ID: ${p.transactionId}. ` +
    `- Parivahan`;

  try {
    const out = await client().send(
      new PublishCommand({
        PhoneNumber,
        Message,
        MessageAttributes: {
          "AWS.SNS.SMS.SMSType": {
            DataType: "String",
            StringValue: "Transactional",
          },
        },
      })
    );
    return out.MessageId ?? null;
  } catch (err) {
    console.error("[sns] PublishCommand failed:", err);
    return null;
  }
}
