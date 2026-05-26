/**
 * Single source of truth for the Uttar Pradesh checkpost-tax receipt.
 *
 * Both the on-screen ReceiptTemplate and the PDF generator
 * (generateReceipt.js) consume the shape produced here, so a single Mongo
 * Transaction document drives identical output everywhere.
 *
 * Uttar Pradesh's receipt mirrors the GOVERNMENT OF UTTAR PRADESH inspect
 * HTML (README.txt lines 5828-6203):
 *   • Single MV Tax row in the breakup table.
 *   • Twelve-row two-column field grid including Permit Number, Permit
 *     Validity, Fitness/Insurance/PUCC Validity and Permit Type.
 *   • "Checkpost Name" maps to the Border/Barrier District dropdown
 *     (AGRA, ALIGARH, …).
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

// UP's form submits text values (e.g. "WEEKLY", "MOTOR CYCLE",
// "TEMPORARY PERMIT") rather than numeric codes — no resolveLabel needed.
function passThrough(v: string | undefined | null): string {
  return v && String(v).trim() ? String(v) : "-";
}

// Validity dates are persisted as ISO Date strings; the UP receipt prints
// them in upper-case "DD-MMM-YYYY" form (e.g. "14-MAY-2026").
function fmtValidity(v: TxnLike["fitnessValidity"]): string {
  if (!v) return "-";
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = months[d.getMonth()];
  const yy = d.getFullYear();
  return `${dd}-${mm}-${yy}`;
}

export function buildUttarPradeshReceiptData(txn: TxnLike): ReceiptData {
  const amount = Number(txn.amount) || 0;

  const taxFromLabel = fmtTaxDate(txn.taxFrom ?? null);
  const taxToLabel   = fmtTaxDate(txn.taxTo   ?? null);
  const paymentDate  = txn.paidAt ? new Date(txn.paidAt) : new Date();

  const receiptNo = txn.receiptNo || "-";

  // UP receipt shows a single Permit Validity field (not a range) — sourced
  // from permitUpto when present. permitFrom is captured on the form too
  // for analytics but isn't surfaced on the receipt.
  const permitValidityText = txn.permitUpto ? fmtValidity(txn.permitUpto) : "";

  return {
    registrationNo:  txn.vehicleNo || "-",
    receiptNo,
    paymentDate:     paymentDate.toISOString(),
    paymentDateText: fmtPaymentDate(paymentDate),
    paymentInitDate: fmtPaymentDate(paymentDate),
    ownerName:       maskName(txn.ownerName  ?? ""),
    chassisNo:       maskChassis(txn.chassisNo ?? ""),
    mobileNo:        maskMobile(txn.mobileNo ?? ""),
    taxMode:         passThrough(txn.taxMode),
    vehicleType:     passThrough(txn.vehicleType),
    vehicleClass:    passThrough(txn.vehicleClass),
    vehicleCategory: passThrough(txn.vehicleCategory),
    permitType:      passThrough(txn.permitType),
    permitCategory:  "",
    // UP receipt's "Checkpost Name" is the Border/Barrier District dropdown
    // value (AGRA, ALIGARH, …).
    checkpostName:   passThrough(txn.borderDistrict ?? txn.checkpostName),
    sleeperCap:      Number(txn.sleeperCap) || 0,
    seatingCapacity: Number(txn.seatingCap) || 0,
    bankRefNo:       txn.orderRef || "-",
    paymentMode:     txn.paymentMethod || "ONLINE",
    serviceType:     passThrough(txn.serviceType) === "-" ? "NOT APPLICABLE" : passThrough(txn.serviceType),

    // UP-specific extras consumed by the on-screen template + PDF generator.
    fitnessValidity:    fmtValidity(txn.fitnessValidity   ?? null),
    insuranceValidity:  fmtValidity(txn.insuranceValidity ?? null),
    puccValidity:       fmtValidity(txn.puccValidity      ?? null),
    permitNumber:       passThrough(txn.permitNumber),
    permitValidityText,
    permitValidity:     permitValidityText,

    qrUrl:           `https://kms.parivahan.gov.in/verify?receipt=${receiptNo}`,
    amount,
    amountInWords:   numberToWords(amount),

    // UP shows a single MV Tax line covering the full tax period.
    taxItems: [
      {
        particular: `MV Tax(${taxFromLabel} TO ${taxToLabel})`,
        fees:       amount,
        fine:       0,
        total:      amount,
      },
    ],
    cap1Label: (String(txn.vehicleCategory || '')).toUpperCase() === 'GOODS CARRIER' ? 'Gross Vehicle\nWt(In. Kg)' : 'Seating\nCapacity',
    cap2Label: (String(txn.vehicleCategory || '')).toUpperCase() === 'GOODS CARRIER' ? 'Unladen\nWt(In Kg.)' : 'Sleeper Cap',
    cap1Value: (String(txn.vehicleCategory || '')).toUpperCase() === 'GOODS CARRIER' ? (Number(txn.grossVehicleWt) || 0) : (Number(txn.seatingCap) || 0),
    cap2Value: (String(txn.vehicleCategory || '')).toUpperCase() === 'GOODS CARRIER' ? (Number(txn.unladenWt) || 0) : (Number(txn.sleeperCap) || 0),
  };
}
