import mongoose, { Model } from "mongoose";
import { createTransactionSchema } from "../shared/baseSchema";
import type { TransactionDoc } from "../types";
import { haryanaConfig } from "./config";

/**
 * Haryana transaction model — backed by the `haryana_transactions`
 * collection.
 *
 * The Haryana checkpost form captures these state-specific fields (in
 * addition to the universal vehicleNo / chassisNo / ownerName / mobileNo /
 * amount / taxFrom / taxTo / paidAt that every state writes):
 *   vehicleCategory   — e.g. "CONTRACT CARRIAGE/PASSENGER VEHICLES"
 *   serviceType       — NOT APPLICABLE | ORDINARY | AIR CONDITIONED | …
 *   distance          — KM travelled inside Haryana
 *   borderDistrict    — entry checkpost district (AMBALA, BHIWANI, …)
 *   fitnessValidity   — vehicle fitness certificate expiry
 *   insuranceValidity — vehicle insurance expiry
 *   puccValidity      — PUCC certificate expiry
 *
 * These live on the shared base schema (so it stays single-source-of-truth
 * for Mongoose), but only Haryana's form ever writes them. Other states
 * silently leave them at their defaults.
 *
 * Wrapped in a getter (instead of a top-level mongoose.model call) so
 * importing this file from a client component or registry doesn't blow up
 * — Mongoose only initialises when getHaryanaTransactionModel() is called
 * server-side.
 */

let cached: Model<TransactionDoc> | null = null;

export function getHaryanaTransactionModel(): Model<TransactionDoc> {
  if (cached) return cached;

  const existing = mongoose.models.HaryanaTransaction as
    | Model<TransactionDoc>
    | undefined;
  if (existing) {
    cached = existing;
    return cached;
  }

  const schema = createTransactionSchema();
  cached = mongoose.model<TransactionDoc>(
    "HaryanaTransaction",
    schema,
    haryanaConfig.collection
  );
  return cached;
}
