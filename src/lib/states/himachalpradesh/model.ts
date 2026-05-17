import mongoose, { Model } from "mongoose";
import { createTransactionSchema } from "../shared/baseSchema";
import type { TransactionDoc } from "../types";
import { himachalPradeshConfig } from "./config";

/**
 * Himachal Pradesh transaction model — backed by the `himachal_pradesh_transactions`
 * collection. Initially uses the shared base schema as-is; Himachal Pradesh-specific
 * fields can be added by calling schema.add(...) before model registration
 * without touching any other state.
 *
 * Wrapped in a getter (instead of a top-level mongoose.model call) so importing
 * this file from a client component or registry doesn't blow up — Mongoose
 * only initialises when getHimachalPradeshTransactionModel() is called server-side.
 */

let cached: Model<TransactionDoc> | null = null;

export function getHimachalPradeshTransactionModel(): Model<TransactionDoc> {
  if (cached) return cached;

  const existing = mongoose.models.HimachalPradeshTransaction as
    | Model<TransactionDoc>
    | undefined;
  if (existing) {
    cached = existing;
    return cached;
  }

  const schema = createTransactionSchema();
  cached = mongoose.model<TransactionDoc>(
    "HimachalPradeshTransaction",
    schema,
    himachalPradeshConfig.collection
  );
  return cached;
}
