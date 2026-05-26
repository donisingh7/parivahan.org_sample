/**
 * Single source of truth for the Andhra Pradesh checkpost-tax receipt.
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
  TAX_MODE_LABELS,
  VEHICLE_CLASS_LABELS,
  VEHICLE_TYPE_LABELS,
} from "../shared/masking";
import { numberToWords } from "../shared/numberToWords";
import type { ReceiptData, TaxItem, TxnLike } from "../types";

function fmtValidity(v: Date | string | null | undefined): string {
  if (!v) return "-";
  const d = new Date(v as string);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  }).toUpperCase().replace(/ /g, "-");
}

function fmtInitDate(s: string | undefined): string {
  if (!s) return "-";
  // If it's a raw ISO date (YYYY-MM-DD) format it for display
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  }).toUpperCase().replace(/ /g, "-");
}

export function buildAndhraPradeshReceiptData(txn: TxnLike): ReceiptData {
  const amount      = Number(txn.amount) || 0;
  const paymentDate = txn.paidAt ? new Date(txn.paidAt) : new Date();
  const receiptNo   = txn.receiptNo || "-";

  // Parse operator-entered tax rows; fall back to a single amount row for
  // legacy records that predate the apTaxItemsJson field.
  let taxItems: TaxItem[];
  try {
    const raw = txn.apTaxItemsJson ? JSON.parse(txn.apTaxItemsJson as string) : [];
    if (Array.isArray(raw) && raw.length > 0) {
      taxItems = (raw as Record<string, unknown>[]).map((item) => ({
        particular: String(item.particular ?? ""),
        fees:       Number(item.fees)  || 0,
        fine:       Number(item.fine)  || 0,
        total:      Number(item.total) || 0,
      }));
    } else {
      taxItems = [{ particular: "MV Tax", fees: amount, fine: 0, total: amount }];
    }
  } catch {
    taxItems = [{ particular: "MV Tax", fees: amount, fine: 0, total: amount }];
  }

  return {
    registrationNo:   txn.vehicleNo    || "-",
    receiptNo,
    paymentDate:      paymentDate.toISOString(),
    paymentDateText:  fmtPaymentDate(paymentDate),
    paymentInitDate:  fmtInitDate(txn.paymentInitDate),
    ownerName:        maskName(txn.ownerName    ?? ""),
    chassisNo:        maskChassis(txn.chassisNo ?? ""),
    mobileNo:         maskMobile(txn.mobileNo   ?? ""),
    taxMode:          resolveLabel(TAX_MODE_LABELS,      txn.taxMode      ?? ""),
    vehicleType:      resolveLabel(VEHICLE_TYPE_LABELS,  txn.vehicleType  ?? ""),
    vehicleClass:     resolveLabel(VEHICLE_CLASS_LABELS, txn.vehicleClass ?? ""),
    permitType:       resolveLabel(PERMIT_TYPE_LABELS,   txn.permitType   ?? ""),
    permitCategory:   "",
    vehicleCategory:  txn.vehicleCategory || "",
    checkpostName:    txn.checkpostName   || "-",
    grossVehicleWt:   Number(txn.grossVehicleWt) || 0,
    unladenWt:        Number(txn.unladenWt)       || 0,
    sleeperCap:       0,
    seatingCapacity:  0,
    bankRefNo:        txn.orderRef        || "-",
    paymentMode:      txn.paymentMethod   || "ONLINE",
    serviceType:      txn.serviceType     || "NOT APPLICABLE",
    fitnessValidity:  fmtValidity(txn.fitnessValidity),
    insuranceValidity: fmtValidity(txn.insuranceValidity),
    puccValidity:     fmtValidity(txn.puccValidity),
    permitValidity:   fmtValidity(txn.permitUpto),
    nameOfGoods:      txn.nameOfGoods || "-",
    route:            txn.route       || "-",
    qrUrl:            `https://apparivahan.gov.in/verify?receipt=${receiptNo}`,
    amount,
    amountInWords:    numberToWords(amount),
    taxItems,
    cap1Label: (String(txn.vehicleType || '')).toUpperCase() === 'GOODS VEHICLE' ? 'Gross Vehicle\nWt(In. Kg)' : 'Seating\nCapacity',
    cap2Label: (String(txn.vehicleType || '')).toUpperCase() === 'GOODS VEHICLE' ? 'Unladen\nWt(In Kg.)' : 'Sleeper Cap',
    cap1Value: (String(txn.vehicleType || '')).toUpperCase() === 'GOODS VEHICLE' ? (Number(txn.grossVehicleWt) || 0) : (Number(txn.seatingCap) || 0),
    cap2Value: (String(txn.vehicleType || '')).toUpperCase() === 'GOODS VEHICLE' ? (Number(txn.unladenWt) || 0) : (Number(txn.sleeperCap) || 0),
  };
}
