import type { StateConfig } from "../types";

/**
 * Punjab state config — referenced by Punjab's model, buildReceiptData,
 * generateReceipt, ReceiptTemplate and TaxCollectionForm so the state's
 * branding lives in one place and can be tweaked without hunting through
 * every per-state file.
 *
 * The themeColor and watermark match the GOVERNMENT OF PUNJAB checkpost
 * portal's inspect HTML (header label uses #154281, table headings use
 * #1552a8 — we use the heading colour for the form chrome).
 */
export const punjabConfig: StateConfig = {
  code: "PB",
  name:           "Punjab",
  label:          "PUNJAB",
  govLabel:       "GOVERNMENT OF PUNJAB",
  deptLabel:      "Department of Transport",
  receiptTitle:   "Checkpost Tax e-Receipt",
  // Watermark image path. The on-screen ReceiptTemplate and the PDF
  // generator both attempt to load this — when the image is missing they
  // fall back gracefully (PDF skips watermark, on-screen hides the <img>).
  watermarkImage: "/Images/Punjab-Transport-Department.png",
  themeColor:     "#154281",
  collection:     "punjab_transactions",
};

export default punjabConfig;
