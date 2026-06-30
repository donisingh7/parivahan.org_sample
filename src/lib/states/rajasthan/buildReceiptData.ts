/**
 * Single source of truth for the Rajasthan checkpost-tax receipt.
 *
 * Both the on-screen ReceiptTemplate and the PDF generator (generateReceipt.js)
 * consume the shape produced here, so a single Mongo Transaction document
 * drives identical output everywhere. Other states have their own
 * buildReceiptData under src/lib/states/<state>/ — duplication is intentional
 * so each state can later diverge without entangled file edits.
 */

import {
  fmtPaymentDate,
  maskChassis,
  maskMobile,
  maskName,
  PERMIT_TYPE_LABELS,
  resolveLabel,
  TAX_MODE_LABELS,
  VEHICLE_CLASS_LABELS,
  VEHICLE_TYPE_LABELS,
} from "../shared/masking";
import { numberToWords } from "../shared/numberToWords";
import type { ReceiptData, TxnLike } from "../types";

// YYYY-MM-DD for the tax-period labels (e.g. "2026-06-23"), date only.
function fmtTaxDateYMD(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

// Canonical "DD-MMM-YYYY HH:MM:SS AP" rendered in IST (UTC+5:30) regardless of
// server timezone. Used for auto Payment Init / Conf / Printed-On fallbacks.
function fmtDateWithSecs(d: Date): string {
  const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  const dd  = String(ist.getUTCDate()).padStart(2, "0");
  const mon = MONTHS[ist.getUTCMonth()];
  const yy  = ist.getUTCFullYear();
  let   hh  = ist.getUTCHours();
  const mm  = String(ist.getUTCMinutes()).padStart(2, "0");
  const ss  = String(ist.getUTCSeconds()).padStart(2, "0");
  const ap  = hh >= 12 ? "PM" : "AM";
  hh = hh % 12 || 12;
  return `${dd}-${mon}-${yy} ${String(hh).padStart(2, "0")}:${mm}:${ss} ${ap}`;
}

// "Receipt Printing Date" uses a comma + non-padded hour,
// e.g. "23-JUN-2026, 9:47:54 PM".
function fmtPrintedOnComma(s: string): string {
  const m = String(s).match(/^(\d{2}-[A-Za-z]{3}-\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)$/i);
  if (!m) return s;
  return `${m[1].toUpperCase()}, ${parseInt(m[2], 10)}:${m[3]}:${m[4]} ${m[5].toUpperCase()}`;
}

export function buildRajasthanReceiptData(txn: TxnLike): ReceiptData {
  const amount = Number(txn.amount) || 0;
  // userCharge stores the Surcharge Fee the operator confirmed (or modified).
  // Fall back to 15/16 split for legacy records that predate this field.
  const surcharge = txn.userCharge != null ? Number(txn.userCharge) : amount - Math.round(amount * 15 / 16);
  const mvTax     = Math.max(0, amount - surcharge);

  const taxFromLabel = fmtTaxDateYMD(txn.taxFrom ?? null);
  const taxToLabel   = fmtTaxDateYMD(txn.taxTo   ?? null);
  const paymentDate  = txn.paidAt ? new Date(txn.paidAt) : new Date();

  const receiptNo = txn.receiptNo || "-";

  return {
    registrationNo:  txn.vehicleNo || "-",
    receiptNo,
    paymentDate:     paymentDate.toISOString(),
    paymentDateText: fmtPaymentDate(paymentDate),
    paymentInitDate:    txn.paymentInitDate || fmtDateWithSecs(paymentDate),
    paymentConfirmDate: txn.paymentConfDate || fmtDateWithSecs(paymentDate),
    printedOnDate:      fmtPrintedOnComma(txn.printedOn || fmtDateWithSecs(paymentDate)),
    ownerName:       maskName(txn.ownerName  ?? ""),
    chassisNo:       maskChassis(txn.chassisNo ?? ""),
    mobileNo:        maskMobile(txn.mobileNo ?? ""),
    taxMode:         resolveLabel(TAX_MODE_LABELS,      txn.taxMode      ?? ""),
    vehicleType:     resolveLabel(VEHICLE_TYPE_LABELS,  txn.vehicleType  ?? ""),
    vehicleClass:    resolveLabel(VEHICLE_CLASS_LABELS, txn.vehicleClass ?? ""),
    permitType:      resolveLabel(PERMIT_TYPE_LABELS,   txn.permitType   ?? ""),
    permitCategory:  "",
    checkpostName:   txn.checkpostName || "-",
    sleeperCap:      Number(txn.sleeperCap) || 0,
    seatingCapacity: Number(txn.seatingCap) || 0,
    bankRefNo:       txn.orderRef || "-",
    paymentMode:     txn.paymentMethod || "ONLINE",
    serviceType:     "NOT APPLICABLE",
    qrUrl:           `https://kms.parivahan.gov.in/verify?receipt=${receiptNo}`,
    amount,
    amountInWords:   numberToWords(amount),
    taxItems: [
      { particular: `MV Tax(${taxFromLabel} TO ${taxToLabel})`, fees: mvTax,     fine: 0, total: mvTax     },
      { particular: "Surcharge fee",                            fees: surcharge, fine: 0, total: surcharge },
    ],
    cap1Label: (String(txn.vehicleType || '')).toUpperCase() === 'GOODS VEHICLE' ? 'Gross Vehicle\nWt(In. Kg)' : 'Seating\nCapacity',
    cap2Label: (String(txn.vehicleType || '')).toUpperCase() === 'GOODS VEHICLE' ? 'Unladen\nWt(In Kg.)' : 'Sleeper Cap',
    cap1Value: (String(txn.vehicleType || '')).toUpperCase() === 'GOODS VEHICLE' ? (Number(txn.grossVehicleWt) || 0) : (Number(txn.seatingCap) || 0),
    cap2Value: (String(txn.vehicleType || '')).toUpperCase() === 'GOODS VEHICLE' ? (Number(txn.unladenWt) || 0) : (Number(txn.sleeperCap) || 0),
  };
}
