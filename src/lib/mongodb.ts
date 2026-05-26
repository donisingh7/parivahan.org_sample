import mongoose from "mongoose";

const MOCK_DB    = process.env.MOCK_DB === "true";
const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MOCK_DB && !MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable in .env.local");
}

// Cache the connection across hot-reloads in development
declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

let cached = global._mongooseConn;
if (!cached) {
  cached = global._mongooseConn = { conn: null, promise: null };
}

export async function connectDB() {
  // ── Mock mode: skip real connection when MOCK_DB=true in .env.local ─────────
  // This env var is never set in production/deployment, so the real
  // MongoDB path runs unchanged there.
  if (MOCK_DB) return null as unknown as typeof mongoose;

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
