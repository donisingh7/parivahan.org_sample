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

  const handleLogin = async () => {
    if (!userId.trim() || !password.trim()) {
      setError("Please enter your Portal User ID and Password.");
      return;
    }
    setError(""); setLoading(true);
    try {
      // Server enforces: cookie's user_token userId === submitted userId AND
      // password is correct. So a logged-in user cannot pay with a different
      // identity — every transaction stays tied to the portal account.
      const res  = await fetch("/api/auth/verify-payment-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId.trim(), password }),
      });
      const data = await res.json();
      if (!data.success) {
        if (data.code === "NOT_LOGGED_IN") {
          // Session lost — bounce back to login keeping the SBI URL as redirect.
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
          return;
        }
        setError(
          data.message ||
          "Invalid credentials. Use the same User ID and Password you used to log in."
        );
        setLoading(false);
        return;
      }
      onSuccess();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
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
          <div className="sbi-login-title"><i className="fa fa-user-circle"></i> Verify Your Identity</div>
          <div style={{
            background: "#fff8e1", border: "1px solid #f0c000", borderRadius: "4px",
            padding: "8px 12px", fontSize: "12px", marginBottom: "14px", color: "#7a5800",
          }}>
            <i className="fa fa-info-circle"></i>&nbsp;
            Enter the same <strong>User ID and Password</strong> you used to log in to the Checkpost Portal.
          </div>
          {error && <div className="sbi-login-error"><i className="fa fa-exclamation-triangle"></i> {error}</div>}
          <div className="sbi-login-field">
            <label className="sbi-login-label">Portal User ID</label>
            <div className="sbi-login-input-wrap">
              <i className="fa fa-id-card sbi-login-icon"></i>
              <input type="text" className="sbi-login-input" placeholder="e.g. UP12345"
                value={userId} onChange={(e) => setUserId(e.target.value)}
                autoComplete="username" onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
            </div>
          </div>
          <div className="sbi-login-field">
            <label className="sbi-login-label">Portal Password</label>
            <div className="sbi-login-input-wrap">
              <i className="fa fa-lock sbi-login-icon"></i>
              <input type={showPwd ? "text" : "password"} className="sbi-login-input"
                placeholder="Enter your password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password" onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
              <button className="sbi-pwd-toggle" type="button" onClick={() => setShowPwd(!showPwd)}>
                <i className={`fa fa-eye${showPwd ? "-slash" : ""}`}></i>
              </button>
            </div>
          </div>
          <button className="sbi-login-btn" style={{ background: bank.bg }} type="button"
            onClick={handleLogin} disabled={loading}>
            {loading
              ? <><i className="fa fa-spinner fa-spin"></i> Verifying...</>
              : <><i className="fa fa-check-circle"></i> Confirm &amp; Pay &#8377;{amount}</>}
          </button>
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

function SuccessScreen({
  transactionId,
  stateCode,
  vehicleNo,
  amount,
  isSaving,
  saveError,
  onRetry,
}: {
  transactionId: string;
  stateCode:     string;
  vehicleNo:     string;
  amount:        string;
  isSaving:      boolean;
  saveError:     string;
  onRetry:       () => void;
}) {
  // The View *and* Download buttons both target the same URL — the PDF is
  // generated once by the per-state generateReceipt.js and served from
  // /api/receipt/<txnId>?state=<XX>. The state hint lets the receipt API
  // hit the right per-state collection without a cross-state scan.
  // `?download=1` swaps Content-Disposition to attachment so the same
  // route can drive both flows.
  const stateQuery  = stateCode ? `&state=${encodeURIComponent(stateCode)}` : "";
  const viewUrl     = `/api/receipt/${transactionId}?inline=1${stateQuery}`;
  const downloadUrl = `/api/receipt/${transactionId}?download=1${stateQuery}`;

  return (
    <div className="sbi-success-wrap" style={{ background: "#f5f7fa", minHeight: "100vh", padding: "24px 0" }}>
      {/* ── Action bar (hidden on print) ── */}
      <div className="no-print" style={{
        maxWidth: 900, margin: "0 auto 16px", display: "flex",
        alignItems: "center", justifyContent: "space-between", padding: "0 28px",
        flexWrap: "wrap", gap: "12px",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <span style={{ color:"#1a7a1a", fontWeight:"bold", fontSize:"18px" }}>
            <i className="fa fa-check-circle"></i> Payment Successful
          </span>
          <span style={{ fontSize:"13px", color:"#555" }}>
            — ₹{amount} paid for {vehicleNo}
          </span>
        </div>
        <div style={{ display:"flex", gap:"10px", flexWrap: "wrap" }}>
          <a
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background:"#1a3060", color:"#fff", borderRadius:"4px",
              padding:"8px 18px", fontSize:"13px", textDecoration:"none", fontWeight:"bold",
              display:"inline-flex", alignItems:"center", gap:"6px",
            }}
          >
            <i className="fa fa-eye"></i> View Receipt
          </a>
          <a
            href={downloadUrl}
            download={`receipt_${transactionId}.pdf`}
            style={{
              background:"#1a7a1a", color:"#fff", borderRadius:"4px",
              padding:"8px 18px", fontSize:"13px", textDecoration:"none", fontWeight:"bold",
              display:"inline-flex", alignItems:"center", gap:"6px",
            }}
          >
            <i className="fa fa-download"></i> Download Receipt PDF
          </a>
          <a href="/checkpost" style={{
            background:"#666", color:"#fff", borderRadius:"4px",
            padding:"8px 18px", fontSize:"13px", textDecoration:"none", fontWeight:"bold",
          }}>
            <i className="fa fa-home"></i> Back
          </a>
        </div>
      </div>

      {/* ── Receipt body ── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px" }}>
        {isSaving && (
          <div style={{
            background: "#fff", borderRadius: 6, padding: "60px 20px",
            textAlign: "center", color: "#555", fontSize: 14,
            border: "1px solid #e3e3e3",
          }}>
            <i className="fa fa-spinner fa-spin"></i>&nbsp;
            Saving payment to records and generating receipt...
          </div>
        )}

        {!isSaving && saveError && (
          <div style={{
            background: "#fff", borderRadius: 6, padding: "40px 20px",
            border: "1px solid #f0c0c0", color: "#a33",
          }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>
              <i className="fa fa-exclamation-triangle"></i>&nbsp; Receipt could not be generated
            </div>
            <div style={{ fontSize: 13, color: "#555", marginBottom: 12 }}>{saveError}</div>
            <button
              type="button"
              onClick={onRetry}
              style={{
                background:"#1a3060", color:"#fff", border:"none", borderRadius:"4px",
                padding:"6px 16px", fontSize:"13px", cursor:"pointer", fontWeight:"bold",
              }}
            >
              <i className="fa fa-refresh"></i> Try again
            </button>
          </div>
        )}

        {!isSaving && !saveError && transactionId && (
          <iframe
            src={viewUrl}
            title="Tax payment receipt"
            style={{
              width: "100%",
              height: "1100px",
              border: "1px solid #d0d0d0",
              borderRadius: 4,
              background: "#fff",
            }}
          />
        )}
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

// Extracts { yy, mm, dd, yyyy } from a "DD-MMM-YYYY HH:MM:SS AP" string (the
// canonical Payment Init Date format) so AP's receiptNo/bankRef can be
// derived from the payment date the user actually picked.
function parseInitDateParts(s: string): { yy: string; mm: string; dd: string; yyyy: string } | null {
  const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const m = s.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})/);
  if (!m) return null;
  const mi = MONTHS.indexOf(m[2].toUpperCase());
  if (mi === -1) return null;
  return { dd: m[1], mm: String(mi + 1).padStart(2, "0"), yyyy: m[3], yy: m[3].slice(2) };
}

function generateReceiptNo(stateCode?: string, paymentInitDate?: string): string {
  if (stateCode === "HR") return `HRT${Date.now()}`;
  const d    = new Date();
  const yy   = String(d.getFullYear()).slice(2);
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000000 + 1000000);
  if (stateCode === "AP") {
    // Receipt No. = APR + YYMMDD of Payment Initialization Date + 7-digit random.
    const parts = paymentInitDate ? parseInitDateParts(paymentInitDate) : null;
    return parts ? `APR${parts.yy}${parts.mm}${parts.dd}${rand}` : `APR${yy}${mm}${dd}${rand}`;
  }
  if (stateCode === "BR") return `BRT${yy}${mm}${dd}${rand}`;
  if (stateCode === "MH") return `MHT${yy}${mm}${dd}${rand}`;
  if (stateCode === "HP") return `HPR${yy}${mm}${dd}${rand}`;
  if (stateCode === "JH") return `JHR${yy}${mm}${dd}${rand}`;
  if (stateCode === "PB") return `PBR${yy}${mm}${dd}${rand}`;
  if (stateCode === "RJ") return `RJT${yy}${mm}${dd}${rand}`;
  if (stateCode === "UK") return `UKR${yy}${mm}${dd}${rand}`;
  if (stateCode === "UP") return `UPR${yy}${mm}${dd}${rand}`;
  return `RJT${yy}${mm}${dd}${rand}`;
}

function generateHRBankRef(): string {
  const numDigits  = Math.floor(Math.random() * 3) + 1;
  const numLetters = 10 - numDigits;
  const chars: string[] = [];
  for (let i = 0; i < numLetters; i++) chars.push(String.fromCharCode(65 + Math.floor(Math.random() * 26)));
  for (let i = 0; i < numDigits;  i++) chars.push(String(Math.floor(Math.random() * 10)));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

// AP bank ref: 14 digits — 10 random digits + the 4-digit year of the
// Payment Initialization Date (falls back to the current year if that date
// isn't available/parseable yet).
function generateAPBankRef(paymentInitDate?: string): string {
  const parts = paymentInitDate ? parseInitDateParts(paymentInitDate) : null;
  const yyyy  = parts?.yyyy ?? String(new Date().getFullYear());
  const rand10 = String(Math.floor(Math.random() * 9000000000 + 1000000000));
  return `${rand10}${yyyy}`;
}

function generateUPBankRef(): string {
  // Format: <1 digit><2 caps><1 digit><3 caps><1 digit><2 caps>
  const d = () => String(Math.floor(Math.random() * 10));
  const c = () => String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `${d()}${c()}${c()}${d()}${c()}${c()}${c()}${d()}${c()}${c()}`;
}

// Generates bank ref for MH: 12-digit number.
function generateMHBankRef(): string {
  return String(Math.floor(Math.random() * 900000000000 + 100000000000));
}

// Generates bank ref for BR: 10 chars, 7-9 uppercase letters + 1-3 digits,
// shuffled — same random scheme as Haryana.
function generateBRBankRef(): string {
  const numDigits  = Math.floor(Math.random() * 3) + 1;
  const numLetters = 10 - numDigits;
  const chars: string[] = [];
  for (let i = 0; i < numLetters; i++) chars.push(String.fromCharCode(65 + Math.floor(Math.random() * 26)));
  for (let i = 0; i < numDigits;  i++) chars.push(String(Math.floor(Math.random() * 10)));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

// HP bank ref: 10 chars, 7-9 uppercase letters + 1-3 digits, shuffled.
function generateHPBankRef(): string {
  const numDigits  = Math.floor(Math.random() * 3) + 1; // 1..3
  const numLetters = 10 - numDigits;                     // 7..9
  const chars: string[] = [];
  for (let i = 0; i < numLetters; i++) chars.push(String.fromCharCode(65 + Math.floor(Math.random() * 26)));
  for (let i = 0; i < numDigits;  i++) chars.push(String(Math.floor(Math.random() * 10)));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

function generateCheckpostBankRef(): string {
  const chars: string[] = [];
  for (let i = 0; i < 6; i++) chars.push(String.fromCharCode(65 + Math.floor(Math.random() * 26)));
  for (let i = 0; i < 3; i++) chars.push(String(Math.floor(Math.random() * 10)));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("") + String(Math.floor(Math.random() * 10));
}

// Random transaction id generated up-front on the client so the success
// screen and the DB row use the SAME id — even if the network request to save
// is slow or fails, the receipt page can still render a complete receipt.
function generateTransactionId(): string {
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TXN${ts}${rand}`;
}

function SBIContent() {
  const searchParams = useSearchParams();
  const stateCode        = searchParams.get("state")            ?? "";
  const vehicleNo        = searchParams.get("vehicleNo")        ?? "";
  const ownerName        = searchParams.get("ownerName")        ?? "";
  const chassisNo        = searchParams.get("chassisNo")        ?? "";
  const mobileNo         = searchParams.get("mobileNo")         ?? "";
  const fromState        = searchParams.get("fromState")        ?? "";
  const vehicleType      = searchParams.get("vehicleType")      ?? "-1";
  const vehicleClass     = searchParams.get("vehicleClass")     ?? "-1";
  const seatingCap       = searchParams.get("seatingCap")       ?? "";
  const sleeperCap       = searchParams.get("sleeperCap")       ?? "";
  const permitType       = searchParams.get("permitType")       ?? "-1";
  const districtEntering = searchParams.get("districtEntering") ?? "";
  const checkpostName    = searchParams.get("checkpostName")    ?? "";
  const purposeOfVisit   = searchParams.get("purposeOfVisit")   ?? "";
  const aitpValidity     = searchParams.get("aitpValidity")     ?? "";
  const aitpAuthValidity = searchParams.get("aitpAuthValidity") ?? "";
  const taxMode          = searchParams.get("taxMode")          ?? "";
  const noOfPeriods      = searchParams.get("noOfPeriods")      ?? "";
  const taxFrom          = searchParams.get("taxFrom")          ?? "";
  const taxTo            = searchParams.get("taxTo")            ?? "";
  const amount           = searchParams.get("amount")           ?? "0";
  const paymentInitDate  = searchParams.get("paymentInitDate")  ?? "";

  const [clientOrderRef, setClientOrderRef] = useState("");
  const [receiptNo,      setReceiptNo]      = useState("");
  const [txnId,          setTxnId]          = useState("");
  const [paidAt,         setPaidAt]         = useState<Date>(new Date());
  useEffect(() => {
    let orderRef: string;
    if      (stateCode === "HR") orderRef = generateHRBankRef();
    else if (stateCode === "AP") orderRef = generateAPBankRef(paymentInitDate);
    else if (stateCode === "BR") orderRef = generateBRBankRef();
    else if (stateCode === "MH") orderRef = generateMHBankRef();
    else if (stateCode === "JH") orderRef = String(Math.floor(Math.random() * 9000000000000 + 1000000000000));
    else if (stateCode === "UP") orderRef = generateUPBankRef();
    else if (stateCode === "HP")
      orderRef = generateHPBankRef();
    else if (stateCode === "PB")
      orderRef = generateHPBankRef();
    else if (stateCode === "RJ" || stateCode === "UK")
      orderRef = generateCheckpostBankRef();
    else orderRef = makeOrderRef(vehicleNo || "VH");
    setClientOrderRef(orderRef);
    setReceiptNo(generateReceiptNo(stateCode, paymentInitDate));
    setTxnId(generateTransactionId());
    setPaidAt(new Date());
  }, []); // eslint-disable-line

  const [method,         setMethod]         = useState<Method>("netbanking");
  const [selectedBank,   setSelectedBank]   = useState("sbi");
  const [otherBank,      setOtherBank]      = useState("");
  const [upiId,          setUpiId]          = useState("");
  const [upiVerified,    setUpiVerified]    = useState(false);
  const [cardNo,         setCardNo]         = useState("");
  const [cardExpiry,     setCardExpiry]     = useState("");
  const [cardCvv,        setCardCvv]        = useState("");
  const [cardName,       setCardName]       = useState("");
  const [step,           setStep]           = useState<Step>("method");
  const [savedTxnId,     setSavedTxnId]     = useState("");
  const [isSaving,       setIsSaving]       = useState(false);
  const [saveError,      setSaveError]      = useState("");

  const displayAmount = parseFloat(amount || "0").toFixed(2);
  const bankObj = popularBanks.find(b => b.id === selectedBank) ?? popularBanks[0];

  const methodIcons:  Record<Method, string> = { netbanking:"fa-university", upi:"fa-mobile", debitcard:"fa-credit-card", creditcard:"fa-credit-card-alt" };
  const methodLabels: Record<Method, string> = { netbanking:"Net Banking",   upi:"UPI / BHIM", debitcard:"Debit Card",   creditcard:"Credit Card" };

  // Persists the transaction in MongoDB and then flips to the success screen.
  // We must await the save here because the success screen embeds the PDF
  // generated from the DB row — the iframe URL only resolves once the row
  // exists.
  const persistAndShowReceipt = async () => {
    setIsSaving(true);
    setSaveError("");
    setSavedTxnId(txnId);
    setStep("success");
    try {
      // Forward every URL search param the per-state form handed us, plus
      // the gateway-side fields the API requires. This keeps the gateway
      // state-agnostic — Haryana / Punjab / etc. can add state-specific
      // fields (vehicleCategory, fitnessValidity, …) to the form's
      // navigation URL and they'll flow through to /api/payment without
      // any change here.
      const forwarded: Record<string, string> = {};
      searchParams.forEach((v, k) => { forwarded[k] = v; });

      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...forwarded,
          transactionId:    txnId,
          state:            stateCode,
          visitingState:    forwarded.visitingState ?? stateCode,
          noOfPeriods:      parseInt(noOfPeriods) || 1,
          seatingCap:       parseInt(seatingCap)  || 0,
          sleeperCap:       parseInt(sleeperCap)  || 0,
          amount:           parseFloat(amount)    || 0,
          paymentMethod:    forwarded.paymentMethod ?? "ONLINE",
          orderRef:         clientOrderRef,
          receiptNo,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.message || `Payment record save failed (HTTP ${res.status})`);
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save payment record.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePaymentSuccess = () => { void persistAndShowReceipt(); };

  if (step === "success") {
    return (
      <SuccessScreen
        transactionId={savedTxnId}
        stateCode={stateCode}
        vehicleNo={vehicleNo}
        amount={displayAmount}
        isSaving={isSaving}
        saveError={saveError}
        onRetry={() => { void persistAndShowReceipt(); }}
      />
    );
  }

  if (step === "login") {
    return (
      <div className="sbi-page">
        <GatewayHeader orderRef={clientOrderRef} />
        <BankLoginScreen bank={bankObj} amount={displayAmount}
          onBack={() => setStep("method")} onSuccess={handlePaymentSuccess} />
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
            <div className="sbi-step"><div className="sbi-step-num">2</div><div className="sbi-step-lbl">Verify</div></div>
            <div className="sbi-step-line"></div>
            <div className="sbi-step"><div className="sbi-step-num">3</div><div className="sbi-step-lbl">Done</div></div>
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
