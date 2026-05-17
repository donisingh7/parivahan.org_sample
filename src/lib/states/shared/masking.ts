/**
 * Masking helpers — parity with the parivahan production receipt where most
 * personal fields show as "F**N", chassis numbers expose only the prefix, and
 * mobile numbers expose only the first five and last digit.
 *
 * Shared across every state's buildReceiptData so the masking convention can
 * never accidentally diverge between state receipt designs.
 */

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

// ── Date formatting helpers (kept here so they're shared too) ───────────────
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_UPPER = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

/**
 * "17-Apr-2026" — date-only. Used in the MV Tax row's "(from TO to)" range,
 * where the checkpost receipt only shows the date (the tax window is always
 * day-aligned so a time component would be misleading).
 */
export function fmtTaxDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  const dd  = String(dt.getUTCDate()).padStart(2, "0");
  const mon = MONTHS_SHORT[dt.getUTCMonth()];
  const yy  = dt.getUTCFullYear();
  return `${dd}-${mon}-${yy}`;
}

/** "17-APR-2026 02:08 PM" — used for "Payment Date" / "Receipt Printing Date". */
export function fmtPaymentDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  const dd  = String(dt.getDate()).padStart(2, "0");
  const mon = MONTHS_UPPER[dt.getMonth()];
  const yy  = dt.getFullYear();
  let hh = dt.getHours();
  const mm = String(dt.getMinutes()).padStart(2, "0");
  const ap = hh >= 12 ? "PM" : "AM";
  hh = hh % 12 || 12;
  return `${dd}-${mon}-${yy} ${String(hh).padStart(2, "0")}:${mm} ${ap}`;
}

// ── Field-code → label resolvers ────────────────────────────────────────────
//
// Lookup tables are kept here so all states share the same vehicle-type /
// vehicle-class / permit-type code conventions today. Per-state divergence
// can move into the state's own buildReceiptData when needed.

export const VEHICLE_TYPE_LABELS: Record<string, string> = {
  "1": "CONTRACT CARRIAGE/PASSENGER VEHICLES",
  "3": "GOODS VEHICLE",
  "7": "TEMPORARY REGISTERED VEHICLES",
  "9": "CONSTRUCTION EQUIPMENT VEHICLE",
};

export const VEHICLE_CLASS_LABELS: Record<string, string> = {
  "1": "MOTOR CAB",
  "2": "MAXI CAB",
  "3": "BUS",
  "4": "GOODS VEHICLE (LMV)",
  "5": "GOODS VEHICLE (HGV)",
  "6": "TRACTOR",
  "7": "ARTICULATED VEHICLE",
};

export const PERMIT_TYPE_LABELS: Record<string, string> = {
  "1": "AITP",
  "2": "NATIONAL PERMIT",
  "3": "SPECIAL PERMIT",
  "4": "CONTRACT CARRIAGE PERMIT",
  "-1": "NOT APPLICABLE",
  "":   "NOT APPLICABLE",
};

export const TAX_MODE_LABELS: Record<string, string> = {
  "1":  "ONLINE",
  "2":  "CASH",
  "-1": "DAYS",
  "":   "DAYS",
};

export function resolveLabel(table: Record<string, string>, value: string): string {
  if (!value) return table[""] ?? "—";
  if (Object.prototype.hasOwnProperty.call(table, value)) return table[value];
  return value;
}
