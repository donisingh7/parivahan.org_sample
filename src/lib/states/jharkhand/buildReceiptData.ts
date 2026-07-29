/**
 * Single source of truth for the Jharkhand checkpost-tax receipt.
 *
 * Produces the shape consumed by the two-page JH PDF generator
 * (generateReceipt.js): a single MV Tax row carrying the tax period, the
 * Seating/Sleeper capacity fields (which toggle to Gross/Unladen weight for
 * goods vehicles), the validity dates and the payment-confirmation timestamp.
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

// Canonical "DD-MMM-YYYY HH:MM:SS AP" in IST — auto Payment Conf / Printed.
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

// "04-JUL-2026 11:04 AM" — the receipt shows payment/printed dates at HH:MM
// (no seconds, non-padded hour).
function fmtDateHHMM(s: string): string {
  const m = String(s).match(/^(\d{2}-[A-Za-z]{3}-\d{4})\s+(\d{1,2}):(\d{2}):\d{2}\s+(AM|PM)$/i);
  if (!m) return s;
  return `${m[1].toUpperCase()} ${parseInt(m[2], 10)}:${m[3]} ${m[4].toUpperCase()}`;
}

// Validity dates print upper-case "DD-MMM-YYYY" (e.g. "25-FEB-2028"). Accepts
// "yyyy-mm-dd" (calendar) or an already-formatted string.
function fmtValidity(v: string | null | undefined): string {
  if (!v || !String(v).trim()) return "-";
  const s = String(v).trim();
  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) {
    const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    return `${ymd[3]}-${months[parseInt(ymd[2], 10) - 1]}-${ymd[1]}`;
  }
  return s.toUpperCase();
}

export function buildJharkhandReceiptData(txn: TxnLike): ReceiptData {
  const amount      = Number(txn.amount) || 0;
  const paymentDate = txn.paidAt ? new Date(txn.paidAt as string) : new Date();

  const taxFromLabel = fmtTaxDate(txn.taxFrom ?? null);
  const taxToLabel   = fmtTaxDate(txn.taxTo   ?? null);

  const receiptNo       = txn.receiptNo || "-";
  const paymentDateText = fmtPaymentDate(paymentDate);
  const autoTs          = fmtDateWithSecs(paymentDate);

  // JH-specific string fields live in extended schema fields; cast to access.
  const jh = txn as Record<string, unknown>;
  const isGoods = String(txn.vehicleCategory || "").toUpperCase() === "GOODS CARRIER";
  const grossWt = Number((jh.jhGrossVehicleWt as string) || "0") || 0;
  const unladen = Number((jh.jhUnladenWt as string) || "0") || 0;

  return {
    registrationNo:   txn.vehicleNo         || "-",
    receiptNo,
    paymentDate:      paymentDate.toISOString(),
    paymentDateText,
    paymentInitDate:    fmtDateHHMM(txn.paymentInitDate || autoTs),
    paymentConfirmDate: fmtDateHHMM(txn.paymentConfDate || autoTs),
    printedOnDate:      fmtDateHHMM(txn.printedOn || autoTs),
    ownerName:        maskName(txn.ownerName    ?? ""),
    chassisNo:        maskChassis(txn.chassisNo ?? ""),
    mobileNo:         maskMobile(txn.mobileNo   ?? ""),
    taxMode:          txn.taxMode           || "-",
    vehicleType:      txn.vehicleType       || "-",
    vehicleCategory:  txn.vehicleCategory   || "-",
    vehicleClass:     txn.vehicleClass      || "-",
    permitType:       txn.permitType        || "NOT APPLICABLE",
    permitCategory:   "",
    checkpostName:    txn.checkpostName     || "-",
    sleeperCap:       Number(txn.sleeperCap)  || 0,
    seatingCapacity:  Number(txn.seatingCap)  || 0,
    // orderRef is used as the bank reference (10-char alphanumeric for JH).
    bankRefNo:        txn.orderRef          || "-",
    paymentMode:      txn.paymentMethod     || "ONLINE",
    serviceType:      txn.serviceType       || "-",
    grossVehicleWt:   grossWt,
    unladenWt:        unladen,
    grossCombinationWeight: (jh.grossCombinationWeight as string) || "-",
    fitnessValidity:   fmtValidity(jh.jhFitnessValidity   as string),
    insuranceValidity: fmtValidity(jh.jhInsuranceValidity as string),
    puccValidity:      fmtValidity(jh.jhPuccValidity      as string),
    qrUrl: `https://kms.parivahan.gov.in/verify?receipt=${receiptNo}`,
    amount,
    amountInWords: numberToWords(amount),
    taxItems: [
      {
        particular: `MV Tax(${taxFromLabel} TO ${taxToLabel})`,
        fees:  amount,
        fine:  0,
        total: amount,
      },
    ],
    // Capacity fields toggle to Gross/Unladen weight for goods vehicles.
    cap1Label: isGoods ? "Gross Vehicle\nWt(In. Kg)" : "Seating\nCapacity",
    cap2Label: isGoods ? "Unladen\nWt(In Kg.)"       : "Sleeper Cap.",
    cap1Value: isGoods ? grossWt : (Number(txn.seatingCap) || 0),
    cap2Value: isGoods ? unladen : (Number(txn.sleeperCap) || 0),
  };
}
