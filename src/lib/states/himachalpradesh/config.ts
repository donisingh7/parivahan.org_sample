import type { StateConfig } from "../types";

/**
 * Himachal Pradesh state config — referenced by Himachal Pradesh's model, buildReceiptData,
 * generateReceipt, ReceiptTemplate and TaxCollectionForm so the state's
 * branding lives in one place and can be tweaked without hunting through
 * every per-state file.
 */
export const himachalPradeshConfig: StateConfig = {
  code: "HP",
  name:           "Himachal Pradesh",
  label:          "HIMACHAL PRADESH",
  govLabel:       "GOVERNMENT OF HIMACHAL PRADESH",
  deptLabel:      "Department of Transport",
  receiptTitle:   "Checkpost Tax e-Receipt",
  watermarkImage: "/Images/Rajasthan-Transport-Department.png",
  themeColor:     "#5e8a47",
  collection:     "himachal_pradesh_transactions",
};

export default himachalPradeshConfig;
