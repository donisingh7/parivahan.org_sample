/**
 * Single source of truth for the Andhra Pradesh checkpost-tax receipt.
 *
 * Both the on-screen ReceiptTemplate and the PDF generator (generateReceipt.js)
 * consume the shape produced here, so a single Mongo Transaction document
 * drives identical output everywhere.
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
import type { ReceiptData, TaxItem, TxnLike } from "../types";

// Validity dates are entered via a date picker as "yyyy-mm-dd"; the receipt
// prints them upper-case "DD-MMM-YYYY" (UTC-based so a server in any
// timezone renders the same calendar day the user picked).
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

// YYYY-MM-DD for the tax-period range appended to every tax-table row
// (e.g. "2026-06-26 to 2026-06-28"), date only.
function fmtTaxDateYMD(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "";
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

export function buildAndhraPradeshReceiptData(txn: TxnLike): ReceiptData {
  const amount      = Number(txn.amount) || 0;
  const paymentDate = txn.paidAt ? new Date(txn.paidAt) : new Date();
  const receiptNo   = txn.receiptNo || "-";

  // Parse operator-entered tax rows; fall back to a single amount row for
  // legacy records that predate the apTaxItemsJson field. Rows where the
  // operator left both fees and fine at 0 are dropped — a blank row on the
  // form should not print a blank row on the receipt.
  // Tax period suffix appended to every row's particular, e.g.
  // "MV Tax (2026-06-26 to 2026-06-28)".
  const taxFromYMD = fmtTaxDateYMD(txn.taxFrom ?? null);
  const taxToYMD   = fmtTaxDateYMD(txn.taxTo   ?? null);
  const taxPeriodSuffix = taxFromYMD && taxToYMD ? ` (${taxFromYMD} to ${taxToYMD})` : "";

  let taxItems: TaxItem[];
  try {
    const raw = txn.apTaxItemsJson ? JSON.parse(txn.apTaxItemsJson as string) : [];
    if (Array.isArray(raw) && raw.length > 0) {
      taxItems = (raw as Record<string, unknown>[])
        .map((item) => ({
          particular: `${String(item.particular ?? "")}${taxPeriodSuffix}`,
          fees:       Number(item.fees)  || 0,
          fine:       Number(item.fine)  || 0,
          total:      Number(item.total) || 0,
        }))
        .filter((item) => item.total !== 0);
    } else {
      taxItems = [{ particular: `MV Tax${taxPeriodSuffix}`, fees: amount, fine: 0, total: amount }];
    }
  } catch {
    taxItems = [{ particular: `MV Tax${taxPeriodSuffix}`, fees: amount, fine: 0, total: amount }];
  }

  return {
    registrationNo:   txn.vehicleNo    || "-",
    receiptNo,
    paymentDate:      paymentDate.toISOString(),
    paymentDateText:  fmtPaymentDate(paymentDate),
    paymentInitDate:    txn.paymentInitDate || fmtDateWithSecs(paymentDate),
    paymentConfirmDate: txn.paymentConfDate || fmtDateWithSecs(paymentDate),
    printedOnDate:      txn.printedOn      || fmtDateWithSecs(paymentDate),
    ownerName:        maskName(txn.ownerName    ?? ""),
    chassisNo:        maskChassis(txn.chassisNo ?? ""),
    mobileNo:         maskMobile(txn.mobileNo   ?? ""),
    taxMode:          resolveLabel(TAX_MODE_LABELS,      txn.taxMode      ?? ""),
    vehicleType:      resolveLabel(VEHICLE_TYPE_LABELS,  txn.vehicleType  ?? ""),
    vehicleClass:     resolveLabel(VEHICLE_CLASS_LABELS, txn.vehicleClass ?? ""),
    permitType:       resolveLabel(PERMIT_TYPE_LABELS,   txn.permitType   ?? ""),
    permitCategory:   "",
    vehicleCategory:  txn.vehicleCategory || "",
    checkpostName:    txn.checkpostName   || "-",
    grossVehicleWt:   Number(txn.grossVehicleWt) || 0,
    unladenWt:        Number(txn.unladenWt)       || 0,
    sleeperCap:       Number(txn.sleeperCap) || 0,
    seatingCapacity:  Number(txn.seatingCap) || 0,
    bankRefNo:        txn.orderRef        || "-",
    paymentMode:      txn.paymentMethod   || "ONLINE",
    serviceType:      txn.serviceType     || "NOT APPLICABLE",
    fitnessValidity:  fmtValidity(txn.fitnessValidity as string),
    insuranceValidity: fmtValidity(txn.insuranceValidity as string),
    puccValidity:     fmtValidity(txn.puccValidity as string),
    permitValidity:   fmtValidity(txn.permitUpto as string),
    nameOfGoods:      txn.nameOfGoods || "-",
    route:            txn.route       || "-",
    qrUrl:            `https://apparivahan.gov.in/verify?receipt=${receiptNo}`,
    amount,
    amountInWords:    numberToWords(amount),
    taxItems,
    cap1Label: (String(txn.vehicleCategory || '')).toUpperCase() === 'GOODS VEHICLE' ? 'Gross Vehicle\nWt(In. Kg)' : 'Seating\nCapacity',
    cap2Label: (String(txn.vehicleCategory || '')).toUpperCase() === 'GOODS VEHICLE' ? 'Unladen\nWt(In Kg.)' : 'Sleeper Cap',
    cap1Value: (String(txn.vehicleCategory || '')).toUpperCase() === 'GOODS VEHICLE' ? (Number(txn.grossVehicleWt) || 0) : (Number(txn.seatingCap) || 0),
    cap2Value: (String(txn.vehicleCategory || '')).toUpperCase() === 'GOODS VEHICLE' ? (Number(txn.unladenWt) || 0) : (Number(txn.sleeperCap) || 0),
  };
}
