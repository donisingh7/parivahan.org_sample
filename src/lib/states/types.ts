/**
 * Multi-state architecture — shared types.
 *
 * Each state under src/lib/states/<state>/ exports a `StateModule` that the
 * central registry (src/lib/states/registry.ts) maps by `StateCode`. Routing,
 * APIs, the receipt pipeline and the admin dashboard all dispatch through the
 * registry, so adding a new state is a matter of:
 *   1. Creating a new src/lib/states/<state>/ folder with the same five files
 *      (config / model / buildReceiptData / generateReceipt / ReceiptTemplate)
 *   2. Adding a matching src/components/states/<state>/TaxCollectionForm.tsx
 *   3. Registering the new entry in registry.ts
 */

import type { Model, Schema } from "mongoose";
import type { ComponentType } from "react";

// ── Codes for the 10 supported states (Rajasthan + 9 expansion states) ──────
export type StateCode =
  | "RJ" // Rajasthan
  | "BR" // Bihar
  | "AP" // Andhra Pradesh
  | "MH" // Maharashtra
  | "GJ" // Gujarat
  | "CG" // Chhattisgarh
  | "TS" // Telangana
  | "OR" // Odisha
  | "MP" // Madhya Pradesh
  | "TN" // Tamil Nadu
  | "JH" // Jharkhand
  | "PB" // Punjab
  | "UP" // Uttar Pradesh
  | "UK" // Uttarakhand
  | "HR" // Haryana
  | "KA" // Karnataka
  | "HP"; // Himachal Pradesh

// ── Per-state configuration ─────────────────────────────────────────────────
// Anything that's text/asset-only for the receipt and the form lives here so
// state-specific PDF generators / forms / templates can pull a single source
// of truth instead of hard-coding the state's name in twenty places.
export interface StateConfig {
  code:           StateCode;
  /** "Rajasthan" — title-cased name shown in headings */
  name:           string;
  /** "RAJASTHAN" — uppercase name shown in selector dropdown / receipt header */
  label:          string;
  /** "GOVERNMENT OF RAJASTHAN" — receipt page header */
  govLabel:       string;
  /** "Department of Transport" — sub-header (kept per-state in case it differs) */
  deptLabel:      string;
  /** Short receipt title under the dept label */
  receiptTitle:   string;
  /** Public path to the watermark image rendered on the PDF + on-screen receipt */
  watermarkImage: string;
  /** Theme accent colour for the form heading + receipt chrome */
  themeColor:     string;
  /** Mongoose collection name used by this state's transaction model */
  collection:     string;
}

// ── Receipt data shape — produced by buildReceiptData, consumed by both the
//    on-screen ReceiptTemplate and the PDF generator. ───────────────────────
export interface TaxItem {
  particular: string;
  fees:       number;
  fine:       number;
  total:      number;
}

export interface ReceiptData {
  registrationNo:  string;
  receiptNo:       string;
  paymentDate:     string;   // ISO
  paymentDateText: string;   // pre-formatted "DD-MMM-YYYY HH:MM AM"
  ownerName:       string;   // already masked
  chassisNo:       string;   // already masked
  mobileNo:        string;   // already masked
  taxMode:         string;
  vehicleType:     string;
  vehicleClass:    string;
  permitType:      string;
  permitCategory:  string;
  makerStatus?:    string;   // Gujarat-specific — blank or "INDIAN"
  checkpostName:   string;
  sleeperCap:      number;
  seatingCapacity: number;
  bankRefNo:       string;
  paymentMode:     string;
  serviceType:     string;
  qrUrl:           string;
  amount:          number;
  amountInWords:   string;
  taxItems:        TaxItem[];
  // ── Dynamic capacity field labels & values ───────────────────────────
  // When vehicleType === "GOODS VEHICLE": cap1 = Gross Vehicle Weight,
  //   cap2 = Unladen Weight. Otherwise: cap1 = Seating Capacity, cap2 = Sleeper Cap.
  cap1Label?:      string;
  cap2Label?:      string;
  // number for capacities (seating/sleeper), string for weights ("2625 KG.").
  cap1Value?:      number | string;
  cap2Value?:      number | string;

  // ── State-specific receipt extras (optional, populated per-state) ───────
  // These show up on a particular state's receipt design in addition to the
  // common fields above; other states' buildReceiptData functions leave them
  // undefined and their templates simply don't render them.
  //   • Haryana       : vehicleCategory, fitnessValidity, insuranceValidity, puccValidity
  //   • Punjab        : vehicleCategory, paymentInitDate
  //   • Uttarakhand   : vehicleCategory, fitnessValidity, puccValidity,
  //                     permitNumber, permitValidityText, paymentInitDate
  //   • Himachal Pradesh: vehicleCategory, fitnessValidity, insuranceValidity,
  //                       puccValidity, fuelType, paymentInitDate
  //   • Uttar Pradesh : vehicleCategory, fitnessValidity, insuranceValidity,
  //                     puccValidity, permitNumber, permitValidityText,
  //                     paymentInitDate
  vehicleCategory?:     string;
  fitnessValidity?:     string;
  insuranceValidity?:   string;
  puccValidity?:        string;
  fuelType?:            string;  // Himachal Pradesh — PETROL/DIESEL/CNG
  paymentInitDate?:     string;  // "Payment Initialization Date" — distinct from confirmation date
  permitNumber?:        string;
  permitValidityText?:  string;  // e.g. "12-MAY-2026 to 26-MAY-2026"
  // Punjab-specific vehicle weight fields
  grossVehicleWt?:      number;
  unladenWt?:           number;
  permitValidity?:      string;  // derived from permitUpto
  // Andhra Pradesh-specific fields
  nameOfGoods?:         string;
  route?:               string;
  apTaxItemsJson?:      string;  // JSON array of {particular,fees,fine,total} rows
  // Jharkhand-specific string fields
  grossCombinationWeight?: string;
  paymentConfirmDate?:     string;
  // HP-specific override dates (user-entered from form)
  printedOnDate?:          string;
  // Maharashtra-specific string weight fields
  ladenWeight?:            string;
  unladenWeight?:          string;
  // Madhya Pradesh-specific receipt extras (FORM MPMVR-51 / CheckPost V4)
  dto?:                    string;   // District Transport Office (e.g. "SATNA")
  standingCapacity?:       number | string;
  roadTaxValidity?:        string;
  routesOrArea?:           string;
  purposeOfJourney?:       string;
  permitIssueDate?:        string;
  // Tamil Nadu-specific receipt extras
  greenTaxValidity?:       string;
  basePermitValidity?:     string;
  // Karnataka-specific receipt extras (Floor Area + Tax Validity)
  floorArea?:              string;
  taxValidity?:            string;
  // Odisha-specific receipt extras (2-page receipt + temporary permit)
  paymentStatus?:          string;
  permit?: {
    number?:             string;
    holderName?:         string;
    area?:               string;
    vehicleType?:        string;
    registrationMark?:   string;
    seatingCapacity?:    string;
    grossVehicleWeight?: string;
    purposeOfJourneys?:  string;
    natureOfGoods?:      string;
    expiryDate?:         string;
    routes?:             string;
  };
}

// Loose Mongo doc shape — GJ reuses ladenWeight/unladenWeight above. — both lean()'d documents and POJOs work for the
// per-state buildReceiptData functions. Each state's buildReceiptData reads
// only the subset it cares about; unknown fields are silently ignored.
export interface TxnLike {
  vehicleNo?:      string;
  receiptNo?:      string;
  ownerName?:      string;
  chassisNo?:      string;
  mobileNo?:       string;
  vehicleType?:    string;
  vehicleClass?:   string;
  permitType?:     string;
  taxMode?:        string;
  checkpostName?:  string;
  sleeperCap?:     number;
  seatingCap?:     number;
  orderRef?:       string;
  paymentMethod?:  string;
  amount?:         number;
  paidAt?:         Date | string | null;
  taxFrom?:        Date | string | null;
  taxTo?:          Date | string | null;

  // ── State-specific extras (Haryana, Punjab, Uttarakhand, …) ────────────
  vehicleCategory?:   string;
  serviceType?:       string;
  distance?:          number;
  borderDistrict?:    string;
  fitnessValidity?:   Date | string | null;
  insuranceValidity?: Date | string | null;
  puccValidity?:      Date | string | null;
  userCharge?:        number;
  infraCess?:         number;
  // Himachal Pradesh-specific (Fuel Type captured on the form)
  fuelType?:          string;
  // Uttarakhand / Uttar Pradesh-specific (Permit Number / Permit Validity range)
  permitNumber?:      string;
  permitFrom?:        Date | string | null;
  permitUpto?:        Date | string | null;
  // Haryana — "HH:MM" time component of the tax window
  taxFromTime?:       string;
  taxToTime?:         string;
  // Punjab vehicle weight fields
  grossVehicleWt?:    number;
  unladenWt?:         number;
  // Andhra Pradesh-specific
  nameOfGoods?:       string;
  route?:             string;
  paymentInitDate?:   string;
  apTaxItemsJson?:    string;
  // HP-specific user-override dates
  paymentConfDate?:   string;
  printedOn?:         string;
  // Jharkhand-specific string fields (separate from base-schema Number fields)
  grossCombinationWeight?: string;
  jhFitnessValidity?:      string;
  jhInsuranceValidity?:    string;
  jhPuccValidity?:         string;
  jhGrossVehicleWt?:       string;
  jhUnladenWt?:            string;
  // Bihar-specific string fields (separate from base-schema Number/Date fields)
  brGrossVehicleWt?:       string;
  brUnladenWt?:            string;
  brFitnessValidity?:      string;
  brInsuranceValidity?:    string;
  brPuccValidity?:         string;
  // Maharashtra-specific string weight fields
  mhLadenWeight?:          string;
  mhUnladenWeight?:        string;
  mhMvTax?:                number;
  mhPermitFee?:            number;
  // Gujarat-specific string weight / tax / maker-status fields
  gjLadenWeight?:          string;
  gjUnladenWeight?:        string;
  gjMvTax?:                number;
  gjPermitFee?:            number;
  gjMakerStatus?:          string;
  // Chhattisgarh-specific string weight / tax fields
  cgLadenWeight?:          string;
  cgUnladenWeight?:        string;
  cgMvTax?:                number;
  cgPermitFee?:            number;
  // Telangana-specific string weight / tax fields
  tsLadenWeight?:          string;
  tsUnladenWeight?:        string;
  tsMvTax?:                number;
  tsPermitFee?:            number;
  // Madhya Pradesh-specific fields (5-row tax + DTO + standing cap + road-tax)
  mpDto?:                  string;
  mpStandingCap?:          number;
  mpRoadTaxValidity?:      string;
  mpPermitFee?:            number;
  mpMvTax?:                number;
  mpUserCharge?:           number;
  mpSgst?:                 number;
  mpCgst?:                 number;
  // Tamil Nadu-specific fields (4-row tax + green-tax / base-permit validity)
  tnPermitFee?:            number;
  tnMvTax?:                number;
  tnWelfareTax?:           number;
  tnUserCharge?:           number;
  tnGreenTaxValidity?:     string;
  tnBasePermitValidity?:   string;
  // Odisha-specific field (Standing Capacity — string, printed on the receipt)
  orStandingCap?:          string;
  // Karnataka-specific fields (Floor Area + Tax Validity)
  kaFloorArea?:            string;
  kaTaxValidity?:          string;
}

// ── State module — the contract every state folder must satisfy. ────────────
//
// Server-only members (model, generateReceipt, buildReceiptData) are imported
// lazily by API routes; the React components (form, receipt template) are
// imported directly by client / server components depending on context.
export interface StateModule {
  config: StateConfig;

  /** Lazily resolved Mongoose model so importing the registry from a client
   *  component doesn't blow up — Mongoose only initialises when called. */
  getModel: () => Model<TransactionDoc>;

  /** Called server-side to convert a Mongo doc into the receipt shape both
   *  the on-screen template and the PDF generator consume. */
  buildReceiptData: (txn: TxnLike) => ReceiptData;

  /** Called server-side to render the receipt PDF. Returns a Buffer ready to
   *  upload to S3 or stream to the client. The argument is the full shape
   *  generateReceipt.js expects (subset of ReceiptData + qrUrl override). */
  generateReceipt: (data: GenerateReceiptInput) => Promise<Buffer>;

  /** Client component that renders the on-screen HTML receipt. */
  ReceiptTemplate: ComponentType<{ data: ReceiptData }>;

  /** Client component that renders the per-state tax-collection form. */
  TaxCollectionForm: ComponentType;
}

// ── PDF generator input — what generateReceipt.js consumes. ─────────────────
// generateReceipt.js is plain JS so we keep this as a loose record-with-known
// keys and let the per-state buildReceiptData adapter build it. The full
// ReceiptData object is forwarded by buildReceiptPdf so per-state generators
// can read whatever extra fields they need (Haryana reads vehicleCategory,
// fitnessValidity, etc.).
export interface GenerateReceiptInput {
  registrationNo:  string;
  receiptNo:       string;
  paymentDate:     string;
  ownerName:       string;
  chassisNo:       string;
  taxMode:         string;
  vehicleType:     string;
  vehicleClass:    string;
  mobileNo:        string;
  checkpostName:   string;
  sleeperCap:      number;
  seatingCapacity: number;
  bankRefNo:       string;
  paymentMode:     string;
  serviceType:     string;
  permitType:      string;
  permitCategory:  string;
  makerStatus?:    string;   // Gujarat-specific — blank or "INDIAN"
  qrUrl:           string;
  taxItems:        TaxItem[];
  // Optional state-specific extras — generator reads what it needs.
  amount?:             number;
  amountInWords?:      string;
  vehicleCategory?:    string;
  fitnessValidity?:    string;
  insuranceValidity?:  string;
  puccValidity?:       string;
  paymentInitDate?:    string;
  permitNumber?:       string;
  permitValidityText?: string;
  permitValidity?:     string;
  fuelType?:           string;
  grossVehicleWt?:          number;
  unladenWt?:               number;
  paymentDateText?:         string;
  // Andhra Pradesh-specific
  nameOfGoods?:             string;
  route?:                   string;
  paymentConfirmDate?:      string;
  printedOnDate?:           string;
  // Jharkhand-specific
  grossCombinationWeight?: string;
  // Maharashtra-specific
  ladenWeight?:            string;
  unladenWeight?:          string;
}

// ── TransactionDoc — Mongo document shape. State-specific models all live
//    on this same loose interface; fields a particular state doesn't use
//    are simply left as their schema defaults. ──────────────────────────────
export interface TransactionDoc {
  // Universal audit / plumbing — every state's model writes these.
  transactionId:    string;
  state:            StateCode;
  userId:           string;
  userIdLabel:      string;
  receiptNo:        string;
  orderRef:         string;
  vehicleNo:        string;
  chassisNo:        string;
  ownerName:        string;
  mobileNo:         string;
  fromState:        string;
  vehicleType:      string;
  vehicleClass:     string;
  taxMode:          string;
  taxFrom:          Date;
  taxTo:            Date;
  amount:           number;
  paymentMethod:    string;
  bankName:         string;
  status:           "PENDING" | "SUCCESS" | "FAILED";
  paidAt:           Date | null;
  s3Key:            string;
  smsMessageId:     string;
  createdAt:        Date;
  updatedAt:        Date;

  // ── Rajasthan-shape extras (also used by BR/AP/MH/JH until their inspect
  //    code is wired in) ───────────────────────────────────────────────────
  visitingState?:    string;
  permitType?:       string;
  districtEntering?: string;
  purposeOfVisit?:   string;
  checkpostName?:    string;
  aitpValidity?:     Date | null;
  aitpAuthValidity?: Date | null;
  noOfPeriods?:      number;
  seatingCap?:       number;
  sleeperCap?:       number;

  // ── State-specific extras (Haryana, Punjab, Uttarakhand, …) ───────────
  vehicleCategory?:    string;
  serviceType?:        string;
  distance?:           number;
  borderDistrict?:     string;
  fitnessValidity?:    Date | null;
  insuranceValidity?:  Date | null;
  puccValidity?:       Date | null;
  userCharge?:         number;
  infraCess?:          number;
  // Himachal Pradesh-specific (Fuel Type captured on the form)
  fuelType?:           string;
  // Uttarakhand / Uttar Pradesh-specific (Permit Number / Permit Validity range)
  permitNumber?:       string;
  permitFrom?:         Date | null;
  permitUpto?:         Date | null;
  // Haryana — "HH:MM" time component of the tax window
  taxFromTime?:        string;
  taxToTime?:          string;
  // Punjab vehicle weight fields
  grossVehicleWt?:     number;
  unladenWt?:          number;
  // Andhra Pradesh-specific
  nameOfGoods?:        string;
  route?:              string;
  paymentInitDate?:    string;
  apTaxItemsJson?:     string;
  // HP-specific user-override dates
  paymentConfDate?:    string;
  printedOn?:          string;
  // Jharkhand-specific
  jhGrossVehicleWt?:    string;
  jhUnladenWt?:         string;
  jhFitnessValidity?:   string;
  jhInsuranceValidity?: string;
  jhPuccValidity?:      string;
  grossCombinationWeight?: string;
  // Bihar-specific
  brGrossVehicleWt?:    string;
  brUnladenWt?:         string;
  brFitnessValidity?:   string;
  brInsuranceValidity?: string;
  brPuccValidity?:      string;
  // Maharashtra-specific
  mhLadenWeight?:       string;
  mhUnladenWeight?:     string;
  mhMvTax?:             number;
  mhPermitFee?:         number;
  // Gujarat-specific
  gjLadenWeight?:       string;
  gjUnladenWeight?:     string;
  gjMvTax?:             number;
  gjPermitFee?:         number;
  gjMakerStatus?:       string;
  // Chhattisgarh-specific
  cgLadenWeight?:       string;
  cgUnladenWeight?:     string;
  cgMvTax?:             number;
  cgPermitFee?:         number;
  // Telangana-specific
  tsLadenWeight?:       string;
  tsUnladenWeight?:     string;
  tsMvTax?:             number;
  tsPermitFee?:         number;
  // Madhya Pradesh-specific
  mpDto?:               string;
  mpStandingCap?:       number;
  mpRoadTaxValidity?:   string;
  mpPermitFee?:         number;
  mpMvTax?:             number;
  mpUserCharge?:        number;
  mpSgst?:              number;
  mpCgst?:              number;
  // Tamil Nadu-specific
  tnPermitFee?:         number;
  tnMvTax?:             number;
  tnWelfareTax?:        number;
  tnUserCharge?:        number;
  tnGreenTaxValidity?:  string;
  tnBasePermitValidity?: string;
  // Odisha
  orStandingCap?:        string;
  // Karnataka
  kaFloorArea?:          string;
  kaTaxValidity?:        string;
}

// Re-export Schema for convenience in shared/baseSchema consumers.
export type { Schema };
