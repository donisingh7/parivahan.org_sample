/**
 * scripts/setup-vehicle-cache.mjs
 *
 * Creates the VehicleCache collection in MongoDB and ensures the unique index
 * on vehicleNo exists.  Run once before first deployment:
 *
 *   node scripts/setup-vehicle-cache.mjs
 *
 * Requires MONGODB_URI to be set in .env.local (loaded automatically).
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

// ── Load .env.local manually (no dotenv dependency needed) ─────────────────
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, "../.env.local");
let MONGODB_URI = "";

try {
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const match = line.match(/^MONGODB_URI=(.+)$/);
    if (match) { MONGODB_URI = match[1].trim(); break; }
  }
} catch {
  // .env.local may not exist in CI
}

MONGODB_URI = MONGODB_URI || process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI is not set. Add it to .env.local or export it as an environment variable.");
  process.exit(1);
}

// ── Minimal schema (mirrors src/models/VehicleCache.ts) ────────────────────
const vehicleCacheSchema = new mongoose.Schema(
  {
    vehicleNo:       { type: String, required: true, unique: true, uppercase: true, trim: true },
    chassisNo:       { type: String, default: "" },
    ownerName:       { type: String, default: "" },
    vehicleType:     { type: String, default: "" },
    vehicleCategory: { type: String, default: "" },
    vehicleClass:    { type: String, default: "" },
    seatingCap:      { type: String, default: "" },
    sleeperCap:      { type: String, default: "" },
    grossVehicleWt:  { type: String, default: "" },
    unladenWt:       { type: String, default: "" },
    permitType:      { type: String, default: "" },
    permitNumber:    { type: String, default: "" },
    taxMode:         { type: String, default: "" },
    noPeriods:       { type: String, default: "" },
  },
  { timestamps: true }
);

async function main() {
  console.log("🔌  Connecting to MongoDB…");
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });
  console.log("✅  Connected.");

  const VehicleCache = mongoose.models.VehicleCache ??
    mongoose.model("VehicleCache", vehicleCacheSchema);

  // createCollection is idempotent — safe to run multiple times
  try {
    await mongoose.connection.db.createCollection("vehiclecaches");
    console.log("✅  Collection 'vehiclecaches' created.");
  } catch (e) {
    if (e?.codeName === "NamespaceExists") {
      console.log("ℹ️   Collection 'vehiclecaches' already exists — skipping creation.");
    } else {
      throw e;
    }
  }

  // Ensure unique index on vehicleNo
  await VehicleCache.collection.createIndex({ vehicleNo: 1 }, { unique: true });
  console.log("✅  Unique index on vehicleNo ensured.");

  // Show current document count
  const count = await VehicleCache.countDocuments();
  console.log(`ℹ️   VehicleCache currently holds ${count} document(s).`);

  await mongoose.disconnect();
  console.log("🔌  Disconnected. Setup complete.");
}

main().catch((err) => {
  console.error("❌  Setup failed:", err);
  process.exit(1);
});
