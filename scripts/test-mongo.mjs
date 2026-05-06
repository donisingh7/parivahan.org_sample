/**
 * MongoDB Connection Test Script
 * Run: node scripts/test-mongo.mjs
 */

import { MongoClient } from "mongodb";
import dns from "dns";
import { readFileSync } from "fs";
import { resolve } from "path";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

// Load .env.local so the correct URI and password are always used
const envFile = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const [key, ...rest] = trimmed.split("=");
  process.env[key.trim()] = rest.join("=").trim();
}

const MONGODB_URI = process.env.MONGODB_URI;

console.log("🔌  Connecting to MongoDB Atlas...");
console.log("   Host: cluster0.rvth9er.mongodb.net");
console.log("   User: donisingh");
console.log("");

const client = new MongoClient(MONGODB_URI, {
  serverSelectionTimeoutMS: 8000,
  connectTimeoutMS: 8000,
});

async function test() {
  // ── 1. Connect ────────────────────────────────────────────────────────────
  await client.connect();
  console.log("✅  Connected successfully!\n");

  // ── 2. List databases ─────────────────────────────────────────────────────
  const admin = client.db("admin");
  const dbs = await admin.admin().listDatabases();
  console.log("📦  Databases found:");
  dbs.databases.forEach(d => console.log(`   - ${d.name} (${(d.sizeOnDisk / 1024).toFixed(1)} KB)`));

  // ── 3. Check 'parivahan' database ─────────────────────────────────────────
  const db = client.db("parivahan");
  const collections = await db.listCollections().toArray();
  console.log("\n📂  Collections in 'parivahan' database:");
  if (collections.length === 0) {
    console.log("   (empty — no collections yet. Run setup-db.mjs to seed data)");
  } else {
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`   - ${col.name}  (${count} documents)`);
    }
  }

  // ── 4. Write test (ping) ───────────────────────────────────────────────────
  const pingCol = db.collection("_ping_test");
  await pingCol.insertOne({ test: true, ts: new Date() });
  await pingCol.deleteOne({ test: true });
  console.log("\n✅  Read/Write test: PASSED");

  console.log("\n════════════════════════════════════════");
  console.log("✅  All checks passed! MongoDB is ready.");
  console.log("\n📝  Next step: update your .env.local with:");
  console.log('   MONGODB_URI="' + MONGODB_URI + '"');
  console.log("════════════════════════════════════════\n");
}

test()
  .catch((err) => {
    console.error("\n❌  Connection FAILED!\n");
    console.error("   Error:", err.message);
    console.error("\n🔍  Possible causes:");
    console.error("   • Wrong username or password");
    console.error("   • Your IP is not whitelisted in Atlas Network Access");
    console.error("     → Go to Atlas → Security → Network Access → Add IP Address → Allow from Anywhere");
    console.error("   • Cluster name/URL is wrong");
    console.error("   • MongoDB Atlas free tier is paused (inactive > 60 days)");
    process.exit(1);
  })
  .finally(() => client.close());
