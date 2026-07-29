import type { StateConfig } from "../types";

/**
 * Odisha state config — referenced by Odisha's model, buildReceiptData,
 * generateReceipt, ReceiptTemplate and TaxCollectionForm so the state's
 * branding lives in one place and can be tweaked without hunting through
 * every per-state file.
 */
export const odishaConfig: StateConfig = {
  code: "OR",
  name:           "Odisha",
  label:          "ODISHA",
  govLabel:       "GOVERNMENT OF ODISHA",
  deptLabel:      "Odisha Motor Vehicles Department",
  receiptTitle:   "Checkpost Tax e-Receipt",
  watermarkImage: "/Images/odisha-seal.png",
  themeColor:     "#0d4f8c",
  collection:     "odisha_transactions",
};

export default odishaConfig;
