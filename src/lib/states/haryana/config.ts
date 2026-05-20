import type { StateConfig } from "../types";

/**
 * Haryana state config — referenced by Haryana's model, buildReceiptData,
 * generateReceipt, ReceiptTemplate and TaxCollectionForm so the state's
 * branding lives in one place and can be tweaked without hunting through
 * every per-state file.
 */
export const haryanaConfig: StateConfig = {
  code:           "HR",
  name:           "Haryana",
  label:          "HARYANA",
  govLabel:       "GOVERNMENT OF HARYANA",
  deptLabel:      "Department of Transport",
  receiptTitle:   "Checkpost Tax e-Receipt",
  // Drop a real Haryana emblem at this path; until then both the on-screen
  // receipt (onError-hides) and the PDF generator (try-catch) gracefully
  // skip the watermark if the file is missing.
  watermarkImage: "/Images/haryana-emblem.png",
  themeColor:     "#154281",
  collection:     "haryana_transactions",
};

export default haryanaConfig;
