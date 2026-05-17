import mongoose, { Model } from "mongoose";
import { createTransactionSchema } from "../shared/baseSchema";
import type { TransactionDoc } from "../types";
import { maharashtraConfig } from "./config";

/**
 * Maharashtra transaction model — backed by the `maharashtra_transactions`
 * collection. Initially uses the shared base schema as-is; Maharashtra-specific
 * fields can be added by calling schema.add(...) before model registration
 * without touching any other state.
 *
 * Wrapped in a getter (instead of a top-level mongoose.model call) so importing
 * this file from a client component or registry doesn't blow up — Mongoose
 * only initialises when getMaharashtraTransactionModel() is called server-side.
 */

let cached: Model<TransactionDoc> | null = null;

export function getMaharashtraTransactionModel(): Model<TransactionDoc> {
  if (cached) return cached;

  const existing = mongoose.models.MaharashtraTransaction as
    | Model<TransactionDoc>
    | undefined;
  if (existing) {
    cached = existing;
    return cached;
  }

  const schema = createTransactionSchema();
  cached = mongoose.model<TransactionDoc>(
    "MaharashtraTransaction",
    schema,
    maharashtraConfig.collection
  );
  return cached;
}
