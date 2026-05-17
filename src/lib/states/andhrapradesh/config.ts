import type { StateConfig } from "../types";

/**
 * Andhra Pradesh state config — referenced by Andhra Pradesh's model, buildReceiptData,
 * generateReceipt, ReceiptTemplate and TaxCollectionForm so the state's
 * branding lives in one place and can be tweaked without hunting through
 * every per-state file.
 */
export const andhraPradeshConfig: StateConfig = {
  code: "AP",
  name:           "Andhra Pradesh",
  label:          "ANDHRA PRADESH",
  govLabel:       "GOVERNMENT OF ANDHRA PRADESH",
  deptLabel:      "Department of Transport",
  receiptTitle:   "Checkpost Tax e-Receipt",
  watermarkImage: "/Images/Rajasthan-Transport-Department.png",
  themeColor:     "#0d4f8c",
  collection:     "andhra_pradesh_transactions",
};

export default andhraPradeshConfig;
