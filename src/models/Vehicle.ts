import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVehicle extends Document {
  registrationNo: string;
  chassisNo: string;
  engineNo: string;
  ownerName: string;
  mobileNo: string;
  vehicleType: string;
  vehicleClass: string;
  fromState: string;
  seatingCapacity: number;
  sleeperCapacity: number;
  permitType: string;
  fuelType: string;
  makerModel: string;
  registrationDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    registrationNo:   { type: String, required: true, unique: true, uppercase: true, trim: true },
    chassisNo:        { type: String, required: true, trim: true },
    engineNo:         { type: String, trim: true, default: "" },
    ownerName:        { type: String, required: true, trim: true },
    mobileNo:         { type: String, trim: true, default: "" },
    vehicleType:      { type: String, default: "GOODS VEHICLE" },
    vehicleClass:     { type: String, default: "HGV" },
    fromState:        { type: String, default: "" },
    seatingCapacity:  { type: Number, default: 0 },
    sleeperCapacity:  { type: Number, default: 0 },
    permitType:       { type: String, default: "NATIONAL PERMIT" },
    fuelType:         { type: String, default: "DIESEL" },
    makerModel:       { type: String, default: "" },
    registrationDate: { type: Date, default: null },
  },
  { timestamps: true }
);

const Vehicle: Model<IVehicle> =
  mongoose.models.Vehicle ?? mongoose.model<IVehicle>("Vehicle", VehicleSchema);

export default Vehicle;
