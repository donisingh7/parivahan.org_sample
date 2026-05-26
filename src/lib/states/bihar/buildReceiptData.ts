/**
 * Single source of truth for the Bihar checkpost-tax receipt.
 *
 * Both the on-screen ReceiptTemplate and the PDF generator (generateReceipt.js)
 * consume the shape produced here, so a single Mongo Transaction document
 * drives identical output everywhere. Other states have their own
 * buildReceiptData under src/lib/states/<state>/ — duplication is intentional
 * so each state can later diverge without entangled file edits.
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

export function buildBiharReceiptData(txn: TxnLike): ReceiptData {
  const amount       = Number(txn.amount) || 0;
  const paymentDate  = txn.paidAt ? new Date(txn.paidAt) : new Date();
  const paymentDateText = fmtPaymentDate(paymentDate);
  const receiptNo    = txn.receiptNo || "-";

  // Read Bihar-specific string fields from the document record.
  const br = txn as Record<string, unknown>;

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
    vehicleCategory: txn.vehicleCategory || "-",
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
      { particular: "MV Tax", fees: amount, fine: 0, total: amount },
    ],
    // Bihar-specific string weight / validity fields
    grossVehicleWt:        Number((br.brGrossVehicleWt  as string) || "0") || 0,
    unladenWt:             Number((br.brUnladenWt        as string) || "0") || 0,
    fitnessValidity:        (br.brFitnessValidity   as string) || "-",
    insuranceValidity:      (br.brInsuranceValidity as string) || "-",
    puccValidity:           (br.brPuccValidity      as string) || "-",
    grossCombinationWeight: (txn.grossCombinationWeight)        || "-",
    paymentConfirmDate:     paymentDateText,
    paymentInitDate:        paymentDateText,
    cap1Label: (String(txn.vehicleType || '')).toUpperCase() === 'GOODS VEHICLE' ? 'Gross Vehicle\nWt(In. Kg)' : 'Seating\nCapacity',
    cap2Label: (String(txn.vehicleType || '')).toUpperCase() === 'GOODS VEHICLE' ? 'Unladen\nWt(In Kg.)' : 'Sleeper Cap',
    cap1Value: (String(txn.vehicleType || '')).toUpperCase() === 'GOODS VEHICLE' ? (Number((br.brGrossVehicleWt as string) || '0') || 0) : (Number(txn.seatingCap) || 0),
    cap2Value: (String(txn.vehicleType || '')).toUpperCase() === 'GOODS VEHICLE' ? (Number((br.brUnladenWt as string) || '0') || 0) : (Number(txn.sleeperCap) || 0),
  };
}

