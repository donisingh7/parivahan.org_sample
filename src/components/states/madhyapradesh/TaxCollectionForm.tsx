"use client";
import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { TaxDateField, PaymentDateTimeField } from "../shared/TaxDateField";
import { madhyaPradeshConfig } from "@/lib/states/madhyapradesh/config";

/**
 * Uttar Pradesh checkpost border-tax collection form.
 *
 * Mirrors the GOVERNMENT OF UTTAR PRADESH Department of Transport
 * "Tax Payment Details" page (up_dashboards.aspx) layout, fields and
 * dropdown options exactly (README.txt lines 5290-5639):
 *   1.  Vehicle No. + Get Details button
 *   2.  Chassis No. + Owner Name
 *   3.  Mobile No. + From State
 *   4.  Vehicle Type (col-3) + Vehicle Category (col-3) + Vehicle Class (col-6)
 *   5.  Seating Capacity + Sleeper Cap + Service Type + Tax Mode
 *   6.  Border/Barrier District (col-6) + Tax From (col-3) + Tax Upto (col-3)
 *   7.  Permit Type (col-3) + Permit Upto (col-3) + Permit No. (col-6)
 *   8.  Fitness Validity (col-3) + Insurance Validity (col-3) + PUCC Validity (col-6)
 *   9.  (empty tax breakup table — populated server-side at receipt time)
 *  10.  Total Amount (col-6) + Calculate/Pay/Reset buttons (col-6)
 *
 * The dropdown values are the exact strings the inspect HTML uses
 * (TRANSPORT, MOTOR CYCLE, AGRA, TEMPORARY PERMIT, …) so what the user
 * picks is what gets stored in Mongo and printed on the receipt.
 *
 * Note: UP's vehicle category lists "GOODS CARRIER" instead of HP's
 * "GOODS VEHICLE", and UP permit types include the inspect HTML's
 * misspelling "SEPECIAL PERMIT" — kept verbatim so saved data round-trips
 * pixel-for-pixel.
 */

const STATE_CODE  = madhyaPradeshConfig.code;
const STATE_LABEL = madhyaPradeshConfig.label;

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

// UP differs from HP/Haryana here: "GOODS CARRIER" instead of "GOODS VEHICLE".
const VEHICLE_CATEGORY_OPTIONS = [
  { value: "",                                          label: "-- Select Vehicle Category --" },
  { value: "CONTRACT CARRIAGE/PASSENGER   VEHICLES",     label: "CONTRACT CARRIAGE/PASSENGER VEHICLES" },
  { value: "PRIVATE SERVICE VEHICLE",                    label: "PRIVATE SERVICE VEHICLE" },
  { value: "GOODS CARRIER",                              label: "GOODS CARRIER" },
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
  { value: "",            label: "-- Select Tax Mode --" },
  { value: "DAYS",        label: "DAYS" },
  { value: "WEEKLY",      label: "WEEKLY" },
  { value: "FORTNIGHT",   label: "FORTNIGHT" },
  { value: "MONTHLY",     label: "MONTHLY" },
  { value: "QUARTERLY",   label: "QUARTERLY" },
  { value: "HALF YEARLY", label: "HALF YEARLY" },
  { value: "YEARLY",      label: "YEARLY" },
];

// UP-specific Permit Type dropdown (inspect lines 5588-5594 — note the
// inspect's "SEPECIAL PERMIT" misspelling is preserved verbatim).
const PERMIT_TYPE_OPTIONS = [
  { value: "",                  label: "-- Select Permit Type --" },
  { value: "NOT APPLICABLE",    label: "NOT APPLICABLE" },
  { value: "TEMPORARY PERMIT",  label: "TEMPORARY PERMIT" },
  { value: "TOURIST PERMIT",    label: "TOURIST PERMIT" },
  { value: "SEPECIAL PERMIT",   label: "SEPECIAL PERMIT" },
];

// DTO (District Transport Office) list — MP districts. The DTO field auto-fills
// from the chosen checkpost but stays an editable dropdown so the operator can
// override it.
const DTO_OPTIONS = [
  "", "SATNA", "BHOPAL", "INDORE", "GWALIOR", "JABALPUR", "UJJAIN", "SAGAR",
  "REWA", "RATLAM", "DEWAS", "KHANDWA", "CHHINDWARA", "PANDHURNA", "VIDISHA",
  "SEHORE", "NARMADAPURAM", "BETUL", "GUNA", "SHIVPURI", "MORENA", "BHIND",
  "SHEOPUR", "DATIA", "CHHATARPUR", "TIKAMGARH", "PANNA", "DAMOH", "KATNI",
  "UMARIA", "SHAHDOL", "ANUPPUR", "SIDHI", "SINGRAULI", "BALAGHAT", "SEONI",
  "MANDLA", "DINDORI", "NARSINGHPUR", "RAISEN", "RAJGARH", "SHAJAPUR",
  "AGAR MALWA", "MANDSAUR", "NEEMUCH", "JHABUA", "ALIRAJPUR", "DHAR",
  "BARWANI", "KHARGONE", "BURHANPUR", "HARDA", "ASHOKNAGAR", "NIWARI", "MAIHAR",
];

// Checkpost → DTO (district) mapping. Web-confirmed MP border checkposts; the
// checkpost field is pick-or-type (datalist) so any checkpost not listed can
// still be typed, and the DTO can then be picked/edited manually.
const CHECKPOST_DTO: Record<string, string> = {
  "MAJHGAWAN": "SATNA",
  "SENDHWA":   "BARWANI",
  "MALANPUR":  "BHIND",
  "MULTAI":    "BETUL",
  "PITOL":     "JHABUA",
  "SAUSAR":    "PANDHURNA",
  "NAYAGAON":  "NEEMUCH",
  "CHAKGHAT":  "REWA",
};
const CHECKPOST_OPTIONS = Object.keys(CHECKPOST_DTO);

// IST timestamp (UTC+5:30), browser-timezone-independent, with seconds.
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

function TaxCollectionContent() {
  const stateCode  = STATE_CODE;
  const stateLabel = STATE_LABEL;

  // ── Form state (one piece per UP input) ────────────────────────────────
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
  const [standingCap,       setStandingCap]       = useState("0");
  const [grossVehicleWt,    setGrossVehicleWt]    = useState("");
  const [unladenWt,         setUnladenWt]         = useState("");
  const [grossCombWt,       setGrossCombWt]       = useState("");
  const [serviceType,       setServiceType]       = useState("");
  const [taxMode,           setTaxMode]           = useState("");
  const [checkpostName,     setCheckpostName]     = useState("");
  const [dto,               setDto]               = useState("");
  const [taxFrom,           setTaxFrom]           = useState("");
  const [taxTo,             setTaxTo]             = useState("");
  const [permitType,        setPermitType]        = useState("");
  const [permitUpto,        setPermitUpto]        = useState("");
  const [permitNumber,      setPermitNumber]      = useState("");
  const [fitnessValidity,   setFitnessValidity]   = useState("");
  const [insuranceValidity, setInsuranceValidity] = useState("");
  const [puccValidity,      setPuccValidity]      = useState("");
  const [roadTaxValidity,   setRoadTaxValidity]   = useState("");
  // Five fixed tax rows (manual amounts).
  const [permitFeeAmt,  setPermitFeeAmt]  = useState("");
  const [mvTaxAmt,      setMvTaxAmt]      = useState("");
  const [userChargeAmt, setUserChargeAmt] = useState("");
  const [sgstAmt,       setSgstAmt]       = useState("");
  const [cgstAmt,       setCgstAmt]       = useState("");
  const [paymentInitDateInput, setPaymentInitDateInput] = useState("");
  const [paymentConfDateInput, setPaymentConfDateInput] = useState("");
  const [printedOnInput,       setPrintedOnInput]       = useState("");

  // Total = sum of the five tax rows (derived, always in sync).
  const totalAmount = String(
    (parseFloat(permitFeeAmt)  || 0) +
    (parseFloat(mvTaxAmt)      || 0) +
    (parseFloat(userChargeAmt) || 0) +
    (parseFloat(sgstAmt)       || 0) +
    (parseFloat(cgstAmt)       || 0)
  );

  // Picking a known checkpost auto-fills the DTO (still editable below).
  const handleCheckpostChange = (val: string) => {
    const v = val.toUpperCase();
    setCheckpostName(v);
    const mapped = CHECKPOST_DTO[v];
    if (mapped) setDto(mapped);
  };

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
      if (d.permitType)      setPermitType(d.permitType);
      if (d.permitNumber)    setPermitNumber(d.permitNumber);
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
    if (!taxFrom)                                     missing.push("Tax From");
    if (!taxTo)                                       missing.push("Tax Upto");
    if (!totalAmount || parseFloat(totalAmount) <= 0) missing.push("Total Amount");
    if (missing.length > 0) {
      setFormError(`Please fill the following before paying: ${missing.join(", ")}`);
      return;
    }
    setShowModal(true);
  };

  const handleConfirmPayment = () => {
    // Forward raw text values; Mongo is the single source of truth.
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
      sleeperCap,
      serviceType,
      taxMode,
      checkpostName,
      mpDto: dto,
      mpStandingCap: standingCap,
      grossCombinationWeight: grossCombWt,
      taxFrom,
      taxTo,
      permitType,
      permitUpto,
      permitNumber,
      fitnessValidity,
      insuranceValidity,
      puccValidity,
      mpRoadTaxValidity: roadTaxValidity,
      mpPermitFee:  permitFeeAmt  || "0",
      mpMvTax:      mvTaxAmt      || "0",
      mpUserCharge: userChargeAmt || "0",
      mpSgst:       sgstAmt       || "0",
      mpCgst:       cgstAmt       || "0",
      amount: totalAmount || "0",
      paymentInitDate: paymentInitDateInput || nowIST(),
      paymentConfDate: paymentConfDateInput,
      printedOn:       printedOnInput,
    });
    router.push(`/payment/sbi?${params.toString()}`);
  };

  const handleReset = () => {
    setVehicleNo(""); setChassisNo(""); setOwnerName(""); setMobileNo("");
    setFromState(""); setVehicleType(""); setVehicleCategory(""); setVehicleClass("");
    setSeatingCap(""); setSleeperCap("0"); setStandingCap("0"); setGrossVehicleWt(""); setUnladenWt(""); setGrossCombWt("");
    setServiceType(""); setTaxMode("");
    setCheckpostName(""); setDto(""); setTaxFrom(""); setTaxTo("");
    setPermitType(""); setPermitUpto(""); setPermitNumber("");
    setFitnessValidity(""); setInsuranceValidity(""); setPuccValidity(""); setRoadTaxValidity("");
    setPermitFeeAmt(""); setMvTaxAmt(""); setUserChargeAmt(""); setSgstAmt(""); setCgstAmt("");
    setPaymentInitDateInput(""); setPaymentConfDateInput(""); setPrintedOnInput("");
    setDateError(""); setFormError(""); setShowModal(false); setPdfError("");
    setNavOpen(false); setReportsOpen(false);
  };

  const handleGetPdf = async () => {
    setPdfError("");
    if (dateError) return;
    const missing: string[] = [];
    if (!vehicleNo.trim())                            missing.push("Registration No.");
    if (!taxFrom)                                     missing.push("Tax From Date");
    if (!taxTo)                                       missing.push("Tax Upto Date");
    if (!totalAmount || parseFloat(totalAmount) <= 0) missing.push("Total Amount");
    if (missing.length > 0) { setPdfError(`Please fill the following before downloading: ${missing.join(", ")}`); return; }
    const d = new Date(); const yy = String(d.getFullYear()).slice(2); const mm = String(d.getMonth()+1).padStart(2,"0"); const dd2 = String(d.getDate()).padStart(2,"0");
    const rand = Math.floor(Math.random()*9000000+1000000);
    const receiptNo = `MPR${yy}${mm}${dd2}${rand}`;
    const transactionId = `TXN${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2,6).toUpperCase()}`;
    setPdfLoading(true);
    try {
      const res = await fetch("/api/payment", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, state: stateCode, visitingState: stateCode, vehicleNo, chassisNo, ownerName, mobileNo, fromState, vehicleType, vehicleCategory, vehicleClass, seatingCap, sleeperCap, serviceType, taxMode, checkpostName, mpDto: dto, mpStandingCap: standingCap, grossCombinationWeight: grossCombWt, taxFrom, taxTo, permitType, permitUpto, permitNumber, fitnessValidity, insuranceValidity, puccValidity, mpRoadTaxValidity: roadTaxValidity, mpPermitFee: parseFloat(permitFeeAmt)||0, mpMvTax: parseFloat(mvTaxAmt)||0, mpUserCharge: parseFloat(userChargeAmt)||0, mpSgst: parseFloat(sgstAmt)||0, mpCgst: parseFloat(cgstAmt)||0, amount: parseFloat(totalAmount)||0, receiptNo, orderRef: String(Math.floor(Math.random()*900000000000+100000000000)), noOfPeriods:1, grossVehicleWt, unladenWt, paymentInitDate: paymentInitDateInput || nowIST(), paymentConfDate: paymentConfDateInput, printedOn: printedOnInput }) });
      const json = await res.json().catch(()=>({}));
      if (!res.ok || !json.success) throw new Error(json.message||"Failed to save transaction");
      const savedId = json.transactionId || transactionId;
      const link = document.createElement("a"); link.href=`/api/receipt/${savedId}?state=MP&download=1`; link.download=`receipt_${savedId}.pdf`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch(err) { setPdfError(err instanceof Error ? err.message : "PDF download failed."); }
    finally { setPdfLoading(false); }
  };

  const isGoodsVehicle = vehicleCategory === "GOODS CARRIER";

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
            <strong className="cp-news-highlight">VAHAN MP CP XXXXXXXXXX</strong>)
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
              <span style={{ color: madhyaPradeshConfig.themeColor, fontWeight: "bold" }}>
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
                        placeholder="e.g. MP04AB1234"
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

                  {/* Row 4: Vehicle Type (col-3) + Vehicle Category (col-3) +
                      Vehicle Class (col-6) — UP-specific layout (inspect 5408-5469). */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Vehicle Type</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select className="select-autofilled" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
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
                        <select className="select-autofilled" value={vehicleCategory} onChange={(e) => setVehicleCategory(e.target.value)}>
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
                        <select className="select-autofilled" value={vehicleClass} onChange={(e) => setVehicleClass(e.target.value)}>
                          {VEHICLE_CLASS_OPTIONS.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 5: Seating Capacity + Sleeper Cap + Service Type + Tax Mode */}
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
                      />
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">
                          {isGoodsVehicle ? "Unladen Wt (In Kg.)" : "Sleeper Cap"}
                        </label>
                      </div>
                      <input
                        type="text"
                        className="ui-inputtext input-autofilled"
                        value={isGoodsVehicle ? unladenWt : sleeperCap}
                        onChange={(e) => isGoodsVehicle
                          ? setUnladenWt(e.target.value.replace(/\D/g, ""))
                          : setSleeperCap(e.target.value.replace(/\D/g, ""))}
                        maxLength={7}
                        autoComplete="off"
                      />
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Service Type</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
                          {SERVICE_TYPE_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
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
                        <select value={taxMode} onChange={(e) => setTaxMode(e.target.value)}>
                          {TAX_MODE_OPTIONS.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 5b: Standing Capacity + Gross Combination Weight */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">Standing Capacity</label>
                      </div>
                      <input type="text" className="ui-inputtext" value={standingCap}
                        onChange={(e) => setStandingCap(e.target.value.replace(/\D/g, ""))}
                        maxLength={7} autoComplete="off" />
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">Gross Combination Weight (In Kg.)</label>
                      </div>
                      <input type="text" className="ui-inputtext" value={grossCombWt}
                        onChange={(e) => setGrossCombWt(e.target.value.replace(/\D/g, ""))}
                        maxLength={9} autoComplete="off" placeholder="e.g. 16200" />
                    </div>
                  </div>

                  {/* Row 6: CheckPost Name (pick-or-type) + DTO (auto-fills, editable) */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">CheckPost Name</label>
                      </div>
                      <input type="text" className="ui-inputtext" value={checkpostName}
                        onChange={(e) => handleCheckpostChange(e.target.value)}
                        maxLength={60} autoComplete="off" list="mp-checkpost-options"
                        placeholder="Select or type a checkpost" />
                      <datalist id="mp-checkpost-options">
                        {CHECKPOST_OPTIONS.map((c) => <option key={c} value={c} />)}
                      </datalist>
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">DTO</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select value={dto} onChange={(e) => setDto(e.target.value)}>
                          {DTO_OPTIONS.map((d) => (
                            <option key={d} value={d}>{d || "---Select DTO---"}</option>
                          ))}
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 6b: Tax From + Tax Upto */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Tax From</label>
                      </div>
                      <TaxDateField
                        date={taxFrom}
                        onDateChange={handleTaxFromChange}
                        hasError={!!(dateError && taxFrom && taxTo && taxFrom > taxTo)}
                      />
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Tax Upto</label>
                      </div>
                      <TaxDateField
                        date={taxTo}
                        onDateChange={handleTaxToChange}
                        hasError={!!(dateError && taxFrom && taxTo && taxFrom > taxTo)}
                      />
                    </div>
                  </div>

                  {/* Row 7: Permit Type (col-3) + Permit Upto (col-3) + Permit No. (col-6)
                      — UP-specific (inspect 5581-5610), permit fields are optional. */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">Permit Type</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select className="select-autofilled" value={permitType} onChange={(e) => setPermitType(e.target.value)}>
                          {PERMIT_TYPE_OPTIONS.map((p) => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">Permit Upto.</label>
                      </div>
                      <div className="ui-calendar">
                        <input
                          type="date"
                          className="ui-inputtext cp-date-input"
                          value={permitUpto}
                          onChange={(e) => setPermitUpto(e.target.value)}
                          autoComplete="off"
                        />
                      </div>
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">Permit No.</label>
                      </div>
                      <input
                        type="text"
                        className="ui-inputtext input-autofilled"
                        value={permitNumber}
                        onChange={(e) => setPermitNumber(e.target.value.toUpperCase())}
                        maxLength={30}
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  {/* Row 8: Fitness Validity (col-3) + Insurance Validity (col-3) +
                      PUCC Validity (col-6) — inspect 5611-5638. */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-3">
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
                    <div className="ui-grid-col-3">
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
                    <div className="ui-grid-col-3">
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
                        <label className="ui-outputlabel">Road Tax Validity</label>
                      </div>
                      <div className="ui-calendar">
                        <input
                          type="date"
                          className="ui-inputtext cp-date-input"
                          value={roadTaxValidity}
                          onChange={(e) => setRoadTaxValidity(e.target.value)}
                          autoComplete="off"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Date validation error */}
                  {dateError && (
                    <div className="ui-grid-row">
                      <div className="ui-grid-col-12">
                        <div className="cp-date-err-msg">{dateError}</div>
                      </div>
                    </div>
                  )}

                  {/* Tax breakup table */}
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

                  {/* Inline form error */}
                  {formError && (
                    <div className="ui-grid-row">
                      <div className="ui-grid-col-12">
                        <div className="cp-date-err-msg">{formError}</div>
                      </div>
                    </div>
                  )}

                  {/* Payment Init Date + Payment Conf Date + Printed On */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-4">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">Payment Init Date</label>
                      </div>
                      <PaymentDateTimeField value={paymentInitDateInput} onChange={setPaymentInitDateInput} />
                    </div>
                    <div className="ui-grid-col-4">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">Payment Conf Date</label>
                      </div>
                      <PaymentDateTimeField value={paymentConfDateInput} onChange={setPaymentConfDateInput} />
                    </div>
                    <div className="ui-grid-col-4">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">Printed On</label>
                      </div>
                      <PaymentDateTimeField value={printedOnInput} onChange={setPrintedOnInput} />
                    </div>
                  </div>

                  {/* Tax table — five fixed rows (manual amounts) */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Permit Fee (Rs.)</label>
                      </div>
                      <input type="number" className="ui-inputtext" min="0" value={permitFeeAmt}
                        onChange={(e) => { setPermitFeeAmt(e.target.value.replace(/[^0-9.]/g, "")); setFormError(""); }}
                        placeholder="0" />
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">MV Tax (Rs.)</label>
                      </div>
                      <input type="number" className="ui-inputtext" min="0" value={mvTaxAmt}
                        onChange={(e) => { setMvTaxAmt(e.target.value.replace(/[^0-9.]/g, "")); setFormError(""); }}
                        placeholder="0" />
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">Service/User Charge (Rs.)</label>
                      </div>
                      <input type="number" className="ui-inputtext" min="0" value={userChargeAmt}
                        onChange={(e) => { setUserChargeAmt(e.target.value.replace(/[^0-9.]/g, "")); setFormError(""); }}
                        placeholder="0" />
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">Tax Mode</label>
                      </div>
                      <input type="text" className="ui-inputtext" value={taxMode} readOnly
                        style={{ background: "#f5f5f5" }} placeholder="—" />
                    </div>
                  </div>

                  <div className="ui-grid-row">
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">SGST (Rs.)</label>
                      </div>
                      <input type="number" className="ui-inputtext" min="0" value={sgstAmt}
                        onChange={(e) => { setSgstAmt(e.target.value.replace(/[^0-9.]/g, "")); setFormError(""); }}
                        placeholder="0" />
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">CGST (Rs.)</label>
                      </div>
                      <input type="number" className="ui-inputtext" min="0" value={cgstAmt}
                        onChange={(e) => { setCgstAmt(e.target.value.replace(/[^0-9.]/g, "")); setFormError(""); }}
                        placeholder="0" />
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Total Amount (Rs.)</label>
                      </div>
                      <input type="text" className="ui-inputtext font-bold medium-text-font"
                        value={totalAmount} readOnly placeholder="0" style={{ background: "#f5f5f5" }} />
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

                  {/* Disclaimer checkbox per inspect 5684-5692 */}
                  <div className="ui-grid-row" style={{ paddingTop: 8 }}>
                    <div className="ui-grid-col-12">
                      <label className="ui-outputlabel red font-bold" style={{ fontWeight: 700 }}>
                        ☑ The above information furnished by me is correct. In case wrong information is filled the tax amount will not be refunded and will be forfeited.
                      </label>
                    </div>
                  </div>

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
                    <td><span className="small-text-font">Tax From Date</span></td>
                    <td><span className="small-text-font">:</span></td>
                    <td><span className="small-text-font">{taxFrom}</span></td>
                  </tr>
                  <tr>
                    <td><span className="small-text-font">Tax To Date</span></td>
                    <td><span className="small-text-font">:</span></td>
                    <td><span className="small-text-font">{taxTo}</span></td>
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
