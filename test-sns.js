/**
 * SNS SMS diagnostic — run with:  node test-sns.js
 * Checks sandbox status, opted-out numbers, account SMS attributes,
 * then sends a test message and prints the full response.
 */
require("dotenv").config({ path: ".env.local" });

const {
  SNSClient,
  PublishCommand,
  GetSMSAttributesCommand,
  CheckIfPhoneNumberIsOptedOutCommand,
  ListSMSSandboxPhoneNumbersCommand,
} = require("@aws-sdk/client-sns");

const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;

if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.error("Missing AWS credentials in .env.local");
  process.exit(1);
}

const client = new SNSClient({
  region: AWS_REGION,
  credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY },
});

const TARGET = "+918769388932";

async function main() {
  console.log(`\n=== AWS SNS SMS Diagnostic ===`);
  console.log(`Region : ${AWS_REGION}`);
  console.log(`Target : ${TARGET}\n`);

  // 1. Account-level SMS attributes (spending limit, default type, etc.)
  console.log("--- [1] Account SMS Attributes ---");
  try {
    const attrs = await client.send(new GetSMSAttributesCommand({}));
    console.log(JSON.stringify(attrs.attributes, null, 2));
  } catch (e) {
    console.error("Could not fetch SMS attributes:", e.message);
  }

  // 2. Sandbox status — lists verified numbers if account is in sandbox
  console.log("\n--- [2] Sandbox Verified Numbers ---");
  try {
    const sandbox = await client.send(new ListSMSSandboxPhoneNumbersCommand({}));
    const nums = sandbox.PhoneNumbers ?? [];
    if (nums.length === 0) {
      console.log("No sandbox numbers found.");
      console.log(">> If your account is in sandbox mode, this is why SMS fails.");
      console.log(">> Go to AWS Console → SNS → Text messaging → Sandbox → add & verify the number.");
    } else {
      console.log("Verified sandbox numbers:");
      nums.forEach((n) => console.log(` • ${n.PhoneNumber}  status=${n.Status}`));
      const isVerified = nums.some((n) => n.PhoneNumber === TARGET && n.Status === "Verified");
      console.log(isVerified
        ? `>> ${TARGET} IS verified — sandbox is not the problem.`
        : `>> ${TARGET} is NOT in the verified list — SMS will be dropped in sandbox mode.`
      );
    }
  } catch (e) {
    // ListSMSSandboxPhoneNumbers throws if account is NOT in sandbox
    if (e.name === "AuthorizationErrorException" || e.message?.includes("sandbox")) {
      console.log("Account appears to be in PRODUCTION mode (not sandbox).");
    } else {
      console.error("Error:", e.message);
    }
  }

  // 3. Opt-out check — number may have opted out of receiving SMS
  console.log("\n--- [3] Opt-out Check ---");
  try {
    const optOut = await client.send(
      new CheckIfPhoneNumberIsOptedOutCommand({ phoneNumber: TARGET })
    );
    console.log(`${TARGET} opted out: ${optOut.isOptedOut}`);
    if (optOut.isOptedOut) {
      console.log(">> Number has opted out — SNS will not deliver SMS to it.");
    }
  } catch (e) {
    console.error("Opt-out check failed:", e.message);
  }

  // 4. Send the test SMS
  console.log("\n--- [4] Sending Test SMS ---");
  try {
    const out = await client.send(
      new PublishCommand({
        PhoneNumber: TARGET,
        Message: "Test SMS from Parivahan — if you got this, SNS is working.",
        MessageAttributes: {
          "AWS.SNS.SMS.SMSType": {
            DataType: "String",
            StringValue: "Transactional",
          },
        },
      })
    );
    console.log("Publish accepted by SNS.");
    console.log("MessageId :", out.MessageId);
    console.log("SequenceNumber:", out.SequenceNumber ?? "N/A");
    console.log("\n>> SNS accepted the message. If SMS still doesn't arrive:");
    console.log("   • Enable CloudWatch delivery logs: AWS Console → SNS → Text messaging → Edit → Delivery status logging");
    console.log("   • Then re-run this script and check CloudWatch Logs for the carrier rejection reason.");
  } catch (e) {
    console.error("Publish failed:", e.message);
    console.error("Error name  :", e.name);
    if (e.$metadata) console.error("HTTP status :", e.$metadata.httpStatusCode);
  }

  console.log("\n=== Done ===\n");
}

main();
