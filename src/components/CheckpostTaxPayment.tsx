"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { states } from "./CheckpostTax";

const BASE = "https://checkpost.parivahan.gov.in";
const LOGO = `${BASE}/checkpost/faces/javax.faces.resource/checkpost-logo.png?ln=images`;
const EVAHAN = `${BASE}/checkpost/faces/javax.faces.resource/e-vahan-logo.png?ln=images`;

const serviceOptions = [
  { value: "5003", label: "VEHICLE TAX COLLECTION (OTHER STATE)" },
];

function CheckpostContent() {
  const searchParams = useSearchParams();
  const stateCode = searchParams.get("state") ?? "";
  const stateLabel = states.find((s) => s.value === stateCode)?.label ?? stateCode;

  const [service, setService] = useState("5003");
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const handleGo = () => {
    if (stateCode && service !== "-1") {
      setSubmitted(true);
      setTimeout(() => {
        router.push(`/checkpost/payment?state=${stateCode}`);
      }, 800);
    }
  };

  return (
    <div id="masterlaoyoutbody" style={{ position: "relative" }}>

      {/* ── Top accessibility bar ── */}
      <div className="cp-topbar">
        <div className="container-fluid">
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div className="marquee-top">
                <span className="cp-marquee-inner">
                  Please pay tax in advance to avoid any last minute hassle.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  Please pay tax in advance to avoid any last minute hassle.
                </span>
              </div>
            </div>
            <ul className="cp-top-menu">
              <li><a href="https://vahan.parivahan.gov.in/" title="Home">🏠 Home</a></li>
              <li><a href="#skip-main-content" title="skip-main-content">↓ Skip main content</a></li>
              <li><a href="#navbar" title="Skip to navigation">↓ Skip navigation</a></li>
              <li><a href="#" title="A+">A<sup>+</sup></a></li>
              <li><a href="#" title="A">A</a></li>
              <li><a href="#" title="A-">A<sup>-</sup></a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Header with logos ── */}
      <div className="cp-header">
        <div className="container-fluid">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO} className="cp-logo" alt="Check Post Logo"
                onError={(e) => { e.currentTarget.style.display = "none"; }} />
              {/* Fallback text logo if image fails */}
              <span style={{ color: "#ffd700", fontWeight: 800, fontSize: "20px", marginLeft: "8px" }}>
                CHECKPOST
              </span>
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
            <ul className="nav-list">
              <li>
                <a href="https://parivahan.gov.in/" className="active">
                  <i className="fa fa-home" aria-hidden="true"></i> Home
                </a>
              </li>
              <li>
                <a href={`${BASE}/checkpost/faces/public/payment/ChecklTransactionStatus.xhtml`}>
                  <i className="fa fa-user" aria-hidden="true"></i> Check Pending Transaction
                </a>
              </li>
              <li className="cp-dropdown">
                <a href="#">
                  <i className="fa fa-print" aria-hidden="true"></i> Reports ▾
                </a>
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
              </li>
            </ul>
            <a
              href={`${BASE}/checkpost/faces/admin/pages/login.xhtml`}
              className="login-btn"
              style={{ marginLeft: "auto" }}
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

      {/* ── Main content ── */}
      <div className="cp-main container" id="skip-main-content">

        {/* Page heading */}
        <h1 className="header-main">BORDER TAX PAYMENT</h1>

        {/* ── Panel 1: State + Service selection ── */}
        <div className="ui-panel">
          <div className="ui-panel-titlebar">Select State Name for Tax Payment</div>
          <div className="ui-panel-content">

            <div className="ui-grid-row">
              <div className="ui-grid-col-1 resp-blank-height"></div>

              {/* Visiting State — pre-filled & DISABLED */}
              <div className="ui-grid-col-5">
                <div className="field-label">
                  <h3 className="top-space">Select Visiting State Name</h3>
                </div>
                <div className="cp-select-wrap">
                  <select
                    className="cp-select"
                    disabled
                    value={stateCode}
                    aria-label="Select Visiting State Name"
                    aria-disabled="true"
                  >
                    <option value="-1">---Select State---</option>
                    {states.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <span className="cp-select-arrow">▼</span>
                </div>

              </div>

              {/* Service Name — user can select */}
              <div className="ui-grid-col-5">
                <div className="field-label">
                  <h3 className="top-space">Service Name</h3>
                </div>
                <div className="cp-select-wrap" style={{ width: "90%" }}>
                  <select
                    className="cp-select cp-select-enabled"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    aria-label="Select Service Name"
                  >
                    {serviceOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <span className="cp-select-arrow">▼</span>
                </div>
              </div>
            </div>

            {/* Go button */}
            <div className="ui-grid-row">
              <div className="ui-grid-col-12 center-position">
                <button
                  className="cp-go-btn"
                  onClick={handleGo}
                  type="button"
                  disabled={!stateCode || service === "-1"}
                >
                  <i className="fa fa-forward" aria-hidden="true"></i> Go
                </button>
              </div>
            </div>

            {/* After clicking Go — overlay while redirecting */}
            {submitted && (
              <div className="overlay overlay-style">
                <h2 className="overlay-heading">
                  <span className="overlay-spinner"></span>
                  Please wait, web page is being loaded...
                </h2>
              </div>
            )}
          </div>
        </div>

        {/* ── Panel 2: Instructions ── */}
        <div className="ui-panel instructions-panel">
          <div className="ui-panel-titlebar">Follow these steps to initiate tax payment...</div>
          <div className="ui-panel-content">
            <ol>
              <li>
                Select the state where you want to go from{" "}
                <span className="dialog-highlight-text">&apos;Select State&apos;</span> combo box.
              </li>
              <li>
                Select service Name from{" "}
                <span className="dialog-highlight-text">&apos;Service Name&apos;</span> combo box.
                <ol type="i" style={{ marginTop: "4px" }}>
                  <li>
                    Select{" "}
                    <span className="dialog-highlight-text">
                      &apos;VEHICLE TAX COLLECTION (OTHER STATE)&apos;
                    </span>{" "}
                    in case you do not have NCR permit.
                  </li>
                  <li>
                    Select{" "}
                    <span className="dialog-highlight-text">
                      &apos;VEHICLE TAX COLLECTION (NCR)&apos;
                    </span>{" "}
                    in case you have NCR permit.
                  </li>
                </ol>
              </li>
              <li>
                Click <span className="dialog-highlight-text">&apos;Go&apos;</span> button to open the vehicle details form.
              </li>
              <li>
                Enter <span className="dialog-highlight-text">&apos;Vehicle No.&apos;</span> and click{" "}
                <span className="dialog-highlight-text">&apos;Get Details&apos;</span> button to fill the details.
              </li>
              <li>Fill rest of the fields which are not filled automatically.</li>
              <li>In case fields are not filled automatically then enter the details manually.</li>
              <li>
                Click <span className="dialog-highlight-text">&apos;Calculate Tax&apos;</span> button to calculate the tax according to state notification.
              </li>
              <li>
                Click <span className="dialog-highlight-text">&apos;Pay Tax&apos;</span> button to pay the calculated tax.
              </li>
              <li>It opens the payment gateway of VAHAN.</li>
              <li>
                Choose payment gateway and click on{" "}
                <span className="dialog-highlight-text">&apos;Continue&apos;</span> button.
              </li>
              <li>And then follow the screen to pay tax.</li>
              <li>After paying tax bank will redirect to the Checkpost application.</li>
              <li>In case payment is success Checkpost application will generate the success receipt.</li>
              <li>Print the receipt.</li>
            </ol>
          </div>
        </div>

        {/* Visitor count */}
        <div className="cp-visitor">
          Total No. of Visitors: 1,538,150,137
        </div>
      </div>
    </div>
  );
}

export default function CheckpostTaxPayment() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div className="overlay-spinner" style={{ width: 40, height: 40, borderWidth: 4 }}></div>
      </div>
    }>
      <CheckpostContent />
    </Suspense>
  );
}
