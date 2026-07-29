/**
 * Single source of truth for the Telangana checkpost-tax receipt.
 *
 * Both the on-screen ReceiptTemplate and the PDF generator (generateReceipt.js)
 * consume the shape produced here, so a single Mongo Transaction document
 * drives identical output everywhere.
 *
 * Tax rows are dynamic: MV Tax and Permit Fee each appear only when their
 * amount is greater than zero, so a receipt never shows an empty/₹0 line.
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
import { buildGoodsCaps } from "../shared/goodsCaps";
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

export function buildTelanganaReceiptData(txn: TxnLike): ReceiptData {
  const paymentDate     = txn.paidAt ? new Date(txn.paidAt) : new Date();
  const paymentDateText = fmtPaymentDate(paymentDate);
  const receiptNo       = txn.receiptNo || "-";

  const ts = txn as Record<string, unknown>;
  const mvTax     = Number(ts.tsMvTax)     || 0;
  const permitFee = Number(ts.tsPermitFee) || 0;

  const taxFromLabel = fmtTaxDate(txn.taxFrom ?? null).toUpperCase();
  const taxToLabel   = fmtTaxDate(txn.taxTo   ?? null).toUpperCase();

  // Dynamic rows: only include a fee that is actually charged.
  const taxItems: ReceiptData["taxItems"] = [];
  if (mvTax > 0) {
    taxItems.push({ particular: `MV Tax(${taxFromLabel} TO ${taxToLabel})`, fees: mvTax, fine: 0, total: mvTax });
  }
  if (permitFee > 0) {
    taxItems.push({ particular: "Permit Fee", fees: permitFee, fine: 0, total: permitFee });
  }
  const amount = mvTax + permitFee;

  // Two capacity slots toggle for goods vs passenger vehicles.
  const caps = buildGoodsCaps(
    txn.vehicleType,
    { label1: "Gross Vehicle Wt(In Kg.)", label2: "Unladen Wt(In Kg.)",
      value1: (ts.tsLadenWeight as string) || "", value2: (ts.tsUnladenWeight as string) || "" },
    { label1: "Seating Capacity", label2: "Sleeper Cap.",
      value1: Number(txn.seatingCap) || 0, value2: Number(txn.sleeperCap) || 0 },
  );

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
    taxItems,
    // TS-specific string weight fields (kept for the on-screen template).
    ladenWeight:    (ts.tsLadenWeight   as string) || "-",
    unladenWeight:  (ts.tsUnladenWeight as string) || "-",
    cap1Label: caps.cap1Label,
    cap2Label: caps.cap2Label,
    cap1Value: caps.cap1Value,
    cap2Value: caps.cap2Value,
  };
}
