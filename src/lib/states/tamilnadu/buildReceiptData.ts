/**
 * Single source of truth for the Tamil Nadu checkpost-tax receipt.
 *
 * Produces the shape consumed by the single-page TN PDF generator
 * (generateReceipt.js): the field grid, a four-row tax table (Permit Fee, MV
 * Tax, Welfare Tax, Service/User Charge), the Green Tax / Base Permit validity
 * fields, and capacity fields that toggle to Gross/Unladen weight for goods
 * vehicles.
 */

import {
  maskChassis,
  maskMobile,
  maskName,
} from "../shared/masking";
import { numberToWords } from "../shared/numberToWords";
import type { ReceiptData, TxnLike } from "../types";

function passThrough(v: string | undefined | null): string {
  return v && String(v).trim() ? String(v) : "-";
}

// "YYYY-MM-DD" for the tax-period labels (e.g. "2026-07-13"), date only.
function fmtTaxDateYMD(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "";
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

// Canonical "DD-MMM-YYYY HH:MM:SS AP" in IST — printed-on / auto fallbacks.
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

// "13-Jul-2026, 9:00:59 AM" — comma + non-padded hour + seconds, mixed-case
// month (matching the reference payment init/confirmation timestamps).
function fmtCommaDate(s: string): string {
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const m = String(s).match(/^(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)$/i);
  if (!m) return s;
  const monIdx = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"].indexOf(m[2].toUpperCase());
  const mon = monIdx >= 0 ? MONTHS[monIdx] : m[2];
  return `${m[1]}-${mon}-${m[3]}, ${parseInt(m[4], 10)}:${m[5]}:${m[6]} ${m[7].toUpperCase()}`;
}

// Validity dates print upper-case "DD-MMM-YYYY". Accepts "yyyy-mm-dd" (calendar)
// or an already-formatted string.
function fmtValidity(v: Date | string | null | undefined): string {
  if (!v || !String(v).trim()) return "";
  const s = String(v).trim();
  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) {
    const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    return `${ymd[3]}-${months[parseInt(ymd[2], 10) - 1]}-${ymd[1]}`;
  }
  return s.toUpperCase();
}

export function buildTamilNaduReceiptData(txn: TxnLike): ReceiptData {
  const tn = txn as Record<string, unknown>;
  const paymentDate = txn.paidAt ? new Date(txn.paidAt) : new Date();
  const receiptNo   = txn.receiptNo || "-";
  const autoTs      = fmtDateWithSecs(paymentDate);

  const from = fmtTaxDateYMD(txn.taxFrom ?? null);
  const to   = fmtTaxDateYMD(txn.taxTo   ?? null);
  const range = from && to ? ` ( ${from} To ${to} )` : "";
  const permitFee  = Number(tn.tnPermitFee)  || 0;
  const mvTax      = Number(tn.tnMvTax)      || 0;
  const welfareTax = Number(tn.tnWelfareTax) || 0;
  const userCharge = Number(tn.tnUserCharge) || 0;
  const taxItems = [
    { particular: `Permit Fee${range}`,          fees: permitFee,  fine: 0, total: permitFee  },
    { particular: `MV Tax${range}`,              fees: mvTax,      fine: 0, total: mvTax      },
    { particular: `Welfare Tax${range}`,         fees: welfareTax, fine: 0, total: welfareTax },
    { particular: `Service/User Charge${range}`, fees: userCharge, fine: 0, total: userCharge },
  ];
  const amount = permitFee + mvTax + welfareTax + userCharge;

  const isGoods = String(txn.vehicleCategory || "").toUpperCase().includes("GOODS");
  const grossWt = Number(txn.grossVehicleWt) || 0;
  const unladen = Number(txn.unladenWt) || 0;

  return {
    registrationNo:  txn.vehicleNo || "-",
    receiptNo,
    paymentDate:     paymentDate.toISOString(),
    paymentDateText: autoTs,
    paymentInitDate:    fmtCommaDate(txn.paymentInitDate || autoTs),
    paymentConfirmDate: fmtCommaDate(txn.paymentConfDate || autoTs),
    printedOnDate:      fmtDateWithSecs(paymentDate),
    ownerName:       maskName(txn.ownerName   ?? ""),
    chassisNo:       maskChassis(txn.chassisNo ?? ""),
    mobileNo:        maskMobile(txn.mobileNo   ?? ""),
    taxMode:         passThrough(txn.taxMode),
    vehicleType:     passThrough(txn.vehicleType),
    vehicleClass:    passThrough(txn.vehicleClass),
    vehicleCategory: passThrough(txn.vehicleCategory),
    permitType:      passThrough(txn.permitType),
    permitCategory:  "",
    checkpostName:   passThrough(txn.checkpostName),
    sleeperCap:      Number(txn.sleeperCap)  || 0,
    seatingCapacity: Number(txn.seatingCap)  || 0,
    grossVehicleWt:  grossWt,
    unladenWt:       unladen,
    bankRefNo:       txn.orderRef || "-",
    paymentMode:     txn.paymentMethod || "ONLINE",
    serviceType:     passThrough(txn.serviceType) === "-" ? "NOT APPLICABLE" : passThrough(txn.serviceType),

    permitNumber:      passThrough(txn.permitNumber),
    permitValidity:    fmtValidity(txn.permitUpto ?? null),
    fitnessValidity:   fmtValidity(txn.fitnessValidity   ?? null),
    insuranceValidity: fmtValidity(txn.insuranceValidity ?? null),
    puccValidity:      fmtValidity(txn.puccValidity      ?? null),
    greenTaxValidity:  fmtValidity((tn.tnGreenTaxValidity as string) || null),
    basePermitValidity: fmtValidity((tn.tnBasePermitValidity as string) || null),

    qrUrl:           `https://kms.parivahan.gov.in/verify?receipt=${receiptNo}`,
    amount,
    amountInWords:   numberToWords(amount),
    taxItems,
    // Capacity fields toggle to Gross/Unladen weight for goods vehicles.
    cap1Label: isGoods ? "Gross Vehicle Wt(In.\nKg)" : "Seating\nCapacity",
    cap2Label: isGoods ? "Unladen Wt(In Kg.)"        : "Sleeper Cap.",
    cap1Value: isGoods ? grossWt : (Number(txn.seatingCap) || 0),
    cap2Value: isGoods ? unladen : (Number(txn.sleeperCap) || 0),
  };
}
