"use client";
import { Suspense, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { haryanaConfig } from "@/lib/states/haryana/config";

/**
 * Haryana checkpost border-tax collection form.
 *
 * Mirrors the GOVERNMENT OF HARYANA Department of Transport "Tax Payment
 * Details" page (Bord_TaxPayment.aspx) layout, fields, and dropdown options
 * exactly:
 *   1.  Vehicle No. + Get Details button
 *   2.  Chassis No. + Owner Name
 *   3.  Mobile No. + From State
 *   4.  Vehicle Type + Vehicle Category
 *   5.  Vehicle Class + Seating Capacity
 *   6.  Service Type + Distance(In KM)
 *   7.  Tax Mode + Border/Barrier District through Entering
 *   8.  Fitness Validity + Insurance Validity
 *   9.  PUCC Validity + Tax From Date + Tax Upto Date
 *  10.  (empty tax breakup table — populated server-side at receipt time)
 *  11.  Total Amount + Calculate Tax / Pay Tax / Reset
 *
 * The dropdown values are the exact strings the inspect HTML uses
 * (TRANSPORT, MOTOR CYCLE, AMBALA, …) so what the user picks is what gets
 * stored in Mongo and printed on the receipt.
 */

const STATE_CODE  = haryanaConfig.code;
const STATE_LABEL = haryanaConfig.label;

const BASE   = "https://checkpost.parivahan.gov.in";
const LOGO   = `${BASE}/checkpost/faces/javax.faces.resource/checkpost-logo.png?ln=images`;
const EVAHAN = `${BASE}/checkpost/faces/javax.faces.resource/e-vahan-logo.png?ln=images`;

// ── Dropdown option lists (taken verbatim from the inspect HTML) ──────────

const FROM_STATE_OPTIONS = [
  { value: "",   label: "---Select State---" },
  { value: "AN", label: "ANDAMAN & NICOBAR" },
  { value: "AP", label: "ANDHRA PRADESH" },
  { value: "AR", label: "ARUNACHAL PRADESH" },
  { value: "AS", label: "ASSAM" },
  { value: "BR", label: "BIHAR" },
  { value: "CH", label: "CHANDIGARH" },
  { value: "CG", label: "CHHATTISGARH" },
  { value: "DL", label: "DELHI" },
  { value: "GA", label: "GOA" },
  { value: "GJ", label: "GUJARAT" },
  { value: "HR", label: "HARYANA" },
  { value: "HP", label: "HIMACHAL PRADESH" },
  { value: "JK", label: "JAMMU & KASHMIR" },
  { value: "JH", label: "JHARKHAND" },
  { value: "KA", label: "KARNATAKA" },
  { value: "KL", label: "KERALA" },
  { value: "LD", label: "LAKSHADWEEP" },
  { value: "MP", label: "MADHYA PRADESH" },
  { value: "MH", label: "MAHARASHTRA" },
  { value: "MN", label: "MANIPUR" },
  { value: "ML", label: "MEGHALAYA" },
  { value: "MZ", label: "MIZORAM" },
  { value: "NL", label: "NAGALAND" },
  { value: "OR", label: "ODISHA" },
  { value: "PY", label: "PONDICHERRY" },
  { value: "PB", label: "PUNJAB" },
  { value: "RJ", label: "RAJASTHAN" },
  { value: "SK", label: "SIKKIM" },
  { value: "TN", label: "TAMIL NADU" },
  { value: "TS", label: "TELANGANA" },
  { value: "TR", label: "TRIPURA" },
  { value: "DD", label: "UT of DNH and DD" },
  { value: "UP", label: "UTTAR PRADESH" },
  { value: "WB", label: "WEST BENGAL" },
];

const VEHICLE_TYPE_OPTIONS = [
  { value: "",               label: "-- Select Vehicle Type --" },
  { value: "TRANSPORT",      label: "TRANSPORT" },
  { value: "NOT APPLICABLE", label: "NOT APPLICABLE" },
];

const VEHICLE_CATEGORY_OPTIONS = [
  { value: "", label: "-- Select Vehicle Category --" },
  { value: "CONTRACT CARRIAGE/PASSENGER   VEHICLES", label: "CONTRACT CARRIAGE/PASSENGER VEHICLES" },
  { value: "PRIVATE SERVICE VEHICLE",                 label: "PRIVATE SERVICE VEHICLE" },
  { value: "GOODS VEHICLE",                            label: "GOODS VEHICLE" },
  { value: "STAGE CARRIAGE",                           label: "STAGE CARRIAGE" },
  { value: "LIGHT PASSENGER VEHICLES",                 label: "LIGHT PASSENGER VEHICLES" },
  { value: "MEDIUM PASSENGER VEHICLES",                label: "MEDIUM PASSENGER VEHICLES" },
  { value: "HEAVY PASSENGER VEHICLES",                 label: "HEAVY PASSENGER VEHICLES" },
  { value: "CONSTRUCTION EQUIPMENT VEHICLE",           label: "CONSTRUCTION EQUIPMENT VEHICLE" },
  { value: "MEDIUM GOODS VEHICLE",                     label: "MEDIUM GOODS VEHICLE" },
  { value: "TEMPORARY REGISTERED VEHICLE",             label: "TEMPORARY REGISTERED VEHICLE" },
];

const VEHICLE_CLASS_OPTIONS = [
  { value: "", label: "-- Select Vehicle Class --" },
  { value: "MOTOR CYCLE",                    label: "MOTOR CYCLE" },
  { value: "THREE WHEELER(PASSENGER)",       label: "THREE WHEELER(PASSENGER)" },
  { value: "MOTOR CAB",                      label: "MOTOR CAB" },
  { value: "MAXI CAB",                       label: "MAXI CAB" },
  { value: "OMNI BUS",                       label: "OMNI BUS" },
  { value: "BUS",                            label: "BUS" },
  { value: "SLEEPER BUS",                    label: "SLEEPER BUS" },
  { value: "VOLVO OR MERECEDEZ ETC",         label: "VOLVO OR MERECEDEZ ETC" },
  { value: "EDUCATIONAL BUS",                label: "EDUCATIONAL BUS" },
  { value: "EDUCATIONAL BUS USED BY SCHOOL", label: "EDUCATIONAL BUS USED BY SCHOOL" },
  { value: "PRIVATE ORGANIZATIONS",          label: "PRIVATE ORGANIZATIONS" },
  { value: "CRANE MOUNTED VEHICLE",          label: "CRANE MOUNTED VEHICLE" },
  { value: "LIGHT GOODS VEHICLE",            label: "LIGHT GOODS VEHICLE" },
  { value: "MEDIUM GOODS VEHICLE",           label: "MEDIUM GOODS VEHICLE" },
  { value: "HEAVY GOODS VEHICLE",            label: "HEAVY GOODS VEHICLE" },
];

const SERVICE_TYPE_OPTIONS = [
  { value: "",                     label: "-- Select Service Type --" },
  { value: "NOT APPLICABLE",       label: "NOT APPLICABLE" },
  { value: "ORDINARY",             label: "ORDINARY" },
  { value: "AIR CONDITIONED",      label: "AIR CONDITIONED" },
  { value: "DELUXE AIR CONDITIONED", label: "DELUXE AIR CONDITIONED" },
];

const TAX_MODE_OPTIONS = [
  { value: "",          label: "---Select Payment Mode---" },
  { value: "DAYS",      label: "DAYS" },
  { value: "WEEKLY",    label: "WEEKLY" },
  { value: "FORTNIGHT", label: "FORTNIGHT" },
  { value: "MONTHLY",   label: "MONTHLY" },
  { value: "QUARTERLY", label: "QUARTERLY" },
  { value: "HALF YEARLY", label: "HALF YEARLY" },
  { value: "YEARLY",    label: "YEARLY" },
];

const BORDER_DISTRICT_OPTIONS = [
  { value: "",              label: "---Select District/Barrier---" },
  { value: "AMBALA",        label: "AMBALA" },
  { value: "BHIWANI",       label: "BHIWANI" },
  { value: "CHARKHI DADRI", label: "CHARKHI DADRI" },
  { value: "FARIDABAD",     label: "FARIDABAD" },
  { value: "FATEHABAD",     label: "FATEHABAD" },
  { value: "GURUGRAM",      label: "GURUGRAM" },
  { value: "HISAR",         label: "HISAR" },
  { value: "JHAJJAR",       label: "JHAJJAR" },
  { value: "JIND",          label: "JIND" },
  { value: "KAITHAL",       label: "KAITHAL" },
  { value: "KARNAL",        label: "KARNAL" },
  { value: "KURUKSHETRA",   label: "KURUKSHETRA" },
  { value: "MAHENDRAGARH",  label: "MAHENDRAGARH" },
  { value: "NUH",           label: "NUH" },
  { value: "PALWAL",        label: "PALWAL" },
  { value: "PANCHKULA",     label: "PANCHKULA" },
  { value: "PANIPAT",       label: "PANIPAT" },
  { value: "REWARI",        label: "REWARI" },
  { value: "ROHTAK",        label: "ROHTAK" },
  { value: "SIRSA",         label: "SIRSA" },
  { value: "SONIPAT",       label: "SONIPAT" },
  { value: "YAMUNA NAGAR",  label: "YAMUNA NAGAR" },
];

// ── IST timestamp ─────────────────────────────────────────────────────────
function nowIST(): string {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const dd  = String(ist.getUTCDate()).padStart(2, "0");
  const mon = MONTHS[ist.getUTCMonth()];
  const yy  = ist.getUTCFullYear();
  let   hh  = ist.getUTCHours();
  const mm  = String(ist.getUTCMinutes()).padStart(2, "0");
  const ss  = String(ist.getUTCSeconds()).padStart(2, "0");
  const ap  = hh >= 12 ? "PM" : "AM";
  hh = hh % 12 || 12;
  return `${dd}-${mon}-${yy} ${String(hh).padStart(2, "0")}:${mm}:${ss} ${ap}`;
}

// ── Shared picker accent colour ───────────────────────────────────────────
const TP_BLUE = "#1565C0";

// ── Combined date+time picker (calendar + scrollable time list) ───────────

const DT_MONTHS_LONG  = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DT_MONTHS_SHORT = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const DT_WEEK_DAYS    = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function parseDTString(s: string): { year: number; month: number; day: number; h24: number; min: number } | null {
  const m = s.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{2}):(\d{2})(?::\d{2})?\s+(AM|PM)$/i);
  if (!m) return null;
  const day   = parseInt(m[1]);
  const month = DT_MONTHS_SHORT.indexOf(m[2].toUpperCase());
  const year  = parseInt(m[3]);
  let   h     = parseInt(m[4]);
  const min   = parseInt(m[5]);
  const ap    = m[6].toUpperCase();
  if (month === -1) return null;
  if (ap === "AM" && h === 12) h = 0;
  else if (ap === "PM" && h !== 12) h += 12;
  return { year, month, day, h24: h, min };
}

function formatDTString(year: number, month: number, day: number, h24: number, min: number): string {
  const dd  = String(day).padStart(2, "0");
  const hh  = h24 % 12 || 12;
  const ap  = h24 < 12 ? "AM" : "PM";
  // No seconds field in the picker — default seconds to "04" for the receipt.
  return `${dd}-${DT_MONTHS_SHORT[month]}-${year} ${String(hh).padStart(2,"0")}:${String(min).padStart(2,"0")}:04 ${ap}`;
}

function DateTimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open,      setOpen]      = useState(false);
  const [viewYear,  setViewYear]  = useState(2026);
  const [viewMonth, setViewMonth] = useState(0);
  const [selYear,   setSelYear]   = useState(2026);
  const [selMonth,  setSelMonth]  = useState(0);
  const [selDay,    setSelDay]    = useState(1);
  const [selTime,   setSelTime]   = useState("00:00");
  const [pickMode,  setPickMode]  = useState<"day" | "year">("day");
  const dtListRef = useRef<HTMLDivElement>(null);

  const handleOpen = () => {
    let year: number, month: number, day: number, h24: number;
    const parsed = parseDTString(value);
    if (parsed) {
      ({ year, month, day, h24 } = parsed);
    } else {
      const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
      year  = ist.getUTCFullYear();
      month = ist.getUTCMonth();
      day   = ist.getUTCDate();
      h24   = ist.getUTCHours();
    }
    const slot = `${String(h24).padStart(2,"0")}:00`;
    setViewYear(year); setViewMonth(month);
    setSelYear(year);  setSelMonth(month); setSelDay(day); setSelTime(slot);
    setPickMode("day");
    setOpen(true);
    setTimeout(() => {
      const idx = HOUR_TIME_SLOTS.indexOf(slot);
      if (idx >= 0 && dtListRef.current) {
        dtListRef.current.scrollTop = Math.max(0, idx - 3) * TDP_ITEM_H;
      }
    }, 30);
  };

  const handleConfirm = () => {
    const [h] = selTime.split(":").map(Number);
    onChange(formatDTString(selYear, selMonth, selDay, h, 0));
    setOpen(false);
  };

  const prevMonth = () => { const d = new Date(viewYear, viewMonth - 1); setViewMonth(d.getMonth()); setViewYear(d.getFullYear()); };
  const nextMonth = () => { const d = new Date(viewYear, viewMonth + 1); setViewMonth(d.getMonth()); setViewYear(d.getFullYear()); };
  const prevYear  = () => setViewYear(y => y - 1);
  const nextYear  = () => setViewYear(y => y + 1);

  const numDays  = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= numDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        readOnly
        className="ui-inputtext cp-date-input"
        value={value || ""}
        placeholder="Auto (system time)"
        onClick={handleOpen}
        style={{ cursor: "pointer", caretColor: "transparent" }}
      />
      {open && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{ background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.3)", width: "440px", maxWidth: "94vw" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ background: TP_BLUE, color: "#fff", padding: "12px 18px", fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px" }}>
              SELECT DATE &amp; TIME
            </div>

            {/* Side-by-side body — fixed height so both columns match exactly */}
            <div style={{ display: "flex", alignItems: "stretch", height: "300px" }}>

              {/* Calendar — left */}
              <div style={{ flex: 1, borderRight: "1px solid #ddd", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", background: "#f4f4f4", gap: "2px", flexShrink: 0 }}>
                  <button type="button" onClick={pickMode === "year" ? () => setViewYear(y => y - 12) : prevYear}  title="Previous year" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", color: TP_BLUE, lineHeight: 1, padding: "2px 4px", fontWeight: 700 }}>«</button>
                  <button type="button" onClick={prevMonth} title="Previous month" disabled={pickMode === "year"} style={{ background: "none", border: "none", cursor: pickMode === "year" ? "default" : "pointer", fontSize: "20px", color: pickMode === "year" ? "#ccc" : TP_BLUE, lineHeight: 1, padding: "0 4px" }}>‹</button>
                  <span
                    onClick={() => setPickMode(m => m === "day" ? "year" : "day")}
                    title="Click to change year"
                    style={{ fontWeight: 700, fontSize: "12px", flex: 1, textAlign: "center", cursor: "pointer", userSelect: "none", padding: "3px 0", borderRadius: "4px" }}
                  >
                    {pickMode === "year" ? `${viewYear - 5} – ${viewYear + 6}` : `${DT_MONTHS_LONG[viewMonth]} ${viewYear} ▾`}
                  </span>
                  <button type="button" onClick={nextMonth} title="Next month" disabled={pickMode === "year"} style={{ background: "none", border: "none", cursor: pickMode === "year" ? "default" : "pointer", fontSize: "20px", color: pickMode === "year" ? "#ccc" : TP_BLUE, lineHeight: 1, padding: "0 4px" }}>›</button>
                  <button type="button" onClick={pickMode === "year" ? () => setViewYear(y => y + 12) : nextYear}  title="Next year" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", color: TP_BLUE, lineHeight: 1, padding: "2px 4px", fontWeight: 700 }}>»</button>
                </div>

                {pickMode === "year" ? (
                  /* Year grid */
                  <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", padding: "8px", background: "#f4f4f4", gap: "6px", alignContent: "start" }}>
                    {Array.from({ length: 12 }, (_, i) => viewYear - 5 + i).map(yr => {
                      const isSel = yr === selYear;
                      return (
                        <div
                          key={yr}
                          onClick={() => { setViewYear(yr); setPickMode("day"); }}
                          style={{
                            textAlign: "center", fontSize: "13px", cursor: "pointer",
                            borderRadius: "16px", padding: "8px 0",
                            background: isSel ? TP_BLUE : "transparent",
                            color: isSel ? "#fff" : "#222",
                            fontWeight: isSel ? 700 : 400,
                          }}
                        >
                          {yr}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "0 8px", background: "#f4f4f4", flexShrink: 0 }}>
                      {DT_WEEK_DAYS.map(d => (
                        <div key={d} style={{ textAlign: "center", fontSize: "10px", fontWeight: 600, color: "#888", padding: "3px 0" }}>{d}</div>
                      ))}
                    </div>
                    <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "4px 8px 10px", background: "#f4f4f4", gap: "2px", alignContent: "start" }}>
                      {cells.map((day, i) => {
                        const isSel = day !== null && day === selDay && viewMonth === selMonth && viewYear === selYear;
                        return (
                          <div
                            key={i}
                            onClick={() => { if (day) { setSelDay(day); setSelMonth(viewMonth); setSelYear(viewYear); } }}
                            style={{
                              textAlign: "center", fontSize: "12px", cursor: day ? "pointer" : "default",
                              borderRadius: "50%", background: isSel ? TP_BLUE : "transparent",
                              color: isSel ? "#fff" : day ? "#222" : "transparent",
                              fontWeight: isSel ? 700 : 400,
                              width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto",
                            }}
                          >
                            {day || ""}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Hourly time list — right, stretches to match calendar height */}
              <div style={{ width: "130px", display: "flex", flexDirection: "column", minHeight: 0 }}>
                <div style={{ padding: "8px 12px", background: "#f4f4f4", fontSize: "11px", fontWeight: 700, color: "#555", letterSpacing: "1px", borderBottom: "1px solid #ddd", flexShrink: 0 }}>
                  TIME
                </div>
                <div
                  ref={dtListRef}
                  style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain" }}
                >
                  {HOUR_TIME_SLOTS.map(slot => {
                    const isSel = slot === selTime;
                    return (
                      <div
                        key={slot}
                        onClick={() => setSelTime(slot)}
                        style={{
                          height: `${TDP_ITEM_H}px`, display: "flex", alignItems: "center",
                          paddingLeft: "16px", fontSize: "14px",
                          fontWeight: isSel ? 700 : 400,
                          background: isSel ? TP_BLUE : "#fff",
                          color: isSel ? "#fff" : "#222",
                          cursor: "pointer",
                        }}
                      >
                        {slot}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", padding: "10px 14px", borderTop: "1px solid #eee" }}>
              <button type="button" onClick={() => { onChange(""); setOpen(false); }} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Clear</button>
              <button type="button" onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Cancel</button>
              <button type="button" onClick={handleConfirm} style={{ background: TP_BLUE, border: "none", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 700, padding: "6px 14px", borderRadius: "6px" }}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tax date+time picker: calendar (left) + hourly list (right) ──────────

const HOUR_TIME_SLOTS: string[] = Array.from({ length: 24 }, (_, h) =>
  `${String(h).padStart(2, "0")}:00`
);
const TDP_ITEM_H = 40;

function TaxDateTimePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
  hasError,
}: {
  date:         string;
  time:         string;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  hasError?:    boolean;
}) {
  const [open,      setOpen]      = useState(false);
  const [viewYear,  setViewYear]  = useState(2026);
  const [viewMonth, setViewMonth] = useState(0);
  const [selYear,   setSelYear]   = useState(2026);
  const [selMonth,  setSelMonth]  = useState(0);
  const [selDay,    setSelDay]    = useState(1);
  const [selTime,   setSelTime]   = useState("00:00");
  const [pickMode,  setPickMode]  = useState<"day" | "year">("day");
  const tdpListRef = useRef<HTMLDivElement>(null);

  // "dd-mm-yyyy HH:MM" display
  let displayVal = "";
  if (date) {
    const p = date.split("-");
    if (p.length === 3) displayVal = `${p[2]}-${p[1]}-${p[0]} ${time || "00:00"}`;
  }

  const nearestHour = (hhmm: string): string => {
    const m = hhmm.match(/^(\d{1,2}):/);
    return m ? `${String(parseInt(m[1])).padStart(2, "0")}:00` : "00:00";
  };

  const handleOpen = () => {
    let year: number, month: number, day: number, slot: string;
    if (date) {
      const p = date.split("-");
      year  = parseInt(p[0]); month = parseInt(p[1]) - 1; day = parseInt(p[2]);
      slot  = nearestHour(time || "00:00");
    } else {
      const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
      year = ist.getUTCFullYear(); month = ist.getUTCMonth(); day = ist.getUTCDate();
      slot = `${String(ist.getUTCHours()).padStart(2, "0")}:00`;
    }
    setViewYear(year); setViewMonth(month);
    setSelYear(year); setSelMonth(month); setSelDay(day); setSelTime(slot);
    setPickMode("day");
    setOpen(true);
    setTimeout(() => {
      const idx = HOUR_TIME_SLOTS.indexOf(slot);
      if (idx >= 0 && tdpListRef.current) {
        tdpListRef.current.scrollTop = Math.max(0, idx - 3) * TDP_ITEM_H;
      }
    }, 30);
  };

  const handleConfirm = () => {
    const dateStr = `${selYear}-${String(selMonth + 1).padStart(2, "0")}-${String(selDay).padStart(2, "0")}`;
    onDateChange(dateStr);
    onTimeChange(selTime);
    setOpen(false);
  };

  const prevMonth = () => { const d = new Date(viewYear, viewMonth - 1); setViewMonth(d.getMonth()); setViewYear(d.getFullYear()); };
  const nextMonth = () => { const d = new Date(viewYear, viewMonth + 1); setViewMonth(d.getMonth()); setViewYear(d.getFullYear()); };
  const prevYear  = () => setViewYear(y => y - 1);
  const nextYear  = () => setViewYear(y => y + 1);

  const numDays  = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= numDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        readOnly
        className={`ui-inputtext cp-date-input${hasError ? " cp-date-error" : ""}`}
        value={displayVal}
        placeholder="dd-mm-yyyy HH:MM"
        onClick={handleOpen}
        style={{ cursor: "pointer", caretColor: "transparent" }}
      />
      {open && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{ background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.3)", width: "440px", maxWidth: "94vw" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ background: TP_BLUE, color: "#fff", padding: "12px 18px", fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px" }}>
              SELECT DATE &amp; TIME
            </div>

            {/* Side-by-side body — fixed height so both columns match exactly */}
            <div style={{ display: "flex", alignItems: "stretch", height: "300px" }}>

              {/* Calendar — left */}
              <div style={{ flex: 1, borderRight: "1px solid #ddd", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", background: "#f4f4f4", gap: "2px", flexShrink: 0 }}>
                  <button type="button" onClick={pickMode === "year" ? () => setViewYear(y => y - 12) : prevYear}  title="Previous year" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", color: TP_BLUE, lineHeight: 1, padding: "2px 4px", fontWeight: 700 }}>«</button>
                  <button type="button" onClick={prevMonth} title="Previous month" disabled={pickMode === "year"} style={{ background: "none", border: "none", cursor: pickMode === "year" ? "default" : "pointer", fontSize: "20px", color: pickMode === "year" ? "#ccc" : TP_BLUE, lineHeight: 1, padding: "0 4px" }}>‹</button>
                  <span
                    onClick={() => setPickMode(m => m === "day" ? "year" : "day")}
                    title="Click to change year"
                    style={{ fontWeight: 700, fontSize: "12px", flex: 1, textAlign: "center", cursor: "pointer", userSelect: "none", padding: "3px 0", borderRadius: "4px" }}
                  >
                    {pickMode === "year" ? `${viewYear - 5} – ${viewYear + 6}` : `${DT_MONTHS_LONG[viewMonth]} ${viewYear} ▾`}
                  </span>
                  <button type="button" onClick={nextMonth} title="Next month" disabled={pickMode === "year"} style={{ background: "none", border: "none", cursor: pickMode === "year" ? "default" : "pointer", fontSize: "20px", color: pickMode === "year" ? "#ccc" : TP_BLUE, lineHeight: 1, padding: "0 4px" }}>›</button>
                  <button type="button" onClick={pickMode === "year" ? () => setViewYear(y => y + 12) : nextYear}  title="Next year" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", color: TP_BLUE, lineHeight: 1, padding: "2px 4px", fontWeight: 700 }}>»</button>
                </div>

                {pickMode === "year" ? (
                  /* Year grid */
                  <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", padding: "8px", background: "#f4f4f4", gap: "6px", alignContent: "start" }}>
                    {Array.from({ length: 12 }, (_, i) => viewYear - 5 + i).map(yr => {
                      const isSel = yr === selYear;
                      return (
                        <div
                          key={yr}
                          onClick={() => { setViewYear(yr); setPickMode("day"); }}
                          style={{
                            textAlign: "center", fontSize: "13px", cursor: "pointer",
                            borderRadius: "16px", padding: "8px 0",
                            background: isSel ? TP_BLUE : "transparent",
                            color: isSel ? "#fff" : "#222",
                            fontWeight: isSel ? 700 : 400,
                          }}
                        >
                          {yr}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "0 8px", background: "#f4f4f4", flexShrink: 0 }}>
                      {DT_WEEK_DAYS.map(d => (
                        <div key={d} style={{ textAlign: "center", fontSize: "10px", fontWeight: 600, color: "#888", padding: "3px 0" }}>{d}</div>
                      ))}
                    </div>
                    <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "4px 8px 10px", background: "#f4f4f4", gap: "2px", alignContent: "start" }}>
                      {cells.map((day, i) => {
                        const isSel = day !== null && day === selDay && viewMonth === selMonth && viewYear === selYear;
                        return (
                          <div
                            key={i}
                            onClick={() => { if (day) { setSelDay(day); setSelMonth(viewMonth); setSelYear(viewYear); } }}
                            style={{
                              textAlign: "center", fontSize: "12px", cursor: day ? "pointer" : "default",
                              borderRadius: "50%", background: isSel ? TP_BLUE : "transparent",
                              color: isSel ? "#fff" : day ? "#222" : "transparent",
                              fontWeight: isSel ? 700 : 400,
                              width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto",
                            }}
                          >
                            {day || ""}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Hourly time list — right, stretches to match calendar height */}
              <div style={{ width: "130px", display: "flex", flexDirection: "column", minHeight: 0 }}>
                <div style={{ padding: "8px 12px", background: "#f4f4f4", fontSize: "11px", fontWeight: 700, color: "#555", letterSpacing: "1px", borderBottom: "1px solid #ddd", flexShrink: 0 }}>
                  TIME
                </div>
                <div
                  ref={tdpListRef}
                  style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain" }}
                >
                  {HOUR_TIME_SLOTS.map(slot => {
                    const isSel = slot === selTime;
                    return (
                      <div
                        key={slot}
                        onClick={() => setSelTime(slot)}
                        style={{
                          height: `${TDP_ITEM_H}px`, display: "flex", alignItems: "center",
                          paddingLeft: "16px", fontSize: "14px",
                          fontWeight: isSel ? 700 : 400,
                          background: isSel ? TP_BLUE : "#fff",
                          color: isSel ? "#fff" : "#222",
                          cursor: "pointer",
                        }}
                      >
                        {slot}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", padding: "10px 14px", borderTop: "1px solid #eee" }}>
              <button type="button" onClick={() => { onDateChange(""); onTimeChange("00:00"); setOpen(false); }} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Clear</button>
              <button type="button" onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Cancel</button>
              <button type="button" onClick={handleConfirm} style={{ background: TP_BLUE, border: "none", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 700, padding: "6px 14px", borderRadius: "6px" }}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

function TaxCollectionContent() {
  const stateCode  = STATE_CODE;
  const stateLabel = STATE_LABEL;

  // ── Form state (one piece per Haryana input) ───────────────────────────
  const [vehicleNo,         setVehicleNo]         = useState("");
  const [chassisNo,         setChassisNo]         = useState("");
  const [ownerName,         setOwnerName]         = useState("");
  const [mobileNo,          setMobileNo]          = useState("");
  const [fromState,         setFromState]         = useState("");
  const [vehicleType,       setVehicleType]       = useState("");
  const [vehicleCategory,   setVehicleCategory]   = useState("");
  const [vehicleClass,      setVehicleClass]      = useState("");
  const [seatingCap,        setSeatingCap]        = useState("");
  const [sleeperCap,        setSleeperCap]        = useState("0");
  const [grossVehicleWt,    setGrossVehicleWt]    = useState("");
  const [unladenWt,         setUnladenWt]         = useState("");
  const [serviceType,       setServiceType]       = useState("");
  const [distance,          setDistance]          = useState("");
  const [taxMode,           setTaxMode]           = useState("");
  const [borderDistrict,    setBorderDistrict]    = useState("");
  const [fitnessValidity,   setFitnessValidity]   = useState("");
  const [insuranceValidity, setInsuranceValidity] = useState("");
  const [puccValidity,      setPuccValidity]      = useState("");
  const [taxFrom,           setTaxFrom]           = useState("");
  const [taxFromTime,       setTaxFromTime]       = useState("00:00");
  const [taxTo,             setTaxTo]             = useState("");
  const [taxToTime,         setTaxToTime]         = useState("23:59");
  const [totalAmount,       setTotalAmount]       = useState("0");

  const [paymentInitDateInput, setPaymentInitDateInput] = useState("");
  const [paymentConfDateInput, setPaymentConfDateInput] = useState("");
  const [printedOnInput,       setPrintedOnInput]       = useState("");

  const [dateError,   setDateError]   = useState("");
  const [formError,   setFormError]   = useState("");
  const [showModal,   setShowModal]   = useState(false);
  const [pdfLoading,  setPdfLoading]  = useState(false);
  const [pdfError,    setPdfError]    = useState("");
  const [navOpen,     setNavOpen]     = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

  const router = useRouter();

  // ── Handlers ───────────────────────────────────────────────────────────

  const [detailsWarning, setDetailsWarning] = useState("");

  const handleGetDetails = async () => {
    setDetailsWarning("");
    if (!vehicleNo.trim()) return;
    try {
      const res = await fetch(`/api/vehicle/cache/${encodeURIComponent(vehicleNo.trim().toUpperCase().replace(/\s/g, ""))}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) { setDetailsWarning("VEHICLE DATA DOES NOT EXIST"); return; }
      const d = json.data;
      if (d.chassisNo)       setChassisNo(d.chassisNo);
      if (d.ownerName)       setOwnerName(d.ownerName);
      if (d.mobileNo)        setMobileNo(d.mobileNo);
      if (d.vehicleType)     setVehicleType(d.vehicleType);
      if (d.vehicleCategory) setVehicleCategory(d.vehicleCategory);
      if (d.vehicleClass)    setVehicleClass(d.vehicleClass);
      if (d.seatingCap)      setSeatingCap(d.seatingCap);
      if (d.sleeperCap)      setSleeperCap(d.sleeperCap);
      if (d.grossVehicleWt)  setGrossVehicleWt(d.grossVehicleWt);
      if (d.unladenWt)       setUnladenWt(d.unladenWt);
    } catch { setDetailsWarning("VEHICLE DATA DOES NOT EXIST"); }
  };

  const handleTaxFromChange = (val: string) => {
    setTaxFrom(val);
    if (taxTo && val && val > taxTo) {
      setDateError("Tax From Date cannot be after Tax Upto Date.");
    } else {
      setDateError("");
    }
  };

  const handleTaxToChange = (val: string) => {
    setTaxTo(val);
    if (taxFrom && val && taxFrom > val) {
      setDateError("Tax Upto Date cannot be before Tax From Date.");
    } else {
      setDateError("");
    }
  };

  const handlePayTax = () => {
    setFormError("");
    if (dateError) return;
    if (taxFrom && taxTo && taxFrom > taxTo) {
      setDateError("Tax From Date must be before Tax Upto Date.");
      return;
    }
    const missing: string[] = [];
    if (!vehicleNo.trim())                            missing.push("Vehicle No.");
    if (!taxFrom)                                     missing.push("Tax From Date");
    if (!taxTo)                                       missing.push("Tax Upto Date");
    if (!totalAmount || parseFloat(totalAmount) <= 0) missing.push("Total Amount");
    if (missing.length > 0) {
      setFormError(`Please fill the following before paying: ${missing.join(", ")}`);
      return;
    }
    setShowModal(true);
  };

  const handleConfirmPayment = () => {
    // Forward the exact text values the user picked — Mongo is the single
    // source of truth and the receipt template / PDF generator just print
    // whatever's saved, no code → label translation needed.
    const params = new URLSearchParams({
      state:             stateCode,
      vehicleNo,
      ownerName,
      chassisNo,
      mobileNo,
      fromState,
      vehicleType,
      vehicleCategory,
      vehicleClass,
      seatingCap,
      serviceType,
      distance,
      taxMode,
      borderDistrict,
      fitnessValidity,
      insuranceValidity,
      puccValidity,
      taxFrom,
      taxFromTime,
      taxTo,
      taxToTime,
      amount:          totalAmount || "0",
      paymentInitDate: paymentInitDateInput || nowIST(),
      paymentConfDate: paymentConfDateInput,
      printedOn:       printedOnInput,
    });
    router.push(`/payment/sbi?${params.toString()}`);
  };

  const handleReset = () => {
    setVehicleNo(""); setChassisNo(""); setOwnerName(""); setMobileNo("");
    setFromState(""); setVehicleType(""); setVehicleCategory(""); setVehicleClass("");
    setSeatingCap(""); setSleeperCap("0"); setGrossVehicleWt(""); setUnladenWt(""); setServiceType(""); setDistance(""); setTaxMode("");
    setBorderDistrict(""); setFitnessValidity(""); setInsuranceValidity(""); setPuccValidity("");
    setTaxFrom(""); setTaxFromTime("00:00"); setTaxTo(""); setTaxToTime("23:59"); setTotalAmount("0");
    setPaymentInitDateInput(""); setPaymentConfDateInput(""); setPrintedOnInput("");
    setDateError(""); setFormError(""); setShowModal(false); setPdfError("");
    setNavOpen(false); setReportsOpen(false);
  };

  const handleGetPdf = async () => {
    setPdfError("");
    if (dateError) return;
    const missing: string[] = [];
    if (!vehicleNo.trim()) missing.push("Registration No.");
    if (!taxFrom)          missing.push("Tax From Date");
    if (!taxTo)            missing.push("Tax Upto Date");
    if (missing.length > 0) { setPdfError(`Please fill the following before downloading: ${missing.join(", ")}`); return; }
    const d = new Date(); const yy = String(d.getFullYear()).slice(2); const mm = String(d.getMonth()+1).padStart(2,"0"); const dd2 = String(d.getDate()).padStart(2,"0");
    const receiptNo = `HRT${Date.now()}`;
    const transactionId = `TXN${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2,6).toUpperCase()}`;
    void yy; void mm; void dd2;
    setPdfLoading(true);
    try {
      const res = await fetch("/api/payment", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, state: stateCode, visitingState: stateCode, vehicleNo, chassisNo, ownerName, mobileNo, fromState, vehicleType, vehicleCategory, vehicleClass, seatingCap, serviceType, distance, taxMode, borderDistrict, fitnessValidity, insuranceValidity, puccValidity, taxFrom, taxFromTime, taxTo, taxToTime: taxToTime, amount: parseFloat(totalAmount)||0, receiptNo, orderRef: (() => { const f = [3,5,6,7][Math.floor(Math.random()*4)]; return `${f}${String(Math.floor(Math.random()*1000000000)).padStart(9,"0")}`; })(), noOfPeriods:1, sleeperCap, grossVehicleWt, unladenWt, paymentInitDate: paymentInitDateInput || nowIST(), paymentConfDate: paymentConfDateInput, printedOn: printedOnInput }) });
      const json = await res.json().catch(()=>({}));
      if (!res.ok || !json.success) throw new Error(json.message||"Failed to save transaction");
      const savedId = json.transactionId || transactionId;
      const link = document.createElement("a"); link.href=`/api/receipt/${savedId}?state=HR&download=1`; link.download=`receipt_${savedId}.pdf`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch(err) { setPdfError(err instanceof Error ? err.message : "PDF download failed."); }
    finally { setPdfLoading(false); }
  };

  const isGoodsVehicle = vehicleCategory === "GOODS VEHICLE";

  return (
    <div id="masterlaoyoutbody">

      {/* ── Top bar ── */}
      <div className="cp-topbar">
        <div className="container-fluid">
          <div className="cp-topbar-row">
            <div className="cp-topbar-marquee">
              <span className="cp-marquee-inner">
                Please pay tax in advance to avoid any last minute hassle.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                Select the service name carefully in case you select wrong service and pay the fee/tax, amount will not be refunded or adjusted.
              </span>
            </div>
            <ul className="cp-top-menu">
              <li><a href="https://vahan.parivahan.gov.in/" title="Home">🏠 Home</a></li>
              <li><a href="#skip-main-content">↓ Skip main content</a></li>
              <li><a href="#navbar">↓ Skip navigation</a></li>
              <li><a href="#">A<sup>+</sup></a></li>
              <li><a href="#">A</a></li>
              <li><a href="#">A<sup>-</sup></a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Header logos ── */}
      <div className="cp-header">
        <div className="container-fluid">
          <div className="cp-header-row">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO} className="cp-logo" alt="Check Post Logo"
                onError={(e) => { e.currentTarget.style.display = "none"; }} />
              <span className="cp-logo-fallback">CHECKPOST</span>
            </div>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={EVAHAN} className="cp-evahan-logo" alt="e-Vahan Logo"
                onError={(e) => { e.currentTarget.style.display = "none"; }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Navbar ── */}
      <nav className="cp-navbar" id="navbar">
        <div className="container-fluid">
          <div className="cp-navbar-inner">
            <button
              className="cp-nav-toggler"
              onClick={() => setNavOpen(!navOpen)}
              aria-label="Toggle navigation"
            >
              <i className="fa fa-bars"></i>
            </button>
            <div className={`cp-nav-collapse${navOpen ? " open" : ""}`}>
              <ul className="nav-list">
                <li>
                  <a href="https://parivahan.gov.in/" className="active">
                    <i className="fa fa-home"></i> Home
                  </a>
                </li>
                <li>
                  <a href={`${BASE}/checkpost/faces/public/payment/ChecklTransactionStatus.xhtml`}>
                    <i className="fa fa-user"></i> Check Pending Transaction
                  </a>
                </li>
                <li
                  className="cp-dropdown"
                  onMouseEnter={() => setReportsOpen(true)}
                  onMouseLeave={() => setReportsOpen(false)}
                >
                  <a href="#">
                    <i className="fa fa-print"></i> Reports ▾
                  </a>
                  {reportsOpen && (
                    <div className="cp-dropdown-menu">
                      <a href={`${BASE}/checkpost/faces/public/reports/PaymentReceipt.xhtml`}>
                        ▶ Print Payment Receipt
                      </a>
                      <a href={`${BASE}/checkpost/faces/public/reports/CheckReceiptDetails.xhtml`}>
                        ▶ Check Receipt Details
                      </a>
                    </div>
                  )}
                </li>
              </ul>
            </div>
            <a
              href={`${BASE}/checkpost/faces/admin/pages/login.xhtml`}
              className="login-btn"
            >
              Log In
            </a>
          </div>
        </div>
      </nav>

      {/* ── News ticker ── */}
      <div className="cp-news-bar">
        <div className="container-fluid cp-news-scroll-wrap">
          <div className="cp-news-scroll">
            Verify the validity of the receipt by sending sms&nbsp;
            <strong className="cp-news-highlight">VAHAN &lt;STATE CODE&gt; CP &lt;VEHICLE NO&gt;</strong>
            &nbsp;to 7738299899 (e.g.&nbsp;
            <strong className="cp-news-highlight">VAHAN XX CP XXXXXXXXXX</strong>)
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      <div className="container-fluid" id="skip-main-content">
        <div className="ui-grid ui-grid-responsive">

          {/* Back to state selection */}
          <div className="ui-grid-row" style={{ padding: "8px 0 0 8px" }}>
            <a href="/checkpost" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#1565C0", fontWeight: 600, fontSize: "14px", textDecoration: "none" }}>
              ← Back to State Selection
            </a>
          </div>

          {/* Page heading */}
          <div className="ui-grid-row top-space center-position contents-Space">
            <h1 className="header-main">
              <span style={{ color: haryanaConfig.themeColor, fontWeight: "bold" }}>
                BORDER TAX PAYMENT FOR ENTRY INTO
              </span>
              <span className="red"> {stateLabel || "STATE"}</span>
            </h1>
          </div>

          {/* ── Tax Payment Panel ── */}
          <div className="ui-grid-row top-space">
            <div className="ui-grid-col-1 resp-blank-height"></div>
            <div className="ui-grid-col-10">
              <div className="ui-panel">
                <div className="ui-panel-titlebar">Tax Payment Details</div>
                <div className="ui-panel-content">

                  {/* Row 1: Vehicle No. + Get Details */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Vehicle No.</label>
                      </div>
                      <input
                        type="text"
                        className="ui-inputtext"
                        maxLength={10}
                        value={vehicleNo}
                        onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                        autoComplete="off"
                        placeholder="e.g. HR14AB1234"
                      />
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="ui-grid-row">
                        <div className="ui-grid-col-12 top_mar1 mar-left5">
                          <button
                            className="ui-button"
                            type="button"
                            onClick={handleGetDetails}
                          >
                            <i className="ui-icon fa fa-arrow-down"></i>
                            <span className="ui-button-text">Get Details</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {detailsWarning && (
                    <div className="ui-grid-row">
                      <div className="ui-grid-col-12">
                        <div className="cp-date-err-msg">{detailsWarning}</div>
                      </div>
                    </div>
                  )}

                  {/* Row 2: Chassis No. + Owner Name */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Chassis No.</label>
                      </div>
                      <input
                        type="text"
                        className="ui-inputtext input-autofilled"
                        value={chassisNo}
                        onChange={(e) => setChassisNo(e.target.value.toUpperCase())}
                        maxLength={30}
                        autoComplete="off"
                      />
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Owner Name</label>
                      </div>
                      <input
                        type="text"
                        className="ui-inputtext input-autofilled"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value.toUpperCase())}
                        maxLength={50}
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  {/* Row 3: Mobile No. + From State */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Mobile No.</label>
                      </div>
                      <input
                        type="text"
                        className="ui-inputtext"
                        maxLength={10}
                        value={mobileNo}
                        onChange={(e) => setMobileNo(e.target.value)}
                        autoComplete="off"
                        placeholder="SMS about payment will be sent to this number."
                      />
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">From State</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select
                          value={fromState}
                          onChange={(e) => setFromState(e.target.value)}
                          autoComplete="off"
                        >
                          {FROM_STATE_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Vehicle Type + Vehicle Category */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Vehicle Type</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select
                          className="select-autofilled"
                          value={vehicleType}
                          onChange={(e) => setVehicleType(e.target.value)}
                        >
                          {VEHICLE_TYPE_OPTIONS.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Vehicle Category</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select
                          className="select-autofilled"
                          value={vehicleCategory}
                          onChange={(e) => setVehicleCategory(e.target.value)}
                        >
                          {VEHICLE_CATEGORY_OPTIONS.map((c) => (
                            <option key={c.label} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 5: Vehicle Class + Seating Capacity */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Vehicle Class</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select
                          className="select-autofilled"
                          value={vehicleClass}
                          onChange={(e) => setVehicleClass(e.target.value)}
                        >
                          {VEHICLE_CLASS_OPTIONS.map((v) => (
                            <option key={v.label} value={v.value}>{v.label}</option>
                          ))}
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">
                          {isGoodsVehicle ? "Gross Vehicle Wt (In Kg)" : "Seating Capacity"}
                        </label>
                      </div>
                      <input
                        type="text"
                        className="ui-inputtext input-autofilled"
                        value={isGoodsVehicle ? grossVehicleWt : seatingCap}
                        onChange={(e) => isGoodsVehicle
                          ? setGrossVehicleWt(e.target.value.replace(/\D/g, ""))
                          : setSeatingCap(e.target.value.replace(/\D/g, ""))}
                        maxLength={7}
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  {/* Row: [Sleeper Cap / Unladen Wt] */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">
                          {isGoodsVehicle ? "Unladen Wt (In Kg)" : "Sleeper Cap"}
                        </label>
                      </div>
                      <input
                        type="text"
                        className="ui-inputtext"
                        value={isGoodsVehicle ? unladenWt : sleeperCap}
                        onChange={(e) => isGoodsVehicle
                          ? setUnladenWt(e.target.value.replace(/\D/g, ""))
                          : setSleeperCap(e.target.value.replace(/\D/g, ""))}
                        maxLength={7}
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  {/* Row 6: Service Type + Distance */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Service Type</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select
                          value={serviceType}
                          onChange={(e) => setServiceType(e.target.value)}
                        >
                          {SERVICE_TYPE_OPTIONS.map((s) => (
                            <option key={s.label} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Distance(In KM)</label>
                      </div>
                      <input
                        type="text"
                        className="ui-inputtext"
                        value={distance}
                        onChange={(e) => setDistance(e.target.value.replace(/\D/g, ""))}
                        maxLength={5}
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  {/* Row 7: Tax Mode + Border District */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Tax Mode</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select
                          value={taxMode}
                          onChange={(e) => setTaxMode(e.target.value)}
                        >
                          {TAX_MODE_OPTIONS.map((t) => (
                            <option key={t.label} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Border/Barrier District through Entering</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select
                          value={borderDistrict}
                          onChange={(e) => setBorderDistrict(e.target.value)}
                        >
                          {BORDER_DISTRICT_OPTIONS.map((d) => (
                            <option key={d.label} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 8: Fitness Validity + Insurance Validity */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Fitness Validity</label>
                      </div>
                      <div className="ui-calendar">
                        <input
                          type="date"
                          className="ui-inputtext cp-date-input"
                          value={fitnessValidity}
                          onChange={(e) => setFitnessValidity(e.target.value)}
                          autoComplete="off"
                        />
                      </div>
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Insurance Validity</label>
                      </div>
                      <div className="ui-calendar">
                        <input
                          type="date"
                          className="ui-inputtext cp-date-input"
                          value={insuranceValidity}
                          onChange={(e) => setInsuranceValidity(e.target.value)}
                          autoComplete="off"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 9: PUCC Validity + Tax From + Tax Upto */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">PUCC Validity</label>
                      </div>
                      <div className="ui-calendar">
                        <input
                          type="date"
                          className="ui-inputtext cp-date-input"
                          value={puccValidity}
                          onChange={(e) => setPuccValidity(e.target.value)}
                          autoComplete="off"
                        />
                      </div>
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Tax From Date &amp; Time</label>
                      </div>
                      <TaxDateTimePicker
                        date={taxFrom}
                        time={taxFromTime}
                        onDateChange={handleTaxFromChange}
                        onTimeChange={setTaxFromTime}
                        hasError={!!(dateError && taxFrom && taxTo && taxFrom > taxTo)}
                      />
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Tax Upto Date &amp; Time</label>
                      </div>
                      <TaxDateTimePicker
                        date={taxTo}
                        time={taxToTime}
                        onDateChange={handleTaxToChange}
                        onTimeChange={setTaxToTime}
                        hasError={!!(dateError && taxFrom && taxTo && taxFrom > taxTo)}
                      />
                    </div>
                  </div>

                  {dateError && (
                    <div className="ui-grid-row">
                      <div className="ui-grid-col-12">
                        <div className="cp-date-err-msg">{dateError}</div>
                      </div>
                    </div>
                  )}

                  {/* Tax-breakup placeholder table — populated server-side */}
                  <br />
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-12">
                      <div className="ui-datatable">
                        <table role="grid">
                          <thead>
                            <tr>
                              <th className="collumn-width">Sl. No.</th>
                              <th>Particulars</th>
                              <th>Tax From</th>
                              <th>Tax Upto</th>
                              <th>Amount</th>
                            </tr>
                          </thead>
                          <tbody className="ui-datatable-data">
                            <tr className="ui-datatable-empty-message">
                              <td colSpan={5}>No records found.</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Payment date fields */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-4">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">Payment Init Date</label>
                      </div>
                      <DateTimePicker value={paymentInitDateInput} onChange={setPaymentInitDateInput} />
                    </div>
                    <div className="ui-grid-col-4">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">Payment Conf Date</label>
                      </div>
                      <DateTimePicker value={paymentConfDateInput} onChange={setPaymentConfDateInput} />
                    </div>
                    <div className="ui-grid-col-4">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">Printed On</label>
                      </div>
                      <DateTimePicker value={printedOnInput} onChange={setPrintedOnInput} />
                    </div>
                  </div>

                  {formError && (
                    <div className="ui-grid-row">
                      <div className="ui-grid-col-12">
                        <div className="cp-date-err-msg">{formError}</div>
                      </div>
                    </div>
                  )}

                  {/* Total Amount + action buttons */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Total Amount.</label>
                      </div>
                      <input
                        type="text"
                        className="ui-inputtext font-bold medium-text-font"
                        value={totalAmount}
                        onChange={(e) => { setTotalAmount(e.target.value.replace(/[^0-9.]/g, "")); setFormError(""); }}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Action buttons — single spaced row */}
                  <div className="ui-grid-row">
                    <div
                      className="ui-grid-col-12 top_mar1"
                      style={{ display: "flex", flexWrap: "wrap", gap: "14px", justifyContent: "center", marginTop: "16px" }}
                    >
                      <button className="ui-button" type="button">
                        <i className="fa fa-calculator"></i>
                        <span className="ui-button-text">Calculate Tax</span>
                      </button>
                      <button
                        className="ui-button"
                        type="button"
                        onClick={handlePayTax}
                      >
                        <i className="fa fa-forward"></i>
                        <span className="ui-button-text">Pay Tax</span>
                      </button>
                      <button
                        className="ui-button"
                        type="button"
                        onClick={handleReset}
                      >
                        <i className="fa fa-refresh"></i>
                        <span className="ui-button-text">Reset</span>
                      </button>
                      <button className="ui-button ui-button-pdf" type="button" onClick={handleGetPdf} disabled={pdfLoading}>
                        <i className={pdfLoading ? "fa fa-spinner fa-spin" : "fa fa-file-pdf-o"}></i>
                        <span className="ui-button-text">{pdfLoading ? "Generating..." : "Get PDF"}</span>
                      </button>
                    </div>
                  </div>
                  {pdfError && (<div className="ui-grid-row"><div className="ui-grid-col-12"><div className="cp-date-err-msg">{pdfError}</div></div></div>)}

                </div>
              </div>
            </div>
            <div className="ui-grid-col-1 resp-blank-height"></div>
          </div>

        </div>
      </div>

      {/* ── Confirmation Modal ── */}
      {showModal && (
        <div className="cp-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="cp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cp-modal-header">
              <span>Confirmation Message...</span>
              <button className="cp-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="cp-modal-body">
              <table className="datatable-panel-100">
                <tbody>
                  <tr>
                    <td><span className="small-text-font-bold">Registration No</span></td>
                    <td><span className="small-text-font-bold">:</span></td>
                    <td><span className="small-text-font-bold">{vehicleNo}</span></td>
                  </tr>
                  <tr>
                    <td><span className="small-text-font">Owner Name</span></td>
                    <td><span className="small-text-font">:</span></td>
                    <td><span className="small-text-font">{ownerName}</span></td>
                  </tr>
                  <tr>
                    <td><span className="small-text-font">Chassis Number</span></td>
                    <td><span className="small-text-font">:</span></td>
                    <td><span className="small-text-font">{chassisNo}</span></td>
                  </tr>
                  <tr>
                    <td><span className="small-text-font">Vehicle Category</span></td>
                    <td><span className="small-text-font">:</span></td>
                    <td><span className="small-text-font">{vehicleCategory}</span></td>
                  </tr>
                  <tr>
                    <td><span className="small-text-font">Tax From</span></td>
                    <td><span className="small-text-font">:</span></td>
                    <td><span className="small-text-font">{taxFrom}{taxFromTime ? ` ${taxFromTime}` : ""}</span></td>
                  </tr>
                  <tr>
                    <td><span className="small-text-font">Tax Upto</span></td>
                    <td><span className="small-text-font">:</span></td>
                    <td><span className="small-text-font">{taxTo}{taxToTime ? ` ${taxToTime}` : ""}</span></td>
                  </tr>
                  <tr>
                    <td><span className="small-text-font-bold">Amount</span></td>
                    <td><span className="small-text-font-bold">:</span></td>
                    <td><span className="small-text-font-bold">{totalAmount ? `${totalAmount}/-` : "/-"}</span></td>
                  </tr>
                  <tr>
                    <td><span className="small-text-font">Payment Mode</span></td>
                    <td><span className="small-text-font">:</span></td>
                    <td><span className="small-text-font">ONLINE</span></td>
                  </tr>
                </tbody>
              </table>
              <div className="ui-grid-row top-space bottom-space">
                <div className="ui-grid-col-12 center-position">
                  <button className="ui-button" type="button" onClick={handleConfirmPayment}>
                    <i className="fa fa-check"></i>
                    <span className="ui-button-text">Confirm</span>
                  </button>
                  <button className="ui-button" type="button" onClick={() => setShowModal(false)}>
                    <i className="fa fa-times"></i>
                    <span className="ui-button-text">Cancel</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function TaxCollectionForm() {
  return (
    <Suspense fallback={
      <div className="cp-loading-center">
        <div className="overlay-spinner cp-loading-spinner"></div>
      </div>
    }>
      <TaxCollectionContent />
    </Suspense>
  );
}
