import type { StateConfig } from "../types";

/**
 * Rajasthan state config — referenced by Rajasthan's model, buildReceiptData,
 * generateReceipt, ReceiptTemplate and TaxCollectionForm so the state's
 * branding lives in one place and can be tweaked without hunting through
 * every per-state file.
 */
export const rajasthanConfig: StateConfig = {
  code:           "RJ",
  name:           "Rajasthan",
  label:          "RAJASTHAN",
  govLabel:       "GOVERNMENT OF RAJASTHAN",
  deptLabel:      "Department of Transport",
  receiptTitle:   "Checkpost Tax e-Receipt",
  watermarkImage: "/Images/Rajasthan-Transport-Department.png",
  themeColor:     "#154281",
  collection:     "rajasthan_transactions",
};

export default rajasthanConfig;
