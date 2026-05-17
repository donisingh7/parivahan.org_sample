import type { StateConfig } from "../types";

/**
 * Uttarakhand state config — referenced by Uttarakhand's model,
 * buildReceiptData, generateReceipt, ReceiptTemplate and TaxCollectionForm
 * so the state's branding lives in one place and can be tweaked without
 * hunting through every per-state file.
 *
 * Note on the spelling: the GOVERNMENT OF UTTRAKHAND checkpost portal's
 * inspect HTML uses "UTTRAKHAND" (without the second 'A') in the form heading
 * and on the receipt — see README.txt lines 2701 and 3372. We preserve that
 * exact spelling on the visible labels so the cloned UI matches the original
 * portal pixel-for-pixel; the file/folder name and `name` keep the
 * conventional spelling for code readability.
 *
 * Theme colour matches the form heading colour (#154281) and the receipt
 * page top-banner (#1552a8). Watermark = the UK Border emblem the receipt
 * shows behind the table.
 */
export const uttarakhandConfig: StateConfig = {
  code: "UK",
  name:           "Uttarakhand",
  label:          "UTTRAKHAND",
  govLabel:       "GOVERNMENT OF UTTRAKHAND",
  deptLabel:      "Department of Transport",
  receiptTitle:   "Checkpost Tax e-Receipt",
  watermarkImage: "/Images/Uttarakhand-Transport-Department.png",
  themeColor:     "#154281",
  collection:     "uttarakhand_transactions",
};

export default uttarakhandConfig;
