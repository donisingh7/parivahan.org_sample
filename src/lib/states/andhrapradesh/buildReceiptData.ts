/**
 * Single source of truth for the Andhra Pradesh checkpost-tax receipt.
 *
 * Both the on-screen ReceiptTemplate and the PDF generator (generateReceipt.js)
 * consume the shape produced here, so a single Mongo Transaction document
 * drives identical output everywhere. Other states have their own
 * buildReceiptData under src/lib/states/<state>/ — duplication is intentional
 * so each state can later diverge without entangled file edits.
 */

import {
  fmtPaymentDate,
  fmtTaxDate,
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
import type { ReceiptData, TxnLike } from "../types";

export function buildAndhraPradeshReceiptData(txn: TxnLike): ReceiptData {
  const amount    = Number(txn.amount) || 0;
  // 15/16 split is the Andhra Pradesh Motor-Vehicle-Tax + Surcharge convention.
  const mvTax     = Math.round(amount * 15 / 16);
  const surcharge = amount - mvTax;

  const taxFromLabel = fmtTaxDate(txn.taxFrom ?? null);
  const taxToLabel   = fmtTaxDate(txn.taxTo   ?? null);
  const paymentDate  = txn.paidAt ? new Date(txn.paidAt) : new Date();

  const receiptNo = txn.receiptNo || "-";

  return {
    registrationNo:  txn.vehicleNo || "-",
    receiptNo,
    paymentDate:     paymentDate.toISOString(),
    paymentDateText: fmtPaymentDate(paymentDate),
    ownerName:       maskName(txn.ownerName  ?? ""),
    chassisNo:       maskChassis(txn.chassisNo ?? ""),
    mobileNo:        maskMobile(txn.mobileNo ?? ""),
    taxMode:         resolveLabel(TAX_MODE_LABELS,      txn.taxMode      ?? ""),
    vehicleType:     resolveLabel(VEHICLE_TYPE_LABELS,  txn.vehicleType  ?? ""),
    vehicleClass:    resolveLabel(VEHICLE_CLASS_LABELS, txn.vehicleClass ?? ""),
    permitType:      resolveLabel(PERMIT_TYPE_LABELS,   txn.permitType   ?? ""),
    permitCategory:  "",
    checkpostName:   txn.checkpostName || "-",
    sleeperCap:      Number(txn.sleeperCap) || 0,
    seatingCapacity: Number(txn.seatingCap) || 0,
    bankRefNo:       txn.orderRef || "-",
    paymentMode:     txn.paymentMethod || "ONLINE",
    serviceType:     "NOT APPLICABLE",
    qrUrl:           `https://kms.parivahan.gov.in/verify?receipt=${receiptNo}`,
    amount,
    amountInWords:   numberToWords(amount),
    taxItems: [
      { particular: `MV Tax(${taxFromLabel} TO ${taxToLabel})`, fees: mvTax,     fine: 0, total: mvTax     },
      { particular: "Surcharge fee",                            fees: surcharge, fine: 0, total: surcharge },
    ],
  };
}
