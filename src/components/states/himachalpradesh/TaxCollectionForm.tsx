"use client";
import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { himachalPradeshConfig } from "@/lib/states/himachalpradesh/config";

/**
 * Himachal Pradesh checkpost border-tax collection form.
 *
 * Mirrors the GOVERNMENT OF HIMACHAL PRADESH Department of Transport
 * "Tax Payment Details" page (hp_dashboards.aspx) layout, fields and
 * dropdown options exactly (README.txt lines 3990-4400):
 *   1.  Vehicle No. + Get Details button
 *   2.  Chassis No. + Owner Name
 *   3.  Mobile No. + From State
 *   4.  Vehicle Type + Vehicle Category + Vehicle Class + Service Type
 *   5.  Seating Capacity + Sleeper Cap + Fuel Type + Tax Mode
 *   6.  Border/Barrier District + Fitness Validity + Insurance Validity
 *   7.  PUCC Validity + Tax From Date + Tax Upto Date
 *   8.  (empty tax breakup table — populated server-side at receipt time)
 *   9.  Total Amount + Service/User Charge + Cess + Calculate/Pay/Reset
 *
 * The dropdown values are the exact strings the inspect HTML uses
 * (TRANSPORT, MOTOR CYCLE, BAROTIWALA, PETROL, …) so what the user picks
 * is what gets stored in Mongo and printed on the receipt.
 */

const STATE_CODE  = himachalPradeshConfig.code;
const STATE_LABEL = himachalPradeshConfig.label;

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

// HP-specific Fuel Type dropdown (inspect lines 4210-4216).
const FUEL_TYPE_OPTIONS = [
  { value: "",       label: "---Select Fule Type---" },
  { value: "PETROL", label: "PETROL" },
  { value: "DIESEL", label: "DIESEL" },
  { value: "CNG",    label: "CNG" },
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

// HP's twelve border-district options (inspect lines 4246-4257).
const BORDER_DISTRICT_OPTIONS = [
  { value: "",             label: "---Select District/Barrier---" },
  { value: "BADDI",        label: "BADDI" },
  { value: "BAROTIWALA",   label: "BAROTIWALA" },
  { value: "DAMTAL",       label: "DAMTAL" },
  { value: "GAGRET",       label: "GAGRET" },
  { value: "KALAAMB",      label: "KALAAMB" },
  { value: "KANDWAL",      label: "KANDWAL" },
  { value: "MEHATPUR",     label: "MEHATPUR" },
  { value: "PAONTA SAHIB", label: "PAONTA SAHIB" },
  { value: "PARWANOO",     label: "PARWANOO" },
  { value: "SWARGAHT",     label: "SWARGAHT" },
  { value: "TIPRA",        label: "TIPRA" },
  { value: "TUNUHATTI",    label: "TUNUHATTI" },
];

function TaxCollectionContent() {
  const stateCode  = STATE_CODE;
  const stateLabel = STATE_LABEL;

  // ── Form state (one piece per HP input) ────────────────────────────────
  const [vehicleNo,         setVehicleNo]         = useState("");
  const [chassisNo,         setChassisNo]         = useState("");
  const [ownerName,         setOwnerName]         = useState("");
  const [mobileNo,          setMobileNo]          = useState("");
  const [fromState,         setFromState]         = useState("");
  const [vehicleType,       setVehicleType]       = useState("");
  const [vehicleCategory,   setVehicleCategory]   = useState("");
  const [vehicleClass,      setVehicleClass]      = useState("");
  const [serviceType,       setServiceType]       = useState("");
  const [seatingCap,        setSeatingCap]        = useState("");
  const [sleeperCap,        setSleeperCap]        = useState("0");
  const [grossVehicleWt,    setGrossVehicleWt]    = useState("");
  const [unladenWt,         setUnladenWt]         = useState("");
  const [fuelType,          setFuelType]          = useState("");
  const [taxMode,           setTaxMode]           = useState("");
  const [borderDistrict,    setBorderDistrict]    = useState("");
  const [fitnessValidity,   setFitnessValidity]   = useState("");
  const [insuranceValidity, setInsuranceValidity] = useState("");
  const [puccValidity,      setPuccValidity]      = useState("");
  const [taxFrom,           setTaxFrom]           = useState("");
  const [taxTo,             setTaxTo]             = useState("");
  const [taxFromTime,       setTaxFromTime]       = useState("00:00");
  const [taxToTime,         setTaxToTime]         = useState("23:59");
  const [specialRoadTax,    setSpecialRoadTax]    = useState("0");
  const [userCharge,        setUserCharge]        = useState("0");
  const [infraCess,         setInfraCess]         = useState("0");
  const [calculatedTotal,   setCalculatedTotal]   = useState("");

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
    if (!vehicleNo.trim())                              missing.push("Vehicle No.");
    if (!taxFrom)                                       missing.push("Tax From Date");
    if (!taxTo)                                         missing.push("Tax Upto Date");
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
      state:             stateCode,
      vehicleNo,
      ownerName,
      chassisNo,
      mobileNo,
      fromState,
      vehicleType,
      vehicleCategory,
      vehicleClass,
      serviceType,
      seatingCap,
      sleeperCap,
      fuelType,
      taxMode,
      borderDistrict,
      fitnessValidity,
      insuranceValidity,
      puccValidity,
      taxFrom,
      taxFromTime,
      taxTo,
      taxToTime,
      amount:     calculatedTotal || "0",
      userCharge: userCharge  || "0",
      infraCess:  infraCess   || "0",
    });
    router.push(`/payment/sbi?${params.toString()}`);
  };

  const handleReset = () => {
    setVehicleNo(""); setChassisNo(""); setOwnerName(""); setMobileNo("");
    setFromState(""); setVehicleType(""); setVehicleCategory(""); setVehicleClass("");
    setServiceType(""); setSeatingCap(""); setSleeperCap("0"); setGrossVehicleWt(""); setUnladenWt(""); setFuelType("");
    setTaxMode(""); setBorderDistrict("");
    setFitnessValidity(""); setInsuranceValidity(""); setPuccValidity("");
    setTaxFrom(""); setTaxTo(""); setTaxFromTime("00:00"); setTaxToTime("23:59");
    setSpecialRoadTax("0"); setUserCharge("0"); setInfraCess("0"); setCalculatedTotal("");
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
    if (!calculatedTotal || parseFloat(calculatedTotal) <= 0) missing.push("Total Amount (Calculate Tax first)");
    if (missing.length > 0) { setPdfError(`Please fill the following before downloading: ${missing.join(", ")}`); return; }
    const d = new Date(); const yy = String(d.getFullYear()).slice(2); const mm = String(d.getMonth()+1).padStart(2,"0"); const dd2 = String(d.getDate()).padStart(2,"0");
    const rand = Math.floor(Math.random()*9000000+1000000);
    const receiptNo = `HPR${yy}${mm}${dd2}${rand}`;
    const transactionId = `TXN${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2,6).toUpperCase()}`;
    setPdfLoading(true);
    try {
      const res = await fetch("/api/payment", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, state: stateCode, visitingState: stateCode, vehicleNo, chassisNo, ownerName, mobileNo, fromState, vehicleType, vehicleCategory, vehicleClass, serviceType, seatingCap, sleeperCap, fuelType, taxMode, borderDistrict, fitnessValidity, insuranceValidity, puccValidity, taxFrom, taxFromTime, taxTo, taxToTime, amount: parseFloat(calculatedTotal)||0, userCharge: userCharge||"0", infraCess: infraCess||"0", receiptNo, orderRef: `CPT${vehicleNo.replace(/\s/g,"").toUpperCase()}${Date.now().toString().slice(-8)}`, noOfPeriods:1, grossVehicleWt, unladenWt }) });
      const json = await res.json().catch(()=>({}));
      if (!res.ok || !json.success) throw new Error(json.message||"Failed to save transaction");
      const savedId = json.transactionId || transactionId;
      const link = document.createElement("a"); link.href=`/api/receipt/${savedId}?state=HP&download=1`; link.download=`receipt_${savedId}.pdf`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
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
            <strong className="cp-news-highlight">VAHAN HP CP XXXXXXXXXX</strong>)
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      <div className="container-fluid" id="skip-main-content">
        <div className="ui-grid ui-grid-responsive">

          {/* Page heading */}
          <div className="ui-grid-row top-space center-position contents-Space">
            <h1 className="header-main">
              <span style={{ color: himachalPradeshConfig.themeColor, fontWeight: "bold" }}>
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
                        placeholder="e.g. HP14AB1234"
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

                  {/* Row 4: Vehicle Type + Vehicle Category + Vehicle Class + Service Type
                      (HP groups all four into a single row of col-3 cells per inspect 4109-4188) */}
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
                    <div className="ui-grid-col-3">
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
                  </div>

                  {/* Row 5: Seating Capacity + Sleeper Cap + Fuel Type + Tax Mode
                      (matches inspect 4189-4237 four-column layout) */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-3">
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
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Fule Type</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select value={fuelType} onChange={(e) => setFuelType(e.target.value)}>
                          {FUEL_TYPE_OPTIONS.map((f) => (
                            <option key={f.value} value={f.value}>{f.label}</option>
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

                  {/* Row 6: Border/Barrier District (col-6) + Fitness Validity (col-3) +
                      Insurance Validity (col-3) — inspect 4238-4280. */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Border/Barrier District through Entering</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select value={borderDistrict} onChange={(e) => setBorderDistrict(e.target.value)}>
                          {BORDER_DISTRICT_OPTIONS.map((d) => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
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
                  </div>

                  {/* Row 7: PUCC Validity (col-6) + Tax From (col-3) + Tax Upto (col-3) */}
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
                      <div className="ui-calendar" style={{ marginTop: "4px" }}>
                        <input
                          type="time"
                          className="ui-inputtext cp-date-input"
                          value={taxFromTime}
                          onChange={(e) => setTaxFromTime(e.target.value)}
                          autoComplete="off"
                        />
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
                        />
                      </div>
                      <div className="ui-calendar" style={{ marginTop: "4px" }}>
                        <input
                          type="time"
                          className="ui-inputtext cp-date-input"
                          value={taxToTime}
                          onChange={(e) => setTaxToTime(e.target.value)}
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

                  {/* Tax breakup table (placeholder) */}
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

                  {/* Service/User Charge + Cess + Special Road Tax + buttons */}
                  <div className="ui-grid-row">
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
                      />
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Special Road Tax.</label>
                      </div>
                      <input
                        type="text"
                        className="ui-inputtext font-bold medium-text-font"
                        value={specialRoadTax}
                        onChange={(e) => { setSpecialRoadTax(e.target.value.replace(/[^0-9.]/g, "")); setCalculatedTotal(""); setFormError(""); }}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="ui-grid-row">
                        <div className="ui-grid-col-12 top_mar1 mar-left5">
                          <button
                            className="ui-button"
                            type="button"
                            onClick={() => {
                              const total = (parseFloat(userCharge)||0) + (parseFloat(infraCess)||0) + (parseFloat(specialRoadTax)||0);
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

                  {/* Calculated total box — appears after Calculate Tax is clicked */}
                  {calculatedTotal && (
                    <div className="ui-grid-row" style={{ marginTop: "10px" }}>
                      <div className="ui-grid-col-12">
                        <div style={{
                          background: "#e8f4fd",
                          border: "1.5px solid #87CEEB",
                          borderRadius: "4px",
                          padding: "10px 16px",
                          fontSize: "15px",
                          fontWeight: "bold",
                          color: "#003366",
                        }}>
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
