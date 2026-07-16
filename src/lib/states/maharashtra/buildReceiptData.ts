/**
 * Single source of truth for the Maharashtra checkpost-tax receipt.
 *
 * Both the on-screen ReceiptTemplate and the PDF generator (generateReceipt.js)
 * consume the shape produced here, so a single Mongo Transaction document
 * drives identical output everywhere.
 */

import {
  fmtPaymentDate,
  fmtTaxDate,
  maskChassis,
  maskMobile,
  maskName,
  PERMIT_TYPE_LABELS,
  resolveLabel,
} from "../shared/masking";
import { numberToWords } from "../shared/numberToWords";
import type { ReceiptData, TxnLike } from "../types";

// Always render in IST (UTC+5:30) regardless of server timezone. Used for
// auto Payment Init / Printed-On fallbacks.
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

export function buildMaharashtraReceiptData(txn: TxnLike): ReceiptData {
  const amount       = Number(txn.amount)    || 0;
  const paymentDate  = txn.paidAt ? new Date(txn.paidAt) : new Date();
  const paymentDateText = fmtPaymentDate(paymentDate);
  const receiptNo    = txn.receiptNo || "-";

  // Read MH-specific fields from the document record.
  const mh = txn as Record<string, unknown>;
  const mvTax     = Number(mh.mhMvTax)    || 0;
  const permitFee = Number(mh.mhPermitFee) || 0;

  // MV Tax row shows the tax period the user picked, e.g.
  // "MV Tax(13-JUL-2026 To 15-JUL-2026)".
  const taxFromLabel = fmtTaxDate(txn.taxFrom ?? null);
  const taxToLabel   = fmtTaxDate(txn.taxTo   ?? null);

  return {
    registrationNo:  txn.vehicleNo    || "-",
    receiptNo,
    paymentDate:     paymentDate.toISOString(),
    paymentDateText,
    paymentInitDate: txn.paymentInitDate || fmtDateWithSecs(paymentDate),
    printedOnDate:   txn.printedOn      || fmtDateWithSecs(paymentDate),
    ownerName:       maskName(txn.ownerName   ?? ""),
    chassisNo:       maskChassis(txn.chassisNo ?? ""),
    mobileNo:        maskMobile(txn.mobileNo   ?? ""),
    taxMode:         txn.taxMode       || "-",
    vehicleType:     txn.vehicleType   || "-",
    vehicleClass:    txn.vehicleClass  || "-",
    permitType:      resolveLabel(PERMIT_TYPE_LABELS, txn.permitType ?? ""),
    permitCategory:  "",
    checkpostName:   txn.checkpostName || "-",
    sleeperCap:      Number(txn.sleeperCap) || 0,
    seatingCapacity: Number(txn.seatingCap) || 0,
    bankRefNo:       txn.orderRef      || "-",
    paymentMode:     txn.paymentMethod || "ONLINE",
    serviceType:     txn.serviceType   || "NOT APPLICABLE",
    qrUrl:           `https://kms.parivahan.gov.in/verify?receipt=${receiptNo}`,
    amount,
    amountInWords:   numberToWords(amount),
    taxItems: [
      { particular: `MV Tax(${taxFromLabel.toUpperCase()} TO ${taxToLabel.toUpperCase()})`, fees: mvTax,     fine: 0, total: mvTax     },
      { particular: "Permit fee",                               fees: permitFee, fine: 0, total: permitFee },
    ],
    // MH-specific string weight fields
    ladenWeight:    (mh.mhLadenWeight   as string) || "-",
    unladenWeight:  (mh.mhUnladenWeight as string) || "-",
    cap1Label: (String(txn.vehicleType || '')).toUpperCase() === 'GOODS VEHICLE' ? 'Gross Vehicle\nWt(In. Kg)' : 'Seating\nCapacity',
    cap2Label: (String(txn.vehicleType || '')).toUpperCase() === 'GOODS VEHICLE' ? 'Unladen\nWt(In Kg.)' : 'Sleeper Cap',
    cap1Value: (String(txn.vehicleType || '')).toUpperCase() === 'GOODS VEHICLE' ? (Number(mh.mhLadenWeight as string) || 0) : (Number(txn.seatingCap) || 0),
    cap2Value: (String(txn.vehicleType || '')).toUpperCase() === 'GOODS VEHICLE' ? (Number(mh.mhUnladenWeight as string) || 0) : (Number(txn.sleeperCap) || 0),
  };
}

