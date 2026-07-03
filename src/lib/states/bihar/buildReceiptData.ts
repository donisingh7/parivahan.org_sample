/**
 * Single source of truth for the Bihar checkpost-tax receipt.
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
} from "../shared/masking";
import { numberToWords } from "../shared/numberToWords";
import type { ReceiptData, TxnLike } from "../types";

// YYYY-MM-DD for the MV Tax period label (e.g. "2026-07-02").
function fmtTaxDateYMD(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

// Always render in IST (UTC+5:30) regardless of server timezone. Used for
// auto Payment Init / Conf / Printed-On fallbacks.
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

// Fitness/Insurance/PUCC Validity are entered via a date picker as
// "yyyy-mm-dd"; the receipt prints them as upper-case "DD-MMM-YYYY".
function fmtValidity(v: string | undefined | null): string {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v).toUpperCase();
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = months[d.getUTCMonth()];
  const yy = d.getUTCFullYear();
  return `${dd}-${mm}-${yy}`;
}

export function buildBiharReceiptData(txn: TxnLike): ReceiptData {
  const amount       = Number(txn.amount) || 0;
  const paymentDate  = txn.paidAt ? new Date(txn.paidAt) : new Date();
  const paymentDateText = fmtPaymentDate(paymentDate);
  const receiptNo    = txn.receiptNo || "-";
  const taxFromLabel = fmtTaxDateYMD(txn.taxFrom ?? null);
  const taxToLabel   = fmtTaxDateYMD(txn.taxTo   ?? null);

  // Read Bihar-specific string fields from the document record.
  const br = txn as Record<string, unknown>;

  return {
    registrationNo:  txn.vehicleNo    || "-",
    receiptNo,
    paymentDate:     paymentDate.toISOString(),
    paymentDateText,
    ownerName:       maskName(txn.ownerName   ?? ""),
    chassisNo:       maskChassis(txn.chassisNo ?? ""),
    mobileNo:        maskMobile(txn.mobileNo   ?? ""),
    taxMode:         txn.taxMode       || "-",
    vehicleType:     txn.vehicleType   || "-",
    vehicleClass:    txn.vehicleClass  || "-",
    vehicleCategory: txn.vehicleCategory || "-",
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
      { particular: `MV Tax(${taxFromLabel} TO ${taxToLabel})`, fees: amount, fine: 0, total: amount },
    ],
    // Bihar-specific string weight / validity fields
    grossVehicleWt:        Number((br.brGrossVehicleWt  as string) || "0") || 0,
    unladenWt:             Number((br.brUnladenWt        as string) || "0") || 0,
    fitnessValidity:        fmtValidity(br.brFitnessValidity   as string),
    insuranceValidity:      fmtValidity(br.brInsuranceValidity as string),
    puccValidity:           fmtValidity(br.brPuccValidity      as string),
    grossCombinationWeight: (txn.grossCombinationWeight)        || "-",
    paymentInitDate:        txn.paymentInitDate || fmtDateWithSecs(paymentDate),
    paymentConfirmDate:     txn.paymentConfDate || fmtDateWithSecs(paymentDate),
    printedOnDate:          txn.printedOn      || fmtDateWithSecs(paymentDate),
    cap1Label: (String(txn.vehicleType || '')).toUpperCase() === 'GOODS VEHICLE' ? 'Gross Vehicle\nWt(In. Kg)' : 'Seating\nCapacity',
    cap2Label: (String(txn.vehicleType || '')).toUpperCase() === 'GOODS VEHICLE' ? 'Unladen\nWt(In Kg.)' : 'Sleeper Cap',
    cap1Value: (String(txn.vehicleType || '')).toUpperCase() === 'GOODS VEHICLE' ? (Number((br.brGrossVehicleWt as string) || '0') || 0) : (Number(txn.seatingCap) || 0),
    cap2Value: (String(txn.vehicleType || '')).toUpperCase() === 'GOODS VEHICLE' ? (Number((br.brUnladenWt as string) || '0') || 0) : (Number(txn.sleeperCap) || 0),
  };
}

