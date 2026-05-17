import mongoose, { Model } from "mongoose";
import { createTransactionSchema } from "../shared/baseSchema";
import type { TransactionDoc } from "../types";
import { biharConfig } from "./config";

/**
 * Bihar transaction model — backed by the `bihar_transactions`
 * collection. Initially uses the shared base schema as-is; Bihar-specific
 * fields can be added by calling schema.add(...) before model registration
 * without touching any other state.
 *
 * Wrapped in a getter (instead of a top-level mongoose.model call) so importing
 * this file from a client component or registry doesn't blow up — Mongoose
 * only initialises when getBiharTransactionModel() is called server-side.
 */

let cached: Model<TransactionDoc> | null = null;

export function getBiharTransactionModel(): Model<TransactionDoc> {
  if (cached) return cached;

  const existing = mongoose.models.BiharTransaction as
    | Model<TransactionDoc>
    | undefined;
  if (existing) {
    cached = existing;
    return cached;
  }

  const schema = createTransactionSchema();
  cached = mongoose.model<TransactionDoc>(
    "BiharTransaction",
    schema,
    biharConfig.collection
  );
  return cached;
}
