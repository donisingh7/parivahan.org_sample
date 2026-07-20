import mongoose, { Model } from "mongoose";
import { createTransactionSchema } from "../shared/baseSchema";
import type { TransactionDoc } from "../types";
import { chhattisgarhConfig } from "./config";

/**
 * Chhattisgarh transaction model — backed by the `chhattisgarh_transactions`
 * collection. Uses the shared base schema as-is; Chhattisgarh-specific fields
 * can be added by calling schema.add(...) before model registration without
 * touching any other state.
 *
 * Wrapped in a getter (instead of a top-level mongoose.model call) so importing
 * this file from a client component or registry doesn't blow up — Mongoose
 * only initialises when getChhattisgarhTransactionModel() is called server-side.
 */

let cached: Model<TransactionDoc> | null = null;

export function getChhattisgarhTransactionModel(): Model<TransactionDoc> {
  if (cached) return cached;

  const existing = mongoose.models.ChhattisgarhTransaction as
    | Model<TransactionDoc>
    | undefined;
  if (existing) {
    cached = existing;
    return cached;
  }

  const schema = createTransactionSchema();
  cached = mongoose.model<TransactionDoc>(
    "ChhattisgarhTransaction",
    schema,
    chhattisgarhConfig.collection
  );
  return cached;
}
