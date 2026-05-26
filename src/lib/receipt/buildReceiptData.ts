/**
 * Single source of truth for the Rajasthan checkpost-tax receipt.
 *
 * Both the on-screen <RajasthanReceipt /> and the PDF generator
 * (receipt-generator/generateReceipt.js) consume the shape produced here, so
 * a single Mongo Transaction document drives identical output everywhere.
 */

// ── Lookup tables (codes → human labels) ────────────────────────────────────
const VEHICLE_TYPE_LABELS: Record<string, string> = {
  "1": "CONTRACT CARRIAGE/PASSENGER VEHICLES",
  "3": "GOODS VEHICLE",
  "7": "TEMPORARY REGISTERED VEHICLES",
  "9": "CONSTRUCTION EQUIPMENT VEHICLE",
};

const VEHICLE_CLASS_LABELS: Record<string, string> = {
  "1": "MOTOR CAB",
  "2": "MAXI CAB",
  "3": "BUS",
  "4": "GOODS VEHICLE (LMV)",
  "5": "GOODS VEHICLE (HGV)",
  "6": "TRACTOR",
  "7": "ARTICULATED VEHICLE",
};

const PERMIT_TYPE_LABELS: Record<string, string> = {
  "1": "AITP",
  "2": "NATIONAL PERMIT",
  "3": "SPECIAL PERMIT",
  "4": "CONTRACT CARRIAGE PERMIT",
  "-1": "NOT APPLICABLE",
  "":   "NOT APPLICABLE",
};

const TAX_MODE_LABELS: Record<string, string> = {
  "1":  "ONLINE",
  "2":  "CASH",
  "-1": "DAYS",
  "":   "DAYS",
};

// Resolve a stored value to its label. We accept either a code that exists in
// the lookup, or a value that's already a label (e.g. legacy rows or values
// the user typed). When neither matches we fall back to the raw value.
function resolveLabel(table: Record<string, string>, value: string): string {
  if (!value) return table[""] ?? "—";
  if (Object.prototype.hasOwnProperty.call(table, value)) return table[value];
  return value;
}

// ── Masking (parity with the parivahan production receipt) ──────────────────
export function maskName(name: string): string {
  if (!name || name.length < 3) return name || "-";
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => (w.length <= 2 ? w : w[0] + "*".repeat(w.length - 2) + w[w.length - 1]))
    .join(" ");
}

export function maskChassis(ch: string): string {
  if (!ch || ch.length <= 5) return ch || "-";
  return ch.slice(0, ch.length - 5) + "*".repeat(5);
}

export function maskMobile(mob: string): string {
  if (!mob || mob.length < 6) return mob || "-";
  return mob.slice(0, 5) + "*".repeat(mob.length - 6) + mob.slice(-1);
}

// ── Date formatting ─────────────────────────────────────────────────────────
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_UPPER = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

/** "17-Apr-2026 12:00 AM" — matches the Rajasthan checkpost convention. */
export function fmtTaxDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  const dd  = String(dt.getUTCDate()).padStart(2, "0");
  const mon = MONTHS_SHORT[dt.getUTCMonth()];
  const yy  = dt.getUTCFullYear();
  return `${dd}-${mon}-${yy} 12:00 AM`;
}

/** "17-APR-2026 02:08 PM" — used for "Payment Date" / "Receipt Printing Date".
 *  Always rendered in IST (UTC+5:30) regardless of server timezone. */
export function fmtPaymentDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  // Shift to IST (UTC+5:30 = +19800000 ms) then read as UTC so the result
  // is always India time, even when the server runs in UTC or another zone.
  const ist = new Date(dt.getTime() + 5.5 * 60 * 60 * 1000);
  const dd  = String(ist.getUTCDate()).padStart(2, "0");
  const mon = MONTHS_UPPER[ist.getUTCMonth()];
  const yy  = ist.getUTCFullYear();
  let hh    = ist.getUTCHours();
  const mm  = String(ist.getUTCMinutes()).padStart(2, "0");
  const ap  = hh >= 12 ? "PM" : "AM";
  hh        = hh % 12 || 12;
  return `${dd}-${mon}-${yy} ${String(hh).padStart(2, "0")}:${mm} ${ap}`;
}

// ── Number → words (Indian numbering, matches the PDF generator) ────────────
const ONES = ["","ONE","TWO","THREE","FOUR","FIVE","SIX","SEVEN","EIGHT","NINE",
  "TEN","ELEVEN","TWELVE","THIRTEEN","FOURTEEN","FIFTEEN","SIXTEEN","SEVENTEEN","EIGHTEEN","NINETEEN"];
const TENS = ["","","TWENTY","THIRTY","FORTY","FIFTY","SIXTY","SEVENTY","EIGHTY","NINETY"];

export function numberToWords(n: number): string {
  const num = Math.round(Math.abs(n));
  if (num === 0) return "ZERO";
  let r = num;
  let s = "";
  if (r >= 100000) { s += numberToWords(Math.floor(r / 100000)) + " LAKH "; r %= 100000; }
  if (r >= 1000)   { s += numberToWords(Math.floor(r / 1000))   + " THOUSAND "; r %= 1000; }
  if (r >= 100)    { s += ONES[Math.floor(r / 100)] + " HUNDRED "; r %= 100; if (r) s += "AND "; }
  if (r >= 20)     { s += TENS[Math.floor(r / 10)] + " "; r %= 10; }
  if (r > 0)       { s += ONES[r] + " "; }
  return s.trim();
}

// ── Public types ────────────────────────────────────────────────────────────
export interface TaxItem {
  particular: string;
  fees:  number;
  fine:  number;
  total: number;
}

export interface ReceiptData {
  registrationNo:  string;
  receiptNo:       string;
  paymentDate:     string;   // ISO — formatted by consumer when needed
  paymentDateText: string;   // pre-formatted "DD-MMM-YYYY HH:MM AM"
  ownerName:       string;   // already masked
  chassisNo:       string;   // already masked
  mobileNo:        string;   // already masked
  taxMode:         string;   // resolved label
  vehicleType:     string;   // resolved label
  vehicleClass:    string;   // resolved label
  permitType:      string;   // resolved label
  permitCategory:  string;
  checkpostName:   string;
  sleeperCap:      number;
  seatingCapacity: number;
  bankRefNo:       string;
  paymentMode:     string;
  serviceType:     string;
  qrUrl:           string;
  amount:          number;
  amountInWords:   string;
  taxItems:        TaxItem[];
}

// Loose Mongo doc shape — both lean()'d documents and POJOs work.
interface TxnLike {
  vehicleNo?: string;
  receiptNo?: string;
  ownerName?: string;
  chassisNo?: string;
  mobileNo?:  string;
  vehicleType?:    string;
  vehicleClass?:   string;
  permitType?:     string;
  taxMode?:        string;
  checkpostName?:  string;
  sleeperCap?:     number;
  seatingCap?:     number;
  orderRef?:       string;
  paymentMethod?:  string;
  amount?:         number;
  paidAt?:         Date | string | null;
  taxFrom?:        Date | string | null;
  taxTo?:          Date | string | null;
}

// ── Builder ─────────────────────────────────────────────────────────────────
export function buildReceiptData(txn: TxnLike): ReceiptData {
  const amount    = Number(txn.amount) || 0;
  // 15/16 split is the Rajasthan Motor-Vehicle-Tax + Surcharge convention.
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
