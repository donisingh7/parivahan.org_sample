import mongoose, { Model } from "mongoose";
import { createTransactionSchema } from "../shared/baseSchema";
import type { TransactionDoc } from "../types";
import { uttarakhandConfig } from "./config";

/**
 * Uttarakhand transaction model — backed by the `uttarakhand_transactions`
 * collection. Uses the shared base schema directly because every Uttarakhand-
 * specific field captured by its tax-collection form is already declared as
 * an optional field on `createTransactionSchema()`:
 *
 *   • vehicleCategory, vehicleClass, vehicleType, permitType, serviceType
 *   • taxMode, noOfPeriods, sleeperCap, seatingCap
 *   • borderDistrict (District Name), checkpostName (Barrier Name)
 *   • fitnessValidity, puccValidity
 *   • permitNumber, permitFrom, permitUpto
 *   • userCharge (Service/User Charge), infraCess (Civic Infra Cess)
 *
 * States that don't capture these fields simply leave the defaults. Adding
 * Uttarakhand's two new permit-validity fields here would have been state-
 * local (schema.add) but we keep them on baseSchema instead so the admin
 * dashboard sees one consistent shape across collections.
 *
 * Wrapped in a getter (instead of a top-level mongoose.model call) so
 * importing this file from a client component or registry doesn't blow up —
 * Mongoose only initialises when getUttarakhandTransactionModel() is called
 * server-side.
 */

let cached: Model<TransactionDoc> | null = null;

export function getUttarakhandTransactionModel(): Model<TransactionDoc> {
  if (cached) return cached;

  const existing = mongoose.models.UttarakhandTransaction as
    | Model<TransactionDoc>
    | undefined;
  if (existing) {
    cached = existing;
    return cached;
  }

  const schema = createTransactionSchema();
  cached = mongoose.model<TransactionDoc>(
    "UttarakhandTransaction",
    schema,
    uttarakhandConfig.collection
  );
  return cached;
}
