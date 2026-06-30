"use client";
import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { TaxDateField, PaymentDateTimeField } from "../shared/TaxDateField";
import { rajasthanConfig } from "@/lib/states/rajasthan/config";

// Per-state form. The state code + label are hard-coded here (rather than
// looked up from the URL ?state=) because /checkpost/page.tsx dispatches
// based on ?state= and renders the per-state form component directly. Other
// states get their own copy of this file under src/components/states/<state>/
// so each state's design can be tweaked independently.
const STATE_CODE  = rajasthanConfig.code;
const STATE_LABEL = rajasthanConfig.label;

const BASE = "https://checkpost.parivahan.gov.in";
const LOGO = `${BASE}/checkpost/faces/javax.faces.resource/checkpost-logo.png?ln=images`;
const EVAHAN = `${BASE}/checkpost/faces/javax.faces.resource/e-vahan-logo.png?ln=images`;

// All Indian states for "From State"
const allStates = [
  { value: "-1", label: "---Select State---" },
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
  { value: "SK", label: "SIKKIM" },
  { value: "TN", label: "TAMIL NADU" },
  { value: "TS", label: "TELANGANA" },
  { value: "TR", label: "TRIPURA" },
  { value: "DD", label: "UT of DNH and DD" },
  { value: "UP", label: "UTTAR PRADESH" },
  { value: "UK", label: "UTTRAKHAND" },
  { value: "WB", label: "WEST BENGAL" },
];

const vehicleTypes = [
  { value: "",                                     label: "-- Select Vehicle Type --" },
  { value: "CONTRACT CARRIAGE/PASSENGER VEHICLES", label: "CONTRACT CARRIAGE/PASSENGER VEHICLES" },
  { value: "PRIVATE SERVICE VEHICLE",              label: "PRIVATE SERVICE VEHICLE" },
  { value: "GOODS VEHICLE",                        label: "GOODS VEHICLE" },
  { value: "STAGE CARRIAGE",                       label: "STAGE CARRIAGE" },
  { value: "CONSTRUCTION EQUIPMENT VEHICLE",       label: "CONSTRUCTION EQUIPMENT VEHICLE" },
  { value: "TEMPORARY REGISTERED VEHICLE",         label: "TEMPORARY REGISTERED VEHICLE" },
];

const VEHICLE_CLASS_OPTIONS = [
  { value: "",                                  label: "-- Select Vehicle Class --" },
  { value: "MOTOR CYCLE",                       label: "MOTOR CYCLE" },
  { value: "THREE WHEELER(PASSENGER)",          label: "THREE WHEELER(PASSENGER)" },
  { value: "MOTOR CAB",                         label: "MOTOR CAB" },
  { value: "MAXI CAB",                          label: "MAXI CAB" },
  { value: "OMNI BUS",                          label: "OMNI BUS" },
  { value: "BUS",                               label: "BUS" },
  { value: "SLEEPER BUS",                       label: "SLEEPER BUS" },
  { value: "VOLVO OR MERECEDEZ ETC",            label: "VOLVO OR MERECEDEZ ETC" },
  { value: "EDUCATIONAL BUS",                   label: "EDUCATIONAL BUS" },
  { value: "EDUCATIONAL BUS USED BY SCHOOL",    label: "EDUCATIONAL BUS USED BY SCHOOL" },
  { value: "PRIVATE ORGANIZATIONS",             label: "PRIVATE ORGANIZATIONS" },
  { value: "CRANE MOUNTED VEHICLE",             label: "CRANE MOUNTED VEHICLE" },
  { value: "LIGHT GOODS VEHICLE",               label: "LIGHT GOODS VEHICLE" },
  { value: "MEDIUM GOODS VEHICLE",              label: "MEDIUM GOODS VEHICLE" },
  { value: "HEAVY GOODS VEHICLE",               label: "HEAVY GOODS VEHICLE" },
];

// vehicleClasses and permitTypes lookup tables are intentionally not declared
// here — the corresponding <select> elements inline their <option> entries
// directly. The shared lookup tables live in src/lib/states/shared/masking.ts
// and are used by buildReceiptData when resolving codes back to labels.

const purposeOptions = [
  { value: "",              label: "---Select Purpose of visit---" },
  { value: "NOT APPLICABLE", label: "NOT APPLICABLE" },
  { value: "RAMDEVRA FAIR",  label: "RAMDEVRA FAIR" },
];

const DISTRICT_OPTIONS = [
  { value: "",             label: "---Select District/Barrier---" },
  { value: "ALWAR",        label: "ALWAR" },
  { value: "BANSWARA",     label: "BANSWARA" },
  { value: "BARAN",        label: "BARAN" },
  { value: "BHARATPUR",    label: "BHARATPUR" },
  { value: "CHITTORGARH",  label: "CHITTORGARH" },
  { value: "CHURU",        label: "CHURU" },
  { value: "DHOLPUR",      label: "DHOLPUR" },
  { value: "DUNGARPUR",    label: "DUNGARPUR" },
  { value: "GANGANAGAR",   label: "GANGANAGAR" },
  { value: "HANUMANGARH",  label: "HANUMANGARH" },
  { value: "JAIPUR",       label: "JAIPUR" },
  { value: "JALORE",       label: "JALORE" },
  { value: "JHALAWAR",     label: "JHALAWAR" },
  { value: "JHUNJHUNU",    label: "JHUNJHUNU" },
  { value: "PRATAPGARH",   label: "PRATAPGARH" },
  { value: "SIROHI",       label: "SIROHI" },
];

const CHECKPOST_OPTIONS = [
  { value: "",                                                                    label: "---Select CheckpostName/Barrier---" },
  { value: "AAKERA MOD, ALWAR(ON BILASPUR - BHIWADI ROUTE)",                     label: "AAKERA MOD, ALWAR(ON BILASPUR - BHIWADI ROUTE)" },
  { value: "BHIWARI MOD, RADHIWAS, BHIWADI(ON DHARUHEDA - BHIWADI ROUTE)",       label: "BHIWARI MOD, RADHIWAS, BHIWADI(ON DHARUHEDA - BHIWADI ROUTE)" },
  { value: "DHARUDHA MOD, BHIWARI(ON DHARUHEDA - BHIWADI ROUTE)",                label: "DHARUDHA MOD, BHIWARI(ON DHARUHEDA - BHIWADI ROUTE)" },
  { value: "NAREDA KALAN, ALWAR(ON NARNAUL - BEHROD ROUTE)",                     label: "NAREDA KALAN, ALWAR(ON NARNAUL - BEHROD ROUTE)" },
  { value: "NOVGAON,  ALWAR(ON SOHANA - ALWAR ROUTE)",                           label: "NOVGAON,  ALWAR(ON SOHANA - ALWAR ROUTE)" },
  { value: "PAKKA BAAG, ALWAR(ON AGRA - BHARATPUR ROUTE)",                       label: "PAKKA BAAG, ALWAR(ON AGRA - BHARATPUR ROUTE)" },
  { value: "SAHAJAHAPUR(ON GURGAON - JAIPUR ROUTE)",                             label: "SAHAJAHAPUR(ON GURGAON - JAIPUR ROUTE)" },
  { value: "TAWADU MOD, BHIWADI(ON SOHNA - BHIWADI ROUTE)",                      label: "TAWADU MOD, BHIWADI(ON SOHNA - BHIWADI ROUTE)" },
];

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
  // The state itself comes from the per-state config so the form always knows
  // which state it belongs to regardless of the URL — /checkpost/page.tsx
  // dispatches based on ?state= and renders this component directly.
  const stateCode = STATE_CODE;
  const stateLabel = STATE_LABEL;

  // Form state
  const [vehicleNo, setVehicleNo] = useState("");
  const [chassisNo, setChassisNo] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [fromState, setFromState] = useState("-1");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleClass, setVehicleClass] = useState("");
  const [seatingCap, setSeatingCap] = useState("");
  const [sleeperCap, setSleeperCap] = useState("");
  const [grossVehicleWt, setGrossVehicleWt] = useState("");
  const [unladenWt,      setUnladenWt]      = useState("");
  const [permitType, setPermitType] = useState("-1");
  const [districtEntering, setDistrictEntering] = useState("");
  const [checkpostName, setCheckpostName] = useState("");
  const [purposeVisit, setPurposeVisit] = useState("");
  const [aitpValidity, setAitpValidity] = useState("");
  const [aitpAuthValidity, setAitpAuthValidity] = useState("");
  const [taxMode, setTaxMode] = useState("-1");
  const [noPeriods, setNoPeriods] = useState("");
  const [taxFrom, setTaxFrom] = useState("");
  const [taxTo, setTaxTo] = useState("");
  const [paymentInitDateInput, setPaymentInitDateInput] = useState("");
  const [paymentConfDateInput, setPaymentConfDateInput] = useState("");
  const [printedOnInput,       setPrintedOnInput]       = useState("");
  const [totalAmount,   setTotalAmount]   = useState("");
  const [mvTaxField,    setMvTaxField]    = useState("");
  const [surchargeField,setSurchargeField]= useState("");
  const [showBreakup,   setShowBreakup]   = useState(false);
  const [dateError, setDateError] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError,   setPdfError]   = useState("");
  const router = useRouter();

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
      if (d.vehicleClass)    setVehicleClass(d.vehicleClass);
      if (d.seatingCap)      setSeatingCap(d.seatingCap);
      if (d.sleeperCap)      setSleeperCap(d.sleeperCap);
      if (d.grossVehicleWt)  setGrossVehicleWt(d.grossVehicleWt);
      if (d.unladenWt)       setUnladenWt(d.unladenWt);
      if (d.taxMode)         setTaxMode(d.taxMode);
      if (d.noPeriods)       setNoPeriods(d.noPeriods);
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

  const [formError, setFormError] = useState("");

  const handlePayTax = () => {
    setFormError("");
    if (dateError) return;
    if (taxFrom && taxTo && taxFrom > taxTo) {
      setDateError("Tax From Date must be before Tax Upto Date.");
      return;
    }
    // Required-field gate. Without these, /api/payment will 400 and the
    // success screen would never render the receipt.
    const missing: string[] = [];
    if (!vehicleNo.trim())            missing.push("Registration No.");
    if (!taxFrom)                     missing.push("Tax From Date");
    if (!taxTo)                       missing.push("Tax Upto Date");
    if (!showBreakup) missing.push("Total Amount (click Calculate Tax first)");
    if (missing.length > 0) {
      setFormError(`Please fill the following before paying: ${missing.join(", ")}`);
      return;
    }
    setShowModal(true);
  };

  const handleConfirmPayment = () => {
    // We forward the raw form codes (e.g. vehicleType="1") rather than labels.
    // Mongo is the single source of truth — labels are resolved at render time
    // by the state's buildReceiptData so the on-screen receipt and the PDF
    // stay in sync no matter what.
    const params = new URLSearchParams({
      state:            stateCode,
      vehicleNo,
      ownerName,
      chassisNo,
      mobileNo,
      fromState,
      vehicleType,
      vehicleClass,
      seatingCap,
      sleeperCap,
      permitType,
      districtEntering,
      checkpostName,
      purposeOfVisit:   purposeVisit,
      aitpValidity,
      aitpAuthValidity,
      taxMode,
      noOfPeriods:      noPeriods,
      taxFrom,
      taxTo,
      amount:     String((parseFloat(mvTaxField) || 0) + (parseFloat(surchargeField) || 0)),
      userCharge: surchargeField || "0",
      paymentInitDate: paymentInitDateInput || nowIST(),
      paymentConfDate: paymentConfDateInput,
      printedOn:       printedOnInput,
    });
    router.push(`/payment/sbi?${params.toString()}`);
  };

  const handleReset = () => {
    setVehicleNo(""); setChassisNo(""); setOwnerName(""); setMobileNo("");
    setFromState("-1"); setVehicleType(""); setVehicleClass("");
    setSeatingCap(""); setSleeperCap(""); setGrossVehicleWt(""); setUnladenWt(""); setPermitType("-1");
    setCheckpostName(""); setDistrictEntering(""); setPurposeVisit(""); setAitpValidity("");
    setAitpAuthValidity(""); setTaxMode("-1"); setNoPeriods("");
    setTaxFrom(""); setTaxTo(""); setPaymentInitDateInput(""); setPaymentConfDateInput(""); setPrintedOnInput(""); setTotalAmount(""); setMvTaxField(""); setSurchargeField(""); setShowBreakup(false); setDateError(""); setFormError(""); setShowModal(false); setPdfError(""); setNavOpen(false); setReportsOpen(false);
  };

  const handleGetPdf = async () => {
    setPdfError("");
    if (dateError) return;
    const missing: string[] = [];
    if (!vehicleNo.trim()) missing.push("Registration No.");
    if (!taxFrom)          missing.push("Tax From Date");
    if (!taxTo)            missing.push("Tax Upto Date");
    const calcAmt = (parseFloat(mvTaxField)||0) + (parseFloat(surchargeField)||0);
    if (calcAmt <= 0)      missing.push("Total Amount (Calculate Tax first)");
    if (missing.length > 0) { setPdfError(`Please fill the following before downloading: ${missing.join(", ")}`); return; }
    const d = new Date(); const yy = String(d.getFullYear()).slice(2); const mm = String(d.getMonth()+1).padStart(2,"0"); const dd2 = String(d.getDate()).padStart(2,"0");
    const rand = Math.floor(Math.random()*9000000+1000000);
    const receiptNo = `RJT${yy}${mm}${dd2}${rand}`;
    const transactionId = `TXN${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2,6).toUpperCase()}`;
    setPdfLoading(true);
    try {
      const res = await fetch("/api/payment", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, state: stateCode, visitingState: stateCode, vehicleNo, chassisNo, ownerName, mobileNo, fromState, vehicleType, vehicleClass, seatingCap, sleeperCap, grossVehicleWt, unladenWt, permitType, districtEntering, checkpostName, purposeOfVisit: purposeVisit, aitpValidity, aitpAuthValidity, taxMode, noOfPeriods: noPeriods, taxFrom, taxTo, amount: calcAmt, userCharge: surchargeField||"0", receiptNo, orderRef: `CPT${vehicleNo.replace(/\s/g,"").toUpperCase()}${Date.now().toString().slice(-8)}`, paymentInitDate: paymentInitDateInput || nowIST(), paymentConfDate: paymentConfDateInput, printedOn: printedOnInput }) });
      const json = await res.json().catch(()=>({}));
      if (!res.ok || !json.success) throw new Error(json.message||"Failed to save transaction");
      const savedId = json.transactionId || transactionId;
      const link = document.createElement("a"); link.href=`/api/receipt/${savedId}?state=RJ&download=1`; link.download=`receipt_${savedId}.pdf`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch(err) { setPdfError(err instanceof Error ? err.message : "PDF download failed."); }
    finally { setPdfLoading(false); }
  };

  const [navOpen, setNavOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

  const isGoodsVehicle = vehicleType === "GOODS VEHICLE";

  return (
    <div id="masterlaoyoutbody">

      {/* ── Top bar ── */}
      <div className="cp-topbar">
        <div className="container-fluid">
          <div className="cp-topbar-row">
            <div className="cp-topbar-marquee">
              <span className="cp-marquee-inner">
                Please pay tax in advance to avoid any last minute hassle.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                Please pay tax in advance to avoid any last minute hassle.
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
                      <a href={`${BASE}/checkpost/faces/public/reports/PermitReceiptPrinting.xhtml`}>
                        ▶ Print Permit Receipt
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
              <span style={{color: "#154281", fontWeight: "bold"}}>BORDER TAX PAYMENT FOR ENTRY INTO</span>
              <span className="red"> {stateLabel || "STATE"}</span>
            </h1>
          </div>

          <div className="ui-grid-row">
            <div className="ui-grid-col-12 center-position contents-Space"></div>
          </div>

          {/* ── Tax Payment Panel ── */}
          <div className="ui-grid-row top-space">
            <div className="ui-grid-col-1 resp-blank-height"></div>
            <div className="ui-grid-col-10">
              <div className="ui-panel">
                <div className="ui-panel-titlebar">Tax Payment Details</div>
                <div className="ui-panel-content">

                  {/* Row 1: Vehicle No + Get Details */}
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
                        placeholder="e.g. RJ14AB1234"
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

                  {/* Row 2: Chassis No + Owner Name */}
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

                  {/* Row 3: Mobile No + From State */}
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
                        title="SMS about payment will be sent to this number."
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
                          {allStates.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Vehicle Type + Vehicle Class */}
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
                          {vehicleTypes.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
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

                  {/* Row 5: Seating Cap + Sleeper Cap + Permit Type */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">
                          {isGoodsVehicle ? "Gross Vehicle Wt (In Kg)" : <>Seating Cap<span style={{color:"#FF0000"}}>*</span></>}
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
                          {isGoodsVehicle ? "Unladen Wt (In Kg)" : "Sleeper Cap"}
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
                      <div className="field-label resp-label-section"></div>
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Permit Type</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select value={permitType} onChange={(e) => setPermitType(e.target.value)}>
                          <option value="-1">---Select Permit Type---</option>
                          <option value="1">AITP</option>
                          <option value="2">NATIONAL PERMIT</option>
                          <option value="3">SPECIAL PERMIT</option>
                          <option value="4">CONTRACT CARRIAGE PERMIT</option>
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 6: District + Purpose + Checkpost Name */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">District through Entering</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select
                          value={districtEntering}
                          onChange={(e) => setDistrictEntering(e.target.value)}
                        >
                          {DISTRICT_OPTIONS.map((d) => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Purpose of visit</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select
                          value={purposeVisit}
                          onChange={(e) => setPurposeVisit(e.target.value)}
                        >
                          {purposeOptions.map((p) => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Check Post Name Through Entering</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select value={checkpostName} onChange={(e) => setCheckpostName(e.target.value)}>
                          {CHECKPOST_OPTIONS.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 7: AITP dates */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">AITP Permit Validity</label>
                      </div>
                      <div className="ui-calendar">
                        <input
                          type="date"
                          className="ui-inputtext cp-date-input"
                          value={aitpValidity}
                          onChange={(e) => setAitpValidity(e.target.value)}
                          autoComplete="off"
                        />
                      </div>
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">AITP Permit Auth Validity</label>
                      </div>
                      <div className="ui-calendar">
                        <input
                          type="date"
                          className="ui-inputtext cp-date-input"
                          value={aitpAuthValidity}
                          onChange={(e) => setAitpAuthValidity(e.target.value)}
                          autoComplete="off"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 8: Tax Mode + No of Periods + Tax From/To */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Tax Mode</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select className="select-autofilled" value={taxMode} onChange={(e) => setTaxMode(e.target.value)}>
                          <option value="-1">---Select Payment Mode---</option>
                          <option value="1">ONLINE</option>
                          <option value="2">CASH</option>
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">No of Periods</label>
                      </div>
                      <input
                        type="text"
                        className="ui-inputtext input-autofilled"
                        value={noPeriods}
                        onChange={(e) => setNoPeriods(e.target.value.replace(/\D/g, ""))}
                        maxLength={2}
                        autoComplete="off"
                      />
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Tax From Date</label>
                      </div>
                      <TaxDateField
                        date={taxFrom}
                        onDateChange={handleTaxFromChange}
                        hasError={!!(dateError && taxFrom && taxTo && taxFrom > taxTo)}
                      />
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Tax Upto Date</label>
                      </div>
                      <TaxDateField
                        date={taxTo}
                        onDateChange={handleTaxToChange}
                        hasError={!!(dateError && taxFrom && taxTo && taxFrom > taxTo)}
                      />
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

                  {/* Tax table */}
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

                  {/* Inline form error (e.g. missing required fields) */}
                  {formError && (
                    <div className="ui-grid-row">
                      <div className="ui-grid-col-12">
                        <div className="cp-date-err-msg">{formError}</div>
                      </div>
                    </div>
                  )}

                  {/* Payment Init Date + Payment Conf Date + Receipt Printed */}
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
                        <label className="ui-outputlabel">Receipt Printed</label>
                      </div>
                      <PaymentDateTimeField value={printedOnInput} onChange={setPrintedOnInput} />
                    </div>
                  </div>

                  {/* Total amount */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Total Amount</label>
                      </div>
                      <input
                        type="text"
                        className="ui-inputtext font-bold medium-text-font"
                        value={totalAmount}
                        onChange={(e) => {
                          setTotalAmount(e.target.value.replace(/[^0-9.]/g, ""));
                          setShowBreakup(false);
                          setMvTaxField("");
                          setSurchargeField("");
                          setFormError("");
                        }}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Action buttons — single spaced row */}
                  <div className="ui-grid-row">
                    <div
                      className="ui-grid-col-12 top_mar1"
                      style={{ display: "flex", flexWrap: "wrap", gap: "14px", justifyContent: "center", marginTop: "16px" }}
                    >
                      <button
                        className="ui-button"
                        type="button"
                        onClick={() => {
                          const amt = parseFloat(totalAmount) || 0;
                          const mv  = Math.round(amt * 15 / 16);
                          setMvTaxField(String(mv));
                          setSurchargeField(String(amt - mv));
                          setShowBreakup(true);
                          setFormError("");
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
                  {pdfError && (<div className="ui-grid-row"><div className="ui-grid-col-12"><div className="cp-date-err-msg">{pdfError}</div></div></div>)}

                  {/* Tax breakup — appears after Calculate Tax is clicked */}
                  {showBreakup && (
                    <div className="ui-grid-row" style={{ marginTop: "10px" }}>
                      <div className="ui-grid-col-4">
                        <div className="field-label resp-label-section">
                          <label className="ui-outputlabel field-label-mandate">MV Tax</label>
                        </div>
                        <input
                          type="text"
                          className="ui-inputtext font-bold medium-text-font"
                          value={mvTaxField}
                          onChange={(e) => setMvTaxField(e.target.value.replace(/[^0-9.]/g, ""))}
                          placeholder="0"
                        />
                      </div>
                      <div className="ui-grid-col-4">
                        <div className="field-label resp-label-section">
                          <label className="ui-outputlabel field-label-mandate">Surcharge Fee</label>
                        </div>
                        <input
                          type="text"
                          className="ui-inputtext"
                          value={surchargeField}
                          onChange={(e) => setSurchargeField(e.target.value.replace(/[^0-9.]/g, ""))}
                          placeholder="0"
                        />
                      </div>
                      <div className="ui-grid-col-4" style={{ display: "flex", alignItems: "flex-end" }}>
                        <div style={{ background: "#e8f4fd", border: "1.5px solid #87CEEB", borderRadius: "4px", padding: "10px 16px", fontSize: "15px", fontWeight: "bold", color: "#003366", width: "100%" }}>
                          Total : &#8377; {(parseFloat(mvTaxField) || 0) + (parseFloat(surchargeField) || 0)}/-
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
                    <td><span className="small-text-font-bold">{showBreakup ? `${(parseFloat(mvTaxField)||0) + (parseFloat(surchargeField)||0)}/-` : "/-"}</span></td>
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
