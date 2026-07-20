import mongoose, { Model } from "mongoose";
import { createTransactionSchema } from "../shared/baseSchema";
import type { TransactionDoc } from "../types";
import { telanganaConfig } from "./config";

/**
 * Telangana transaction model — backed by the `telangana_transactions`
 * collection. Uses the shared base schema as-is; Telangana-specific fields
 * can be added by calling schema.add(...) before model registration without
 * touching any other state.
 *
 * Wrapped in a getter (instead of a top-level mongoose.model call) so importing
 * this file from a client component or registry doesn't blow up — Mongoose
 * only initialises when getTelanganaTransactionModel() is called server-side.
 */

let cached: Model<TransactionDoc> | null = null;

export function getTelanganaTransactionModel(): Model<TransactionDoc> {
  if (cached) return cached;

  const existing = mongoose.models.TelanganaTransaction as
    | Model<TransactionDoc>
    | undefined;
  if (existing) {
    cached = existing;
    return cached;
  }

  const schema = createTransactionSchema();
  cached = mongoose.model<TransactionDoc>(
    "TelanganaTransaction",
    schema,
    telanganaConfig.collection
  );
  return cached;
}
