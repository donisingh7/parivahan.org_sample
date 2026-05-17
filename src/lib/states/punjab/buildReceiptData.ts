/**
 * Single source of truth for the Punjab checkpost-tax receipt.
 *
 * Both the on-screen ReceiptTemplate and the PDF generator
 * (generateReceipt.js) consume the shape produced here, so a single Mongo
 * Transaction document drives identical output everywhere.
 *
 * Punjab's receipt differs from Rajasthan and Haryana in a few ways:
 *   • Three rows in the breakup table — MV Tax, Civic Infra Cess, and
 *     Service/User Charge — each with its own (taxFrom To taxTo) period.
 *   • Four-column tax table (Particular | Tax/Fees | Fine | Total).
 *   • Carries a Tax Mode field (DAYS / WEEKLY / FORTNIGHT / …) and a
 *     Vehicle Category field (CONTRACT CARRIAGE/PASSENGER VEHICLES, etc.).
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

// Punjab's form submits text values (e.g. "WEEKLY", "MOTOR CYCLE") instead
// of numeric codes, so no resolveLabel-style lookup is needed.
function passThrough(v: string | undefined | null): string {
  return v && String(v).trim() ? String(v) : "-";
}

export function buildPunjabReceiptData(txn: TxnLike): ReceiptData {
  const mvTax     = Number(txn.amount)     || 0;
  const userChg   = Number(txn.userCharge) || 0;
  const infra     = Number(txn.infraCess)  || 0;
  const grand     = mvTax + userChg + infra;

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
    // Punjab's receipt shows the form's Checkpost Name dropdown value
    // (DOOMWALI, GUMJAL, …). The border district is captured separately
    // and is not surfaced on the receipt.
    checkpostName:   passThrough(txn.checkpostName ?? txn.borderDistrict),
    sleeperCap:      Number(txn.sleeperCap) || 0,
    seatingCapacity: Number(txn.seatingCap) || 0,
    bankRefNo:       txn.orderRef || "-",
    paymentMode:     txn.paymentMethod || "ONLINE",
    serviceType:     passThrough(txn.serviceType) === "-" ? "NOT APPLICABLE" : passThrough(txn.serviceType),
    qrUrl:           `https://kms.parivahan.gov.in/verify?receipt=${receiptNo}`,
    amount:          grand,
    amountInWords:   numberToWords(grand),
    // Three rows — MV Tax, Civic Infra Cess, Service/User Charge — each
    // carrying the same tax period in its particular text.
    taxItems: [
      {
        particular: `MV Tax (${taxFromLabel} To ${taxToLabel})`,
        fees:       mvTax,
        fine:       0,
        total:      mvTax,
      },
      {
        particular: `Civic Infra Cess (${taxFromLabel} To ${taxToLabel})`,
        fees:       infra,
        fine:       0,
        total:      infra,
      },
      {
        particular: `Service/User Charge (${taxFromLabel} To ${taxToLabel})`,
        fees:       userChg,
        fine:       0,
        total:      userChg,
      },
    ],
  };
}
