/**
 * Single source of truth for the Uttarakhand checkpost-tax receipt.
 *
 * Both the on-screen ReceiptTemplate and the PDF generator
 * (generateReceipt.js) consume the shape produced here, so a single Mongo
 * Transaction document drives identical output everywhere.
 *
 * Uttarakhand's receipt mirrors the GOVERNMENT OF UTTRAKHAND inspect HTML:
 *   • Three rows in the breakup table — MV Tax, Civic Infra Cess and
 *     Service/User Charge — each carrying the same (taxFrom To taxTo)
 *     period (README.txt lines 3496-3537).
 *   • Two-column field grid spanning twelve label/value rows including
 *     "Permit Number", "Permit Validity", "Fitness Validity" and "PUCC
 *     Validity" — fields Punjab/Haryana don't surface (lines 3389-3475).
 *   • "Checkpost Name" maps to the form's `checkpostName` (the Barrier Name
 *     dropdown) — the District-Name dropdown is captured separately in
 *     `borderDistrict` and is not surfaced on the receipt.
 *   • Two distinct timestamps — "Payment Initialization Date" and
 *     "Payment Confirmation Date" — both currently sourced from paidAt.
 */

import {
  fmtPaymentDate,
  fmtTaxDate,
  maskChassis,
  maskMobile,
  maskName,
} from "../shared/masking";
import { numberToWords } from "../shared/numberToWords";
import type { ReceiptData, TxnLike } from "../types";

// Uttarakhand's form submits text values (e.g. "WEEKLY", "PRIVATE
// ORGANIZATIONS") rather than numeric codes, so no resolveLabel-style lookup
// is needed here.
function passThrough(v: string | undefined | null): string {
  return v && String(v).trim() ? String(v) : "-";
}

export function buildUttarakhandReceiptData(txn: TxnLike): ReceiptData {
  const grand   = Number(txn.amount)     || 0;
  const userChg = Number(txn.userCharge) || 0;
  const infra   = Number(txn.infraCess)  || 0;
  const mvTax   = Math.max(0, grand - userChg - infra);

  const taxFromLabel = fmtTaxDate(txn.taxFrom ?? null);
  const taxToLabel   = fmtTaxDate(txn.taxTo   ?? null);
  const paymentDate  = txn.paidAt ? new Date(txn.paidAt) : new Date();

  const receiptNo = txn.receiptNo || "-";

  // Date strings in Uttarakhand's field grid are uppercase (e.g.
  // "03-MAY-2026") per the inspect HTML lines 3459/3463 — distinct from
  // the mixed-case dates inside the tax-breakup row text. fmtTaxDate gives
  // mixed-case so we upper-case the result for the grid only.
  const upper = (s: string) => (s === "—" ? "" : s.toUpperCase());

  // Permit validity range — only shown when both ends are present, otherwise
  // the receipt prints a blank value just like the inspect HTML does
  // (README.txt line 3457).
  const permitFromText = txn.permitFrom ? upper(fmtTaxDate(txn.permitFrom)) : "";
  const permitUptoText = txn.permitUpto ? upper(fmtTaxDate(txn.permitUpto)) : "";
  const permitValidityText =
    permitFromText && permitUptoText
      ? `${permitFromText} to ${permitUptoText}`
      : permitFromText || permitUptoText || "";

  return {
    registrationNo:  txn.vehicleNo || "-",
    receiptNo,
    paymentDate:     paymentDate.toISOString(),
    paymentDateText: fmtPaymentDate(paymentDate),
    paymentInitDate: txn.paymentInitDate || fmtPaymentDate(paymentDate),
    ownerName:       maskName(txn.ownerName  ?? ""),
    chassisNo:       maskChassis(txn.chassisNo ?? ""),
    mobileNo:        maskMobile(txn.mobileNo ?? ""),
    taxMode:         passThrough(txn.taxMode),
    vehicleType:     passThrough(txn.vehicleType),
    vehicleClass:    passThrough(txn.vehicleClass),
    vehicleCategory: passThrough(txn.vehicleCategory),
    permitType:      passThrough(txn.permitType),
    permitCategory:  "",
    // Uttarakhand's receipt prints the form's Barrier Name (saved as
    // checkpostName). The District Name is captured separately in
    // borderDistrict — useful for analytics but not surfaced on-screen.
    checkpostName:   passThrough(txn.checkpostName ?? txn.borderDistrict),
    sleeperCap:      Number(txn.sleeperCap) || 0,
    seatingCapacity: Number(txn.seatingCap) || 0,
    bankRefNo:       txn.orderRef || "-",
    paymentMode:     txn.paymentMethod || "ONLINE",
    serviceType:     passThrough(txn.serviceType) === "-" ? "NOT APPLICABLE" : passThrough(txn.serviceType),
    qrUrl:           `https://kms.parivahan.gov.in/verify?receipt=${receiptNo}`,
    amount:          grand,
    amountInWords:   numberToWords(grand),

    // Uttarakhand-only receipt extras. Other states' templates ignore them.
    fitnessValidity:    txn.fitnessValidity ? upper(fmtTaxDate(txn.fitnessValidity)) : "",
    puccValidity:       txn.puccValidity    ? upper(fmtTaxDate(txn.puccValidity))    : "",
    permitNumber:       passThrough(txn.permitNumber),
    permitValidityText,
    permitValidity:     permitValidityText,
    grossVehicleWt:     Number(txn.grossVehicleWt) || 0,
    unladenWt:          Number(txn.unladenWt) || 0,

    // Page 1: MV Tax; Page 2: Service/User Charge + Cess (slice(0,1)/slice(1))
    taxItems: [
      {
        particular: `MV Tax(${taxFromLabel} To ${taxToLabel})`,
        fees:       mvTax,
        fine:       0,
        total:      mvTax,
      },
      {
        particular: `Service/User Charge ( ${taxFromLabel} To ${taxToLabel})`,
        fees:       userChg,
        fine:       0,
        total:      userChg,
      },
      {
        particular: `Cess ( ${taxFromLabel} To ${taxToLabel})`,
        fees:       infra,
        fine:       0,
        total:      infra,
      },
    ],
    cap1Label: (String(txn.vehicleCategory || '')).toUpperCase() === 'GOODS VEHICLE' ? 'Gross Vehicle\nWt(In. Kg)' : 'Seating\nCapacity',
    cap2Label: (String(txn.vehicleCategory || '')).toUpperCase() === 'GOODS VEHICLE' ? 'Unladen\nWt(In Kg.)' : 'Sleeper Cap',
    cap1Value: (String(txn.vehicleCategory || '')).toUpperCase() === 'GOODS VEHICLE' ? (Number(txn.grossVehicleWt) || 0) : (Number(txn.seatingCap) || 0),
    cap2Value: (String(txn.vehicleCategory || '')).toUpperCase() === 'GOODS VEHICLE' ? (Number(txn.unladenWt) || 0) : (Number(txn.sleeperCap) || 0),
  };
}
