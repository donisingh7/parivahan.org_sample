import type { StateConfig } from "../types";

/**
 * Madhya Pradesh state config — referenced by Madhya Pradesh's model,
 * buildReceiptData, generateReceipt, ReceiptTemplate and TaxCollectionForm so
 * the state's branding lives in one place and can be tweaked without hunting
 * through every per-state file.
 */
export const madhyaPradeshConfig: StateConfig = {
  code: "MP",
  name:           "Madhya Pradesh",
  label:          "MADHYA PRADESH",
  govLabel:       "Transport Department MADHYA PRADESH",
  deptLabel:      "Department of Transport",
  receiptTitle:   "Checkpost Tax e-Receipt",
  watermarkImage: "/Images/UP_logo.png",
  themeColor:     "#5d3a8e",
  collection:     "madhya_pradesh_transactions",
};

export default madhyaPradeshConfig;
