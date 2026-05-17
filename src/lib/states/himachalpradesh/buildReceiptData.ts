/**
 * Single source of truth for the Himachal Pradesh checkpost-tax receipt.
 *
 * Both the on-screen ReceiptTemplate and the PDF generator
 * (generateReceipt.js) consume the shape produced here, so a single Mongo
 * Transaction document drives identical output everywhere.
 *
 * Himachal Pradesh's receipt mirrors the GOVERNMENT OF HIMACHAL PRADESH
 * inspect HTML (README.txt lines 4509-4912):
 *   • Three rows in the breakup table — Special Road Tax, Civic Infra
 *     Cess and Service/User Charge — each carrying the same
 *     (taxFrom To taxTo) period.
 *   • Twelve-row two-column field grid including Fitness/Insurance/PUCC
 *     Validity, Fuel Type (PETROL/DIESEL/CNG) and Permit Type.
 *   • "Checkpost Name" maps to the form's Border/Barrier District
 *     (BADDI / BAROTIWALA / DAMTAL / …) — no separate barrier dropdown.
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

// HP's form submits text values (e.g. "WEEKLY", "MOTOR CYCLE", "PETROL")
// rather than numeric codes, so no resolveLabel-style lookup is needed.
function passThrough(v: string | undefined | null): string {
  return v && String(v).trim() ? String(v) : "-";
}

// Validity dates are persisted as ISO Date strings; the HP receipt prints
// them in upper-case "DD-MMM-YYYY" form (e.g. "11-MAY-2026").
function fmtValidity(v: TxnLike["fitnessValidity"]): string {
  if (!v) return "-";
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = months[d.getMonth()];
  const yy = d.getFullYear();
  return `${dd}-${mm}-${yy}`;
}

export function buildHimachalPradeshReceiptData(txn: TxnLike): ReceiptData {
  const mvTax   = Number(txn.amount)     || 0;
  const userChg = Number(txn.userCharge) || 0;
  const infra   = Number(txn.infraCess)  || 0;
  const grand   = mvTax + userChg + infra;

  const taxFromLabel = fmtTaxDate(txn.taxFrom ?? null);
  const taxToLabel   = fmtTaxDate(txn.taxTo   ?? null);
  const paymentDate  = txn.paidAt ? new Date(txn.paidAt) : new Date();

  const receiptNo = txn.receiptNo || "-";

  return {
    registrationNo:  txn.vehicleNo || "-",
    receiptNo,
    paymentDate:     paymentDate.toISOString(),
    paymentDateText: fmtPaymentDate(paymentDate),
    paymentInitDate: fmtPaymentDate(paymentDate),
    ownerName:       maskName(txn.ownerName  ?? ""),
    chassisNo:       maskChassis(txn.chassisNo ?? ""),
    mobileNo:        maskMobile(txn.mobileNo ?? ""),
    taxMode:         passThrough(txn.taxMode),
    vehicleType:     passThrough(txn.vehicleType),
    vehicleClass:    passThrough(txn.vehicleClass),
    vehicleCategory: passThrough(txn.vehicleCategory),
    permitType:      "",
    permitCategory:  "",
    // HP receipt's "Checkpost Name" is the Border/Barrier District
    // dropdown value (BADDI, BAROTIWALA, …) — there is no separate
    // checkpost dropdown on the HP form.
    checkpostName:   passThrough(txn.borderDistrict ?? txn.checkpostName),
    sleeperCap:      Number(txn.sleeperCap) || 0,
    seatingCapacity: Number(txn.seatingCap) || 0,
    bankRefNo:       txn.orderRef || "-",
    paymentMode:     txn.paymentMethod || "ONLINE",
    serviceType:     passThrough(txn.serviceType) === "-" ? "NOT APPLICABLE" : passThrough(txn.serviceType),

    // HP-specific extras consumed by the on-screen template + PDF generator.
    fitnessValidity:   fmtValidity(txn.fitnessValidity   ?? null),
    insuranceValidity: fmtValidity(txn.insuranceValidity ?? null),
    puccValidity:      fmtValidity(txn.puccValidity      ?? null),
    fuelType:          passThrough(txn.fuelType),

    qrUrl:           `https://kms.parivahan.gov.in/verify?receipt=${receiptNo}`,
    amount:          grand,
    amountInWords:   numberToWords(grand),

    // Three rows mirroring the HP inspect HTML (lines 4791-4832): Special
    // Road Tax, Civic Infra Cess and Service/User Charge.
    taxItems: [
      {
        particular: `Special Road Tax ( ${taxFromLabel} TO ${taxToLabel} )`,
        fees:       mvTax,
        fine:       0,
        total:      mvTax,
      },
      {
        particular: `Civic Infra Cess ( ${taxFromLabel} To ${taxToLabel})`,
        fees:       infra,
        fine:       0,
        total:      infra,
      },
      {
        particular: `Service/User Charge ( ${taxFromLabel} To ${taxToLabel}) `,
        fees:       userChg,
        fine:       0,
        total:      userChg,
      },
    ],
  };
}
