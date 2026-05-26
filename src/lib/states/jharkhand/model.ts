import mongoose, { Model } from "mongoose";
import { createTransactionSchema } from "../shared/baseSchema";
import type { TransactionDoc } from "../types";
import { jharkhandConfig } from "./config";

/**
 * Jharkhand transaction model — backed by the `jharkhand_transactions`
 * collection. Initially uses the shared base schema as-is; Jharkhand-specific
 * fields can be added by calling schema.add(...) before model registration
 * without touching any other state.
 *
 * Wrapped in a getter (instead of a top-level mongoose.model call) so importing
 * this file from a client component or registry doesn't blow up — Mongoose
 * only initialises when getJharkhandTransactionModel() is called server-side.
 */

let cached: Model<TransactionDoc> | null = null;

export function getJharkhandTransactionModel(): Model<TransactionDoc> {
  if (cached) return cached;

  const existing = mongoose.models.JharkhandTransaction as
    | Model<TransactionDoc>
    | undefined;
  if (existing) {
    cached = existing;
    return cached;
  }

  const schema = createTransactionSchema();

  // Jharkhand-specific string fields that differ from the base schema types
  // (base schema stores grossVehicleWt/unladenWt as Number, fitnessValidity
  // etc. as Date — JH captures them as free-text strings from the form).
  // NOTE: grossCombinationWeight is now in the shared base schema.
  schema.add({
    jhFitnessValidity:      { type: String, default: "" },
    jhInsuranceValidity:    { type: String, default: "" },
    jhPuccValidity:         { type: String, default: "" },
    jhGrossVehicleWt:       { type: String, default: "" },
    jhUnladenWt:            { type: String, default: "" },
  });

  cached = mongoose.model<TransactionDoc>(
    "JharkhandTransaction",
    schema,
    jharkhandConfig.collection
  );
  return cached;
}
