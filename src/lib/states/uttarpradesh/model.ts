import mongoose, { Model } from "mongoose";
import { createTransactionSchema } from "../shared/baseSchema";
import type { TransactionDoc } from "../types";
import { uttarPradeshConfig } from "./config";

/**
 * Uttar Pradesh transaction model — backed by the `uttar_pradesh_transactions`
 * collection. Initially uses the shared base schema as-is; Uttar Pradesh-specific
 * fields can be added by calling schema.add(...) before model registration
 * without touching any other state.
 *
 * Wrapped in a getter (instead of a top-level mongoose.model call) so importing
 * this file from a client component or registry doesn't blow up — Mongoose
 * only initialises when getUttarPradeshTransactionModel() is called server-side.
 */

let cached: Model<TransactionDoc> | null = null;

export function getUttarPradeshTransactionModel(): Model<TransactionDoc> {
  if (cached) return cached;

  const existing = mongoose.models.UttarPradeshTransaction as
    | Model<TransactionDoc>
    | undefined;
  if (existing) {
    cached = existing;
    return cached;
  }

  const schema = createTransactionSchema();
  cached = mongoose.model<TransactionDoc>(
    "UttarPradeshTransaction",
    schema,
    uttarPradeshConfig.collection
  );
  return cached;
}
