import mongoose, { Model } from "mongoose";
import { createTransactionSchema } from "../shared/baseSchema";
import type { TransactionDoc } from "../types";
import { odishaConfig } from "./config";

/**
 * Odisha transaction model — backed by the `odisha_transactions` collection.
 * Uses the shared base schema as-is; Odisha-specific fields can be added by
 * calling schema.add(...) before model registration without touching any
 * other state.
 *
 * Wrapped in a getter (instead of a top-level mongoose.model call) so importing
 * this file from a client component or registry doesn't blow up — Mongoose
 * only initialises when getOdishaTransactionModel() is called server-side.
 */

let cached: Model<TransactionDoc> | null = null;

export function getOdishaTransactionModel(): Model<TransactionDoc> {
  if (cached) return cached;

  const existing = mongoose.models.OdishaTransaction as
    | Model<TransactionDoc>
    | undefined;
  if (existing) {
    cached = existing;
    return cached;
  }

  const schema = createTransactionSchema();
  cached = mongoose.model<TransactionDoc>(
    "OdishaTransaction",
    schema,
    odishaConfig.collection
  );
  return cached;
}
