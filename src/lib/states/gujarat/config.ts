import type { StateConfig } from "../types";

/**
 * Gujarat state config — referenced by Gujarat's model, buildReceiptData,
 * generateReceipt, ReceiptTemplate and TaxCollectionForm so the state's
 * branding lives in one place and can be tweaked without hunting through
 * every per-state file.
 */
export const gujaratConfig: StateConfig = {
  code: "GJ",
  name:           "Gujarat",
  label:          "GUJARAT",
  govLabel:       "GOVERNMENT OF GUJARAT",
  deptLabel:      "Department of Transport",
  receiptTitle:   "Checkpost Tax e-Receipt",
  watermarkImage: "/Images/Gujarat.png",
  themeColor:     "#a83232",
  collection:     "gujarat_transactions",
};

export default gujaratConfig;
