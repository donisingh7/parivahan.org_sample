"use client";
import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { uttarPradeshConfig } from "@/lib/states/uttarpradesh/config";

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

const STATE_CODE  = uttarPradeshConfig.code;
const STATE_LABEL = uttarPradeshConfig.label;

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

// UP's 35 border-district options (inspect lines 5527-5563).
const BORDER_DISTRICT_OPTIONS = [
  { value: "",                    label: "---Select Barrier---" },
  { value: "AGRA",                label: "AGRA" },
  { value: "ALIGARH",             label: "ALIGARH" },
  { value: "BAGHPAT",             label: "BAGHPAT" },
  { value: "BAHRAICH",            label: "BAHRAICH" },
  { value: "BALLIA",              label: "BALLIA" },
  { value: "BALRAMPUR",           label: "BALRAMPUR" },
  { value: "BANDA",               label: "BANDA" },
  { value: "BAREILLY",            label: "BAREILLY" },
  { value: "BIJNOR",              label: "BIJNOR" },
  { value: "CHANDAULI",           label: "CHANDAULI" },
  { value: "CHITRAKOOT",          label: "CHITRAKOOT" },
  { value: "DEORIA",              label: "DEORIA" },
  { value: "ETAWAH",              label: "ETAWAH" },
  { value: "GAUTAM BUDDHA NAGAR", label: "GAUTAM BUDDHA NAGAR" },
  { value: "GHAZIABAD",           label: "GHAZIABAD" },
  { value: "GHAZIPUR",            label: "GHAZIPUR" },
  { value: "HAMIRPUR",            label: "HAMIRPUR" },
  { value: "JHANSI",              label: "JHANSI" },
  { value: "KUSHINAGAR",          label: "KUSHINAGAR" },
  { value: "LAKHIMPUR",           label: "LAKHIMPUR" },
  { value: "LALITPUR",            label: "LALITPUR" },
  { value: "MAHARAJGANJ",         label: "MAHARAJGANJ" },
  { value: "MAHOBA",              label: "MAHOBA" },
  { value: "MATHURA",             label: "MATHURA" },
  { value: "MIRZAPUR",            label: "MIRZAPUR" },
  { value: "MUZAFFARNAGAR",       label: "MUZAFFARNAGAR" },
  { value: "ORAI",                label: "ORAI" },
  { value: "PILIBHIT",            label: "PILIBHIT" },
  { value: "PRAYAGRAJ",           label: "PRAYAGRAJ" },
  { value: "RAMPUR",              label: "RAMPUR" },
  { value: "SAHARANPUR",          label: "SAHARANPUR" },
  { value: "SHAMLI",              label: "SHAMLI" },
  { value: "SHRAVASTI",           label: "SHRAVASTI" },
  { value: "SIDDHARTH NAGAR",     label: "SIDDHARTH NAGAR" },
  { value: "SONBHADRA",           label: "SONBHADRA" },
];

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
  const [serviceType,       setServiceType]       = useState("");
  const [taxMode,           setTaxMode]           = useState("");
  const [borderDistrict,    setBorderDistrict]    = useState("");
  const [taxFrom,           setTaxFrom]           = useState("");
  const [taxTo,             setTaxTo]             = useState("");
  const [permitType,        setPermitType]        = useState("");
  const [permitUpto,        setPermitUpto]        = useState("");
  const [permitNumber,      setPermitNumber]      = useState("");
  const [fitnessValidity,   setFitnessValidity]   = useState("");
  const [insuranceValidity, setInsuranceValidity] = useState("");
  const [puccValidity,      setPuccValidity]      = useState("");
  const [totalAmount,       setTotalAmount]       = useState("0");

  const [dateError,   setDateError]   = useState("");
  const [formError,   setFormError]   = useState("");
  const [showModal,   setShowModal]   = useState(false);
  const [navOpen,     setNavOpen]     = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

  const router = useRouter();

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleGetDetails = () => {
    if (!vehicleNo.trim()) return;
    if (!chassisNo) setChassisNo("MMMASF24EFES");
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
      borderDistrict,
      taxFrom,
      taxTo,
      permitType,
      permitUpto,
      permitNumber,
      fitnessValidity,
      insuranceValidity,
      puccValidity,
      amount: totalAmount || "0",
    });
    router.push(`/payment/sbi?${params.toString()}`);
  };

  const handleReset = () => {
    setVehicleNo(""); setChassisNo(""); setOwnerName(""); setMobileNo("");
    setFromState(""); setVehicleType(""); setVehicleCategory(""); setVehicleClass("");
    setSeatingCap(""); setSleeperCap("0"); setServiceType(""); setTaxMode("");
    setBorderDistrict(""); setTaxFrom(""); setTaxTo("");
    setPermitType(""); setPermitUpto(""); setPermitNumber("");
    setFitnessValidity(""); setInsuranceValidity(""); setPuccValidity("");
    setTotalAmount("0");
    setDateError(""); setFormError(""); setShowModal(false);
  };

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
            <strong className="cp-news-highlight">VAHAN UP CP XXXXXXXXXX</strong>)
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      <div className="container-fluid" id="skip-main-content">
        <div className="ui-grid ui-grid-responsive">

          {/* Page heading */}
          <div className="ui-grid-row top-space center-position contents-Space">
            <h1 className="header-main">
              <span style={{ color: uttarPradeshConfig.themeColor, fontWeight: "bold" }}>
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
                        placeholder="e.g. UP14AB1234"
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

                  {/* Row 2: Chassis No. + Owner Name */}
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
                        <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
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
                        <select value={vehicleCategory} onChange={(e) => setVehicleCategory(e.target.value)}>
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
                        <select value={vehicleClass} onChange={(e) => setVehicleClass(e.target.value)}>
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
                        <label className="ui-outputlabel field-label-mandate">Seating Capacity</label>
                      </div>
                      <input
                        type="text"
                        className="ui-inputtext"
                        value={seatingCap}
                        onChange={(e) => setSeatingCap(e.target.value.replace(/\D/g, ""))}
                        maxLength={3}
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
                        maxLength={3}
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

                  {/* Row 6: Border/Barrier District (col-6) + Tax From (col-3) +
                      Tax Upto (col-3) — inspect 5520-5580. */}
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
                        <label className="ui-outputlabel field-label-mandate">Tax From</label>
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
                        <label className="ui-outputlabel field-label-mandate">Tax Upto</label>
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

                  {/* Row 7: Permit Type (col-3) + Permit Upto (col-3) + Permit No. (col-6)
                      — UP-specific (inspect 5581-5610), permit fields are optional. */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">Permit Type</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select value={permitType} onChange={(e) => setPermitType(e.target.value)}>
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
                        className="ui-inputtext"
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

                  {/* Total Amount + buttons (inspect 5666-5683 — col-6 / col-6 split). */}
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
