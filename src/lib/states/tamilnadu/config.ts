import type { StateConfig } from "../types";

/**
 * Tamil Nadu state config — referenced by Tamil Nadu's model, buildReceiptData,
 * generateReceipt, ReceiptTemplate and TaxCollectionForm so the state's
 * branding lives in one place.
 */
export const tamilNaduConfig: StateConfig = {
  code: "TN",
  name:           "Tamil Nadu",
  label:          "TAMIL NADU",
  govLabel:       "GOVERNMENT OF TAMIL NADU",
  deptLabel:      "Department of Transport",
  receiptTitle:   "Checkpost Tax e-Receipt",
  watermarkImage: "/Images/tamil-nadu-emblem.png",
  themeColor:     "#5d3a8e",
  collection:     "tamil_nadu_transactions",
};

export default tamilNaduConfig;
