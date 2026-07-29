import mongoose, { Model } from "mongoose";
import { createTransactionSchema } from "../shared/baseSchema";
import type { TransactionDoc } from "../types";
import { karnatakaConfig } from "./config";

/**
 * Karnataka transaction model — backed by the `karnataka_transactions`
 * collection. Uses the shared base schema. Wrapped in a getter so importing
 * this file from a client component or registry doesn't initialise Mongoose;
 * it only runs server-side when getKarnatakaTransactionModel() is called.
 */

let cached: Model<TransactionDoc> | null = null;

export function getKarnatakaTransactionModel(): Model<TransactionDoc> {
  if (cached) return cached;

  const existing = mongoose.models.KarnatakaTransaction as
    | Model<TransactionDoc>
    | undefined;
  if (existing) {
    cached = existing;
    return cached;
  }

  const schema = createTransactionSchema();
  cached = mongoose.model<TransactionDoc>(
    "KarnatakaTransaction",
    schema,
    karnatakaConfig.collection
  );
  return cached;
}
