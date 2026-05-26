/**
 * Single source of truth for the Rajasthan checkpost-tax receipt.
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

export function buildRajasthanReceiptData(txn: TxnLike): ReceiptData {
  const amount = Number(txn.amount) || 0;
  // userCharge stores the Surcharge Fee the operator confirmed (or modified).
  // Fall back to 15/16 split for legacy records that predate this field.
  const surcharge = txn.userCharge != null ? Number(txn.userCharge) : amount - Math.round(amount * 15 / 16);
  const mvTax     = Math.max(0, amount - surcharge);

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
    cap1Label: (String(txn.vehicleType || '')).toUpperCase() === 'GOODS VEHICLE' ? 'Gross Vehicle\nWt(In. Kg)' : 'Seating\nCapacity',
    cap2Label: (String(txn.vehicleType || '')).toUpperCase() === 'GOODS VEHICLE' ? 'Unladen\nWt(In Kg.)' : 'Sleeper Cap',
    cap1Value: (String(txn.vehicleType || '')).toUpperCase() === 'GOODS VEHICLE' ? (Number(txn.grossVehicleWt) || 0) : (Number(txn.seatingCap) || 0),
    cap2Value: (String(txn.vehicleType || '')).toUpperCase() === 'GOODS VEHICLE' ? (Number(txn.unladenWt) || 0) : (Number(txn.sleeperCap) || 0),
  };
}
