import mongoose, { Model } from "mongoose";
import { createTransactionSchema } from "../shared/baseSchema";
import type { TransactionDoc } from "../types";
import { tamilNaduConfig } from "./config";

/**
 * Tamil Nadu transaction model — backed by the `tamil_nadu_transactions`
 * collection. Uses the shared base schema as-is.
 *
 * Wrapped in a getter (instead of a top-level mongoose.model call) so importing
 * this file from a client component or registry doesn't blow up — Mongoose
 * only initialises when getTamilNaduTransactionModel() is called server-side.
 */

let cached: Model<TransactionDoc> | null = null;

export function getTamilNaduTransactionModel(): Model<TransactionDoc> {
  if (cached) return cached;

  const existing = mongoose.models.TamilNaduTransaction as
    | Model<TransactionDoc>
    | undefined;
  if (existing) {
    cached = existing;
    return cached;
  }

  const schema = createTransactionSchema();
  cached = mongoose.model<TransactionDoc>(
    "TamilNaduTransaction",
    schema,
    tamilNaduConfig.collection
  );
  return cached;
}
