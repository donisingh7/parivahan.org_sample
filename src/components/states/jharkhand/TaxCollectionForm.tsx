"use client";
import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { jharkhandConfig } from "@/lib/states/jharkhand/config";

// Per-state form. The state code + label are hard-coded here (rather than
// looked up from the URL ?state=) because /checkpost/page.tsx dispatches
// based on ?state= and renders the per-state form component directly. Other
// states get their own copy of this file under src/components/states/<state>/
// so each state's design can be tweaked independently.
const STATE_CODE  = jharkhandConfig.code;
const STATE_LABEL = jharkhandConfig.label;

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
  { value: "-1", label: "---Select Vehicle Type---" },
  { value: "1",  label: "CONTRACT CARRIAGE/PASSENGER VEHICLES" },
  { value: "3",  label: "GOODS VEHICLE" },
  { value: "7",  label: "TEMPORARY REGISTERED VEHICLES" },
  { value: "9",  label: "CONSTRUCTION EQUIPMENT VEHICLE" },
];

// vehicleClasses and permitTypes lookup tables are intentionally not declared
// here — the corresponding <select> elements inline their <option> entries
// directly. The shared lookup tables live in src/lib/states/shared/masking.ts
// and are used by buildReceiptData when resolving codes back to labels.

const purposeOptions = [
  { value: "-1", label: "---Select Purpose of visit---" },
  { value: "4", label: "RAMDEVRA FAIR" },
  { value: "6", label: "URS FAIR" },
];

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
  const [vehicleType, setVehicleType] = useState("-1");
  const [vehicleClass, setVehicleClass] = useState("-1");
  const [seatingCap, setSeatingCap] = useState("");
  const [sleeperCap, setSleeperCap] = useState("");
  const [permitType, setPermitType] = useState("-1");
  const [districtEntering, setDistrictEntering] = useState("-1");
  const [checkpostName, setCheckpostName] = useState("");
  const [purposeVisit, setPurposeVisit] = useState("-1");
  const [aitpValidity, setAitpValidity] = useState("");
  const [aitpAuthValidity, setAitpAuthValidity] = useState("");
  const [taxMode, setTaxMode] = useState("-1");
  const [noPeriods, setNoPeriods] = useState("");
  const [taxFrom, setTaxFrom] = useState("");
  const [taxTo, setTaxTo] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [dateError, setDateError] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const handleGetDetails = () => {
    if (!vehicleNo.trim()) return;
    // Pre-fill fields on Get Details — user can still edit them
    if (!chassisNo) setChassisNo("MBLHA10ANZZM12345");
    if (!ownerName) setOwnerName("JOHN DOE");
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
    if (!totalAmount || parseFloat(totalAmount) <= 0) missing.push("Total Amount");
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
      amount: totalAmount || "0",
    });
    router.push(`/payment/sbi?${params.toString()}`);
  };

  const handleReset = () => {
    setVehicleNo(""); setChassisNo(""); setOwnerName(""); setMobileNo("");
    setFromState("-1"); setVehicleType("-1"); setVehicleClass("-1");
    setSeatingCap(""); setSleeperCap(""); setPermitType("-1");
    setCheckpostName(""); setDistrictEntering("-1"); setPurposeVisit("-1"); setAitpValidity("");
    setAitpAuthValidity(""); setTaxMode("-1"); setNoPeriods("");
    setTaxFrom(""); setTaxTo(""); setTotalAmount(""); setDateError(""); setFormError(""); setShowModal(false);
  };

  const [navOpen, setNavOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

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

          {/* Page heading */}
          <div className="ui-grid-row top-space center-position contents-Space">
            <h1 className="header-main">
              <span style={{color: "#1a6b3a", fontWeight: "bold"}}>BORDER TAX PAYMENT FOR ENTRY INTO</span>
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
                        placeholder="e.g. JH14AB1234"
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

                  {/* Row 2: Chassis No + Owner Name */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Chassis No.</label>
                      </div>
                      <input
                        type="text"
                        className="ui-inputtext"
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
                        className="ui-inputtext"
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
                        <select value={vehicleClass} onChange={(e) => setVehicleClass(e.target.value)}>
                          <option value="-1">---Select Vehicle Class---</option>
                          <option value="1">MOTOR CAB</option>
                          <option value="2">MAXI CAB</option>
                          <option value="3">BUS</option>
                          <option value="4">GOODS VEHICLE (LMV)</option>
                          <option value="5">GOODS VEHICLE (HGV)</option>
                          <option value="6">TRACTOR</option>
                          <option value="7">ARTICULATED VEHICLE</option>
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
                          Seating Cap<span style={{color:"#FF0000"}}>*</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        className="ui-inputtext"
                        value={seatingCap}
                        onChange={(e) => setSeatingCap(e.target.value.replace(/\D/g, ""))}
                        maxLength={2}
                        autoComplete="off"
                      />
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">Sleeper Cap</label>
                      </div>
                      <input
                        type="text"
                        className="ui-inputtext"
                        value={sleeperCap}
                        onChange={(e) => setSleeperCap(e.target.value.replace(/\D/g, ""))}
                        maxLength={2}
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
                          <option value="-1">---Select District/Barrier---</option>
                          <option value="2">ALWAR</option>
                          <option value="3">BANSWARA</option>
                          <option value="28">BARAN</option>
                          <option value="5">BHARATPUR</option>
                          <option value="9">CHITTORGARH</option>
                          <option value="10">CHURU</option>
                          <option value="11">DHOLPUR</option>
                          <option value="12">DUNGARPUR</option>
                          <option value="13">GANGANAGAR</option>
                          <option value="31">HANUMANGARH</option>
                          <option value="14">JAIPUR</option>
                          <option value="16">JALORE</option>
                          <option value="17">JHALAWAR</option>
                          <option value="18">JHUNJHUNU</option>
                          <option value="35">PRATAPGARH</option>
                          <option value="24">SIROHI</option>
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
                      <input
                        type="text"
                        className="ui-inputtext"
                        value={checkpostName}
                        onChange={(e) => setCheckpostName(e.target.value.toUpperCase())}
                        maxLength={80}
                        autoComplete="off"
                        placeholder="e.g. AAKERA MOD, ALWAR"
                      />
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
                        <select value={taxMode} onChange={(e) => setTaxMode(e.target.value)}>
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
                        className="ui-inputtext"
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
                      <div className="ui-calendar">
                        <input
                          type="date"
                          className={`ui-inputtext cp-date-input${dateError && taxFrom > taxTo && taxTo ? " cp-date-error" : ""}`}
                          value={taxFrom}
                          max={taxTo || undefined}
                          onChange={(e) => handleTaxFromChange(e.target.value)}
                          autoComplete="off"
                        />
                      </div>
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Tax Upto Date</label>
                      </div>
                      <div className="ui-calendar">
                        <input
                          type="date"
                          className={`ui-inputtext cp-date-input${dateError && taxFrom > taxTo && taxFrom ? " cp-date-error" : ""}`}
                          value={taxTo}
                          min={taxFrom || undefined}
                          onChange={(e) => handleTaxToChange(e.target.value)}
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

                  {/* Total amount + action buttons */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Total Amount</label>
                      </div>
                      <input
                        type="text"
                        className="ui-inputtext font-bold medium-text-font"
                        value={totalAmount}
                        onChange={(e) => { setTotalAmount(e.target.value.replace(/[^0-9.]/g, "")); setFormError(""); }}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="ui-grid-row">
                        <div className="ui-grid-col-12 top_mar1 mar-left5">
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
                        </div>
                      </div>
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
