import mongoose from "mongoose";
import dns from "dns";
import { readFileSync } from "fs";
import { resolve } from "path";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

// Manually parse .env.local
const envPath = resolve(process.cwd(), ".env.local");
const envFile = readFileSync(envPath, "utf-8");
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const [key, ...rest] = trimmed.split("=");
  process.env[key.trim()] = rest.join("=").trim();
}

const uri = process.env.MONGODB_URI;
console.log("URI found:", uri ? "YES" : "NO");
console.log("URI preview:", uri?.slice(0, 40) + "...");

try {
  console.log("\nConnecting...");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log("\n✅ Connected to MongoDB successfully!");
  console.log("DB name:", mongoose.connection.name);
  await mongoose.disconnect();
} catch (err) {
  console.error("\n❌ Connection FAILED:");
  console.error("Error name:", err.name);
  console.error("Error message:", err.message);
  if (err.cause) console.error("Cause:", err.cause.message);
}
