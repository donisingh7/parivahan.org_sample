/**
 * Single source of truth for the Maharashtra checkpost-tax receipt.
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
} from "../shared/masking";
import { numberToWords } from "../shared/numberToWords";
import type { ReceiptData, TxnLike } from "../types";

export function buildMaharashtraReceiptData(txn: TxnLike): ReceiptData {
  const amount       = Number(txn.amount)    || 0;
  const paymentDate  = txn.paidAt ? new Date(txn.paidAt) : new Date();
  const paymentDateText = fmtPaymentDate(paymentDate);
  const receiptNo    = txn.receiptNo || "-";

  // Read MH-specific fields from the document record.
  const mh = txn as Record<string, unknown>;
  const mvTax     = Number(mh.mhMvTax)    || 0;
  const permitFee = Number(mh.mhPermitFee) || 0;

  return {
    registrationNo:  txn.vehicleNo    || "-",
    receiptNo,
    paymentDate:     paymentDate.toISOString(),
    paymentDateText,
    ownerName:       maskName(txn.ownerName   ?? ""),
    chassisNo:       maskChassis(txn.chassisNo ?? ""),
    mobileNo:        maskMobile(txn.mobileNo   ?? ""),
    taxMode:         txn.taxMode       || "-",
    vehicleType:     txn.vehicleType   || "-",
    vehicleClass:    txn.vehicleClass  || "-",
    permitType:      resolveLabel(PERMIT_TYPE_LABELS, txn.permitType ?? ""),
    permitCategory:  "",
    checkpostName:   txn.checkpostName || "-",
    sleeperCap:      0,
    seatingCapacity: 0,
    bankRefNo:       txn.orderRef      || "-",
    paymentMode:     txn.paymentMethod || "ONLINE",
    serviceType:     txn.serviceType   || "NOT APPLICABLE",
    qrUrl:           `https://kms.parivahan.gov.in/verify?receipt=${receiptNo}`,
    amount,
    amountInWords:   numberToWords(amount),
    taxItems: [
      { particular: "MV Tax",     fees: mvTax,     fine: 0, total: mvTax     },
      { particular: "Permit fee", fees: permitFee, fine: 0, total: permitFee },
    ],
    // MH-specific string weight fields
    ladenWeight:    (mh.mhLadenWeight   as string) || "-",
    unladenWeight:  (mh.mhUnladenWeight as string) || "-",
    cap1Label: (String(txn.vehicleType || '')).toUpperCase() === 'GOODS VEHICLE' ? 'Gross Vehicle\nWt(In. Kg)' : 'Seating\nCapacity',
    cap2Label: (String(txn.vehicleType || '')).toUpperCase() === 'GOODS VEHICLE' ? 'Unladen\nWt(In Kg.)' : 'Sleeper Cap',
    cap1Value: (String(txn.vehicleType || '')).toUpperCase() === 'GOODS VEHICLE' ? (Number(mh.mhLadenWeight as string) || 0) : (Number(txn.seatingCap) || 0),
    cap2Value: (String(txn.vehicleType || '')).toUpperCase() === 'GOODS VEHICLE' ? (Number(mh.mhUnladenWeight as string) || 0) : (Number(txn.sleeperCap) || 0),
  };
}

