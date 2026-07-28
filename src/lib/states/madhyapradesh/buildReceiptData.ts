/**
 * Single source of truth for the Madhya Pradesh checkpost-tax receipt.
 *
 * Produces the shape consumed by the MP 3-page PDF generator
 * (generateReceipt.js — CheckPost V4 / FORM MPMVR-51 layout): a full field
 * grid, a fixed five-row tax table (Permit Fee, MV Tax, Service/User Charge,
 * SGST, CGST), the DTO and the temporary-permit block.
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

// "YYYY-MM-DD" for the tax-period labels (e.g. "2026-07-08"), date only.
function fmtTaxDateYMD(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "";
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

// Canonical "DD-MMM-YYYY HH:MM:SS AP" in IST — auto Payment Init / Conf / Printed.
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

// "Printed On" — comma + non-padded hour, e.g. "08-JUL-2026, 3:28:10 PM".
function fmtPrintedOnComma(s: string): string {
  const m = String(s).match(/^(\d{2}-[A-Za-z]{3}-\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)$/i);
  if (!m) return s;
  return `${m[1].toUpperCase()}, ${parseInt(m[2], 10)}:${m[3]}:${m[4]} ${m[5].toUpperCase()}`;
}

// "Payment Init/Conf" — comma + non-padded hour + seconds, e.g.
// "08-Jul-2026, 3:27:10 PM" (mixed case month, matching the reference).
function fmtCommaDate(s: string): string {
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const m = String(s).match(/^(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)$/i);
  if (!m) return s;
  const monIdx = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"].indexOf(m[2].toUpperCase());
  const mon = monIdx >= 0 ? MONTHS[monIdx] : m[2];
  return `${m[1]}-${mon}-${m[3]}, ${parseInt(m[4], 10)}:${m[5]}:${m[6]} ${m[7].toUpperCase()}`;
}

// Validity dates print upper-case "DD-MMM-YYYY" (e.g. "17-OCT-2026").
function fmtValidity(v: Date | string | null | undefined): string {
  if (!v) return "";
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return typeof v === "string" ? v : "";
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = months[d.getUTCMonth()];
  const yy = d.getUTCFullYear();
  return `${dd}-${mm}-${yy}`;
}

export function buildMadhyaPradeshReceiptData(txn: TxnLike): ReceiptData {
  const mp = txn as Record<string, unknown>;
  const paymentDate = txn.paidAt ? new Date(txn.paidAt) : new Date();
  const receiptNo   = txn.receiptNo || "-";

  // Fixed five-row tax table — each row carries the tax period.
  const from = fmtTaxDateYMD(txn.taxFrom ?? null);
  const to   = fmtTaxDateYMD(txn.taxTo   ?? null);
  const range = from && to ? ` ( ${from} To ${to} )` : "";
  const permitFee  = Number(mp.mpPermitFee)  || 0;
  const mvTax      = Number(mp.mpMvTax)      || 0;
  const userCharge = Number(mp.mpUserCharge) || 0;
  const sgst       = Number(mp.mpSgst)       || 0;
  const cgst       = Number(mp.mpCgst)       || 0;
  const taxItems = [
    { particular: `Permit Fee${range}`,          fees: permitFee,  fine: 0, total: permitFee  },
    { particular: `MV Tax${range}`,              fees: mvTax,      fine: 0, total: mvTax      },
    { particular: `Service/User Charge${range}`, fees: userCharge, fine: 0, total: userCharge },
    { particular: `SGST${range}`,                fees: sgst,       fine: 0, total: sgst       },
    { particular: `CGST${range}`,                fees: cgst,       fine: 0, total: cgst       },
  ];
  const amount = permitFee + mvTax + userCharge + sgst + cgst;

  const isGoods = String(txn.vehicleCategory || "").toUpperCase().includes("GOODS");

  return {
    registrationNo:  txn.vehicleNo || "-",
    receiptNo,
    paymentDate:     paymentDate.toISOString(),
    paymentDateText: fmtDateWithSecs(paymentDate),
    paymentInitDate:    fmtCommaDate(txn.paymentInitDate || fmtDateWithSecs(paymentDate)),
    paymentConfirmDate: fmtCommaDate(txn.paymentConfDate || fmtDateWithSecs(paymentDate)),
    printedOnDate:      fmtPrintedOnComma(txn.printedOn || fmtDateWithSecs(paymentDate)),
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
    dto:             passThrough((mp.mpDto as string) || "").toUpperCase(),
    sleeperCap:      Number(txn.sleeperCap)  || 0,
    seatingCapacity: Number(txn.seatingCap)  || 0,
    standingCapacity: Number(mp.mpStandingCap) || 0,
    grossVehicleWt:  Number(txn.grossVehicleWt) || 0,
    grossCombinationWeight: (txn.grossCombinationWeight as string) || "0",
    bankRefNo:       txn.orderRef || "-",
    paymentMode:     txn.paymentMethod || "ONLINE",
    serviceType:     passThrough(txn.serviceType) === "-" ? "NOT APPLICABLE" : passThrough(txn.serviceType),

    permitNumber:      passThrough(txn.permitNumber),
    permitValidity:    fmtValidity(txn.permitUpto ?? null),
    fitnessValidity:   fmtValidity(txn.fitnessValidity   ?? null),
    insuranceValidity: fmtValidity(txn.insuranceValidity ?? null),
    puccValidity:      fmtValidity(txn.puccValidity      ?? null),
    roadTaxValidity:   fmtValidity((mp.mpRoadTaxValidity as string) || null),

    // Temporary-permit (FORM MPMVR-51) block — mostly fixed / derived.
    routesOrArea:    "Madhya Pradesh State",
    purposeOfJourney: isGoods
      ? "87(1)(A)- Will be granted for short period\n(FOR Goods Vehicle)"
      : "87(1)(A)- Will be granted for short period\n(FOR Passenger Vehicle)",
    permitIssueDate: fmtCommaDate(txn.paymentInitDate || fmtDateWithSecs(paymentDate)),

    qrUrl:           `https://kms.parivahan.gov.in/verify?receipt=${receiptNo}`,
    amount,
    amountInWords:   numberToWords(amount),
    taxItems,
  };
}
