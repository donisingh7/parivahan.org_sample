/**
 * Parivahan — MongoDB Setup & Seed Script
 * ─────────────────────────────────────────
 * Run with:
 *   node --env-file=.env.local scripts/setup-db.mjs
 *
 * What this script does:
 *  1. Creates all collections with proper indexes
 *  2. Seeds 1 superadmin user
 *  3. Seeds 5 portal users (for checkpost login)
 *  4. Seeds 5 sample vehicles
 *
 * Safe to run multiple times — uses upsert, won't duplicate data.
 */

import { MongoClient } from "mongodb";
import bcryptjs from "bcryptjs";
import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const MONGODB_URI = process.env.MONGODB_URI;
const hash = (pwd) => bcryptjs.hashSync(pwd, 12);

if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI is not set. Run: node --env-file=.env.local scripts/setup-db.mjs");
  process.exit(1);
}

const client = new MongoClient(MONGODB_URI);

// ── Sample Data ──────────────────────────────────────────────────────────────

const ADMIN_USER = {
  name:     "Super Admin",
  email:    "admin@parivahan.gov.in",
  password: hash("Admin@123"),
  role:     "superadmin",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const PORTAL_USERS = [
  { userId: "UP12345", name: "Rajesh Kumar",  mobileNo: "9876543210", email: "rajesh@example.com",  vehicleNos: ["UP32AB1234"], password: hash("User@123"), isActive: true },
  { userId: "DL56789", name: "Priya Sharma",  mobileNo: "9123456789", email: "priya@example.com",   vehicleNos: ["DL01AA9999"], password: hash("User@123"), isActive: true },
  { userId: "MH90123", name: "Vikram Singh",  mobileNo: "9988776655", email: "vikram@example.com",  vehicleNos: ["MH12CD5678"], password: hash("User@123"), isActive: true },
  { userId: "RJ45678", name: "Suresh Patel",  mobileNo: "9765432108", email: "suresh@example.com",  vehicleNos: ["RJ14EF3456"], password: hash("User@123"), isActive: true },
  { userId: "GJ23456", name: "Amit Shah",     mobileNo: "9654321087", email: "amit@example.com",    vehicleNos: ["GJ01GH7890"], password: hash("User@123"), isActive: true },
].map(u => ({ ...u, createdAt: new Date(), updatedAt: new Date() }));

const VEHICLES = [
  {
    registrationNo: "UP32AB1234", chassisNo: "CH001234", engineNo: "EN001234",
    ownerName: "Rajesh Kumar",   mobileNo: "9876543210", fromState: "UP",
    vehicleType: "GOODS VEHICLE", vehicleClass: "HGV",    fuelType: "DIESEL",
    seatingCapacity: 2, sleeperCapacity: 0, permitType: "NATIONAL PERMIT",
    makerModel: "TATA LPT 1109", registrationDate: new Date("2019-03-15"),
  },
  {
    registrationNo: "DL01AA9999", chassisNo: "CH005678", engineNo: "EN005678",
    ownerName: "Priya Sharma",   mobileNo: "9123456789", fromState: "DL",
    vehicleType: "PASSENGER VEHICLE", vehicleClass: "BUS",  fuelType: "DIESEL",
    seatingCapacity: 45, sleeperCapacity: 0, permitType: "NATIONAL PERMIT",
    makerModel: "ASHOK LEYLAND",  registrationDate: new Date("2020-07-22"),
  },
  {
    registrationNo: "MH12CD5678", chassisNo: "CH009012", engineNo: "EN009012",
    ownerName: "Vikram Singh",   mobileNo: "9988776655", fromState: "MH",
    vehicleType: "GOODS VEHICLE", vehicleClass: "HGV",    fuelType: "DIESEL",
    seatingCapacity: 2, sleeperCapacity: 0, permitType: "NATIONAL PERMIT",
    makerModel: "EICHER PRO 3015", registrationDate: new Date("2021-01-10"),
  },
  {
    registrationNo: "RJ14EF3456", chassisNo: "CH003456", engineNo: "EN003456",
    ownerName: "Suresh Patel",   mobileNo: "9765432108", fromState: "RJ",
    vehicleType: "TOURIST VEHICLE", vehicleClass: "TOURIST CAB", fuelType: "PETROL",
    seatingCapacity: 8, sleeperCapacity: 0, permitType: "ALL INDIA TOURIST PERMIT",
    makerModel: "TOYOTA INNOVA",  registrationDate: new Date("2022-05-18"),
  },
  {
    registrationNo: "GJ01GH7890", chassisNo: "CH007890", engineNo: "EN007890",
    ownerName: "Amit Shah",      mobileNo: "9654321087", fromState: "GJ",
    vehicleType: "GOODS VEHICLE", vehicleClass: "MGV",    fuelType: "CNG",
    seatingCapacity: 2, sleeperCapacity: 0, permitType: "NATIONAL PERMIT",
    makerModel: "MAHINDRA BOLERO PICKUP", registrationDate: new Date("2021-11-30"),
  },
].map(v => ({ ...v, createdAt: new Date(), updatedAt: new Date() }));

// ── Main ─────────────────────────────────────────────────────────────────────

async function setup() {
  await client.connect();
  console.log("✅  Connected to MongoDB:", MONGODB_URI.replace(/\/\/.*@/, "//***@"));

  const dbName = MONGODB_URI.split("/").pop()?.split("?")[0] || "parivahan";
  const db = client.db(dbName);
  console.log("📦  Database:", dbName);
  console.log("");

  // ── 1. Users (admin) ──────────────────────────────────────────────────────
  console.log("🔧  Setting up collection: users");
  const users = db.collection("users");
  await users.createIndex({ email: 1 }, { unique: true, background: true });
  await users.updateOne(
    { email: ADMIN_USER.email },
    { $setOnInsert: ADMIN_USER },
    { upsert: true }
  );
  console.log("   ✓ Index: email (unique)");
  console.log("   ✓ Admin user:", ADMIN_USER.email);

  // ── 2. PortalUsers (regular users) ───────────────────────────────────────
  console.log("\n🔧  Setting up collection: portalusers");
  const portalUsers = db.collection("portalusers");
  await portalUsers.createIndex({ userId: 1 }, { unique: true, background: true });
  await portalUsers.createIndex({ mobileNo: 1 }, { background: true });

  let portalUpserted = 0;
  for (const u of PORTAL_USERS) {
    const res = await portalUsers.updateOne(
      { userId: u.userId },
      { $setOnInsert: u },
      { upsert: true }
    );
    if (res.upsertedCount > 0) portalUpserted++;
  }
  console.log("   ✓ Index: userId (unique)");
  console.log("   ✓ Index: mobileNo");
  console.log(`   ✓ Portal users seeded: ${portalUpserted} new / ${PORTAL_USERS.length - portalUpserted} already existed`);

  // ── 3. Vehicles ───────────────────────────────────────────────────────────
  console.log("\n🔧  Setting up collection: vehicles");
  const vehicles = db.collection("vehicles");
  await vehicles.createIndex({ registrationNo: 1 }, { unique: true, background: true });
  await vehicles.createIndex({ ownerName: 1 }, { background: true });
  await vehicles.createIndex({ mobileNo: 1 }, { background: true });

  let vehicleUpserted = 0;
  for (const v of VEHICLES) {
    const res = await vehicles.updateOne(
      { registrationNo: v.registrationNo },
      { $setOnInsert: v },
      { upsert: true }
    );
    if (res.upsertedCount > 0) vehicleUpserted++;
  }
  console.log("   ✓ Index: registrationNo (unique)");
  console.log("   ✓ Index: ownerName");
  console.log("   ✓ Index: mobileNo");
  console.log(`   ✓ Vehicles seeded: ${vehicleUpserted} new / ${VEHICLES.length - vehicleUpserted} already existed`);

  // ── 4. Transactions (per-state collections) ──────────────────────────────
  // The legacy unified `transactions` collection is dropped on every setup
  // because the app now writes to per-state collections (rajasthan_transactions,
  // bihar_transactions, …). Each per-state collection mirrors the same schema
  // and indexes — the model file under src/lib/states/<state>/model.ts uses
  // the shared base schema (which already declares the same indexes), so the
  // first write to any state collection auto-creates them. We pre-create all
  // ten here so admin queries see consistent collections from day one.
  const PER_STATE_COLLECTIONS = [
    { code: "RJ", name: "Rajasthan",         collection: "rajasthan_transactions"        },
    { code: "BR", name: "Bihar",             collection: "bihar_transactions"            },
    { code: "AP", name: "Andhra Pradesh",    collection: "andhra_pradesh_transactions"   },
    { code: "MH", name: "Maharashtra",       collection: "maharashtra_transactions"      },
    { code: "JH", name: "Jharkhand",         collection: "jharkhand_transactions"        },
    { code: "PB", name: "Punjab",            collection: "punjab_transactions"           },
    { code: "UP", name: "Uttar Pradesh",     collection: "uttar_pradesh_transactions"    },
    { code: "UK", name: "Uttarakhand",       collection: "uttarakhand_transactions"      },
    { code: "HR", name: "Haryana",           collection: "haryana_transactions"          },
    { code: "HP", name: "Himachal Pradesh",  collection: "himachal_pradesh_transactions" },
  ];

  // Drop the legacy single-collection if it exists — fresh start as agreed.
  const existing = await db.listCollections({ name: "transactions" }).toArray();
  if (existing.length > 0) {
    console.log("\n🗑   Dropping legacy collection: transactions (per-state collections take over)");
    await db.collection("transactions").drop();
    console.log("   ✓ Dropped");
  }

  // ── Per-state collections whose schema has been redesigned to match the
  //    real gov-portal inspect HTML are wiped here so leftover Rajasthan-
  //    shaped documents from prior runs don't poison the new receipts.
  //    Add a state code to this list whenever its schema changes shape.
  const SCHEMA_CHANGED_COLLECTIONS = [
    "haryana_transactions",
    "punjab_transactions",
    "uttarakhand_transactions",
  ];
  for (const name of SCHEMA_CHANGED_COLLECTIONS) {
    const drop = await db.listCollections({ name }).toArray();
    if (drop.length > 0) {
      console.log(`\n🗑   Dropping ${name} (schema redesign — fresh start)`);
      await db.collection(name).drop();
      console.log("   ✓ Dropped");
    }
  }

  console.log("\n🔧  Setting up per-state transaction collections");
  for (const s of PER_STATE_COLLECTIONS) {
    const coll = db.collection(s.collection);
    await coll.createIndex({ transactionId: 1 }, { unique: true, background: true });
    await coll.createIndex({ vehicleNo: 1, createdAt: -1 }, { background: true });
    await coll.createIndex({ status: 1 },     { background: true });
    await coll.createIndex({ state: 1 },      { background: true });
    await coll.createIndex({ userId: 1 },     { background: true });
    await coll.createIndex({ createdAt: -1 }, { background: true });
    console.log(`   ✓ ${s.collection.padEnd(35)}  (${s.name})`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n════════════════════════════════════════");
  console.log("✅  Setup complete!");
  console.log("\n📋  Login credentials:");
  console.log("   🔑  Admin Portal  → http://localhost:3000/admin");
  console.log("       Email:    admin@parivahan.gov.in");
  console.log("       Password: Admin@123");
  console.log("\n   🔑  Checkpost Portal → http://localhost:3000/login");
  console.log("       User ID:  UP12345   Password: User@123  (Rajesh Kumar)");
  console.log("       User ID:  DL56789   Password: User@123  (Priya Sharma)");
  console.log("       User ID:  MH90123   Password: User@123  (Vikram Singh)");
  console.log("       User ID:  RJ45678   Password: User@123  (Suresh Patel)");
  console.log("       User ID:  GJ23456   Password: User@123  (Amit Shah)");
  console.log("\n   🚗  Sample Vehicle Numbers:");
  VEHICLES.forEach(v => console.log(`       ${v.registrationNo} — ${v.ownerName}`));
  console.log("════════════════════════════════════════\n");
}

setup()
  .catch((err) => { console.error("❌  Setup failed:", err); process.exit(1); })
  .finally(() => client.close());
