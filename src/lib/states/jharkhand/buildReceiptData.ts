/**
 * Single source of truth for the Jharkhand checkpost-tax receipt.
 *
 * Both the on-screen ReceiptTemplate and the PDF generator (generateReceipt.js)
 * consume the shape produced here. All auto-generated fields (receiptNo,
 * bankRefNo, paymentConfirmDate) are stored in the DB at payment time and
 * simply read back here — no re-generation on each render.
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

export function buildJharkhandReceiptData(txn: TxnLike): ReceiptData {
  const amount     = Number(txn.amount) || 0;
  const paymentDate = txn.paidAt ? new Date(txn.paidAt as string) : new Date();

  const taxFromLabel = fmtTaxDate(txn.taxFrom ?? null);
  const taxToLabel   = fmtTaxDate(txn.taxTo   ?? null);

  const receiptNo          = txn.receiptNo || "-";
  const paymentDateText    = fmtPaymentDate(paymentDate);
  const paymentConfirmDate = paymentDateText;
  const paymentInitDate    = paymentDateText;

  // JH-specific string fields live in extended schema fields; cast to access.
  const jh = txn as Record<string, unknown>;

  return {
    registrationNo:   txn.vehicleNo         || "-",
    receiptNo,
    paymentDate:      paymentDate.toISOString(),
    paymentDateText,
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
    // orderRef is used as bank reference — generated as 13-digit number for JH
    bankRefNo:        txn.orderRef          || "-",
    paymentMode:      txn.paymentMethod     || "ONLINE",
    serviceType:      txn.serviceType       || "-",
    // JH-specific string weight/validity fields
    grossVehicleWt:   Number(jh.jhGrossVehicleWt as string  || "0") || 0,
    unladenWt:        Number(jh.jhUnladenWt       as string  || "0") || 0,
    grossCombinationWeight: (jh.grossCombinationWeight as string) || "-",
    fitnessValidity:   (jh.jhFitnessValidity   as string) || "-",
    insuranceValidity: (jh.jhInsuranceValidity as string) || "-",
    puccValidity:      (jh.jhPuccValidity      as string) || "-",
    paymentConfirmDate,
    paymentInitDate,
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
    cap1Label: (String(txn.vehicleCategory || '')).toUpperCase() === 'GOODS CARRIER' ? 'Gross Vehicle\nWt(In. Kg)' : 'Seating\nCapacity',
    cap2Label: (String(txn.vehicleCategory || '')).toUpperCase() === 'GOODS CARRIER' ? 'Unladen\nWt(In Kg.)' : 'Sleeper Cap',
    cap1Value: (String(txn.vehicleCategory || '')).toUpperCase() === 'GOODS CARRIER' ? (Number(jh.jhGrossVehicleWt as string || '0') || 0) : (Number(txn.seatingCap) || 0),
    cap2Value: (String(txn.vehicleCategory || '')).toUpperCase() === 'GOODS CARRIER' ? (Number(jh.jhUnladenWt as string || '0') || 0) : (Number(txn.sleeperCap) || 0),
  };
}
