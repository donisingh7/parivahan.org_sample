import type { StateConfig } from "../types";

/**
 * Bihar state config — referenced by Bihar's model, buildReceiptData,
 * generateReceipt, ReceiptTemplate and TaxCollectionForm so the state's
 * branding lives in one place and can be tweaked without hunting through
 * every per-state file.
 */
export const biharConfig: StateConfig = {
  code: "BR",
  name:           "Bihar",
  label:          "BIHAR",
  govLabel:       "GOVERNMENT OF BIHAR",
  deptLabel:      "Department of Transport",
  receiptTitle:   "Checkpost Tax e-Receipt",
  watermarkImage: "/Images/bihar_logo.png",
  themeColor:     "#0e7c43",
  collection:     "bihar_transactions",
};

export default biharConfig;
