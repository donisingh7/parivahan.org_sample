"use client";

/**
 * Shared date / date-time fields for every state's TaxCollectionForm.
 *
 *  • The box is a normal TYPEABLE text input.
 *  • Focusing/clicking opens an ANCHORED DROPDOWN right below the box (not a
 *    full-screen modal), so typing and picking work at the same time.
 *  • The dropdown is kept fully on-screen — it shifts left and/or opens
 *    upward when it would overflow the viewport — and has a Clear / OK footer.
 *  • Opening an EMPTY field pre-fills the current IST date & time.
 *
 * Two exports:
 *   - TaxDateField        → Tax From / Tax Upto. date ("yyyy-mm-dd") + optional
 *                           time ("HH:MM", HH + MM columns).
 *   - PaymentDateTimeField → Payment Init / Conf / Printed On. A single combined
 *                           value with HH + MM + SS columns, stored in the
 *                           canonical "dd-MMM-yyyy HH:MM:SS AM/PM" form the
 *                           receipt expects; the box shows 24h
 *                           "dd-mm-yyyy HH:MM:SS".
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const BLUE = "#1565C0";
const MONTHS_LONG  = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const WEEK_DAYS    = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const HOURS   = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, m) => String(m).padStart(2, "0"));
const SECONDS = Array.from({ length: 60 }, (_, s) => String(s).padStart(2, "0"));
const ITEM_H  = 34;
const BODY_H  = 248;

const pad = (n: number) => String(n).padStart(2, "0");
function istNow() {
  const d = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return { y: d.getUTCFullYear(), mo: d.getUTCMonth(), d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes(), s: d.getUTCSeconds() };
}

// The dropdown is rendered in a PORTAL to <body> with position:fixed, so no
// ancestor's `overflow:hidden`/width can clip it. Position is computed from the
// input's rect and clamped to the viewport (shift left, flip above) so the
// whole panel — including the Clear/OK footer — is always fully visible.
function useAnchoredPosition(open: boolean, rootRef: React.RefObject<HTMLDivElement | null>) {
  const dropRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<React.CSSProperties>({ position: "fixed", top: -9999, left: -9999, visibility: "hidden" });
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const root = rootRef.current, drop = dropRef.current;
      if (!root || !drop) return;
      const r  = root.getBoundingClientRect();
      const dw = drop.offsetWidth, dh = drop.offsetHeight;
      const vw = window.innerWidth, vh = window.innerHeight, M = 8;
      let left = r.left;
      if (left + dw > vw - M) left = vw - M - dw;
      if (left < M) left = M;
      let top = r.bottom + 4;
      if (top + dh > vh - M) {
        const above = r.top - 4 - dh;
        top = above >= M ? above : Math.max(M, vh - M - dh);
      }
      setPos({ position: "fixed", top, left, zIndex: 9999, visibility: "visible" });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => { window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); };
  }, [open, rootRef]);
  return { dropRef, pos };
}

// ── Calendar pane (shared) ────────────────────────────────────────────────
function CalendarPane({
  viewYear, viewMonth, setViewYear, setViewMonth, pickMode, setPickMode, sel, onPickDay,
}: {
  viewYear: number; viewMonth: number;
  setViewYear: (f: (y: number) => number) => void;
  setViewMonth: (m: number) => void;
  pickMode: "day" | "year"; setPickMode: (f: (m: "day" | "year") => "day" | "year") => void;
  sel: { y: number; m: number; d: number } | null;
  onPickDay: (day: number) => void;
}) {
  const prevMonth = () => { const d = new Date(viewYear, viewMonth - 1); setViewMonth(d.getMonth()); setViewYear(() => d.getFullYear()); };
  const nextMonth = () => { const d = new Date(viewYear, viewMonth + 1); setViewMonth(d.getMonth()); setViewYear(() => d.getFullYear()); };

  const numDays  = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let i = 1; i <= numDays; i++) cells.push(i);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{ width: "214px", display: "flex", flexDirection: "column", borderRight: "1px solid #eee" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 6px", background: "#f4f4f4", gap: "1px" }}>
        <button type="button" onClick={pickMode === "year" ? () => setViewYear((y) => y - 12) : () => setViewYear((y) => y - 1)} style={navBtn}>«</button>
        <button type="button" onClick={prevMonth} disabled={pickMode === "year"} style={{ ...navBtn, fontSize: "18px", color: pickMode === "year" ? "#ccc" : BLUE }}>‹</button>
        <span onClick={() => setPickMode((m) => (m === "day" ? "year" : "day"))} style={{ fontWeight: 700, fontSize: "11.5px", flex: 1, textAlign: "center", cursor: "pointer", userSelect: "none" }}>
          {pickMode === "year" ? `${viewYear - 5} – ${viewYear + 6}` : `${MONTHS_LONG[viewMonth]} ${viewYear} ▾`}
        </span>
        <button type="button" onClick={nextMonth} disabled={pickMode === "year"} style={{ ...navBtn, fontSize: "18px", color: pickMode === "year" ? "#ccc" : BLUE }}>›</button>
        <button type="button" onClick={pickMode === "year" ? () => setViewYear((y) => y + 12) : () => setViewYear((y) => y + 1)} style={navBtn}>»</button>
      </div>

      {pickMode === "year" ? (
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", padding: "8px", background: "#f4f4f4", gap: "6px", alignContent: "start" }}>
          {Array.from({ length: 12 }, (_, i) => viewYear - 5 + i).map((yr) => (
            <div key={yr} onClick={() => { setViewYear(() => yr); setPickMode(() => "day"); }}
              style={{ textAlign: "center", fontSize: "13px", cursor: "pointer", borderRadius: "14px", padding: "7px 0",
                background: sel && yr === sel.y ? BLUE : "transparent", color: sel && yr === sel.y ? "#fff" : "#222", fontWeight: sel && yr === sel.y ? 700 : 400 }}>
              {yr}
            </div>
          ))}
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "0 6px", background: "#f4f4f4" }}>
            {WEEK_DAYS.map((d) => <div key={d} style={{ textAlign: "center", fontSize: "10px", fontWeight: 600, color: "#888", padding: "3px 0" }}>{d}</div>)}
          </div>
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "4px 6px 8px", background: "#f4f4f4", gap: "1px", alignContent: "start" }}>
            {cells.map((d, i) => {
              const isSel = d !== null && sel !== null && d === sel.d && viewMonth === sel.m && viewYear === sel.y;
              return (
                <div key={i} onClick={() => d && onPickDay(d)}
                  style={{ textAlign: "center", fontSize: "12px", cursor: d ? "pointer" : "default", borderRadius: "50%",
                    background: isSel ? BLUE : "transparent", color: isSel ? "#fff" : d ? "#222" : "transparent",
                    fontWeight: isSel ? 700 : 400, width: "25px", height: "25px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                  {d || ""}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

const navBtn: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: BLUE, lineHeight: 1, padding: "2px 3px", fontWeight: 700 };

function TimeColumn({
  label, items, selected, onPick, listRef,
}: {
  label: string; items: string[]; selected: string; onPick: (v: string) => void;
  listRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div style={{ width: "50px", display: "flex", flexDirection: "column", borderLeft: "1px solid #eee" }}>
      <div style={{ padding: "6px 0", background: "#f4f4f4", fontSize: "10px", fontWeight: 700, color: "#555", letterSpacing: "1px", textAlign: "center", borderBottom: "1px solid #ddd" }}>{label}</div>
      <div ref={listRef} style={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain" }}>
        {items.map((it) => {
          const isSel = it === selected;
          return (
            <div key={it} onClick={() => onPick(it)}
              style={{ height: `${ITEM_H}px`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px",
                fontWeight: isSel ? 700 : 400, background: isSel ? BLUE : "#fff", color: isSel ? "#fff" : "#222", cursor: "pointer" }}>
              {it}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Footer({ onClear, onOk }: { onClear: () => void; onOk: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderTop: "1px solid #eee", background: "#fff" }}>
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onClear}
        style={{ background: "none", border: "none", color: "#c62828", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Clear</button>
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onOk}
        style={{ background: BLUE, border: "none", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 700, padding: "6px 18px", borderRadius: "6px" }}>OK</button>
    </div>
  );
}

const outerStyle: React.CSSProperties = {
  position: "absolute", zIndex: 9999,
  background: "#fff", border: "1px solid #ccc", borderRadius: "10px",
  boxShadow: "0 8px 28px rgba(0,0,0,0.22)", display: "flex", flexDirection: "column", overflow: "hidden",
};

// ══════════════════════════════════════════════════════════════════════════
// TaxDateField — Tax From / Tax Upto (date + optional HH:MM)
// ══════════════════════════════════════════════════════════════════════════

function taxDisplay(date: string, time: string | undefined, withTime: boolean): string {
  if (!date) return "";
  const p = date.split("-");
  if (p.length !== 3) return "";
  const d = `${p[2]}-${p[1]}-${p[0]}`;
  return withTime ? `${d} ${time || "00:00"}` : d;
}

function parseTaxTyped(str: string): { date: string; time: string | null } | null {
  const m = str.trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?$/);
  if (!m) return null;
  const dd = +m[1], mm = +m[2], yyyy = +m[3];
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const date = `${yyyy}-${pad(mm)}-${pad(dd)}`;
  let time: string | null = null;
  if (m[4] !== undefined && m[5] !== undefined) {
    const h = +m[4], mn = +m[5];
    if (h <= 23 && mn <= 59) time = `${pad(h)}:${pad(mn)}`;
  }
  return { date, time };
}

export function TaxDateField({
  date, onDateChange, time = "00:00", onTimeChange, withTime = false, hasError = false,
}: {
  date: string; onDateChange: (v: string) => void;
  time?: string; onTimeChange?: (v: string) => void;
  withTime?: boolean; hasError?: boolean;
}) {
  const [open, setOpen]       = useState(false);
  const [text, setText]       = useState(taxDisplay(date, time, withTime));
  const [viewYear, setViewYear]   = useState(2026);
  const [viewMonth, setViewMonth] = useState(0);
  const [pickMode, setPickMode]   = useState<"day" | "year">("day");
  const rootRef = useRef<HTMLDivElement>(null);
  const hhRef = useRef<HTMLDivElement>(null);
  const mmRef = useRef<HTMLDivElement>(null);
  const focused = useRef(false);
  const { dropRef, pos } = useAnchoredPosition(open, rootRef);

  const sel  = (() => { const p = date.split("-"); return p.length === 3 ? { y: +p[0], m: +p[1] - 1, d: +p[2] } : null; })();
  const curH = (time || "00:00").split(":")[0]?.padStart(2, "0") ?? "00";
  const curM = (time || "00:00").split(":")[1]?.padStart(2, "0") ?? "00";

  useEffect(() => { if (!focused.current) setText(taxDisplay(date, time, withTime)); }, [date, time, withTime]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { const t = e.target as Node; if (!rootRef.current?.contains(t) && !dropRef.current?.contains(t)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, dropRef]);

  const openDropdown = () => {
    let y: number, mo: number, h: string, mi: string;
    if (sel) { y = sel.y; mo = sel.m; h = curH; mi = curM; }
    else {
      const n = istNow(); y = n.y; mo = n.mo; h = pad(n.h); mi = pad(n.mi);
      onDateChange(`${n.y}-${pad(n.mo + 1)}-${pad(n.d)}`);
      if (withTime && onTimeChange) onTimeChange(`${pad(n.h)}:${pad(n.mi)}`);
      setText(`${pad(n.d)}-${pad(n.mo + 1)}-${n.y}${withTime ? ` ${pad(n.h)}:${pad(n.mi)}` : ""}`);
    }
    setViewYear(() => y); setViewMonth(mo); setPickMode(() => "day"); setOpen(true);
    if (withTime) setTimeout(() => {
      if (hhRef.current) hhRef.current.scrollTop = Math.max(0, HOURS.indexOf(h) - 2) * ITEM_H;
      if (mmRef.current) mmRef.current.scrollTop = Math.max(0, MINUTES.indexOf(mi) - 2) * ITEM_H;
    }, 20);
  };

  const handleType = (val: string) => {
    setText(val);
    const parsed = parseTaxTyped(val);
    if (parsed) { onDateChange(parsed.date); if (withTime && parsed.time && onTimeChange) onTimeChange(parsed.time); }
    else if (val.trim() === "") onDateChange("");
  };

  const pickDay = (d: number) => onDateChange(`${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`);
  const clear = () => { onDateChange(""); if (onTimeChange) onTimeChange(withTime ? "00:00" : time); setText(""); setOpen(false); };

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <input
        type="text"
        className={`ui-inputtext cp-date-input${hasError ? " cp-date-error" : ""}`}
        value={text}
        placeholder={withTime ? "dd-mm-yyyy HH:MM" : "dd-mm-yyyy"}
        onFocus={() => { focused.current = true; openDropdown(); }}
        onBlur={() => { focused.current = false; setText(taxDisplay(date, time, withTime)); }}
        onChange={(e) => handleType(e.target.value)}
        autoComplete="off"
      />
      {open && createPortal(
        <div ref={dropRef} style={{ ...outerStyle, ...pos }} onMouseDown={(e) => e.preventDefault()}>
          <div style={{ display: "flex", height: `${BODY_H}px` }}>
            <CalendarPane
              viewYear={viewYear} viewMonth={viewMonth} setViewYear={setViewYear} setViewMonth={setViewMonth}
              pickMode={pickMode} setPickMode={setPickMode} sel={sel} onPickDay={pickDay}
            />
            {withTime && (
              <>
                <TimeColumn label="HH" items={HOURS}   selected={curH} listRef={hhRef} onPick={(h) => onTimeChange && onTimeChange(`${h}:${curM}`)} />
                <TimeColumn label="MM" items={MINUTES} selected={curM} listRef={mmRef} onPick={(m) => onTimeChange && onTimeChange(`${curH}:${m}`)} />
              </>
            )}
          </div>
          <Footer onClear={clear} onOk={() => setOpen(false)} />
        </div>,
        document.body
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PaymentDateTimeField — Payment Init / Conf / Printed On (date + HH:MM:SS)
// ══════════════════════════════════════════════════════════════════════════

type DTParts = { y: number; mo: number; d: number; h: number; mi: number; s: number };

function parseCanonical(v: string): DTParts | null {
  const m = v.trim().match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)$/i);
  if (!m) return null;
  const mo = MONTHS_SHORT.indexOf(m[2].toUpperCase());
  if (mo === -1) return null;
  let h = +m[4];
  const ap = m[7].toUpperCase();
  if (ap === "AM" && h === 12) h = 0; else if (ap === "PM" && h !== 12) h += 12;
  return { y: +m[3], mo, d: +m[1], h, mi: +m[5], s: +m[6] };
}

function parsePayTyped(str: string): DTParts | null {
  const m = str.trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/);
  if (!m) return null;
  const d = +m[1], mo = +m[2] - 1, y = +m[3], h = +m[4], mi = +m[5], s = +m[6];
  if (mo < 0 || mo > 11 || d < 1 || d > 31 || h > 23 || mi > 59 || s > 59) return null;
  return { y, mo, d, h, mi, s };
}

function toCanonical(p: DTParts): string {
  const h12 = p.h % 12 || 12;
  const ap  = p.h < 12 ? "AM" : "PM";
  return `${pad(p.d)}-${MONTHS_SHORT[p.mo]}-${p.y} ${pad(h12)}:${pad(p.mi)}:${pad(p.s)} ${ap}`;
}
function payDisplay(v: string): string {
  const p = parseCanonical(v);
  return p ? `${pad(p.d)}-${pad(p.mo + 1)}-${p.y} ${pad(p.h)}:${pad(p.mi)}:${pad(p.s)}` : "";
}

export function PaymentDateTimeField({
  value, onChange, hasError = false,
}: {
  value: string; onChange: (v: string) => void; hasError?: boolean;
}) {
  const [open, setOpen]       = useState(false);
  const [text, setText]       = useState(payDisplay(value));
  const [viewYear, setViewYear]   = useState(2026);
  const [viewMonth, setViewMonth] = useState(0);
  const [pickMode, setPickMode]   = useState<"day" | "year">("day");
  const rootRef = useRef<HTMLDivElement>(null);
  const hhRef = useRef<HTMLDivElement>(null);
  const mmRef = useRef<HTMLDivElement>(null);
  const ssRef = useRef<HTMLDivElement>(null);
  const focused = useRef(false);
  const { dropRef, pos } = useAnchoredPosition(open, rootRef);

  const parts = parseCanonical(value);
  const sel  = parts ? { y: parts.y, m: parts.mo, d: parts.d } : null;
  const curH = pad(parts?.h ?? 0);
  const curM = pad(parts?.mi ?? 0);
  const curS = pad(parts?.s ?? 0);

  useEffect(() => { if (!focused.current) setText(payDisplay(value)); }, [value]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { const t = e.target as Node; if (!rootRef.current?.contains(t) && !dropRef.current?.contains(t)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, dropRef]);

  const emit = (p: DTParts) => onChange(toCanonical(p));

  const openDropdown = () => {
    let base: DTParts;
    if (parts) base = parts;
    else {
      base = istNow(); emit(base);
      setText(`${pad(base.d)}-${pad(base.mo + 1)}-${base.y} ${pad(base.h)}:${pad(base.mi)}:${pad(base.s)}`);
    }
    setViewYear(() => base.y); setViewMonth(base.mo); setPickMode(() => "day"); setOpen(true);
    setTimeout(() => {
      if (hhRef.current) hhRef.current.scrollTop = Math.max(0, HOURS.indexOf(pad(base.h))   - 2) * ITEM_H;
      if (mmRef.current) mmRef.current.scrollTop = Math.max(0, MINUTES.indexOf(pad(base.mi)) - 2) * ITEM_H;
      if (ssRef.current) ssRef.current.scrollTop = Math.max(0, SECONDS.indexOf(pad(base.s))  - 2) * ITEM_H;
    }, 20);
  };

  const cur = (): DTParts => parts ?? istNow();
  const handleType = (val: string) => {
    setText(val);
    const p = parsePayTyped(val);
    if (p) emit(p);
    else if (val.trim() === "") onChange("");
  };
  const pickDay = (d: number) => { const c = cur(); emit({ ...c, y: viewYear, mo: viewMonth, d }); };
  const clear = () => { onChange(""); setText(""); setOpen(false); };

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <input
        type="text"
        className={`ui-inputtext cp-date-input${hasError ? " cp-date-error" : ""}`}
        value={text}
        placeholder="dd-mm-yyyy HH:MM:SS (auto = now)"
        onFocus={() => { focused.current = true; openDropdown(); }}
        onBlur={() => { focused.current = false; setText(payDisplay(value)); }}
        onChange={(e) => handleType(e.target.value)}
        autoComplete="off"
      />
      {open && createPortal(
        <div ref={dropRef} style={{ ...outerStyle, ...pos }} onMouseDown={(e) => e.preventDefault()}>
          <div style={{ display: "flex", height: `${BODY_H}px` }}>
            <CalendarPane
              viewYear={viewYear} viewMonth={viewMonth} setViewYear={setViewYear} setViewMonth={setViewMonth}
              pickMode={pickMode} setPickMode={setPickMode} sel={sel} onPickDay={pickDay}
            />
            <TimeColumn label="HH" items={HOURS}   selected={curH} listRef={hhRef} onPick={(h) => emit({ ...cur(), h: +h })} />
            <TimeColumn label="MM" items={MINUTES} selected={curM} listRef={mmRef} onPick={(m) => emit({ ...cur(), mi: +m })} />
            <TimeColumn label="SS" items={SECONDS} selected={curS} listRef={ssRef} onPick={(s) => emit({ ...cur(), s: +s })} />
          </div>
          <Footer onClear={clear} onOk={() => setOpen(false)} />
        </div>,
        document.body
      )}
    </div>
  );
}
