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

// YYYY-MM-DD for the tax-period labels (e.g. "2026-06-23").
function fmtTaxDateYMD(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

// " HH:MM AP" (12-hour) appended to a tax-period date.
function fmt12Hour(hhmm: string | undefined | null): string {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return "";
  const period = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 || 12;
  return ` ${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

// Canonical "DD-MMM-YYYY HH:MM:SS AP" rendered in IST (UTC+5:30) regardless of
// server timezone. Used for auto Payment Init / Conf fallbacks.
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

// "Printed On" uses a comma + non-padded hour, e.g. "23-JUN-2026, 9:47:54 PM".
// Accepts the canonical "DD-MMM-YYYY HH:MM:SS AP" (user-entered or auto).
function fmtPrintedOnComma(s: string): string {
  const m = String(s).match(/^(\d{2}-[A-Za-z]{3}-\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)$/i);
  if (!m) return s;
  return `${m[1].toUpperCase()}, ${parseInt(m[2], 10)}:${m[3]}:${m[4]} ${m[5].toUpperCase()}`;
}

export function buildUttarakhandReceiptData(txn: TxnLike): ReceiptData {
  const grand   = Number(txn.amount)     || 0;
  const userChg = Number(txn.userCharge) || 0;
  const infra   = Number(txn.infraCess)  || 0;
  const mvTax   = Math.max(0, grand - userChg - infra);

  const taxFromLabel = fmtTaxDateYMD(txn.taxFrom ?? null) + fmt12Hour(txn.taxFromTime);
  const taxToLabel   = fmtTaxDateYMD(txn.taxTo   ?? null) + fmt12Hour(txn.taxToTime);
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
    paymentInitDate:    txn.paymentInitDate || fmtDateWithSecs(paymentDate),
    paymentConfirmDate: txn.paymentConfDate || fmtDateWithSecs(paymentDate),
    printedOnDate:      fmtPrintedOnComma(txn.printedOn || fmtDateWithSecs(paymentDate)),
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
