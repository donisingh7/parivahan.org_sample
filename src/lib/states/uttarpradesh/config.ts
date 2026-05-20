import type { StateConfig } from "../types";

/**
 * Uttar Pradesh state config — referenced by Uttar Pradesh's model, buildReceiptData,
 * generateReceipt, ReceiptTemplate and TaxCollectionForm so the state's
 * branding lives in one place and can be tweaked without hunting through
 * every per-state file.
 */
export const uttarPradeshConfig: StateConfig = {
  code: "UP",
  name:           "Uttar Pradesh",
  label:          "UTTAR PRADESH",
  govLabel:       "GOVERNMENT OF UTTAR PRADESH",
  deptLabel:      "Department of Transport",
  receiptTitle:   "Checkpost Tax e-Receipt",
  watermarkImage: "/Images/UP_logo.png",
  themeColor:     "#5d3a8e",
  collection:     "uttar_pradesh_transactions",
};

export default uttarPradeshConfig;
