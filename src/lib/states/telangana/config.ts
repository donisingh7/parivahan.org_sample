import type { StateConfig } from "../types";

/**
 * Telangana state config — referenced by Telangana's model, buildReceiptData,
 * generateReceipt, ReceiptTemplate and TaxCollectionForm so the state's
 * branding lives in one place and can be tweaked without hunting through
 * every per-state file.
 */
export const telanganaConfig: StateConfig = {
  code: "TS",
  name:           "Telangana",
  label:          "TELANGANA",
  govLabel:       "GOVERNMENT OF TELANGANA",
  deptLabel:      "Department of Transport",
  receiptTitle:   "Checkpost Tax e-Receipt",
  watermarkImage: "/Images/MMVD_logo.jpg",
  themeColor:     "#a83232",
  collection:     "telangana_transactions",
};

export default telanganaConfig;
