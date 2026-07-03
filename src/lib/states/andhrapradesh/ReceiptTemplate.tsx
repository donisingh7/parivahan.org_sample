"use client";

import type { ReceiptData } from "../types";

const TERMS = [
  "This is a computer generated printout and no signature is required.",
  "Should not carry unlawful/unaccompanied goods.",
  "If any false information/discrepancies are found at later, necessary action will be taken against the vehicle owner/driver.",
];

// ── Text watermark ─────────────────────────────────────────────────────────
function Watermark({ text }: { text: string }) {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {Array.from({ length: 28 }, (_, i) => (
        <span key={i} style={{
          position:   "absolute",
          top:        `${25 + i * 20}px`,
          left:       "25px",
          fontSize:   "11px",
          fontWeight: 700,
          whiteSpace: "nowrap",
          color:      "rgba(170,170,170,0.5)",
          fontFamily: "Helvetica, Arial, sans-serif",
        }}>
          {`${text}  `.repeat(2)}
        </span>
      ))}
    </div>
  );
}

// ── Image watermark (AP logo, centred) ─────────────────────────────────────
function EmblemWatermark() {
  return (
    <div style={{
      position:  "absolute",
      top:       "150px",
      left:      "50%",
      transform: "translateX(-50%)",
      pointerEvents: "none",
      zIndex:    0,
      opacity:   0.30,
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/Images/Andhra_Pradesh_logo.png"
        alt=""
        style={{ width: "180px", height: "180px", objectFit: "contain" }}
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
    </div>
  );
}

// ── QR placeholder ─────────────────────────────────────────────────────────
function QRPlaceholder({ value }: { value: string }) {
  return (
    <div style={{
      width: 100, height: 100,
      border: "1px solid #000",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#fff", flexShrink: 0,
    }}>
      <svg width="80" height="80" viewBox="0 0 7 7" style={{ imageRendering: "pixelated" }}>
        {([
          [0,0],[1,0],[2,0],[3,0],[4,0],[0,1],[4,1],[0,2],[1,2],[2,2],[3,2],[4,2],
          [0,3],[4,3],[0,4],[1,4],[2,4],[3,4],[4,4],[6,0],[5,0],[6,1],[6,2],[5,2],
          [6,3],[5,4],[6,4],[0,5],[1,5],[2,5],[0,6],[2,6],[1,6],[5,5],[6,6],[5,6],
          [6,5],[3,5],[4,6],[3,6],
        ] as [number,number][]).map(([x,y],i) => (
          <rect key={i} x={x} y={y} width={1} height={1} fill="#000" />
        ))}
      </svg>
      <div style={{ fontSize: "6px", marginTop: "2px", wordBreak: "break-all", textAlign: "center", padding: "0 4px" }}>
        {value.slice(0, 20)}
      </div>
    </div>
  );
}

// ── Field row (label : value) ──────────────────────────────────────────────
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "9px" }}>
      <div style={{ width: "105px", fontSize: "8.5px", fontWeight: 700, flexShrink: 0, lineHeight: 1.4, whiteSpace: "pre-line" }}>
        {label}
      </div>
      <div style={{ width: "10px", fontSize: "8.5px" }}>:</div>
      <div style={{ fontSize: "8.5px", fontWeight: 700, flex: 1, lineHeight: 1.4 }}>
        {value ?? "-"}
      </div>
    </div>
  );
}

// ── Tax table cell styles (sky-blue borders) ───────────────────────────────
const thStyle: React.CSSProperties = {
  border: "0.8px solid #87CEEB",
  padding: "5px 6px",
  fontWeight: 600,
  textAlign: "center",
  fontSize: "7px",
};
const tdStyle: React.CSSProperties = {
  border: "0.8px solid #87CEEB",
  padding: "6px",
  fontSize: "9px",
  fontWeight: "bold",
};

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

// ── Main component ─────────────────────────────────────────────────────────
export default function AndhraPradeshReceiptTemplate({ data }: { data: ReceiptData }) {
  const grandTotal = (data.taxItems || []).reduce((sum, item) => sum + (item.total || 0), 0);
  const printedOn  = data.paymentDateText || "-";

  return (
    <div style={pageStyle}>
      <EmblemWatermark />
      <Watermark text={`${data.registrationNo} ${printedOn}`} />

      {/* Printed on — top right */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "right", fontSize: "7px", marginBottom: "4px" }}>
        Printed on : {printedOn}
      </div>

      {/* Header: AP logo | title | QR */}
      <table style={{ position: "relative", zIndex: 1, width: "100%", borderCollapse: "collapse", marginBottom: "10px" }}>
        <tbody>
          <tr style={{ verticalAlign: "middle" }}>
            <td style={{ width: "15%", padding: "4px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Images/Andhra_Pradesh_logo.png"
                alt=""
                style={{ width: "80px", height: "80px", objectFit: "contain", background: "#fff" }}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            </td>
            <td style={{ width: "60%", textAlign: "center", verticalAlign: "middle" }}>
              <div style={{ fontSize: "10px", fontWeight: "bold", textDecoration: "underline" }}>
                GOVERNMENT OF ANDHRA PRADESH
              </div>
              <div style={{ fontSize: "9px", fontWeight: "bold", marginTop: "3px" }}>Department of Transport</div>
              <div style={{ fontSize: "9px", fontWeight: "bold", marginTop: "3px" }}>Checkpost Tax e-Receipt</div>
            </td>
            <td style={{ width: "25%", textAlign: "right", verticalAlign: "top" }}>
              <QRPlaceholder value={data.receiptNo || data.qrUrl} />
            </td>
          </tr>
        </tbody>
      </table>

      {/* Two-column fields — 12 rows matching PDF */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", gap: "10px" }}>
        {/* Left column */}
        <div style={{ flex: 1 }}>
          <Field label="Registration No."          value={data.registrationNo} />
          <Field label={"Payment\nInitialization Date"} value={data.paymentInitDate} />
          <Field label="Chassis No."               value={data.chassisNo} />
          <Field label="Vehicle Type"              value={data.vehicleType} />
          <Field label="Vehicle Category"          value={data.vehicleCategory} />
          <Field label="CheckPost Name"            value={data.checkpostName} />
          <Field label={data.cap2Label || "Unladen Wt\n(In Kg.)"}   value={data.cap2Value ?? data.unladenWt} />
          <Field label="Payment Mode"              value={data.paymentMode} />
          <Field label="Fitness Validity"          value={data.fitnessValidity} />
          <Field label="PUCC Validity"             value={data.puccValidity} />
          <Field label="Permit Type"               value={data.permitType || "NOT APPLICABLE"} />
          <Field label="Route"                     value={data.route} />
        </div>
        {/* Right column */}
        <div style={{ flex: 1 }}>
          <Field label="Receipt No."               value={data.receiptNo} />
          <Field label="Owner Name."               value={data.ownerName} />
          <Field label="Tax Mode"                  value={data.taxMode} />
          <Field label="Vehicle Class"             value={data.vehicleClass} />
          <Field label="Mobile No."                value={data.mobileNo} />
          <Field label={data.cap1Label || "Gross Vehicle\nWt (In. Kg)"} value={data.cap1Value ?? data.grossVehicleWt} />
          <Field label="Bank Ref. No."             value={data.bankRefNo} />
          <Field label="Permit Validity"           value={data.permitValidity} />
          <Field label="Insurance Validity"        value={data.insuranceValidity} />
          <Field label="Service Type"              value={data.serviceType} />
          <Field label="Name of Goods"             value={data.nameOfGoods} />
          <Field label={"Payment\nConfirmation Date"} value={data.paymentDateText} />
        </div>
      </div>

      {/* Tax table */}
      <div style={{ position: "relative", zIndex: 1, marginTop: "14px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: "55%", textAlign: "left", paddingLeft: "8px" }}>
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

      {/* Grand Total */}
      <div style={{ position: "relative", zIndex: 1, marginTop: "12px", fontSize: "8px", fontWeight: "bold" }}>
        Grand Total : {grandTotal}/- {data.amountInWords} Rupees Only
      </div>

      {/* Note & Terms */}
      <div style={{ position: "relative", zIndex: 1, marginTop: "10px" }}>
        <div style={{ fontSize: "8px", fontWeight: "bold", marginBottom: "6px" }}>Note :</div>
        <div style={{ fontSize: "8px", fontWeight: "bold", marginBottom: "6px" }}>Terms and Conditions:</div>
        {TERMS.map((term, i) => (
          <div key={i} style={{ fontSize: "7.5px", marginBottom: "6px" }}>
            {i + 1}. {term}
          </div>
        ))}
      </div>

      {/* QR scan note */}
      <div style={{ position: "relative", zIndex: 1, marginTop: "20px", fontSize: "13px", fontWeight: "bold" }}>
        Scan the QR code for genuinity of the receipt.
      </div>
    </div>
  );
}
