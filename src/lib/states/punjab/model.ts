import mongoose, { Model } from "mongoose";
import { createTransactionSchema } from "../shared/baseSchema";
import type { TransactionDoc } from "../types";
import { punjabConfig } from "./config";

/**
 * Punjab transaction model — backed by the `punjab_transactions`
 * collection. Uses the shared base schema directly because Punjab's
 * required fields (vehicleCategory, serviceType, taxMode, borderDistrict,
 * checkpostName, userCharge, infraCess) are all already optional fields
 * on `createTransactionSchema()`. The Punjab form populates them; states
 * that don't need them simply leave the defaults.
 *
 * Wrapped in a getter (instead of a top-level mongoose.model call) so importing
 * this file from a client component or registry doesn't blow up — Mongoose
 * only initialises when getPunjabTransactionModel() is called server-side.
 */

let cached: Model<TransactionDoc> | null = null;

export function getPunjabTransactionModel(): Model<TransactionDoc> {
  if (cached) return cached;

  const existing = mongoose.models.PunjabTransaction as
    | Model<TransactionDoc>
    | undefined;
  if (existing) {
    cached = existing;
    return cached;
  }

  const schema = createTransactionSchema();
  cached = mongoose.model<TransactionDoc>(
    "PunjabTransaction",
    schema,
    punjabConfig.collection
  );
  return cached;
}
