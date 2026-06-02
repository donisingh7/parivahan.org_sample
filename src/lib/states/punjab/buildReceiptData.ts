/**
 * Single source of truth for the Punjab checkpost-tax receipt.
 *
 * Both the on-screen ReceiptTemplate and the PDF generator
 * (generateReceipt.js) consume the shape produced here, so a single Mongo
 * Transaction document drives identical output everywhere.
 *
 * Punjab's receipt layout:
 *   • Three rows in the breakup table — MV Tax, Civic Infra Cess, and
 *     Service/User Charge — each with its own (taxFrom To taxTo) period.
 *   • Ten-row two-column field grid including Gross Vehicle Wt, Unladen Wt,
 *     and Permit Validity.
 *   • First 2 tax items on page 1, remaining on page 2.
 *   • "Checkpost Name" on the receipt is the form's checkpostName dropdown
 *     value (not the border-district as in Haryana).
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

function passThrough(v: string | undefined | null): string {
  return v && String(v).trim() ? String(v) : "-";
}

function fmt12Hour(hhmm: string | undefined | null): string {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return "";
  const period = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 || 12;
  return ` ${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

// Format a date as "DD-MMM-YYYY" (e.g. "11-MAY-2026") for permit validity.
function fmtValidity(v: TxnLike["permitUpto"]): string {
  if (!v) return "-";
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = months[d.getMonth()];
  const yy = d.getFullYear();
  return `${dd}-${mm}-${yy}`;
}

export function buildPunjabReceiptData(txn: TxnLike): ReceiptData {
  const grand   = Number(txn.amount)     || 0;
  const userChg = Number(txn.userCharge) || 0;
  const infra   = Number(txn.infraCess)  || 0;
  const mvTax   = Math.max(0, grand - userChg - infra);

  const taxFromLabel = fmtTaxDate(txn.taxFrom ?? null) + fmt12Hour(txn.taxFromTime);
  const taxToLabel   = fmtTaxDate(txn.taxTo   ?? null) + fmt12Hour(txn.taxToTime);
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
    permitType:      passThrough(txn.permitType) === "-" ? "NOT APPLICABLE" : passThrough(txn.permitType),
    permitCategory:  "",
    checkpostName:   passThrough(txn.checkpostName ?? txn.borderDistrict),
    sleeperCap:      Number(txn.sleeperCap) || 0,
    seatingCapacity: Number(txn.seatingCap) || 0,
    bankRefNo:       txn.orderRef || "-",
    paymentMode:     txn.paymentMethod || "ONLINE",
    serviceType:     passThrough(txn.serviceType) === "-" ? "NOT APPLICABLE" : passThrough(txn.serviceType),

    // Punjab-specific weight and permit fields
    grossVehicleWt:  Number(txn.grossVehicleWt) || 0,
    unladenWt:       Number(txn.unladenWt) || 0,
    permitValidity:  fmtValidity(txn.permitUpto ?? null),

    qrUrl:           `https://kms.parivahan.gov.in/verify?receipt=${receiptNo}`,
    amount:          grand,
    amountInWords:   numberToWords(grand),

    // Page 1: MV Tax + Service/User Charge; Page 2: Cess (slice(0,2)/slice(2))
    taxItems: [
      {
        particular: `MV Tax (${taxFromLabel} To ${taxToLabel})`,
        fees:       mvTax,
        fine:       0,
        total:      mvTax,
      },
      {
        particular: `Service/User Charge (${taxFromLabel} To ${taxToLabel})`,
        fees:       userChg,
        fine:       0,
        total:      userChg,
      },
      {
        particular: `Cess (${taxFromLabel} To ${taxToLabel})`,
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
