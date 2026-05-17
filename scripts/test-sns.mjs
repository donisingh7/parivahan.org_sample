/**
 * Parivahan — Amazon SNS Test Harness
 * ──────────────────────────────────────────────────────────────────────────
 * Run with:
 *
 *   node --env-file=.env.local scripts/test-sns.mjs
 *
 * Or pass a different number on the CLI:
 *
 *   node --env-file=.env.local scripts/test-sns.mjs +919876543210
 *
 * What this script does (in order):
 *  1. Loads + sanity-checks AWS credentials and region from env
 *  2. Verifies STS works for those credentials (proves they aren't bogus)
 *  3. Reads the SMS sandbox status of your account
 *      → if you're still in sandbox, lists the verified destinations and
 *        warns you if your test number isn't on the list
 *  4. Reads SMS attributes (default sender ID, monthly spend limit, type)
 *  5. Reads the spending stats for the current month (for ap-south-1)
 *  6. Sends a Publish command with full request/response logging
 *  7. Optional: tails CloudWatch metrics for delivery rate (best-effort)
 *
 * No matter what fails, we log the full error so you can copy/paste it back.
 */

// eslint-disable-next-line no-undef
const args = process.argv.slice(2);
const insecure = args.includes("--insecure");
const target = args.filter((a) => !a.startsWith("--"))[0] || "+919799538595";

// ── Imports ──────────────────────────────────────────────────────────────
import {
  SNSClient,
  PublishCommand,
  GetSMSAttributesCommand,
  GetSMSSandboxAccountStatusCommand,
  ListSMSSandboxPhoneNumbersCommand,
} from "@aws-sdk/client-sns";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { HttpsProxyAgent } from "https-proxy-agent";

// ── Corporate proxy plumbing ─────────────────────────────────────────────
// On corporate networks (e.g. Bosch with Zscaler at 127.0.0.1:8080), all
// outbound HTTPS must go through the proxy. The AWS SDK v3 does NOT honour
// HTTPS_PROXY / HTTP_PROXY env vars by default, so we build a custom
// NodeHttpHandler with an HttpsProxyAgent and pass it via `requestHandler`
// to every SNS / STS client below.
const proxyUrl =
  process.env.HTTPS_PROXY ||
  process.env.https_proxy ||
  process.env.HTTP_PROXY  ||
  process.env.http_proxy  ||
  "";
// SSL-inspecting corporate proxies (Zscaler etc.) rewrite the cert chain.
// `--insecure` disables Node's cert validation — diagnostic use only.
const tlsOpts = insecure ? { rejectUnauthorized: false } : {};
const proxyAgent = proxyUrl
  ? new HttpsProxyAgent(proxyUrl, tlsOpts)
  : undefined;
const requestHandler = proxyAgent
  ? new NodeHttpHandler({ httpsAgent: proxyAgent, httpAgent: proxyAgent })
  : undefined;
if (insecure) {
  // Some corporate stacks also intercept on the Node side via a local cert
  // store override; fully bypassing TLS makes the script behaviour
  // deterministic across machines.
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

// ── Helpers ──────────────────────────────────────────────────────────────
const Reset = "\x1b[0m";
const Bold = "\x1b[1m";
const Dim = "\x1b[2m";
const Red = "\x1b[31m";
const Green = "\x1b[32m";
const Yellow = "\x1b[33m";
const Blue = "\x1b[34m";
const Magenta = "\x1b[35m";
const Cyan = "\x1b[36m";

function header(title) {
  console.log("");
  console.log(`${Bold}${Cyan}═══════════════════════════════════════════════════════════════${Reset}`);
  console.log(`${Bold}${Cyan}▶ ${title}${Reset}`);
  console.log(`${Bold}${Cyan}═══════════════════════════════════════════════════════════════${Reset}`);
}

function ok(msg, extra) {
  console.log(`${Green}✓${Reset} ${msg}${extra ? ` ${Dim}${extra}${Reset}` : ""}`);
}
function warn(msg, extra) {
  console.log(`${Yellow}⚠${Reset} ${msg}${extra ? ` ${Dim}${extra}${Reset}` : ""}`);
}
function fail(msg, extra) {
  console.log(`${Red}✗${Reset} ${msg}${extra ? ` ${Dim}${extra}${Reset}` : ""}`);
}
function info(label, value) {
  console.log(`  ${Dim}${label}${Reset} : ${value ?? "—"}`);
}

function dumpError(label, err) {
  fail(label);
  console.log(`  ${Dim}name${Reset}      : ${err?.name ?? "—"}`);
  console.log(`  ${Dim}message${Reset}   : ${err?.message ?? "—"}`);
  console.log(`  ${Dim}code${Reset}      : ${err?.Code ?? err?.$metadata?.code ?? "—"}`);
  console.log(`  ${Dim}httpStatus${Reset}: ${err?.$metadata?.httpStatusCode ?? "—"}`);
  console.log(`  ${Dim}reqId${Reset}     : ${err?.$metadata?.requestId ?? "—"}`);
  if (err?.fault) console.log(`  ${Dim}fault${Reset}     : ${err.fault}`);
  if (err?.stack) console.log(`${Dim}${err.stack.split("\n").slice(0, 4).join("\n")}${Reset}`);
}

function maskKey(k) {
  if (!k) return "(missing)";
  if (k.length < 8) return `${k.slice(0, 2)}***`;
  return `${k.slice(0, 4)}…${k.slice(-4)} (len=${k.length})`;
}

function toE164(raw) {
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

// ── 1. Env sanity ────────────────────────────────────────────────────────
header("Step 1 — Environment & credentials");

const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

info("AWS_REGION", region);
info("AWS_ACCESS_KEY_ID", maskKey(accessKeyId));
info("AWS_SECRET_ACCESS_KEY", maskKey(secretAccessKey));
info("Outbound proxy", proxyUrl ? `${proxyUrl}  ${Green}(routing AWS calls through it)${Reset}` : `${Yellow}none — relying on direct internet${Reset}`);
info("NO_PROXY", process.env.NO_PROXY || process.env.no_proxy || "(unset)");
info("TLS validation", insecure ? `${Red}DISABLED (--insecure flag)${Reset}` : `${Green}strict${Reset}`);
info("Target phone (raw)", target);

const phoneNumber = toE164(target);
info("Target phone (E.164)", phoneNumber ?? `${Red}invalid${Reset}`);

if (!region || !accessKeyId || !secretAccessKey) {
  fail("Missing AWS credentials in env. Run with --env-file=.env.local");
  process.exit(1);
}
if (!phoneNumber) {
  fail("Phone number is not in valid E.164 format (e.g. +919876543210)");
  process.exit(1);
}

// SMS-supporting regions (subset). ap-south-1 supports SMS but only after
// you opt in via console for SenderID + Origin numbers.
const SMS_FRIENDLY = new Set([
  "us-east-1", "us-west-2", "ap-northeast-1", "ap-southeast-1",
  "ap-southeast-2", "ap-south-1", "eu-west-1", "eu-central-1",
]);
if (!SMS_FRIENDLY.has(region)) {
  warn(`Region ${region} may not support SNS SMS. Try us-east-1 or ap-south-1.`);
}
ok("Environment looks good");

// ── 2. STS GetCallerIdentity ─────────────────────────────────────────────
header("Step 2 — STS GetCallerIdentity (proves credentials work)");

const sts = new STSClient({
  region,
  credentials: { accessKeyId, secretAccessKey },
  ...(requestHandler ? { requestHandler } : {}),
});
try {
  const id = await sts.send(new GetCallerIdentityCommand({}));
  ok("Credentials authenticated to AWS");
  info("Account", id.Account);
  info("Arn", id.Arn);
  info("UserId", id.UserId);
} catch (err) {
  dumpError("STS GetCallerIdentity failed — credentials are invalid or expired", err);
  process.exit(1);
}

// ── Build the SNS client used by every step from here on ─────────────────
const sns = new SNSClient({
  region,
  credentials: { accessKeyId, secretAccessKey },
  ...(requestHandler ? { requestHandler } : {}),
  logger: {
    debug: () => {},
    info:  () => {},
    warn:  (...a) => console.log(`${Dim}[sns warn ]${Reset}`, ...a),
    error: (...a) => console.log(`${Dim}[sns error]${Reset}`, ...a),
  },
});

// ── 3. SMS sandbox status ────────────────────────────────────────────────
header("Step 3 — SMS sandbox status (most common reason SMS doesn't deliver)");

let inSandbox = false;
try {
  const out = await sns.send(new GetSMSSandboxAccountStatusCommand({}));
  inSandbox = !!out.IsInSandbox;
  if (inSandbox) {
    warn(`Your AWS account is in ${Bold}SMS Sandbox${Reset} mode.`);
    console.log(`  ${Dim}→ SMS will only deliver to phone numbers you have explicitly verified.${Reset}`);
    console.log(`  ${Dim}→ To exit sandbox, request production access in the SNS console.${Reset}`);
  } else {
    ok("Account is OUT of SMS sandbox — SMS will deliver to any valid number");
  }
} catch (err) {
  dumpError("Could not read SMS sandbox status (IAM may be missing sns:GetSMSSandboxAccountStatus)", err);
}

if (inSandbox) {
  try {
    const list = await sns.send(new ListSMSSandboxPhoneNumbersCommand({}));
    const verified = list.PhoneNumbers ?? [];
    if (verified.length === 0) {
      warn("Sandbox: NO verified phone numbers found.");
      console.log(`  ${Dim}→ Add ${phoneNumber} as a verified destination at:${Reset}`);
      console.log(`    ${Blue}https://${region}.console.aws.amazon.com/sns/v3/home?region=${region}#/mobile/text-messaging${Reset}`);
    } else {
      console.log(`  ${Dim}Verified destinations (${verified.length}):${Reset}`);
      for (const v of verified) {
        const isMatch = v.PhoneNumber === phoneNumber;
        const tag = isMatch ? `${Green}← matches target${Reset}` : "";
        console.log(`    ${Magenta}•${Reset} ${v.PhoneNumber}  status=${v.Status}  ${tag}`);
      }
      const matchEntry = verified.find((v) => v.PhoneNumber === phoneNumber);
      if (!matchEntry) {
        warn(`Target ${phoneNumber} is NOT in the verified list — SMS will silently drop in sandbox.`);
      } else if (matchEntry.Status !== "Verified") {
        warn(`Target ${phoneNumber} is in the list but status is ${matchEntry.Status} — SMS will not deliver until status=Verified.`);
      } else {
        ok(`Target ${phoneNumber} is verified — SMS should deliver`);
      }
    }
  } catch (err) {
    dumpError("Could not list sandbox phone numbers", err);
  }
}

// ── 4. SMS attributes ─────────────────────────────────────────────────────
header("Step 4 — Account-level SMS attributes");

try {
  const out = await sns.send(new GetSMSAttributesCommand({}));
  const a = out.attributes ?? {};
  info("DefaultSenderID", a.DefaultSenderID);
  info("DefaultSMSType", a.DefaultSMSType);
  info("MonthlySpendLimit (USD)", a.MonthlySpendLimit);
  info("DeliveryStatusIAMRole", a.DeliveryStatusIAMRole);
  info("DeliveryStatusSuccessSamplingRate", a.DeliveryStatusSuccessSamplingRate);
  info("UsageReportS3Bucket", a.UsageReportS3Bucket);

  if (!a.MonthlySpendLimit || Number(a.MonthlySpendLimit) === 0) {
    warn("MonthlySpendLimit is 0 or unset — AWS may block delivery to protect your account.");
    console.log(`  ${Dim}→ Bump it in the SNS console → Mobile → Text messaging (SMS) → Preferences.${Reset}`);
  } else {
    ok(`Monthly SMS spend limit: $${a.MonthlySpendLimit}`);
  }
} catch (err) {
  dumpError("Could not read SMS attributes (IAM may be missing sns:GetSMSAttributes)", err);
}

// ── 5. Publish a test SMS ────────────────────────────────────────────────
header("Step 5 — Publish test SMS");

const message =
  `Parivahan SNS test — sent at ${new Date().toISOString()}. ` +
  `If you received this, SNS is wired up correctly. Source: scripts/test-sns.mjs`;

const publishInput = {
  PhoneNumber: phoneNumber,
  Message: message,
  MessageAttributes: {
    "AWS.SNS.SMS.SMSType": { DataType: "String", StringValue: "Transactional" },
    "AWS.SNS.SMS.SenderID": { DataType: "String", StringValue: "PARVHN" },
  },
};

console.log(`  ${Dim}PublishCommand input:${Reset}`);
console.log(JSON.stringify(publishInput, null, 2).split("\n").map((l) => `    ${l}`).join("\n"));

try {
  const t0 = Date.now();
  const out = await sns.send(new PublishCommand(publishInput));
  const elapsed = Date.now() - t0;
  ok(`Publish accepted by AWS in ${elapsed}ms`);
  info("MessageId", out.MessageId);
  console.log(`  ${Dim}Full response:${Reset}`);
  console.log(JSON.stringify(out, null, 2).split("\n").map((l) => `    ${l}`).join("\n"));
  console.log("");
  console.log(`${Bold}${Green}WHAT THIS MEANS${Reset}`);
  console.log("  • AWS has accepted the SMS for delivery.");
  console.log("  • A MessageId DOES NOT mean the carrier delivered it — it means SNS queued it.");
  if (inSandbox) {
    console.log(`  • Because your account is in ${Bold}SMS sandbox${Reset}, the message will only deliver if`);
    console.log("    the destination is in the verified list above with status=Verified.");
  }
  console.log("  • To see actual delivery status, enable CloudWatch SMS delivery logs in the");
  console.log(`    SNS console → Mobile → Text messaging (SMS) → Preferences → Delivery status logging.`);
} catch (err) {
  dumpError("Publish FAILED — full diagnostic below", err);

  // Friendly hints based on the error code
  console.log("");
  console.log(`${Bold}${Yellow}LIKELY CAUSE${Reset}`);
  const code = (err?.name ?? err?.Code ?? "").toString();
  if (code.includes("AuthorizationError") || code.includes("AccessDenied")) {
    console.log("  • IAM user is missing the sns:Publish permission.");
    console.log("  • Attach the AmazonSNSFullAccess policy or a custom policy with sns:Publish on *.");
  } else if (code.includes("InvalidParameter")) {
    console.log("  • Phone number, region, or SenderID rejected. Check above input is well-formed.");
    console.log("  • In ap-south-1 (India), Sender IDs must be 6 alphanumeric chars and pre-registered with TRAI/DLT.");
    console.log("    For unregistered SenderIDs, AWS may silently fall back or reject the publish.");
  } else if (code.includes("OptedOut")) {
    console.log("  • The destination opted out of SMS from this AWS account.");
    console.log("  • Re-opt them in: SNS console → Mobile → Text messaging → Opted-out phone numbers.");
  } else if (code.includes("Throttling") || code.includes("ThrottlingException")) {
    console.log("  • You're hitting SNS Publish throttling. Wait a minute and try again.");
  } else if (code.includes("InvalidClientTokenId") || code.includes("SignatureDoesNotMatch")) {
    console.log("  • AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY pair is wrong or rotated.");
  } else {
    console.log("  • See the error code above. Cross-check at:");
    console.log(`    ${Blue}https://docs.aws.amazon.com/sns/latest/api/CommonErrors.html${Reset}`);
  }
  process.exit(2);
}

// ── 6. Final summary ─────────────────────────────────────────────────────
header("Done");
console.log(`${Green}If your phone (${phoneNumber}) does not receive the SMS within 1 minute:${Reset}`);
console.log("  1. Check the sandbox section above — is the number verified?");
console.log("  2. Open the SNS console → Mobile → Text messaging → Delivery status to see per-message logs.");
console.log("  3. Check that DND (Do Not Disturb) is not blocking transactional SMS on this number.");
console.log("  4. Re-run this script with the same number — if MessageId changes each time, AWS is accepting them.");
console.log("");
