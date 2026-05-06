import mongoose, { Schema, Document, Model } from "mongoose";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface ITransaction extends Document {
  transactionId:    string;
  // Portal user this transaction belongs to (decoded from the user_token cookie
  // at /api/payment time). Empty string when the user wasn't logged in — the
  // transaction is still saved so the receipt can render.
  userId:           string;
  userIdLabel:      string;
  receiptNo:        string;
  orderRef:         string;
  vehicleNo:        string;
  chassisNo:        string;
  ownerName:        string;
  mobileNo:         string;
  visitingState:    string;
  fromState:        string;
  // Form select codes ("1", "3", "-1", etc.) — preserved as-is from the form.
  vehicleType:      string;
  vehicleClass:     string;
  permitType:       string;
  districtEntering: string;
  purposeOfVisit:   string;
  taxMode:          string;
  // Free-text checkpost name typed by the user.
  checkpostName:    string;
  // AITP permit dates (optional).
  aitpValidity:     Date | null;
  aitpAuthValidity: Date | null;
  taxFrom:          Date;
  taxTo:            Date;
  noOfPeriods:      number;
  seatingCap:       number;
  sleeperCap:       number;
  amount:           number;
  paymentMethod:    string;
  bankName:         string;
  status:           PaymentStatus;
  paidAt:           Date | null;
  createdAt:        Date;
  updatedAt:        Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    transactionId:    { type: String, required: true, unique: true },
    userId:           { type: String, default: "", index: true },
    userIdLabel:      { type: String, default: "" },
    receiptNo:        { type: String, default: "" },
    orderRef:         { type: String, default: "" },
    vehicleNo:        { type: String, required: true, uppercase: true, trim: true },
    chassisNo:        { type: String, default: "" },
    ownerName:        { type: String, default: "" },
    mobileNo:         { type: String, default: "" },
    visitingState:    { type: String, default: "" },
    fromState:        { type: String, default: "" },
    vehicleType:      { type: String, default: "" },
    vehicleClass:     { type: String, default: "" },
    permitType:       { type: String, default: "" },
    districtEntering: { type: String, default: "" },
    purposeOfVisit:   { type: String, default: "" },
    taxMode:          { type: String, default: "" },
    checkpostName:    { type: String, default: "" },
    aitpValidity:     { type: Date, default: null },
    aitpAuthValidity: { type: Date, default: null },
    taxFrom:          { type: Date, required: true },
    taxTo:            { type: Date, required: true },
    noOfPeriods:      { type: Number, default: 1 },
    seatingCap:       { type: Number, default: 0 },
    sleeperCap:       { type: Number, default: 0 },
    amount:           { type: Number, required: true },
    paymentMethod:    { type: String, default: "ONLINE" },
    bankName:         { type: String, default: "" },
    status:           { type: String, enum: ["PENDING","SUCCESS","FAILED"], default: "PENDING" },
    paidAt:           { type: Date, default: null },
  },
  { timestamps: true }
);

// Index for fast lookups
TransactionSchema.index({ vehicleNo: 1, createdAt: -1 });
TransactionSchema.index({ status: 1 });

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ?? mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
