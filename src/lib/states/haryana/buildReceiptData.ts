/**
 * Single source of truth for the Haryana checkpost-tax receipt.
 *
 * Both the on-screen ReceiptTemplate and the PDF generator (generateReceipt.js)
 * consume the shape produced here, so a single Mongo Transaction document
 * drives identical output everywhere.
 *
 * Haryana's receipt differs from Rajasthan in a few ways:
 *   • Single "MV Tax(<from> To <to>)" row in the breakup table — no separate
 *     surcharge line. The grand total equals the MV Tax line directly.
 *   • Carries fitness/insurance/PUCC validity dates and a vehicle category.
 *   • "Checkpost Name" maps to the border-district field (e.g. BHIWANI) rather
 *     than a free-form entry-checkpost name.
 *   • Two distinct timestamps — "Payment Initialization Date" and "Payment
 *     Confirmation Date" — both currently sourced from paidAt.
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

// Haryana's form submits text values (e.g. "WEEKLY", "MOTOR CYCLE") instead
// of numeric codes, so no resolveLabel-style lookup is needed. We just
// pass the value straight through, falling back to "-" when empty.
function passThrough(v: string | undefined | null): string {
  return v && String(v).trim() ? String(v) : "-";
}

// Validity dates are persisted as ISO Date strings; the on-screen and PDF
// receipts want short "04-MAY-2026" formatting.
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

export function buildHaryanaReceiptData(txn: TxnLike): ReceiptData {
  const amount = Number(txn.amount) || 0;

  const taxFromLabel = fmtTaxDate(txn.taxFrom ?? null) + (txn.taxFromTime ? ` ${txn.taxFromTime}` : "");
  const taxToLabel   = fmtTaxDate(txn.taxTo   ?? null) + (txn.taxToTime   ? ` ${txn.taxToTime}`   : "");
  const paymentDate  = txn.paidAt ? new Date(txn.paidAt) : new Date();

  const receiptNo = txn.receiptNo || "-";

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
    permitType:      "",
    permitCategory:  "",
    // "Checkpost Name" on the Haryana receipt mirrors the border district
    // the vehicle is entering through. The dropdown value is uppercase.
    checkpostName:   passThrough(txn.borderDistrict ?? txn.checkpostName),
    sleeperCap:      Number(txn.sleeperCap) || 0,
    seatingCapacity: Number(txn.seatingCap) || 0,
    bankRefNo:       txn.orderRef || "-",
    paymentMode:     txn.paymentMethod || "ONLINE",
    serviceType:     passThrough(txn.serviceType) === "-" ? "NOT APPLICABLE" : passThrough(txn.serviceType),
    fitnessValidity:   fmtValidity(txn.fitnessValidity   ?? null),
    insuranceValidity: fmtValidity(txn.insuranceValidity ?? null),
    puccValidity:      fmtValidity(txn.puccValidity      ?? null),
    qrUrl:           `https://kms.parivahan.gov.in/verify?receipt=${receiptNo}`,
    amount,
    amountInWords:   numberToWords(amount),
    // Haryana shows a single MV Tax line covering the full tax period.
    taxItems: [
      {
        particular: `MV Tax(${taxFromLabel} To ${taxToLabel})`,
        fees:       amount,
        fine:       0,
        total:      amount,
      },
    ],
    cap1Label: (String(txn.vehicleCategory || '')).toUpperCase() === 'GOODS VEHICLE' ? 'Gross Vehicle\nWt(In. Kg)' : 'Seating\nCapacity',
    cap2Label: (String(txn.vehicleCategory || '')).toUpperCase() === 'GOODS VEHICLE' ? 'Unladen\nWt(In Kg.)' : 'Sleeper Cap',
    cap1Value: (String(txn.vehicleCategory || '')).toUpperCase() === 'GOODS VEHICLE' ? (Number(txn.grossVehicleWt) || 0) : (Number(txn.seatingCap) || 0),
    cap2Value: (String(txn.vehicleCategory || '')).toUpperCase() === 'GOODS VEHICLE' ? (Number(txn.unladenWt) || 0) : (Number(txn.sleeperCap) || 0),
  };
}
