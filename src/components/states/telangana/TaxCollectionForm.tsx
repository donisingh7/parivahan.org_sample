"use client";
import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { PaymentDateTimeField } from "../shared/TaxDateField";
import { telanganaConfig } from "@/lib/states/telangana/config";

const STATE_CODE  = telanganaConfig.code;
const STATE_LABEL = telanganaConfig.label;

const BASE   = "https://checkpost.parivahan.gov.in";
const LOGO   = `${BASE}/checkpost/faces/javax.faces.resource/checkpost-logo.png?ln=images`;
const EVAHAN = `${BASE}/checkpost/faces/javax.faces.resource/e-vahan-logo.png?ln=images`;

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

const VEHICLE_TYPE_OPTIONS = [
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

// Telangana checkpost / RTO list (district RTOs — refinable with an exact
// web-sourced border-checkpost list later).
const CHECKPOST_OPTIONS = [
  { value: "",                     label: "---Select Checkpost Name---" },
  { value: "HYDERABAD",            label: "HYDERABAD" },
  { value: "RANGAREDDY",           label: "RANGAREDDY" },
  { value: "MEDCHAL-MALKAJGIRI",   label: "MEDCHAL-MALKAJGIRI" },
  { value: "SANGAREDDY",           label: "SANGAREDDY" },
  { value: "NIZAMABAD",            label: "NIZAMABAD" },
  { value: "KARIMNAGAR",           label: "KARIMNAGAR" },
  { value: "WARANGAL",             label: "WARANGAL" },
  { value: "HANAMKONDA",           label: "HANAMKONDA" },
  { value: "KHAMMAM",              label: "KHAMMAM" },
  { value: "NALGONDA",             label: "NALGONDA" },
  { value: "MAHBUBNAGAR",          label: "MAHBUBNAGAR" },
  { value: "ADILABAD",             label: "ADILABAD" },
  { value: "NIRMAL",               label: "NIRMAL" },
  { value: "MANCHERIAL",           label: "MANCHERIAL" },
  { value: "JAGTIAL",              label: "JAGTIAL" },
  { value: "PEDDAPALLI",           label: "PEDDAPALLI" },
  { value: "KOTHAGUDEM",           label: "BHADRADRI KOTHAGUDEM" },
  { value: "SURYAPET",             label: "SURYAPET" },
  { value: "SIDDIPET",             label: "SIDDIPET" },
  { value: "MEDAK",                label: "MEDAK" },
  { value: "VIKARABAD",            label: "VIKARABAD" },
  { value: "WANAPARTHY",           label: "WANAPARTHY" },
  { value: "NAGARKURNOOL",         label: "NAGARKURNOOL" },
  { value: "GADWAL",               label: "JOGULAMBA GADWAL" },
  { value: "KAMAREDDY",            label: "KAMAREDDY" },
  { value: "SIRCILLA",             label: "RAJANNA SIRCILLA" },
  { value: "JANGAON",              label: "JANGAON" },
  { value: "MAHABUBABAD",          label: "MAHABUBABAD" },
  { value: "BHUPALPALLY",          label: "JAYASHANKAR BHUPALPALLY" },
  { value: "MULUGU",               label: "MULUGU" },
  { value: "NARAYANPET",           label: "NARAYANPET" },
  { value: "BHUVANAGIRI",          label: "YADADRI BHUVANAGIRI" },
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
  const router = useRouter();

  // Core vehicle fields
  const [vehicleNo,  setVehicleNo]  = useState("");
  const [chassisNo,  setChassisNo]  = useState("");
  const [ownerName,  setOwnerName]  = useState("");
  const [mobileNo,   setMobileNo]   = useState("");
  const [fromState,  setFromState]  = useState("-1");

  // Text-string inputs (per requirement)
  const [vehicleType,     setVehicleType]     = useState("");
  const [vehicleClass,    setVehicleClass]    = useState("");
  const [checkpostName,   setCheckpostName]   = useState("");
  const [tsLadenWeight,   setTsLadenWeight]   = useState("");
  const [tsUnladenWeight, setTsUnladenWeight] = useState("");
  const [seatingCap,      setSeatingCap]      = useState("");
  const [sleeperCap,      setSleeperCap]      = useState("0");
  const [serviceType,     setServiceType]     = useState("");

  // Dropdown fields
  const [taxMode,       setTaxMode]       = useState("DAILY");
  const [permitType,    setPermitType]    = useState("");
  const [paymentMethod, setPaymentMethod] = useState("ONLINE");

  // Tax window
  const [taxFrom,   setTaxFrom]   = useState("");
  const [taxTo,     setTaxTo]     = useState("");
  const [dateError, setDateError] = useState("");

  // Payment Init Date + Receipt Printing Date (auto = current IST if left blank)
  const [paymentInitDateInput, setPaymentInitDateInput] = useState("");
  const [printedOnInput,       setPrintedOnInput]       = useState("");

  // Two tax fields: MV Tax + Permit fee
  const [mvTax,       setMvTax]       = useState("");
  const [permitFee,   setPermitFee]   = useState("");
  const [totalAmount, setTotalAmount] = useState("");

  // UI state
  const [formError,   setFormError]   = useState("");
  const [showModal,   setShowModal]   = useState(false);
  const [pdfLoading,  setPdfLoading]  = useState(false);
  const [pdfError,    setPdfError]    = useState("");
  const [navOpen,     setNavOpen]     = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

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
      if (d.vehicleClass)    setVehicleClass(d.vehicleClass);
      if (d.seatingCap)      setSeatingCap(d.seatingCap);
      if (d.sleeperCap)      setSleeperCap(d.sleeperCap);
      if (d.grossVehicleWt)  setTsLadenWeight(d.grossVehicleWt);
      if (d.unladenWt)       setTsUnladenWeight(d.unladenWt);
    } catch { setDetailsWarning("VEHICLE DATA DOES NOT EXIST"); }
  };

  const handleTaxFromChange = (val: string) => {
    setTaxFrom(val);
    if (taxTo && val && val > taxTo) setDateError("Tax From Date cannot be after Tax Upto Date.");
    else setDateError("");
  };

  const handleTaxToChange = (val: string) => {
    setTaxTo(val);
    if (taxFrom && val && taxFrom > val) setDateError("Tax Upto Date cannot be before Tax From Date.");
    else setDateError("");
  };

  const handleCalculateTax = () => {
    const mv   = parseFloat(mvTax)     || 0;
    const pf   = parseFloat(permitFee) || 0;
    const sum  = mv + pf;
    setTotalAmount(sum > 0 ? String(sum) : "");
    if (sum <= 0) setFormError("Please enter at least one tax amount.");
    else setFormError("");
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
    if (!totalAmount || parseFloat(totalAmount) <= 0) missing.push("Tax (calculate first)");
    if (missing.length > 0) {
      setFormError(`Please fill: ${missing.join(", ")}`);
      return;
    }
    setShowModal(true);
  };

  const handleConfirmPayment = () => {
    const params = new URLSearchParams({
      state:          STATE_CODE,
      vehicleNo,
      ownerName,
      chassisNo,
      mobileNo,
      fromState,
      vehicleType,
      vehicleClass,
      checkpostName,
      taxMode,
      serviceType,
      tsLadenWeight,
      tsUnladenWeight,
      seatingCap,
      sleeperCap,
      paymentMethod,
      permitType,
      tsMvTax:    mvTax     || "0",
      tsPermitFee: permitFee || "0",
      taxFrom,
      taxTo,
      amount: totalAmount || "0",
      paymentInitDate: paymentInitDateInput || nowIST(),
      printedOn:       printedOnInput,
    });
    router.push(`/payment/sbi?${params.toString()}`);
  };

  const handleReset = () => {
    setVehicleNo(""); setChassisNo(""); setOwnerName(""); setMobileNo("");
    setFromState("-1"); setVehicleType(""); setVehicleClass(""); setCheckpostName("");
    setTsLadenWeight(""); setTsUnladenWeight(""); setSeatingCap(""); setSleeperCap("0"); setServiceType("");
    setTaxMode("DAILY"); setPermitType(""); setPaymentMethod("ONLINE");
    setTaxFrom(""); setTaxTo(""); setMvTax(""); setPermitFee(""); setTotalAmount("");
    setPaymentInitDateInput(""); setPrintedOnInput("");
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
    const receiptNo = `TST${yy}${mm}${dd2}${rand}`;
    const transactionId = `TXN${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2,6).toUpperCase()}`;
    setPdfLoading(true);
    try {
      const res = await fetch("/api/payment", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, state: STATE_CODE, visitingState: STATE_CODE, vehicleNo, chassisNo, ownerName, mobileNo, fromState, vehicleType, vehicleClass, checkpostName, taxMode, serviceType, tsLadenWeight, tsUnladenWeight, paymentMethod, permitType, tsMvTax: parseFloat(mvTax)||0, tsPermitFee: parseFloat(permitFee)||0, taxFrom, taxTo, amount: parseFloat(totalAmount)||0, receiptNo, orderRef: String(Math.floor(Math.random()*900000000000+100000000000)), noOfPeriods:1, seatingCap, sleeperCap, paymentInitDate: paymentInitDateInput || nowIST(), printedOn: printedOnInput }) });
      const json = await res.json().catch(()=>({}));
      if (!res.ok || !json.success) throw new Error(json.message||"Failed to save transaction");
      const savedId = json.transactionId || transactionId;
      const link = document.createElement("a"); link.href=`/api/receipt/${savedId}?state=TS&download=1`; link.download=`receipt_${savedId}.pdf`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch(err) { setPdfError(err instanceof Error ? err.message : "PDF download failed."); }
    finally { setPdfLoading(false); }
  };

  const isGoodsVehicle = vehicleType === "GOODS VEHICLE";

  return (
    <div id="masterlaoyoutbody">

      {/* Top bar */}
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

      {/* Header logos */}
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

      {/* Navbar */}
      <nav className="cp-navbar" id="navbar">
        <div className="container-fluid">
          <div className="cp-navbar-inner">
            <button className="cp-nav-toggler" onClick={() => setNavOpen(!navOpen)} aria-label="Toggle navigation">
              <i className="fa fa-bars"></i>
            </button>
            <div className={`cp-nav-collapse${navOpen ? " open" : ""}`}>
              <ul className="nav-list">
                <li><a href="https://parivahan.gov.in/" className="active"><i className="fa fa-home"></i> Home</a></li>
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
                  <a href="#"><i className="fa fa-print"></i> Reports ▾</a>
                  {reportsOpen && (
                    <div className="cp-dropdown-menu">
                      <a href={`${BASE}/checkpost/faces/public/reports/PaymentReceipt.xhtml`}>▶ Print Payment Receipt</a>
                      <a href={`${BASE}/checkpost/faces/public/reports/CheckReceiptDetails.xhtml`}>▶ Check Receipt Details</a>
                    </div>
                  )}
                </li>
              </ul>
            </div>
            <a href={`${BASE}/checkpost/faces/admin/pages/login.xhtml`} className="login-btn">Log In</a>
          </div>
        </div>
      </nav>

      {/* News ticker */}
      <div className="cp-news-bar">
        <div className="container-fluid cp-news-scroll-wrap">
          <div className="cp-news-scroll">
            Verify the validity of the receipt by sending sms&nbsp;
            <strong className="cp-news-highlight">VAHAN TS CP &lt;VEHICLE NO&gt;</strong>
            &nbsp;to 7738299899
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="container-fluid" id="skip-main-content">
        <div className="ui-grid ui-grid-responsive">

          {/* Back to state selection */}
          <div className="ui-grid-row" style={{ padding: "8px 0 0 8px" }}>
            <a href="/checkpost" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#1565C0", fontWeight: 600, fontSize: "14px", textDecoration: "none" }}>
              ← Back to State Selection
            </a>
          </div>

          <div className="ui-grid-row top-space center-position contents-Space">
            <h1 className="header-main">
              <span style={{ color: "#a83232", fontWeight: "bold" }}>BORDER TAX PAYMENT FOR ENTRY INTO</span>
              <span className="red"> {STATE_LABEL}</span>
            </h1>
          </div>

          <div className="ui-grid-row">
            <div className="ui-grid-col-12 center-position contents-Space"></div>
          </div>

          {/* Tax Payment Panel */}
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
                      <input type="text" className="ui-inputtext" maxLength={10}
                        value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                        autoComplete="off" placeholder="e.g. TS09AB1234" />
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="ui-grid-row">
                        <div className="ui-grid-col-12 top_mar1 mar-left5">
                          <button className="ui-button" type="button" onClick={handleGetDetails}>
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

                  {/* Row 2: Owner Name + Chassis No */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Owner Name</label>
                      </div>
                      <input type="text" className="ui-inputtext input-autofilled"
                        value={ownerName} onChange={(e) => setOwnerName(e.target.value.toUpperCase())}
                        maxLength={50} autoComplete="off" />
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Chassis No.</label>
                      </div>
                      <input type="text" className="ui-inputtext input-autofilled"
                        value={chassisNo} onChange={(e) => setChassisNo(e.target.value.toUpperCase())}
                        maxLength={30} autoComplete="off" />
                    </div>
                  </div>

                  {/* Row 3: Mobile No + From State */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Mobile No.</label>
                      </div>
                      <input type="text" className="ui-inputtext" maxLength={10}
                        value={mobileNo} onChange={(e) => setMobileNo(e.target.value)}
                        autoComplete="off" placeholder="SMS receipt will be sent here" />
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">From State</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select value={fromState} onChange={(e) => setFromState(e.target.value)} autoComplete="off">
                          {allStates.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Vehicle Type + Vehicle Class (text string) */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Vehicle Type</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className="select-autofilled">
                          {VEHICLE_TYPE_OPTIONS.map((t) => (
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
                        <select value={vehicleClass} onChange={(e) => setVehicleClass(e.target.value)} className="select-autofilled">
                          {VEHICLE_CLASS_OPTIONS.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 5: Checkpost Name (text string) + Service Type (text string) */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">CheckPost Name</label>
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
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">Service Type</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
                          <option value="">---Select Service Type---</option>
                          <option value="NOT APPLICABLE">NOT APPLICABLE</option>
                          <option value="ORDINARY">ORDINARY</option>
                          <option value="AIR CONDITIONED">AIR CONDITIONED</option>
                          <option value="DELUXE AIR CONDITIONED">DELUXE AIR CONDITIONED</option>
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 6: [Seating Cap / Laden Wt] + [Sleeper Cap / Unladen Wt] */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">
                          {isGoodsVehicle ? "Laden Wt. (In Kg)" : "Seating Capacity"}
                        </label>
                      </div>
                      <input type="text" className="ui-inputtext input-autofilled"
                        value={isGoodsVehicle ? tsLadenWeight : seatingCap}
                        onChange={(e) => isGoodsVehicle
                          ? setTsLadenWeight(e.target.value)
                          : setSeatingCap(e.target.value.replace(/\D/g, ""))}
                        maxLength={20} autoComplete="off" placeholder="e.g. 5000" />
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">
                          {isGoodsVehicle ? "Unladen Wt. (In Kg)" : "Sleeper Cap"}
                        </label>
                      </div>
                      <input type="text" className="ui-inputtext input-autofilled"
                        value={isGoodsVehicle ? tsUnladenWeight : sleeperCap}
                        onChange={(e) => isGoodsVehicle
                          ? setTsUnladenWeight(e.target.value)
                          : setSleeperCap(e.target.value.replace(/\D/g, ""))}
                        maxLength={20} autoComplete="off" placeholder="e.g. 2000" />
                    </div>
                  </div>

                  {/* Row 7: Permit Type (dropdown) + Payment Mode (dropdown) */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Permit Type</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select value={permitType} onChange={(e) => setPermitType(e.target.value)}>
                          <option value="">---Select Permit Type---</option>
                          <option value="TEMPORARY PERMIT">TEMPORARY PERMIT</option>
                          <option value="TOURIST PERMIT">TOURIST PERMIT</option>
                          <option value="SEPECIAL PERMIT">SEPECIAL PERMIT</option>
                          <option value="NOT APPLICABLE">NOT APPLICABLE</option>
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Payment Mode</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                          <option value="ONLINE">ONLINE</option>
                          <option value="CASH">CASH</option>
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 8: Tax From + Tax Upto dates */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Tax From Date</label>
                      </div>
                      <div className="ui-calendar">
                        <input type="date"
                          className={`ui-inputtext cp-date-input${dateError && taxFrom > taxTo && taxTo ? " cp-date-error" : ""}`}
                          value={taxFrom} max={taxTo || undefined}
                          onChange={(e) => handleTaxFromChange(e.target.value)} autoComplete="off" />
                      </div>
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Tax Upto Date</label>
                      </div>
                      <div className="ui-calendar">
                        <input type="date"
                          className={`ui-inputtext cp-date-input${dateError && taxFrom > taxTo && taxFrom ? " cp-date-error" : ""}`}
                          value={taxTo} min={taxFrom || undefined}
                          onChange={(e) => handleTaxToChange(e.target.value)} autoComplete="off" />
                      </div>
                    </div>
                  </div>

                  {/* Date error */}
                  {dateError && (
                    <div className="ui-grid-row">
                      <div className="ui-grid-col-12">
                        <div className="cp-date-err-msg">{dateError}</div>
                      </div>
                    </div>
                  )}

                  {/* Tax table with Tax Mode dropdown in header */}
                  <br />
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-12">
                      <div className="ui-datatable">
                        <table role="grid">
                          <thead>
                            <tr>
                              <th className="collumn-width">Sl. No.</th>
                              <th>Particulars</th>
                              <th>Tax Mode</th>
                              <th>Tax/Fees (Rs.)</th>
                              <th>Fine (Rs.)</th>
                              <th>Total (Rs.)</th>
                            </tr>
                          </thead>
                          <tbody className="ui-datatable-data">
                            {totalAmount && parseFloat(totalAmount) > 0 ? (
                              <>
                                <tr>
                                  <td>1</td>
                                  <td>MV Tax</td>
                                  <td rowSpan={2}>
                                    <div className="ui-selectonemenu" style={{ minWidth: "110px" }}>
                                      <select value={taxMode} onChange={(e) => setTaxMode(e.target.value)}>
                                        <option value="DAILY">DAILY</option>
                                        <option value="WEEKLY">WEEKLY</option>
                                        <option value="MONTHLY">MONTHLY</option>
                                      </select>
                                      <span className="ui-selectonemenu-arrow">▼</span>
                                    </div>
                                  </td>
                                  <td>{mvTax || "0"}</td>
                                  <td>0</td>
                                  <td>{mvTax || "0"}</td>
                                </tr>
                                <tr>
                                  <td>2</td>
                                  <td>Permit fee</td>
                                  <td>{permitFee || "0"}</td>
                                  <td>0</td>
                                  <td>{permitFee || "0"}</td>
                                </tr>
                              </>
                            ) : (
                              <tr className="ui-datatable-empty-message">
                                <td colSpan={6}>Enter tax amounts and click Calculate Tax.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Form error */}
                  {formError && (
                    <div className="ui-grid-row">
                      <div className="ui-grid-col-12">
                        <div className="cp-date-err-msg">{formError}</div>
                      </div>
                    </div>
                  )}

                  {/* Payment Init Date + Receipt Printing Date */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">Payment Init Date</label>
                      </div>
                      <PaymentDateTimeField value={paymentInitDateInput} onChange={setPaymentInitDateInput} />
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">Receipt Printing Date</label>
                      </div>
                      <PaymentDateTimeField value={printedOnInput} onChange={setPrintedOnInput} />
                    </div>
                  </div>

                  {/* MV Tax + Permit fee + Total + buttons */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">MV Tax (Rs.)</label>
                      </div>
                      <input
                        type="number"
                        className="ui-inputtext"
                        value={mvTax}
                        onChange={(e) => { setMvTax(e.target.value.replace(/[^0-9.]/g, "")); setFormError(""); }}
                        placeholder="Enter MV Tax"
                        min="0"
                      />
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Permit fee (Rs.)</label>
                      </div>
                      <input
                        type="number"
                        className="ui-inputtext"
                        value={permitFee}
                        onChange={(e) => { setPermitFee(e.target.value.replace(/[^0-9.]/g, "")); setFormError(""); }}
                        placeholder="Enter Permit fee"
                        min="0"
                      />
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Total Amount (Rs.)</label>
                      </div>
                      <input
                        type="text"
                        className="ui-inputtext font-bold medium-text-font"
                        value={totalAmount}
                        readOnly
                        placeholder="0.00"
                        style={{ background: "#f5f5f5" }}
                      />
                    </div>
                  </div>

                  {/* Action buttons — single spaced row */}
                  <div className="ui-grid-row">
                    <div
                      className="ui-grid-col-12 top_mar1"
                      style={{ display: "flex", flexWrap: "wrap", gap: "14px", justifyContent: "center", marginTop: "16px" }}
                    >
                      <button className="ui-button" type="button" onClick={handleCalculateTax}>
                        <i className="fa fa-calculator"></i>
                        <span className="ui-button-text">Calculate Tax</span>
                      </button>
                      <button className="ui-button" type="button" onClick={handlePayTax}>
                        <i className="fa fa-forward"></i>
                        <span className="ui-button-text">Pay Tax</span>
                      </button>
                      <button className="ui-button" type="button" onClick={handleReset}>
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

      {/* Confirmation Modal */}
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
                    <td><span className="small-text-font">Chassis No.</span></td>
                    <td><span className="small-text-font">:</span></td>
                    <td><span className="small-text-font">{chassisNo}</span></td>
                  </tr>
                  <tr>
                    <td><span className="small-text-font">Vehicle Type</span></td>
                    <td><span className="small-text-font">:</span></td>
                    <td><span className="small-text-font">{vehicleType}</span></td>
                  </tr>
                  <tr>
                    <td><span className="small-text-font">Permit Type</span></td>
                    <td><span className="small-text-font">:</span></td>
                    <td><span className="small-text-font">{permitType || "NOT APPLICABLE"}</span></td>
                  </tr>
                  <tr>
                    <td><span className="small-text-font">Tax Mode</span></td>
                    <td><span className="small-text-font">:</span></td>
                    <td><span className="small-text-font">{taxMode}</span></td>
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
                    <td><span className="small-text-font">MV Tax</span></td>
                    <td><span className="small-text-font">:</span></td>
                    <td><span className="small-text-font">Rs. {mvTax || "0"}/-</span></td>
                  </tr>
                  <tr>
                    <td><span className="small-text-font">Permit fee</span></td>
                    <td><span className="small-text-font">:</span></td>
                    <td><span className="small-text-font">Rs. {permitFee || "0"}/-</span></td>
                  </tr>
                  <tr>
                    <td><span className="small-text-font-bold">Total Amount</span></td>
                    <td><span className="small-text-font-bold">:</span></td>
                    <td><span className="small-text-font-bold">Rs. {totalAmount || "0"}/-</span></td>
                  </tr>
                  <tr>
                    <td><span className="small-text-font">Payment Mode</span></td>
                    <td><span className="small-text-font">:</span></td>
                    <td><span className="small-text-font">{paymentMethod}</span></td>
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
