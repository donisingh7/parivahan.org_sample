"use client";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { isSupportedState } from "@/lib/states/registry";

const BASE        = "https://checkpost.parivahan.gov.in";

const ALL_STATES = [
  { value: "AP", label: "ANDHRA PRADESH" },
  { value: "AS", label: "ASSAM" },
  { value: "BR", label: "BIHAR" },
  { value: "CG", label: "CHHATTISGARH" },
  { value: "GJ", label: "GUJARAT" },
  { value: "JH", label: "JHARKHAND" },
  { value: "KL", label: "KERALA" },
  { value: "KA", label: "KARNATAKA" },
  { value: "HR", label: "HARYANA" },
  { value: "HP", label: "HIMACHAL PRADESH" },
  { value: "OR", label: "ODISHA" },
  { value: "MP", label: "MADHYA PRADESH" },
  { value: "MH", label: "MAHARASHTRA" },
  { value: "PB", label: "PUNJAB" },
  { value: "RJ", label: "RAJASTHAN" },
  { value: "TN", label: "TAMIL NADU" },
  { value: "TS", label: "TELANGANA" },
  { value: "UP", label: "UTTAR PRADESH" },
  { value: "UK", label: "UTTARAKHAND" },
  { value: "WB", label: "WEST BENGAL" },
];

function SelectStateContent() {
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const initState     = searchParams.get("state") ?? "";

  const [selectedState, setSelectedState] = useState(initState);
  const [service,       setService]       = useState("");
  const [submitted,     setSubmitted]     = useState(false);
  const [unsupportedMsg, setUnsupportedMsg] = useState("");
  const [navOpen,       setNavOpen]       = useState(false);
  const [totalPayment,  setTotalPayment]  = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setTotalPayment(d.totalPayments ?? 0))
      .catch(() => setTotalPayment(0));
  }, []);

  const handleGo = () => {
    if (!selectedState || !service) return;
    if (!isSupportedState(selectedState)) {
      const label = ALL_STATES.find((s) => s.value === selectedState)?.label ?? selectedState;
      setUnsupportedMsg(
        `Online tax payment for ${label} is not yet available on this portal. Please contact your local RTO office.`
      );
      return;
    }
    setUnsupportedMsg("");
    setSubmitted(true);
    setTimeout(() => router.push(`/checkpost/payment?state=${selectedState}`), 800);
  };

  return (
    <div id="masterlaoyoutbody">

      {/* ── Top accessibility bar ── */}
      <div className="container-fluid topbar-menu">
        <div className="mar-bot">
          <div className="row no-margin">
            <div className="col-md-6 left-position">
              <div className="marquee marquee-top mar-common-f">
                <div>
                  <span>Please pay tax in advance to avoid any last minute hassle.</span>
                </div>
              </div>
            </div>
            <div className="col-md-5 right-position top-pad-top">
              <ul className="top-menu">
                <li>
                  <a href="https://parivahan.gov.in/" title="Home">
                    <span className="glyphicon glyphicon-home"></span> Home
                  </a>
                </li>
                <li>
                  <a href="#skip-main-content" title="skip-main-content">
                    <span className="glyphicon glyphicon-arrow-down"></span> Skip main content
                  </a>
                </li>
                <li>
                  <a href="#navbar" title="Skip to navigation">
                    <span className="glyphicon glyphicon-arrow-down"></span> Skip navigation
                  </a>
                </li>
                <li><a href="#" title="A+">A<sup>+</sup></a></li>
                <li><a href="#" title="A">A</a></li>
                <li><a href="#" title="A-">A<sup>-</sup></a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ── Logo header ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/Images/header.png" alt="Parivahan Checkpost Header" style={{ width: "100%", display: "block" }} />

      {/* ── Navigation bar ── */}
      <nav className="navbar-default navigation-background" role="navigation" id="navbar">
        <div className="navbar-header">
          <button
            type="button"
            className="navbar-toggle"
            onClick={() => setNavOpen(!navOpen)}
            aria-label="Toggle navigation"
          >
            <span className="sr-only">Toggle navigation</span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
          </button>
        </div>
        <div className={`navbar-collapse navigation-background-nav${navOpen ? " nav-open" : ""}`}>
          <ul className="nav navbar-nav">
            <li>
              <a href="#"><span className="glyphicon glyphicon-home"></span> Home</a>
            </li>
            <li className="dropdown">
              <a href="#" className="dropdown-toggle">
                <span className="glyphicon glyphicon-bitcoin"></span> Border Tax Payment
                <span className="caret"></span>
              </a>
              <ul className="dropdown-menu">
                <li>
                  <a href="#"><span className="glyphicon glyphicon-arrow-right"></span> Tax Payment</a>
                </li>
              </ul>
            </li>
            <li className="dropdown">
              <a href="#" className="dropdown-toggle">
                <span className="glyphicon glyphicon-print"></span> Reports
                <span className="caret"></span>
              </a>
              <ul className="dropdown-menu">
                <li>
                  <a href="#"><span className="glyphicon glyphicon-arrow-right"></span> Print Payment Receipt</a>
                </li>
                <li>
                  <a href="#"><span className="glyphicon glyphicon-log-out"></span> Logout</a>
                </li>
              </ul>
            </li>
            <li>
              <a href="/user/bookings"><span className="glyphicon glyphicon-list-alt"></span> My Bookings</a>
            </li>
          </ul>
        </div>
      </nav>

      {/* ── News ticker 1: SMS verification ── */}
      <div className="main_news_w">
        <div className="news_w">
          <div className="marquee-with-options">
            <div className="ss-ticker-scroll">
              Verify the validity of the receipt by sending sms&nbsp;
              <span style={{ color: "#ff83dc" }}>VAHAN &lt;STATE CODE&gt; CP &lt;VEHICLE NO&gt;</span>
              &nbsp;to 7738299899 (e.g.&nbsp;
              <span style={{ color: "#ff83dc" }}>VAHAN XX CP XXXXXXXXXX</span>)
            </div>
          </div>
        </div>
      </div>

      {/* ── News ticker 2: Service name warning ── */}
      <div className="main_news_w2">
        <div className="news_w">
          <div className="marquee-with-options">
            <div className="ss-ticker-scroll2">
              <span style={{ fontSize: "14px", color: "#ff0f0f", fontWeight: 700 }}>
                Select the service name carefully in case you select wrong service and pay the fee/tax, amount will not be refunded or adjusted.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div id="MainContentPlaceHolder1_Upd_SelectState">
        <div className="container" id="skip-main-content">
          <div className="ui-grid ui-grid-responsive">

            {/* Page title */}
            <div className="ui-grid-row">
              <div className="ui-grid-col-12 center-position" style={{ flexDirection: "column" }}>
                <h1 className="header-main header-title">BORDER TAX PAYMENT</h1>
                <h1 className="header-total">Total Payment :- {totalPayment !== null ? `₹${totalPayment.toLocaleString("en-IN")}` : "..."}</h1>
              </div>
            </div>

            <div className="ui-grid-row">
              <div className="ui-grid-col-12">

                {/* ── Panel: Select State ── */}
                <div className="ui-panel ui-widget ui-widget-content ui-corner-all">
                  <div className="ui-panel-titlebar ui-widget-header ui-helper-clearfix ui-corner-all">
                    <span className="ui-panel-title">Select State Name for Tax Payment</span>
                  </div>
                  <div className="ui-panel-content ui-widget-content">

                    <div className="ui-grid-row">
                      <div className="ui-grid-col-1 resp-blank-height"></div>

                      {/* Visiting State */}
                      <div className="ui-grid-col-5 mar-right">
                        <label className="field-label resp-label-section">
                          <h3 className="top-space">Select Visiting State Name</h3>
                        </label>
                        <select
                          className="form-control"
                          value={selectedState}
                          onChange={(e) => { setSelectedState(e.target.value); setUnsupportedMsg(""); }}
                          required
                        >
                          <option value="">---Select State---</option>
                          {ALL_STATES.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Service Name */}
                      <div className="ui-grid-col-5">
                        <label className="field-label resp-label-section">
                          <h3 className="top-space">Service Name</h3>
                        </label>
                        <select
                          className="form-control"
                          value={service}
                          onChange={(e) => setService(e.target.value)}
                          required
                        >
                          <option value="">---Select Service Name---</option>
                          <option value="other">VEHICLE TAX COLLECTION (OTHER STATE)</option>
                        </select>
                      </div>
                    </div>

                    {/* Unsupported state warning */}
                    {unsupportedMsg && (
                      <div className="ui-grid-row top-space">
                        <div className="ui-grid-col-12 center-position">
                          <div className="ss-unsupported-msg">
                            <span className="glyphicon glyphicon-warning-sign"></span>{" "}
                            {unsupportedMsg}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Go button */}
                    <div className="ui-grid-row top-space">
                      <div className="ui-grid-col-12 center-position">
                        <button
                          className="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-icon-left"
                          type="button"
                          role="button"
                          onClick={handleGo}
                          disabled={!selectedState || !service}
                        >
                          <span className="ui-button-icon-left ui-icon ui-c ui-icon-seek-next"></span>
                          <span className="ui-button-text ui-c">Go</span>
                        </button>
                      </div>
                    </div>

                    {/* Loading overlay */}
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

                <br />

                {/* ── Panel: Instructions ── */}
                <div className="ui-panel ui-widget ui-widget-content ui-corner-all" style={{ fontSize: "11pt" }}>
                  <div className="ui-panel-titlebar ui-widget-header ui-helper-clearfix ui-corner-all">
                    <span className="ui-panel-title">Follow these steps to initiate tax payment...</span>
                  </div>
                  <div className="ui-panel-content ui-widget-content">
                    <ol>
                      <li>Select the state where you want to go from <span className="dialog-highlight-text">&apos;Select State&apos;</span> combo box.</li>
                      <li>Select service Name from <span className="dialog-highlight-text">&apos;Service Name&apos;</span> combo box.
                        <ol type="i">
                          <li>Select <span className="dialog-highlight-text">&apos;VEHICLE TAX COLLECTION (OTHER STATE)&apos;</span> in case you do not have NCR permit.</li>
                          <li>Select <span className="dialog-highlight-text">&apos;VEHICLE TAX COLLECTION (NCR)&apos;</span> in case you have NCR permit.</li>
                        </ol>
                      </li>
                      <li>Click <span className="dialog-highlight-text">&apos;Go&apos;</span> button to open the vehicle details form.</li>
                      <li>Enter <span className="dialog-highlight-text">&apos;Vehicle No.&apos;</span> and click <span className="dialog-highlight-text">&apos;Get Details&apos;</span> button to fill the details.</li>
                      <li>Fill rest of the fields which are not filled automatically.</li>
                      <li>In case fields are not filled automatically then enter the details manually.</li>
                      <li>Click <span className="dialog-highlight-text">&apos;Calculate Tax&apos;</span> button to calculate the tax according to state notification.</li>
                      <li>Click <span className="dialog-highlight-text">&apos;Pay Tax&apos;</span> button to pay the calculated tax.</li>
                      <li>It opens the payment gateway of VAHAN.</li>
                      <li>Choose payment gateway and click on <span className="dialog-highlight-text">&apos;Continue&apos;</span> button.</li>
                      <li>And then follow the screen to pay tax.</li>
                      <li>After paying tax bank will redirect to the Checkpost application.</li>
                      <li>In case payment is success Checkpost application will generate the success receipt.</li>
                      <li>Print the receipt.</li>
                    </ol>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}

export default function CheckpostTaxPayment() {
  return (
    <Suspense fallback={
      <div className="cp-loading-center">
        <div className="overlay-spinner cp-loading-spinner"></div>
      </div>
    }>
      <SelectStateContent />
    </Suspense>
  );
}
