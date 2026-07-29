import type { StateConfig } from "../types";

/**
 * Chhattisgarh state config — referenced by Chhattisgarh's model,
 * buildReceiptData, generateReceipt, ReceiptTemplate and TaxCollectionForm so
 * the state's branding lives in one place and can be tweaked without hunting
 * through every per-state file.
 */
export const chhattisgarhConfig: StateConfig = {
  code: "CG",
  name:           "Chhattisgarh",
  label:          "CHHATTISGARH",
  govLabel:       "GOVERNMENT OF CHHATTISGARH",
  deptLabel:      "Department of Transport",
  receiptTitle:   "Checkpost Tax e-Receipt",
  watermarkImage: "/Images/chhattisgarh-seal.png",
  themeColor:     "#a83232",
  collection:     "chhattisgarh_transactions",
};

export default chhattisgarhConfig;
