import type { StateConfig } from "../types";

/**
 * Karnataka state config — referenced by Karnataka's model, buildReceiptData,
 * generateReceipt, ReceiptTemplate and TaxCollectionForm so the state's
 * branding lives in one place.
 */
export const karnatakaConfig: StateConfig = {
  code: "KA",
  name:           "Karnataka",
  label:          "KARNATAKA",
  govLabel:       "GOVERNMENT OF KARNATAKA",
  deptLabel:      "Department of Transport",
  receiptTitle:   "Checkpost Tax e-Receipt",
  watermarkImage: "/Images/karnataka-watermark.png",
  themeColor:     "#b8860b",
  collection:     "karnataka_transactions",
};

export default karnatakaConfig;
