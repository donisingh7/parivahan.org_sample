"use client";
import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { TaxDateField, PaymentDateTimeField } from "../shared/TaxDateField";
import { andhraPradeshConfig } from "@/lib/states/andhrapradesh/config";

const STATE_CODE  = andhraPradeshConfig.code;
const STATE_LABEL = andhraPradeshConfig.label;

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
  { value: "",               label: "-- Select Vehicle Type --" },
  { value: "TRANSPORT",      label: "TRANSPORT" },
  { value: "NOT APPLICABLE", label: "NOT APPLICABLE" },
];

const VEHICLE_CATEGORY_OPTIONS = [
  { value: "",                                     label: "-- Select Vehicle Category --" },
  { value: "CONTRACT CARRIAGE/PASSENGER VEHICLES", label: "CONTRACT CARRIAGE/PASSENGER VEHICLES" },
  { value: "PRIVATE SERVICE VEHICLE",              label: "PRIVATE SERVICE VEHICLE" },
  { value: "GOODS VEHICLE",                        label: "GOODS VEHICLE" },
  { value: "STAGE CARRIAGE",                       label: "STAGE CARRIAGE" },
  { value: "CONSTRUCTION EQUIPMENT VEHICLE",       label: "CONSTRUCTION EQUIPMENT VEHICLE" },
  { value: "TEMPORARY REGISTERED VEHICLE",         label: "TEMPORARY REGISTERED VEHICLE" },
];

const CHECKPOST_OPTIONS = [
  "ICHCHAPURAM", "JEELUGUMILLI", "PANCHALINGALA", "PENUKONDA", "SUNNIPENTA",
  "THIRUVURU", "GARIKAPADU", "PALAMANERU", "TADA", "BV PALEM",
  "RENIGUNTA", "NARAHARIPET", "DACHEPALLI", "MACHARLA", "BENDAPUDI",
];

const TAX_ROW_NAMES = [
  "Permit Fee",
  "MV Tax",
  "Service/User Charge",
  "Tax Token Fee",
];

interface TaxRow {
  fees: string;
  fine: string;
}

const emptyRow = (): TaxRow => ({ fees: "0", fine: "0" });

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

// Extracts { yy, mm, dd, yyyy } from a "DD-MMM-YYYY HH:MM:SS AP" string (the
// canonical Payment Init Date format) so receiptNo/bankRef can be derived
// from the payment date the user actually picked, not the current moment.
function parseInitDateParts(s: string): { yy: string; mm: string; dd: string; yyyy: string } | null {
  const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const m = s.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})/);
  if (!m) return null;
  const mi = MONTHS.indexOf(m[2].toUpperCase());
  if (mi === -1) return null;
  return { dd: m[1], mm: String(mi + 1).padStart(2, "0"), yyyy: m[3], yy: m[3].slice(2) };
}

function TaxCollectionContent() {
  const stateCode  = STATE_CODE;
  const stateLabel = STATE_LABEL;
  const router     = useRouter();

  // ── Vehicle / owner fields ──────────────────────────────────────────────
  const [vehicleNo,        setVehicleNo]        = useState("");
  const [chassisNo,        setChassisNo]        = useState("");
  const [ownerName,        setOwnerName]        = useState("");
  const [mobileNo,         setMobileNo]         = useState("");
  const [fromState,        setFromState]        = useState("-1");

  // ── Vehicle classification ──────────────────────────────────────────────
  const [vehicleType,      setVehicleType]      = useState("");
  const [vehicleClass,     setVehicleClass]     = useState("");
  const [vehicleCategory,  setVehicleCategory]  = useState("");

  // ── Checkpost / permit ──────────────────────────────────────────────────
  const [checkpostName,    setCheckpostName]    = useState("");
  const [permitType,       setPermitType]       = useState("-1");
  const [permitValidity,   setPermitValidity]   = useState("");
  const [taxMode,          setTaxMode]          = useState("");
  const [paymentMode,      setPaymentMode]      = useState("Online");

  // ── Weight fields (AP-specific) ─────────────────────────────────────────
  const [grossVehicleWt,   setGrossVehicleWt]   = useState("");
  const [unladenWt,        setUnladenWt]        = useState("");
  const [seatingCap,       setSeatingCap]       = useState("");
  const [sleeperCap,       setSleeperCap]       = useState("0");

  // ── Validity dates ──────────────────────────────────────────────────────
  const [fitnessValidity,   setFitnessValidity]   = useState("");
  const [insuranceValidity, setInsuranceValidity] = useState("");
  const [puccValidity,      setPuccValidity]      = useState("");

  // ── AP-specific string fields ───────────────────────────────────────────
  const [serviceType,      setServiceType]      = useState("");
  const [nameOfGoods,      setNameOfGoods]      = useState("");
  const [route,            setRoute]            = useState("");

  // ── Tax / date fields ───────────────────────────────────────────────────
  const [taxFrom,          setTaxFrom]          = useState("");
  const [taxTo,            setTaxTo]            = useState("");

  // Payment Init / Conf / Printed On (auto = current IST if left blank)
  const [paymentInitDateInput, setPaymentInitDateInput] = useState("");
  const [paymentConfDateInput, setPaymentConfDateInput] = useState("");
  const [printedOnInput,       setPrintedOnInput]       = useState("");

  // ── 4 editable tax rows ─────────────────────────────────────────────────
  const [taxRows, setTaxRows] = useState<TaxRow[]>([
    emptyRow(), emptyRow(), emptyRow(), emptyRow(),
  ]);

  const [totalAmount, setTotalAmount] = useState("");
  const [dateError,   setDateError]   = useState("");
  const [formError,   setFormError]   = useState("");
  const [showModal,   setShowModal]   = useState(false);
  const [pdfLoading,  setPdfLoading]  = useState(false);
  const [pdfError,    setPdfError]    = useState("");

  const [navOpen,     setNavOpen]     = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

  // ── Helpers ──────────────────────────────────────────────────────────────
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
    if (taxTo && val && val > taxTo) setDateError("Tax From Date cannot be after Tax Upto Date.");
    else setDateError("");
  };

  const handleTaxToChange = (val: string) => {
    setTaxTo(val);
    if (taxFrom && val && taxFrom > val) setDateError("Tax Upto Date cannot be before Tax From Date.");
    else setDateError("");
  };

  const updateTaxRow = (idx: number, field: "fees" | "fine", val: string) => {
    setTaxRows(rows => rows.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  };

  const handleCalculateTax = () => {
    const sum = taxRows.reduce((acc, row) => {
      const fees = parseFloat(row.fees) || 0;
      const fine = parseFloat(row.fine) || 0;
      return acc + fees + fine;
    }, 0);
    setTotalAmount(String(sum));
    setFormError("");
  };

  const handlePayTax = () => {
    setFormError("");
    if (dateError) return;
    const missing: string[] = [];
    if (!vehicleNo.trim())                        missing.push("Registration No.");
    if (!taxFrom)                                 missing.push("Tax From Date");
    if (!taxTo)                                   missing.push("Tax Upto Date");
    if (!totalAmount || parseFloat(totalAmount) <= 0) missing.push("Total Amount");
    if (missing.length > 0) {
      setFormError(`Please fill the following before paying: ${missing.join(", ")}`);
      return;
    }
    setShowModal(true);
  };

  const handleConfirmPayment = () => {
    const apTaxItems = taxRows.map((r, i) => ({
      particular: TAX_ROW_NAMES[i],
      fees:       parseFloat(r.fees) || 0,
      fine:       parseFloat(r.fine) || 0,
      total:      (parseFloat(r.fees) || 0) + (parseFloat(r.fine) || 0),
    }));

    const params = new URLSearchParams({
      state:            stateCode,
      vehicleNo,
      ownerName,
      chassisNo,
      mobileNo,
      fromState,
      vehicleType,
      vehicleClass,
      vehicleCategory,
      permitType,
      checkpostName,
      taxMode,
      paymentMethod:    paymentMode,
      taxFrom,
      taxTo,
      grossVehicleWt,
      unladenWt,
      seatingCap,
      sleeperCap,
      fitnessValidity,
      insuranceValidity,
      puccValidity,
      serviceType,
      nameOfGoods,
      route,
      permitUpto:       permitValidity,
      apTaxItemsJson:   JSON.stringify(apTaxItems),
      amount:           totalAmount || "0",
      paymentInitDate:  paymentInitDateInput || nowIST(),
      paymentConfDate:  paymentConfDateInput,
      printedOn:        printedOnInput,
    });
    router.push(`/payment/sbi?${params.toString()}`);
  };

  const handleReset = () => {
    setVehicleNo(""); setChassisNo(""); setOwnerName(""); setMobileNo("");
    setFromState("-1"); setVehicleType(""); setVehicleClass("");
    setVehicleCategory(""); setCheckpostName(""); setPermitType("-1");
    setPermitValidity(""); setTaxMode(""); setPaymentMode("Online");
    setGrossVehicleWt(""); setUnladenWt(""); setSeatingCap(""); setSleeperCap("0");
    setFitnessValidity(""); setInsuranceValidity(""); setPuccValidity("");
    setServiceType(""); setNameOfGoods(""); setRoute("");
    setTaxFrom(""); setTaxTo("");
    setPaymentInitDateInput(""); setPaymentConfDateInput(""); setPrintedOnInput("");
    setTaxRows([emptyRow(), emptyRow(), emptyRow(), emptyRow()]);
    setTotalAmount(""); setDateError(""); setFormError(""); setShowModal(false);
    setPdfError(""); setNavOpen(false); setReportsOpen(false);
  };

  const handleGetPdf = async () => {
    setPdfError("");
    if (dateError) return;
    const missing: string[] = [];
    if (!vehicleNo.trim())                            missing.push("Registration No.");
    if (!taxFrom)                                     missing.push("Tax From Date");
    if (!taxTo)                                       missing.push("Tax Upto Date");
    if (!totalAmount || parseFloat(totalAmount) <= 0) missing.push("Total Amount");
    if (missing.length > 0) {
      setPdfError(`Please fill the following before downloading: ${missing.join(", ")}`);
      return;
    }

    // Receipt No. = APR + YYMMDD of Payment Initialization Date + 7-digit random.
    const effectivePaymentInitDate = paymentInitDateInput || nowIST();
    const initParts = parseInitDateParts(effectivePaymentInitDate);
    const rand = Math.floor(Math.random() * 9000000 + 1000000);
    const receiptNo = initParts
      ? `APR${initParts.yy}${initParts.mm}${initParts.dd}${rand}`
      : `APR${rand}`;
    // Bank Ref No. = 14-digit number ending with the 4-digit year of the
    // Payment Initialization Date — 10 random digits + that year.
    const bankRefYear = initParts?.yyyy ?? String(new Date().getFullYear());
    const bankRef10   = String(Math.floor(Math.random() * 9000000000 + 1000000000));
    const orderRef     = `${bankRef10}${bankRefYear}`;
    const ts           = Date.now().toString(36).toUpperCase();
    const randTxn      = Math.random().toString(36).slice(2, 6).toUpperCase();
    const transactionId = `TXN${ts}${randTxn}`;

    const apTaxItems = taxRows.map((r, i) => ({
      particular: TAX_ROW_NAMES[i],
      fees:  parseFloat(r.fees) || 0,
      fine:  parseFloat(r.fine) || 0,
      total: (parseFloat(r.fees) || 0) + (parseFloat(r.fine) || 0),
    }));

    setPdfLoading(true);
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId,
          state:            stateCode,
          visitingState:    stateCode,
          vehicleNo,        chassisNo,     ownerName,       mobileNo,
          fromState,        vehicleType,   vehicleClass,    vehicleCategory,
          permitType,       checkpostName, taxMode,         paymentMethod: paymentMode,
          taxFrom,          taxTo,
          grossVehicleWt,   unladenWt,
          fitnessValidity,  insuranceValidity, puccValidity,
          serviceType,      nameOfGoods,   route,
          permitUpto:       permitValidity,
          apTaxItemsJson:   JSON.stringify(apTaxItems),
          amount:           parseFloat(totalAmount) || 0,
          receiptNo,
          orderRef,
          noOfPeriods:      1,
          seatingCap,
          sleeperCap,
          paymentInitDate:  effectivePaymentInitDate,
          paymentConfDate:  paymentConfDateInput,
          printedOn:        printedOnInput,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to save transaction");
      }
      const savedId = json.transactionId || transactionId;
      // Trigger PDF download
      const link = document.createElement("a");
      link.href = `/api/receipt/${savedId}?state=AP&download=1`;
      link.download = `receipt_${savedId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "PDF download failed. Please try again.");
    } finally {
      setPdfLoading(false);
    }
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
            <button className="cp-nav-toggler" onClick={() => setNavOpen(!navOpen)} aria-label="Toggle navigation">
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
                  <a href="#"><i className="fa fa-print"></i> Reports ▾</a>
                  {reportsOpen && (
                    <div className="cp-dropdown-menu">
                      <a href={`${BASE}/checkpost/faces/public/reports/PaymentReceipt.xhtml`}>▶ Print Payment Receipt</a>
                      <a href={`${BASE}/checkpost/faces/public/reports/PermitReceiptPrinting.xhtml`}>▶ Print Permit Receipt</a>
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

      {/* ── News ticker ── */}
      <div className="cp-news-bar">
        <div className="container-fluid cp-news-scroll-wrap">
          <div className="cp-news-scroll">
            Verify the validity of the receipt by sending sms&nbsp;
            <strong className="cp-news-highlight">VAHAN &lt;STATE CODE&gt; CP &lt;VEHICLE NO&gt;</strong>
            &nbsp;to 7738299899 (e.g.&nbsp;
            <strong className="cp-news-highlight">VAHAN AP CP XXXXXXXXXX</strong>)
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

          <div className="ui-grid-row top-space center-position contents-Space">
            <h1 className="header-main">
              <span style={{ color: "#0d4f8c", fontWeight: "bold" }}>BORDER TAX PAYMENT FOR ENTRY INTO</span>
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

                  {/* Row: Vehicle No + Get Details */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Vehicle No.</label>
                      </div>
                      <input type="text" className="ui-inputtext" maxLength={10}
                        value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                        autoComplete="off" placeholder="e.g. AP14AB1234" />
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

                  {/* Row: Chassis No + Owner Name */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Chassis No.</label>
                      </div>
                      <input type="text" className="ui-inputtext input-autofilled" value={chassisNo}
                        onChange={(e) => setChassisNo(e.target.value.toUpperCase())} maxLength={30} autoComplete="off" />
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Owner Name</label>
                      </div>
                      <input type="text" className="ui-inputtext input-autofilled" value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value.toUpperCase())} maxLength={50} autoComplete="off" />
                    </div>
                  </div>

                  {/* Row: Mobile No + From State */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Mobile No.</label>
                      </div>
                      <input type="text" className="ui-inputtext input-autofilled" maxLength={10}
                        value={mobileNo} onChange={(e) => setMobileNo(e.target.value)}
                        autoComplete="off" placeholder="SMS about payment will be sent to this number." />
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">From State</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select value={fromState} onChange={(e) => setFromState(e.target.value)} autoComplete="off">
                          {allStates.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                  </div>

                  {/* Row: Vehicle Type + Vehicle Class */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
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
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Vehicle Class</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select value={vehicleClass} onChange={(e) => setVehicleClass(e.target.value)}>
                          <option value="">-- Select Vehicle Class --</option>
                          <option value="MOTOR CYCLE">MOTOR CYCLE</option>
                          <option value="THREE WHEELER(PASSENGER)">THREE WHEELER(PASSENGER)</option>
                          <option value="MOTOR CAB">MOTOR CAB</option>
                          <option value="MAXI CAB">MAXI CAB</option>
                          <option value="OMNI BUS">OMNI BUS</option>
                          <option value="BUS">BUS</option>
                          <option value="SLEEPER BUS">SLEEPER BUS</option>
                          <option value="VOLVO OR MERECEDEZ ETC">VOLVO OR MERECEDEZ ETC</option>
                          <option value="EDUCATIONAL BUS">EDUCATIONAL BUS</option>
                          <option value="EDUCATIONAL BUS USED BY SCHOOL">EDUCATIONAL BUS USED BY SCHOOL</option>
                          <option value="PRIVATE ORGANIZATIONS">PRIVATE ORGANIZATIONS</option>
                          <option value="CRANE MOUNTED VEHICLE">CRANE MOUNTED VEHICLE</option>
                          <option value="LIGHT GOODS VEHICLE">LIGHT GOODS VEHICLE</option>
                          <option value="MEDIUM GOODS VEHICLE">MEDIUM GOODS VEHICLE</option>
                          <option value="HEAVY GOODS VEHICLE">HEAVY GOODS VEHICLE</option>
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                  </div>

                  {/* Row: Vehicle Category */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Vehicle Category</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select value={vehicleCategory} onChange={(e) => setVehicleCategory(e.target.value)}>
                          {VEHICLE_CATEGORY_OPTIONS.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                    <div className="ui-grid-col-6">
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

                  {/* Row: Checkpost Name + Tax Mode */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">CheckPost Name</label>
                      </div>
                      <input type="text" className="ui-inputtext" value={checkpostName}
                        onChange={(e) => setCheckpostName(e.target.value.toUpperCase())}
                        maxLength={80} autoComplete="off" placeholder="Select or type a checkpost"
                        list="ap-checkpost-options" />
                      <datalist id="ap-checkpost-options">
                        {CHECKPOST_OPTIONS.map((c) => <option key={c} value={c} />)}
                      </datalist>
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Tax Mode</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select value={taxMode} onChange={(e) => setTaxMode(e.target.value)}>
                          <option value="">-- Select Tax Mode --</option>
                          <option value="DAYS">DAYS</option>
                          <option value="WEEKLY">WEEKLY</option>
                          <option value="FORTNIGHT">FORTNIGHT</option>
                          <option value="MONTHLY">MONTHLY</option>
                          <option value="QUARTERLY">QUARTERLY</option>
                          <option value="HALF YEARLY">HALF YEARLY</option>
                          <option value="YEARLY">YEARLY</option>
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                  </div>

                  {/* Row: [Seating Cap / Gross Vehicle Wt] + [Sleeper Cap / Unladen Wt] */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">
                          {isGoodsVehicle ? "Gross Vehicle Wt (In. Kg)" : "Seating Capacity"}
                        </label>
                      </div>
                      <input type="text" className="ui-inputtext"
                        value={isGoodsVehicle ? grossVehicleWt : seatingCap}
                        onChange={(e) => isGoodsVehicle
                          ? setGrossVehicleWt(e.target.value.replace(/\D/g, ""))
                          : setSeatingCap(e.target.value.replace(/\D/g, ""))}
                        maxLength={8} autoComplete="off" placeholder="0" />
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">
                          {isGoodsVehicle ? "Unladen Wt (In Kg.)" : "Sleeper Cap"}
                        </label>
                      </div>
                      <input type="text" className="ui-inputtext"
                        value={isGoodsVehicle ? unladenWt : sleeperCap}
                        onChange={(e) => isGoodsVehicle
                          ? setUnladenWt(e.target.value.replace(/\D/g, ""))
                          : setSleeperCap(e.target.value.replace(/\D/g, ""))}
                        maxLength={8} autoComplete="off" placeholder="0" />
                    </div>
                  </div>

                  {/* Row: Fitness Validity + Insurance Validity */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">Fitness Validity</label>
                      </div>
                      <TaxDateField date={fitnessValidity} onDateChange={setFitnessValidity} />
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">Insurance Validity</label>
                      </div>
                      <TaxDateField date={insuranceValidity} onDateChange={setInsuranceValidity} />
                    </div>
                  </div>

                  {/* Row: PUCC Validity + Permit Validity */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">PUCC Validity</label>
                      </div>
                      <TaxDateField date={puccValidity} onDateChange={setPuccValidity} />
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">Permit Validity</label>
                      </div>
                      <TaxDateField date={permitValidity} onDateChange={setPermitValidity} />
                    </div>
                  </div>

                  {/* Row: Service Type + Name of Goods */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">Service Type</label>
                      </div>
                      <input type="text" className="ui-inputtext" value={serviceType}
                        onChange={(e) => setServiceType(e.target.value.toUpperCase())}
                        maxLength={50} autoComplete="off" placeholder="e.g. NOT APPLICABLE" />
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">Name of Goods</label>
                      </div>
                      <input type="text" className="ui-inputtext" value={nameOfGoods}
                        onChange={(e) => setNameOfGoods(e.target.value.toUpperCase())}
                        maxLength={100} autoComplete="off" placeholder="e.g. RICE, COTTON" />
                    </div>
                  </div>

                  {/* Row: Route */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">Route</label>
                      </div>
                      <input type="text" className="ui-inputtext" value={route}
                        onChange={(e) => setRoute(e.target.value.toUpperCase())}
                        maxLength={100} autoComplete="off" placeholder="e.g. VIJAYAWADA TO HYDERABAD" />
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">Payment Init Date</label>
                      </div>
                      <PaymentDateTimeField value={paymentInitDateInput} onChange={setPaymentInitDateInput} />
                    </div>
                  </div>

                  {/* Row: Payment Conf Date + Printed On */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">Payment Conf Date</label>
                      </div>
                      <PaymentDateTimeField value={paymentConfDateInput} onChange={setPaymentConfDateInput} />
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel">Printed On</label>
                      </div>
                      <PaymentDateTimeField value={printedOnInput} onChange={setPrintedOnInput} />
                    </div>
                  </div>

                  {/* Row: Tax From + Tax To */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-6">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Tax From Date</label>
                      </div>
                      <TaxDateField
                        date={taxFrom}
                        onDateChange={handleTaxFromChange}
                        hasError={!!(dateError && taxFrom && taxTo && taxFrom > taxTo)}
                      />
                    </div>
                    <div className="ui-grid-col-6">
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

                  {dateError && (
                    <div className="ui-grid-row">
                      <div className="ui-grid-col-12">
                        <div className="cp-date-err-msg">{dateError}</div>
                      </div>
                    </div>
                  )}

                  {/* ── Tax table (4 static rows) ── */}
                  <br />
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-12">
                      <div className="ui-datatable">
                        <table role="grid">
                          <thead>
                            <tr>
                              <th className="collumn-width">Sl. No.</th>
                              <th>Tax / Fee Particular</th>
                              <th style={{ width: "130px" }}>Tax / Fees (₹)</th>
                              <th style={{ width: "110px" }}>Fine (₹)</th>
                              <th style={{ width: "110px" }}>Total (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="ui-datatable-data">
                            {taxRows.map((row, idx) => {
                              const fees  = parseFloat(row.fees) || 0;
                              const fine  = parseFloat(row.fine) || 0;
                              const total = fees + fine;
                              return (
                                <tr key={idx}>
                                  <td style={{ textAlign: "center" }}>{idx + 1}</td>
                                  <td style={{ fontWeight: "bold" }}>{TAX_ROW_NAMES[idx]}</td>
                                  <td>
                                    <input type="text" className="ui-inputtext"
                                      value={row.fees}
                                      onChange={(e) => updateTaxRow(idx, "fees", e.target.value.replace(/[^0-9.]/g, ""))}
                                      style={{ width: "100%" }} />
                                  </td>
                                  <td>
                                    <input type="text" className="ui-inputtext"
                                      value={row.fine}
                                      onChange={(e) => updateTaxRow(idx, "fine", e.target.value.replace(/[^0-9.]/g, ""))}
                                      style={{ width: "100%" }} />
                                  </td>
                                  <td style={{ textAlign: "center", fontWeight: "bold" }}>
                                    {total.toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })}
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

                  {/* Total amount + Payment Mode + action buttons */}
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Total Amount</label>
                      </div>
                      <input type="text" className="ui-inputtext font-bold medium-text-font"
                        value={totalAmount}
                        onChange={(e) => { setTotalAmount(e.target.value.replace(/[^0-9.]/g, "")); setFormError(""); }}
                        placeholder="0.00" />
                    </div>
                    <div className="ui-grid-col-3">
                      <div className="field-label resp-label-section">
                        <label className="ui-outputlabel field-label-mandate">Payment Mode</label>
                      </div>
                      <div className="ui-selectonemenu">
                        <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                          <option value="Online">Online</option>
                          <option value="Cash">Cash</option>
                        </select>
                        <span className="ui-selectonemenu-arrow">▼</span>
                      </div>
                    </div>
                    <div className="ui-grid-col-6">
                      <div className="ui-grid-row">
                        <div className="ui-grid-col-12 top_mar1 mar-left5">
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
                          <button
                            className="ui-button ui-button-pdf"
                            type="button"
                            onClick={handleGetPdf}
                            disabled={pdfLoading}
                          >
                            <i className={pdfLoading ? "fa fa-spinner fa-spin" : "fa fa-file-pdf-o"}></i>
                            <span className="ui-button-text">{pdfLoading ? "Generating..." : "Get PDF"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {pdfError && (
                    <div className="ui-grid-row">
                      <div className="ui-grid-col-12">
                        <div className="cp-date-err-msg">{pdfError}</div>
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
                    <td><span className="small-text-font-bold">{totalAmount ? `${totalAmount}/-` : "/-"}</span></td>
                  </tr>
                  <tr>
                    <td><span className="small-text-font">Payment Mode</span></td>
                    <td><span className="small-text-font">:</span></td>
                    <td><span className="small-text-font">{paymentMode}</span></td>
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
