/**
 * VehicleCache — stores the union of all grey-coloured fields across every
 * state's TaxCollectionForm.  Keyed by vehicleNo (unique).
 *
 * When a booking is confirmed (POST /api/payment succeeds) the grey-field
 * values are upserted here.  When the operator clicks "Get Details" on any
 * state form, we fetch from this collection and pre-fill the matching fields.
 *
 * Fields that do not apply to a particular state are simply left empty ("").
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVehicleCache extends Document {
  vehicleNo:       string;
  chassisNo:       string;
  ownerName:       string;
  vehicleType:     string;   // TRANSPORT / NOT APPLICABLE / GOODS VEHICLE / …
  vehicleCategory: string;   // GOODS VEHICLE / GOODS CARRIER / … (states that have a separate category dropdown)
  vehicleClass:    string;
  seatingCap:      string;   // passenger vehicles
  sleeperCap:      string;
  grossVehicleWt:  string;   // goods vehicles (normalised from grossVehicleWt / jhGrossVehicleWt / brGrossVehicleWt / mhLadenWeight)
  unladenWt:       string;   // goods vehicles (normalised from unladenWt / jhUnladenWt / brUnladenWt / mhUnladenWeight)
  permitType:      string;
  permitNumber:    string;   // Uttar Pradesh
  taxMode:         string;   // Rajasthan
  noPeriods:       string;   // Rajasthan
}

const VehicleCacheSchema = new Schema<IVehicleCache>(
  {
    vehicleNo:       { type: String, required: true, unique: true, uppercase: true, trim: true },
    chassisNo:       { type: String, default: "" },
    ownerName:       { type: String, default: "" },
    vehicleType:     { type: String, default: "" },
    vehicleCategory: { type: String, default: "" },
    vehicleClass:    { type: String, default: "" },
    seatingCap:      { type: String, default: "" },
    sleeperCap:      { type: String, default: "" },
    grossVehicleWt:  { type: String, default: "" },
    unladenWt:       { type: String, default: "" },
    permitType:      { type: String, default: "" },
    permitNumber:    { type: String, default: "" },
    taxMode:         { type: String, default: "" },
    noPeriods:       { type: String, default: "" },
  },
  { timestamps: true }
);

const VehicleCache: Model<IVehicleCache> =
  mongoose.models.VehicleCache ??
  mongoose.model<IVehicleCache>("VehicleCache", VehicleCacheSchema);

export default VehicleCache;
