import type { StateConfig } from "../types";

/**
 * Maharashtra state config — referenced by Maharashtra's model, buildReceiptData,
 * generateReceipt, ReceiptTemplate and TaxCollectionForm so the state's
 * branding lives in one place and can be tweaked without hunting through
 * every per-state file.
 */
export const maharashtraConfig: StateConfig = {
  code: "MH",
  name:           "Maharashtra",
  label:          "MAHARASHTRA",
  govLabel:       "GOVERNMENT OF MAHARASHTRA",
  deptLabel:      "Department of Transport",
  receiptTitle:   "Checkpost Tax e-Receipt",
  watermarkImage: "/Images/MMVD_logo.jpg",
  themeColor:     "#a83232",
  collection:     "maharashtra_transactions",
};

export default maharashtraConfig;
