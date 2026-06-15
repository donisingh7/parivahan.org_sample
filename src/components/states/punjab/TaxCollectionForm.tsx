"use client";
import { Suspense, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { punjabConfig } from "@/lib/states/punjab/config";

/**
 * Punjab checkpost border-tax collection form.
 *
 * Mirrors the GOVERNMENT OF PUNJAB Department of Transport "Tax Payment
 * Details" page (pb_dashboards.aspx) layout, fields, and dropdown options
 * exactly:
 *   1.  Vehicle No. + Get Details button
 *   2.  Chassis No. + Owner Name
 *   3.  Mobile No. + From State
 *   4.  Vehicle Type + Vehicle Category + Vehicle Class
 *   5.  Seating Capacity + Service Type + Tax Mode
 *   6.  Border/Barrier District + Checkpost Name + Tax From Date + Tax Upto Date
 *   7.  (empty tax breakup table — populated server-side at receipt time)
 *   8.  Total Amount + User Charge + Infra Cess
 *       + Calculate Tax / Pay Tax / Reset
 *
 * The dropdown values are the exact strings the inspect HTML uses
 * (TRANSPORT, MOTOR CYCLE, FAZILKA, …) so what the user picks is what gets
 * stored in Mongo and printed on the receipt.
 */

const STATE_CODE  = punjabConfig.code;
const STATE_LABEL = punjabConfig.label;

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
  { value: "",                                          label: "-- Select Vehicle Category --" },
  { value: "CONTRACT CARRIAGE/PASSENGER   VEHICLES",     label: "CONTRACT CARRIAGE/PASSENGER VEHICLES" },
  { value: "PRIVATE SERVICE VEHICLE",                    label: "PRIVATE SERVICE VEHICLE" },
  { value: "GOODS VEHICLE",                              label: "GOODS VEHICLE" },
  { value: "STAGE CARRIAGE",                             label: "STAGE CARRIAGE" },
  { value: "LIGHT PASSENGER VEHICLES",                   label: "LIGHT PASSENGER VEHICLES" },
  { value: "MEDIUM PASSENGER VEHICLES",                  label: "MEDIUM PASSENGER VEHICLES" },
  { value: "HEAVY PASSENGER VEHICLES",                   label: "HEAVY PASSENGER VEHICLES" },
  { value: "CONSTRUCTION EQUIPMENT VEHICLE",             label: "CONSTRUCTION EQUIPMENT VEHICLE" },
  { value: "MEDIUM GOODS VEHICLE",                       label: "MEDIUM GOODS VEHICLE" },
  { value: "TEMPORARY REGISTERED VEHICLE",               label: "TEMPORARY REGISTERED VEHICLE" },
];

const VEHICLE_CLASS_OPTIONS = [
  { value: "",                               label: "-- Select Vehicle Class --" },
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
  { value: "",                       label: "-- Select Service Type --" },
  { value: "NOT APPLICABLE",         label: "NOT APPLICABLE" },
  { value: "ORDINARY",               label: "ORDINARY" },
  { value: "AIR CONDITIONED",        label: "AIR CONDITIONED" },
  { value: "DELUXE AIR CONDITIONED", label: "DELUXE AIR CONDITIONED" },
];

const TAX_MODE_OPTIONS = [
  { value: "",            label: "---Select Payment Mode---" },
  { value: "DAYS",        label: "DAYS" },
  { value: "WEEKLY",      label: "WEEKLY" },
  { value: "FORTNIGHT",   label: "FORTNIGHT" },
  { value: "MONTHLY",     label: "MONTHLY" },
  { value: "QUARTERLY",   label: "QUARTERLY" },
  { value: "HALF YEARLY", label: "HALF YEARLY" },
  { value: "YEARLY",      label: "YEARLY" },
];

// Punjab's nine border-district options (inspect HTML lines 1646-1656).
const BORDER_DISTRICT_OPTIONS = [
  { value: "",          label: "---Select District/Barrier---" },
  { value: "BATHINDA",  label: "BATHINDA" },
  { value: "FAZILKA",   label: "FAZILKA" },
  { value: "MOHALI",    label: "MOHALI" },
  { value: "MUKTSAR",   label: "MUKTSAR" },
  { value: "FATEHABAD", label: "FATEHABAD" },
  { value: "PATHANKOT", label: "PATHANKOT" },
  { value: "PATIALA",   label: "PATIALA" },
  { value: "RUPNAGAR",  label: "RUPNAGAR" },
  { value: "SANGRUR",   label: "SANGRUR" },
];

// Punjab's ten checkpost-name options (inspect HTML lines 1666-1677).
const CHECKPOST_OPTIONS = [
  { value: "",             label: "---Select Checkpost Name---" },
  { value: "DOOMWALI",     label: "DOOMWALI" },
  { value: "GUMJAL",       label: "GUMJAL" },
  { value: "RAJPURA",      label: "RAJPURA" },
  { value: "JHARMARI",     label: "JHARMARI" },
  { value: "KHARAR",       label: "KHARAR" },
  { value: "KILLIAN WALI", label: "KILLIAN WALI" },
  { value: "MADHO PUR",    label: "MADHO PUR" },
  { value: "SHAMBU",       label: "SHAMBU" },
  { value: "GHANOULI",     label: "GHANOULI" },
  { value: "MOONAK",       label: "MOONAK" },
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
  const ap  = hh >= 12 ? "PM" : "AM";
  hh = hh % 12 || 12;
  return `${dd}-${mon}-${yy} ${String(hh).padStart(2, "0")}:${mm} ${ap}`;
}

// ── Circular clock picker ─────────────────────────────────────────────────

const CLOCK_SIZE   = 240;
const CLOCK_CX     = 120;
const CLOCK_CY     = 120;
const CLOCK_R      = 88;
const CLOCK_ACCENT = "#e65c00";

function clockPos(slot: number, total: number) {
  const angle = (slot / total) * 2 * Math.PI - Math.PI / 2;
  return { x: CLOCK_CX + CLOCK_R * Math.cos(angle), y: CLOCK_CY + CLOCK_R * Math.sin(angle) };
}

function to24h(h: number, ampm: "AM" | "PM"): number {
  if (ampm === "AM") return h === 12 ? 0 : h;
  return h === 12 ? 12 : h + 12;
}

function from24h(h24: number): { h: number; ampm: "AM" | "PM" } {
  if (h24 === 0)   return { h: 12, ampm: "AM" };
  if (h24 < 12)   return { h: h24, ampm: "AM" };
  if (h24 === 12)  return { h: 12, ampm: "PM" };
  return { h: h24 - 12, ampm: "PM" };
}

const HOUR_SLOTS   = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTE_SLOTS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function ClockPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open,   setOpen]   = useState(false);
  const [mode,   setMode]   = useState<"hour" | "minute">("hour");
  const [hour,   setHour]   = useState(12);
  const [minute, setMinute] = useState(0);
  const [ampm,   setAmpm]   = useState<"AM" | "PM">("AM");

  const handleOpen = () => {
    const m    = value.match(/^(\d{1,2}):(\d{2})$/);
    const h24  = m ? parseInt(m[1]) : 0;
    const min  = m ? Math.round(parseInt(m[2]) / 5) * 5 % 60 : 0;
    const { h, ampm: ap } = from24h(h24);
    setHour(h); setMinute(min); setAmpm(ap); setMode("hour");
    setOpen(true);
  };

  const handleClockClick = (e: MouseEvent<SVGSVGElement>) => {
    const rect  = e.currentTarget.getBoundingClientRect();
    const px    = e.clientX - rect.left  - CLOCK_CX;
    const py    = e.clientY - rect.top   - CLOCK_CY;
    let   angle = Math.atan2(py, px) * (180 / Math.PI) + 90;
    if (angle < 0)    angle += 360;
    if (angle >= 360) angle -= 360;
    if (mode === "hour") {
      const raw = Math.round(angle / 30) % 12;
      setHour(raw === 0 ? 12 : raw);
      setMode("minute");
    } else {
      const snapped = Math.round(Math.round(angle / 6) % 60 / 5) * 5 % 60;
      setMinute(snapped);
    }
  };

  const handleSet = () => {
    const h24 = to24h(hour, ampm);
    onChange(`${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    setOpen(false);
  };

  const selPos = mode === "hour" ? clockPos(HOUR_SLOTS.indexOf(hour), 12) : clockPos(minute / 5, 12);

  return (
    <div style={{ position: "relative" }}>
      <input type="text" readOnly className="ui-inputtext cp-date-input" value={value || "--:--"}
        onClick={handleOpen} style={{ cursor: "pointer", caretColor: "transparent" }} />
      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)" }}
          onClick={() => setOpen(false)}>
          <div style={{ background: "#fff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.3)", width: "292px" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ background: CLOCK_ACCENT, color: "#fff", padding: "18px 22px 14px" }}>
              <div style={{ fontSize: "10px", letterSpacing: "1.5px", opacity: 0.82, marginBottom: "4px" }}>SELECT TIME</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
                <div style={{ fontSize: "46px", fontWeight: 300, lineHeight: 1, letterSpacing: "1px" }}>
                  <span style={{ cursor: "pointer", opacity: mode === "hour"   ? 1 : 0.6, borderBottom: mode === "hour"   ? "2px solid #fff" : "none" }} onClick={() => setMode("hour")}>{String(hour).padStart(2, "0")}</span>
                  <span style={{ opacity: 0.75 }}>:</span>
                  <span style={{ cursor: "pointer", opacity: mode === "minute" ? 1 : 0.6, borderBottom: mode === "minute" ? "2px solid #fff" : "none" }} onClick={() => setMode("minute")}>{String(minute).padStart(2, "0")}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginBottom: "7px", fontSize: "13px", fontWeight: 600 }}>
                  {(["AM", "PM"] as const).map((ap) => (
                    <span key={ap} style={{ cursor: "pointer", opacity: ampm === ap ? 1 : 0.55, padding: "1px 5px", borderRadius: "3px", background: ampm === ap ? "rgba(255,255,255,0.25)" : "transparent" }} onClick={() => setAmpm(ap)}>{ap}</span>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", padding: "14px 8px 6px", background: "#f7f7f7" }}>
              <svg width={CLOCK_SIZE} height={CLOCK_SIZE} onClick={handleClockClick} style={{ cursor: "crosshair", display: "block" }}>
                <circle cx={CLOCK_CX} cy={CLOCK_CY} r={110} fill="#e0e0e0" />
                <circle cx={CLOCK_CX} cy={CLOCK_CY} r={106} fill="#eeeeee" />
                <line x1={CLOCK_CX} y1={CLOCK_CY} x2={selPos.x} y2={selPos.y} stroke={CLOCK_ACCENT} strokeWidth={2} />
                <circle cx={CLOCK_CX} cy={CLOCK_CY} r={4} fill={CLOCK_ACCENT} />
                <circle cx={selPos.x} cy={selPos.y} r={18} fill={CLOCK_ACCENT} />
                {mode === "hour"
                  ? HOUR_SLOTS.map((h, i) => { const p = clockPos(i, 12); return (<text key={h} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight={h === hour ? "bold" : "normal"} fill={h === hour ? "#fff" : "#333"} style={{ userSelect: "none", pointerEvents: "none" }}>{h}</text>); })
                  : MINUTE_SLOTS.map((m, i) => { const p = clockPos(i, 12); return (<text key={m} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight={m === minute ? "bold" : "normal"} fill={m === minute ? "#fff" : "#333"} style={{ userSelect: "none", pointerEvents: "none" }}>{String(m).padStart(2, "0")}</text>); })
                }
              </svg>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 18px 14px", background: "#fff" }}>
              <button type="button" style={{ background: "none", border: "none", color: CLOCK_ACCENT, fontWeight: 700, cursor: "pointer", fontSize: "14px" }}
                onClick={() => { setHour(12); setMinute(0); setAmpm("AM"); setMode("hour"); }}>Clear</button>
              <div style={{ display: "flex", gap: "18px" }}>
                <button type="button" style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: "14px" }} onClick={() => setOpen(false)}>Cancel</button>
                <button type="button" style={{ background: "none", border: "none", color: CLOCK_ACCENT, fontWeight: 700, cursor: "pointer", fontSize: "14px" }} onClick={handleSet}>Set</button>
              </div>
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

  // ── Form state (one piece per Punjab input) ────────────────────────────
  const [vehicleNo,       setVehicleNo]       = useState("");
  const [chassisNo,       setChassisNo]       = useState("");
  const [ownerName,       setOwnerName]       = useState("");
  const [mobileNo,        setMobileNo]        = useState("");
  const [fromState,       setFromState]       = useState("");
  const [vehicleType,     setVehicleType]     = useState("");
  const [vehicleCategory, setVehicleCategory] = useState("");
  const [vehicleClass,    setVehicleClass]    = useState("");
  const [grossVehicleWt,  setGrossVehicleWt]  = useState("0");
  const [unladenWt,       setUnladenWt]       = useState("0");
  const [seatingCap,      setSeatingCap]      = useState("");
  const [sleeperCap,      setSleeperCap]      = useState("0");
  const [serviceType,     setServiceType]     = useState("");
  const [taxMode,         setTaxMode]         = useState("");
  const [borderDistrict,  setBorderDistrict]  = useState("");
  const [checkpostName,   setCheckpostName]   = useState("");
  const [taxFrom,         setTaxFrom]         = useState("");
  const [taxTo,           setTaxTo]           = useState("");
  const [taxFromTime,     setTaxFromTime]     = useState("00:00");
  const [taxToTime,       setTaxToTime]       = useState("23:59");
  const [mvTax,           setMvTax]           = useState("0");
  const [userCharge,      setUserCharge]      = useState("0");
  const [infraCess,       setInfraCess]       = useState("0");
  const [calculatedTotal, setCalculatedTotal] = useState("");

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
    if (!calculatedTotal || parseFloat(calculatedTotal) <= 0) missing.push("Total Amount (click Calculate Tax)");
    if (missing.length > 0) {
      setFormError(`Please fill the following before paying: ${missing.join(", ")}`);
      return;
    }
    setShowModal(true);
  };

  const handleConfirmPayment = () => {
    // Forward the exact text values the user picked. Mongo is the single
    // source of truth and the receipt template / PDF generator just print
    // whatever's saved, no code → label translation needed.
    const params = new URLSearchParams({
      state:           stateCode,
      vehicleNo,
      ownerName,
      chassisNo,
      mobileNo,
      fromState,
      vehicleType,
      vehicleCategory,
      vehicleClass,
      grossVehicleWt,
      unladenWt,
      seatingCap,
      sleeperCap,
      serviceType,
      taxMode,
      borderDistrict,
      checkpostName,
      taxFrom,
      taxFromTime,
      taxTo,
      taxToTime,
      amount:          calculatedTotal || "0",
      userCharge:      userCharge     || "0",
      infraCess:       infraCess      || "0",
      paymentInitDate: nowIST(),
    });
    router.push(`/payment/sbi?${params.toString()}`);
  };

  const handleReset = () => {
    setVehicleNo(""); setChassisNo(""); setOwnerName(""); setMobileNo("");
    setFromState(""); setVehicleType(""); setVehicleCategory(""); setVehicleClass("");
    setGrossVehicleWt("0"); setUnladenWt("0"); setSeatingCap(""); setSleeperCap("0"); setServiceType(""); setTaxMode("");
    setBorderDistrict(""); setCheckpostName("");
    setTaxFrom(""); setTaxTo(""); setTaxFromTime("00:00"); setTaxToTime("23:59");
    setMvTax("0"); setUserCharge("0"); setInfraCess("0"); setCalculatedTotal("");
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
    const effectiveTotal = calculatedTotal && parseFloat(calculatedTotal) > 0
      ? calculatedTotal
      : String((parseFloat(mvTax)||0) + (parseFloat(userCharge)||0) + (parseFloat(infraCess)||0));
    const d = new Date(); const yy = String(d.getFullYear()).slice(2); const mm = String(d.getMonth()+1).padStart(2,"0"); const dd2 = String(d.getDate()).padStart(2,"0");
    const rand = Math.floor(Math.random()*9000000+1000000);
    const receiptNo = `PBR${yy}${mm}${dd2}${rand}`;
    const transactionId = `TXN${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2,6).toUpperCase()}`;
    setPdfLoading(true);
    try {
      const res = await fetch("/api/payment", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, state: stateCode, visitingState: stateCode, vehicleNo, chassisNo, ownerName, mobileNo, fromState, vehicleType, vehicleCategory, vehicleClass, grossVehicleWt, unladenWt, serviceType, taxMode, borderDistrict, checkpostName, taxFrom, taxFromTime, taxTo, taxToTime, amount: parseFloat(effectiveTotal)||0, userCharge: userCharge||"0", infraCess: infraCess||"0", receiptNo, orderRef: (() => { const c=[]; for(let i=0;i<6;i++)c.push(String.fromCharCode(65+Math.floor(Math.random()*26))); for(let i=0;i<3;i++)c.push(String(Math.floor(Math.random()*10))); for(let i=c.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[c[i],c[j]]=[c[j],c[i]];} return c.join("")+String(Math.floor(Math.random()*10)); })(), noOfPeriods:1, seatingCap, sleeperCap, paymentInitDate: nowIST() }) });
      const json = await res.json().catch(()=>({}));
      if (!res.ok || !json.success) throw new Error(json.message||"Failed to save transaction");
      const savedId = json.transactionId || transactionId;
      const link = document.createElement("a"); link.href=`/api/receipt/${savedId}?state=PB&download=1`; link.download=`receipt_${savedId}.pdf`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
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
              <span style={{ color: punjabConfig.themeColor, fontWeight: "bold" }}>
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
                        placeholder="e.g. PB14AB1234"
                        title="Vehicle Registration Number"
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
                        title="Chassis Number"
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
                        title="Owner Name"
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
                        title="Mobile Number"
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
                          title="From State"
                        >
                          {FROM_STATE_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Vehicle Type + Vehicle Category + Vehicle Class */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Vehicle Type</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select
                          className="select-autofilled"
                          value={vehicleType}
                          onChange={(e) => setVehicleType(e.target.value)}
                          title="Vehicle Type"
                        >
                          {VEHICLE_TYPE_OPTIONS.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Vehicle Category</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select
                          className="select-autofilled"
                          value={vehicleCategory}
                          onChange={(e) => setVehicleCategory(e.target.value)}
                          title="Vehicle Category"
                        >
                          {VEHICLE_CATEGORY_OPTIONS.map((c) => (
                            <option key={c.label} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Vehicle Class</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select
                          className="select-autofilled"
                          value={vehicleClass}
                          onChange={(e) => setVehicleClass(e.target.value)}
                          title="Vehicle Class"
                        >
                          {VEHICLE_CLASS_OPTIONS.map((v) => (
                            <option key={v.label} value={v.value}>{v.label}</option>
                          ))}
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 5: Gross Vehicle Wt + Unladen Wt + Service Type + Tax Mode */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">
                          {isGoodsVehicle ? "Gross Vehicle Wt (In Kg.)" : "Seating Capacity"}
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
                        title="Gross Vehicle Weight in Kg"
                      />
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">
                          {isGoodsVehicle ? "Unladen Wt (In Kg.)" : "Sleeper Cap"}
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
                        title="Unladen Weight in Kg"
                      />
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Service Type</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select
                          value={serviceType}
                          onChange={(e) => setServiceType(e.target.value)}
                          title="Service Type"
                        >
                          {SERVICE_TYPE_OPTIONS.map((s) => (
                            <option key={s.label} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Tax Mode</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select
                          value={taxMode}
                          onChange={(e) => setTaxMode(e.target.value)}
                          title="Tax Mode"
                        >
                          {TAX_MODE_OPTIONS.map((t) => (
                            <option key={t.label} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 6: Border District + Checkpost + Tax From + Tax Upto */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Border/Barrier District through Entering</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select
                          value={borderDistrict}
                          onChange={(e) => setBorderDistrict(e.target.value)}
                          title="Border / Barrier District"
                        >
                          {BORDER_DISTRICT_OPTIONS.map((d) => (
                            <option key={d.label} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Checkpost Name</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select
                          value={checkpostName}
                          onChange={(e) => setCheckpostName(e.target.value)}
                          title="Checkpost Name"
                        >
                          {CHECKPOST_OPTIONS.map((c) => (
                            <option key={c.label} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Tax From Date &amp; Time</label>
                      </div>
                      <div className="ui-calendar">
                        <input
                          type="date"
                          className={`ui-inputtext cp-date-input${dateError && taxFrom > taxTo && taxTo ? " cp-date-error" : ""}`}
                          value={taxFrom}
                          max={taxTo || undefined}
                          onChange={(e) => handleTaxFromChange(e.target.value)}
                          autoComplete="off"
                          title="Tax From Date"
                        />
                      </div>
                      <div className="ui-calendar" style={{ marginTop: "4px" }}>
                        <ClockPicker value={taxFromTime} onChange={setTaxFromTime} />
                      </div>
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Tax Upto Date &amp; Time</label>
                      </div>
                      <div className="ui-calendar">
                        <input
                          type="date"
                          className={`ui-inputtext cp-date-input${dateError && taxFrom > taxTo && taxFrom ? " cp-date-error" : ""}`}
                          value={taxTo}
                          min={taxFrom || undefined}
                          onChange={(e) => handleTaxToChange(e.target.value)}
                          autoComplete="off"
                          title="Tax Upto Date"
                        />
                      </div>
                      <div className="ui-calendar" style={{ marginTop: "4px" }}>
                        <ClockPicker value={taxToTime} onChange={setTaxToTime} />
                      </div>
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

                  {formError && (
                    <div className="ui-grid-row">
                      <div className="ui-grid-col-12">
                        <div className="cp-date-err-msg">{formError}</div>
                      </div>
                    </div>
                  )}

                  {/* MV Tax + Service/User Charge + Cess + buttons */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">MV Tax.</label>
                      </div>
                      <input
                        type="text"
                        className="ui-inputtext font-bold medium-text-font"
                        value={mvTax}
                        onChange={(e) => { setMvTax(e.target.value.replace(/[^0-9.]/g, "")); setCalculatedTotal(""); setFormError(""); }}
                        placeholder="0"
                        title="MV Tax"
                      />
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Service/User Charge.</label>
                      </div>
                      <input
                        type="text"
                        className="ui-inputtext"
                        value={userCharge}
                        onChange={(e) => { setUserCharge(e.target.value.replace(/[^0-9.]/g, "")); setCalculatedTotal(""); }}
                        placeholder="0"
                        title="Service/User Charge"
                      />
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Cess</label>
                      </div>
                      <input
                        type="text"
                        className="ui-inputtext"
                        value={infraCess}
                        onChange={(e) => { setInfraCess(e.target.value.replace(/[^0-9.]/g, "")); setCalculatedTotal(""); }}
                        placeholder="0"
                        title="Cess"
                      />
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="ui-grid-row">
                        <div className="ui-grid-col-12 top_mar1 mar-left5">
                          <button
                            className="ui-button"
                            type="button"
                            onClick={() => {
                              const total = (parseFloat(mvTax) || 0) + (parseFloat(userCharge) || 0) + (parseFloat(infraCess) || 0);
                              setCalculatedTotal(total.toString());
                            }}
                          >
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
                    </div>
                  </div>
                  {pdfError && (<div className="ui-grid-row"><div className="ui-grid-col-12"><div className="cp-date-err-msg">{pdfError}</div></div></div>)}
                  {calculatedTotal && (
                    <div className="ui-grid-row" style={{ marginTop: "10px" }}>
                      <div className="ui-grid-col-12">
                        <div style={{ background: "#e8f4fd", border: "1.5px solid #87CEEB", borderRadius: "4px", padding: "10px 16px", fontSize: "15px", fontWeight: "bold", color: "#003366" }}>
                          Total Tax Amount : &#8377; {calculatedTotal}/-
                        </div>
                      </div>
                    </div>
                  )}

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
                    <td><span className="small-text-font">Tax From Date</span></td>
                    <td><span className="small-text-font">:</span></td>
                    <td><span className="small-text-font">{taxFrom}{taxFromTime ? ` ${taxFromTime}` : ""}</span></td>
                  </tr>
                  <tr>
                    <td><span className="small-text-font">Tax To Date</span></td>
                    <td><span className="small-text-font">:</span></td>
                    <td><span className="small-text-font">{taxTo}{taxToTime ? ` ${taxToTime}` : ""}</span></td>
                  </tr>
                  <tr>
                    <td><span className="small-text-font-bold">Amount</span></td>
                    <td><span className="small-text-font-bold">:</span></td>
                    <td><span className="small-text-font-bold">{calculatedTotal ? `${calculatedTotal}/-` : "/-"}</span></td>
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
