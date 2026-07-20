"use client";

import type { ReceiptData } from "../types";
import { madhyaPradeshConfig } from "./config";

const TERMS = [
  'This is a computer generated printout and no signature is required.',
  'Should not carry unlawful/unaccompanied goods.',
  'If any false information/discrepancies are found at later, necessary action will be taken against the vehicle owner/driver.',
];

// ── Text watermark (tiled) ─────────────────────────────────────────────────
function Watermark({ text }: { text: string }) {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {Array.from({ length: 80 }, (_, i) => (
        <span
          key={i}
          style={{
            position:   "absolute",
            top:        `${Math.floor(i / 8) * 20}px`,
            left:       `${(i % 8) * 170}px`,
            fontSize:   "15.5px",
            fontWeight: 700,
            whiteSpace: "nowrap",
            color:      "rgba(170,170,170,0.5)",
            fontFamily: "Helvetica, Arial, sans-serif",
          }}
        >
          {text}
        </span>
      ))}
    </div>
  );
}

// ── Image watermark (center-right offset, matches PDF) ─────────────────────
function EmblemWatermark() {
  return (
    <div style={{
      position:      "absolute",
      top:           "50%",
      left:          "50%",
      transform:     "translate(-50%, -50%) translateX(60px) translateY(-80px)",
      pointerEvents: "none",
      zIndex:        0,
      opacity:       0.42,
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={madhyaPradeshConfig.watermarkImage}
        alt=""
        style={{ width: "260px", height: "260px", objectFit: "contain" }}
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
    </div>
  );
}

// ── QR placeholder (108×108 matching PDF QR) ──────────────────────────────
function QRPlaceholder({ value }: { value: string }) {
  return (
    <div style={{
      width:          108,
      height:         108,
      border:         "1px solid #000",
      display:        "flex",
      flexDirection:  "column",
      alignItems:     "center",
      justifyContent: "center",
      background:     "#fff",
      flexShrink:     0,
      marginTop:      "20px",
    }}>
      <svg width="84" height="84" viewBox="0 0 7 7" style={{ imageRendering: "pixelated" }}>
        {([
          [0,0],[1,0],[2,0],[3,0],[4,0],[0,1],[4,1],[0,2],[1,2],[2,2],[3,2],[4,2],
          [0,3],[4,3],[0,4],[1,4],[2,4],[3,4],[4,4],[6,0],[5,0],[6,1],[6,2],[5,2],
          [6,3],[5,4],[6,4],[0,5],[1,5],[2,5],[0,6],[2,6],[1,6],[5,5],[6,6],[5,6],
          [6,5],[3,5],[4,6],[3,6],
        ] as [number, number][]).map(([x, y], i) => (
          <rect key={i} x={x} y={y} width={1} height={1} fill="#000" />
        ))}
      </svg>
      <div style={{ fontSize: "6px", marginTop: "2px", wordBreak: "break-all", textAlign: "center", padding: "0 4px" }}>
        {value.slice(0, 24)}
      </div>
    </div>
  );
}

// ── Field row (label : value) ──────────────────────────────────────────────
function Field({ label, value, mb }: { label: string; value: React.ReactNode; mb?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", marginBottom: mb ?? "8px" }}>
      <div style={{ width: "120px", fontSize: "13.5px", fontWeight: 400, flexShrink: 0, lineHeight: 1.4, whiteSpace: "pre-line" }}>
        {label}
      </div>
      <div style={{ width: "14px", fontSize: "13.5px" }}>:</div>
      <div style={{ fontSize: "13.5px", flex: 1, lineHeight: 1.4 }}>
        {value ?? "-"}
      </div>
    </div>
  );
}

// ── Page wrapper ───────────────────────────────────────────────────────────
const pageStyle: React.CSSProperties = {
  position:   "relative",
  maxWidth:   "794px",
  margin:     "0 auto",
  background: "#fff",
  padding:    "20px 30px",
  fontFamily: "Helvetica, Arial, sans-serif",
  color:      "#000",
  boxSizing:  "border-box",
  minHeight:  "1123px",
  overflow:   "hidden",
};

// ── Table cell styles (sky-blue borders matching PDF) ─────────────────────
const thStyle: React.CSSProperties = {
  border:     "0.8px solid #87CEEB",
  padding:    "8px 6px",
  fontWeight: 600,
  textAlign:  "center",
  fontSize:   "11.5px",
};
const tdStyle: React.CSSProperties = {
  border:     "0.8px solid #87CEEB",
  padding:    "10px 6px",
  fontSize:   "11.5px",
  fontWeight: "bold",
};

// ── Main component ─────────────────────────────────────────────────────────
export default function MadhyaPradeshReceiptTemplate({ data }: { data: ReceiptData }) {
  const grandTotal    = (data.taxItems || []).reduce((sum, item) => sum + (item.total || 0), 0);
  const printedOn     = data.printedOnDate || data.paymentDateText || "-";
  const amountInWords = (data.amountInWords || "").toUpperCase();
  // Watermark uses the Payment Init date at HH:MM (no seconds, non-padded
  // hour) — e.g. "23-JUN-2026 9:45 PM".
  const initWatermark = data.paymentInitDate
    ? data.paymentInitDate.replace(
        /^(\d{2}-[A-Za-z]{3}-\d{4})\s+(\d{1,2}):(\d{2}):\d{2}\s+(AM|PM)$/i,
        (_m, d, h, mm, ap) => `${d} ${parseInt(h, 10)}:${mm} ${ap}`)
    : printedOn;
  // Payment Init/Conf fields show HH:MM only (no seconds).
  const stripSecs = (s: string) => s.replace(/(\d{1,2}:\d{2}):\d{2}(\s*(?:AM|PM))/i, "$1$2");
  const paymentInitHHMM = data.paymentInitDate ? stripSecs(data.paymentInitDate) : "-";
  const paymentConfHHMM = stripSecs(data.paymentConfirmDate || data.paymentDateText || "-");

  return (
    <div style={{ fontFamily: "Helvetica, Arial, sans-serif", color: "#000" }}>

      {/* ══════════════════ PAGE 1 ══════════════════ */}
      <div style={pageStyle}>
        <EmblemWatermark />
        <Watermark text={`${data.registrationNo} ${initWatermark}`} />

        {/* Printed on — top right */}
        <div style={{ position: "relative", zIndex: 1, textAlign: "right", fontSize: "11px", marginBottom: "4px" }}>
          Printed on : {printedOn}
        </div>

        {/* Header: logo | titles | QR */}
        <table style={{ position: "relative", zIndex: 1, width: "100%", borderCollapse: "collapse", marginBottom: "12px" }}>
          <tbody>
            <tr style={{ verticalAlign: "middle" }}>
              {/* Logo */}
              <td style={{ width: "20%", padding: "10px 5px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={madhyaPradeshConfig.watermarkImage}
                  alt=""
                  style={{ width: "100px", height: "100px", objectFit: "contain" }}
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              </td>
              {/* Titles */}
              <td style={{ width: "55%", textAlign: "center", verticalAlign: "top", paddingTop: "55px" }}>
                <div style={{ fontSize: "13px", fontWeight: "bold", textDecoration: "underline" }}>
                  Transport Department MADHYA PRADESH
                </div>
                <div style={{ fontSize: "11px", marginTop: "5px" }}>Department of Transport</div>
                <div style={{ fontSize: "10px", marginTop: "4px" }}>Checkpost Tax e-Receipt</div>
              </td>
              {/* QR */}
              <td style={{ width: "25%", textAlign: "right", verticalAlign: "top" }}>
                <QRPlaceholder value={data.receiptNo || data.qrUrl} />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Two-column fields */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", gap: "4px" }}>
          {/* Left column */}
          <div style={{ flex: 1 }}>
            <Field label={"Registration\nNo."}              value={data.registrationNo} />
            <Field label={"Payment\nInitialization\nDate"}  value={paymentInitHHMM} />
            <Field label="Chassis No."                      value={data.chassisNo} />
            <Field label="Vehilce Type"                     value={data.vehicleType} />
            <Field label={"Vehicle\nCategory"}              value={data.vehicleCategory} mb="21px" />
            <Field label={"Checkpost\nName"}                value={data.checkpostName} />
            <Field label={data.cap2Label || "Sleeper Cap."} value={data.cap2Value ?? data.sleeperCap} />
            <Field label={"Payment\nMode"}                  value={data.paymentMode} />
            <Field label={"Permit\nValidity"}               value={data.permitValidity} />
            <Field label={"Insurance\nValidity"}            value={data.insuranceValidity} />
            <Field label="Service Type"                     value={data.serviceType} />
            <Field label={"Payment\nConfirmation\nDate"}    value={paymentConfHHMM} />
          </div>
          {/* Right column */}
          <div style={{ flex: 1 }}>
            <Field label="Receipt No."         value={data.receiptNo} />
            <Field label="Owner Name"          value={data.ownerName} />
            <Field label="Tax Mode"            value={data.taxMode} />
            <Field label="Vehicle Class"       value={data.vehicleClass} />
            <Field label="Mobile No."          value={data.mobileNo} mb="21px" />
            <Field label={data.cap1Label || "Seating\nCapacity"} value={data.cap1Value ?? data.seatingCapacity} />
            <Field label="Bank Ref. No."       value={data.bankRefNo} />
            <Field label={"Permit\nNumber"}    value={data.permitNumber || "0000"} />
            <Field label={"Fitness\nValidity"} value={data.fitnessValidity} />
            <Field label="PUCC Validity"       value={data.puccValidity} />
            <Field label="Permit Type"         value={data.permitType || "NOT APPLICABLE"} />
          </div>
        </div>

        {/* Tax table */}
        <div style={{ position: "relative", zIndex: 1, marginTop: "20px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: "60%", textAlign: "left", paddingLeft: "8px" }}>
                  Tax/Fee Particular
                </th>
                <th style={thStyle}>Tax/Fees</th>
                <th style={thStyle}>Fine</th>
                <th style={thStyle}>Total</th>
              </tr>
            </thead>
            <tbody>
              {(data.taxItems || []).map((item, i) => (
                <tr key={i}>
                  <td style={{ ...tdStyle, textAlign: "left", paddingLeft: "8px" }}>{item.particular}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{item.fees}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{item.fine}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════ PAGE 2 ══════════════════ */}
      <div style={{ ...pageStyle, minHeight: "auto", borderTop: "2px dashed #ccc", marginTop: "0" }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Grand Total */}
          <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "10px" }}>
            Grand Total : Rs. {grandTotal}/- {amountInWords} Rupees Only
          </div>
          <hr style={{ border: "none", borderTop: "0.5px solid #000", marginBottom: "14px" }} />

          <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>Note:</div>
          <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>Terms and Conditions:</div>
          {TERMS.map((term, i) => (
            <div key={i} style={{ fontSize: "12px", marginBottom: "10px" }}>
              {i + 1}. {term}
            </div>
          ))}
          <div style={{ marginTop: "24px", fontSize: "18px", fontWeight: "bold" }}>
            Scan the QR code for genuinity of the receipt.
          </div>
        </div>
      </div>

    </div>
  );
}
