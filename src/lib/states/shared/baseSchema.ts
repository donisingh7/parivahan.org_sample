/**
 * Shared Mongoose schema factory for every state's transaction model.
 *
 * Each state's src/lib/states/<state>/model.ts calls createTransactionSchema()
 * to get a fresh Schema instance, then registers it under a state-specific
 * Mongoose model name (e.g. "RajasthanTransaction"). That gives every state
 * its own collection (rajasthan_transactions, bihar_transactions, …) without
 * duplicating the field definitions in ten places.
 *
 * Today every state has identical fields. When a state needs to diverge later
 * the corresponding state model.ts can call schema.add(...) before registering
 * — none of the other states are affected.
 */

import { Schema } from "mongoose";
import type { TransactionDoc } from "../types";

export function createTransactionSchema(): Schema<TransactionDoc> {
  const schema = new Schema<TransactionDoc>(
    {
      transactionId:    { type: String, required: true, unique: true },
      // Two-letter state code so every transaction document carries enough
      // context for the admin dashboard's cross-state aggregation.
      state:            { type: String, required: true, index: true },
      // Portal user this transaction belongs to (decoded from the user_token
      // cookie at /api/payment time). Empty string when the user wasn't logged
      // in — the transaction is still saved so the receipt can render.
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
      // S3 object key where the receipt PDF is stored after a successful
      // payment. /api/receipt/[transactionId] streams the PDF directly from
      // this key, so every receipt the user sees comes from S3 — not a
      // one-shot in-memory render.
      s3Key:            { type: String, default: "" },
      // ID returned by SNS Publish for the post-payment SMS, kept for
      // traceability when investigating delivery issues.
      smsMessageId:     { type: String, default: "" },

      // ── State-specific optional fields ─────────────────────────────────
      // States that capture extra inputs in their checkpost-tax form persist
      // them on the shared base schema. Other states simply ignore the
      // fields (they're optional and default to empty / null / 0).
      // Adding a new state's field here is preferred over schema.add(...)
      // per state — keeps every state's collection on the same shape so
      // the admin dashboard can aggregate cross-state without surprises.
      //
      //   • Haryana    (HR): vehicleCategory, serviceType, distance,
      //     borderDistrict, fitnessValidity, insuranceValidity, puccValidity
      //   • Punjab     (PB): vehicleCategory, serviceType, taxMode,
      //     borderDistrict, checkpostName, userCharge, infraCess
      //   • Uttarakhand(UK): vehicleCategory, serviceType, taxMode, permitType,
      //     borderDistrict (District Name), checkpostName (Barrier Name),
      //     fitnessValidity, puccValidity, permitNumber, permitFrom, permitUpto,
      //     userCharge, infraCess, sleeperCap
      vehicleCategory:  { type: String, default: "" },
      serviceType:      { type: String, default: "" },
      distance:         { type: Number, default: 0 },
      borderDistrict:   { type: String, default: "" },
      fitnessValidity:  { type: Date,   default: null },
      insuranceValidity:{ type: Date,   default: null },
      puccValidity:     { type: Date,   default: null },
      userCharge:       { type: Number, default: 0 },
      infraCess:        { type: Number, default: 0 },
      // Himachal Pradesh — PETROL/DIESEL/CNG. Other states leave it blank.
      fuelType:         { type: String, default: "" },
      // Uttarakhand / Uttar Pradesh — Permit Number / Permit Validity range
      permitNumber:     { type: String, default: "" },
      permitFrom:       { type: Date,   default: null },
      permitUpto:       { type: Date,   default: null },
      // Haryana — time component of the tax window ("HH:MM", 24-hr).
      // Stored separately so the Date fields stay date-only everywhere else.
      taxFromTime:      { type: String, default: "" },
      taxToTime:        { type: String, default: "" },
      // Punjab — vehicle weight fields (Gross Vehicle Wt / Unladen Wt in Kg).
      grossVehicleWt:   { type: Number, default: 0 },
      unladenWt:        { type: Number, default: 0 },
      // Andhra Pradesh — AP-specific fields.
      nameOfGoods:      { type: String, default: "" },
      route:            { type: String, default: "" },
      paymentInitDate:  { type: String, default: "" },
      apTaxItemsJson:   { type: String, default: "" },
      // HP-specific user-override dates
      paymentConfDate:  { type: String, default: "" },
      printedOn:        { type: String, default: "" },
      // Jharkhand / Bihar / multi-state — string weight & validity fields.
      // Stored as strings because these states capture them as free-text in
      // the form rather than structured Date/Number inputs.
      grossCombinationWeight: { type: String, default: "" },
      // Bihar-specific string fields
      brGrossVehicleWt:   { type: String, default: "" },
      brUnladenWt:        { type: String, default: "" },
      brFitnessValidity:  { type: String, default: "" },
      brInsuranceValidity:{ type: String, default: "" },
      brPuccValidity:     { type: String, default: "" },
      // Maharashtra-specific string weight fields (different names from base Number fields)
      mhLadenWeight:      { type: String, default: "" },
      mhUnladenWeight:    { type: String, default: "" },
      // Maharashtra-specific tax split fields
      mhMvTax:            { type: Number, default: 0 },
      mhPermitFee:        { type: Number, default: 0 },
      // Gujarat-specific string weight / tax split / maker-status fields
      gjLadenWeight:      { type: String, default: "" },
      gjUnladenWeight:    { type: String, default: "" },
      gjMvTax:            { type: Number, default: 0 },
      gjPermitFee:        { type: Number, default: 0 },
      gjMakerStatus:      { type: String, default: "" },
      // Chhattisgarh-specific string weight / tax split fields
      cgLadenWeight:      { type: String, default: "" },
      cgUnladenWeight:    { type: String, default: "" },
      cgMvTax:            { type: Number, default: 0 },
      cgPermitFee:        { type: Number, default: 0 },
      // Telangana-specific string weight / tax split fields
      tsLadenWeight:      { type: String, default: "" },
      tsUnladenWeight:    { type: String, default: "" },
      tsMvTax:            { type: Number, default: 0 },
      tsPermitFee:        { type: Number, default: 0 },
      // Madhya Pradesh-specific (DTO, standing cap, road-tax, 5-row tax split)
      mpDto:              { type: String, default: "" },
      mpStandingCap:      { type: Number, default: 0 },
      mpRoadTaxValidity:  { type: String, default: "" },
      mpPermitFee:        { type: Number, default: 0 },
      mpMvTax:            { type: Number, default: 0 },
      mpUserCharge:       { type: Number, default: 0 },
      mpSgst:             { type: Number, default: 0 },
      mpCgst:             { type: Number, default: 0 },
      // Tamil Nadu-specific (4-row tax + green-tax / base-permit validity)
      tnPermitFee:        { type: Number, default: 0 },
      tnMvTax:            { type: Number, default: 0 },
      tnWelfareTax:       { type: Number, default: 0 },
      tnUserCharge:       { type: Number, default: 0 },
      tnGreenTaxValidity: { type: String, default: "" },
      tnBasePermitValidity: { type: String, default: "" },
    },
    { timestamps: true }
  );

  schema.index({ vehicleNo: 1, createdAt: -1 });
  schema.index({ status: 1 });

  return schema;
}
