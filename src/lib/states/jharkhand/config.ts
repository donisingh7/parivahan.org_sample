import type { StateConfig } from "../types";

/**
 * Jharkhand state config — referenced by Jharkhand's model, buildReceiptData,
 * generateReceipt, ReceiptTemplate and TaxCollectionForm so the state's
 * branding lives in one place and can be tweaked without hunting through
 * every per-state file.
 */
export const jharkhandConfig: StateConfig = {
  code: "JH",
  name:           "Jharkhand",
  label:          "JHARKHAND",
  govLabel:       "GOVERNMENT OF JHARKHAND",
  deptLabel:      "Department of Transport",
  receiptTitle:   "Checkpost Tax e-Receipt",
  watermarkImage: "/Images/Rajasthan-Transport-Department.png",
  themeColor:     "#1a6b3a",
  collection:     "jharkhand_transactions",
};

export default jharkhandConfig;
