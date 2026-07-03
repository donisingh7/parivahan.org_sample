"use client";

import type { ReceiptData } from "../types";
import { jharkhandConfig } from "./config";

// ── Watermark (matches the tiled vehicle/date overlay in the PDF) ───────────

function Watermark({ text }: { text: string }) {
  const items = Array.from({ length: 80 }, (_, i) => i);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {items.map((i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top:  `${Math.floor(i / 8) * 55}px`,
            left: `${(i % 8) * 155 - 60}px`,
            transform: "rotate(-30deg)",
            fontSize: "10px",
            fontWeight: 700,
            whiteSpace: "nowrap",
            color: "rgba(0,0,0,0.09)",
            fontFamily: "Arial, sans-serif",
          }}
        >
          {text}
        </span>
      ))}
    </div>
  );
}

// ── Center emblem watermark (matches the greyscale image in the PDF) ────────

function EmblemWatermark() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "120px",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.08,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={jharkhandConfig.watermarkImage}
        alt=""
        style={{
          width: "260px",
          height: "auto",
          filter: "grayscale(100%)",
        }}
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
    </div>
  );
}

// ── QR placeholder (replaced by a real QR via the PDF; React side keeps a
//    visual stand-in until the user downloads the PDF) ─────────────────────

function QRPlaceholder({ value }: { value: string }) {
  return (
    <div
      style={{
        width: 80,
        height: 80,
        border: "2px solid #000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "7px",
        textAlign: "center",
        padding: "4px",
        background: "#fff",
        flexShrink: 0,
      }}
    >
      <svg width="64" height="64" viewBox="0 0 7 7" style={{ imageRendering: "pixelated" }}>
        {[
          [0,0],[1,0],[2,0],[3,0],[4,0],[0,1],[4,1],[0,2],[1,2],[2,2],[3,2],[4,2],[0,3],[4,3],[0,4],[1,4],[2,4],[3,4],[4,4],
          [6,0],[5,0],[6,1],[6,2],[5,2],[6,3],[5,4],[6,4],
          [0,5],[1,5],[2,5],[0,6],[2,6],[1,6],
          [5,5],[6,6],[5,6],[6,5],[3,5],[4,6],[3,6],
        ].map(([x, y], i) => (
          <rect key={i} x={x} y={y} width={1} height={1} fill="#000" />
        ))}
      </svg>
      <div style={{ fontSize: "6px", marginTop: "2px", wordBreak: "break-all" }}>
        {value.slice(0, 16)}
      </div>
    </div>
  );
}

// ── Single field row helper (label : value), used everywhere ────────────────

function FieldCell({
  label,
  value,
  bold = false,
  span = 1,
}: {
  label: string;
  value: React.ReactNode;
  bold?: boolean;
  span?: 1 | 2;
}) {
  return (
    <td colSpan={span === 2 ? 5 : 2} style={fieldCellStyle}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={labelStyle}>{label}</td>
            <td style={colonStyle}>:</td>
            <td style={{ ...valueStyle, fontWeight: bold ? 700 : 400 }}>{value || "-"}</td>
          </tr>
        </tbody>
      </table>
    </td>
  );
}

const fieldCellStyle: React.CSSProperties = {
  padding: "6px 0",
  fontFamily: "Arial, sans-serif",
  fontSize: "11px",
  verticalAlign: "top",
};
const labelStyle: React.CSSProperties = {
  width: "115px",
  fontWeight: 700,
  padding: "0 4px",
  whiteSpace: "nowrap",
};
const colonStyle: React.CSSProperties = {
  width: "8px",
  padding: 0,
};
const valueStyle: React.CSSProperties = {
  padding: "0 4px",
};

// ── Main Receipt ────────────────────────────────────────────────────────────

export default function JharkhandReceiptTemplate({ data }: { data: ReceiptData }) {
  return (
    <div
      id="jharkhand-receipt"
      style={{
        position: "relative",
        maxWidth: "800px",
        margin: "0 auto",
        background: "#fff",
        padding: "20px 28px 24px",
        fontFamily: "Arial, sans-serif",
        color: "#000",
        fontSize: "12px",
        boxSizing: "border-box",
        minHeight: "1100px",
      }}
    >
      <EmblemWatermark />
      <Watermark text={`${data.registrationNo} / ${data.paymentDateText}`} />

      {/* Header strip */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "16px",
        }}
      >
        {/* Left: logo placeholder */}
        <div style={{ minWidth: "100px", display: "flex", alignItems: "flex-start" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Images/Jharkhand_logo.png"
            alt="Jharkhand Emblem"
            style={{ width: "70px", height: "70px", objectFit: "contain" }}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        </div>

        <div style={{ textAlign: "center", flex: 1, padding: "0 16px" }}>
          <div style={{ fontWeight: 900, fontSize: "15px", textDecoration: "underline" }}>
            {jharkhandConfig.govLabel}
          </div>
          <div style={{ fontSize: "13px", marginTop: "2px" }}>{jharkhandConfig.deptLabel}</div>
          <div style={{ fontSize: "12px", marginTop: "2px" }}>{jharkhandConfig.receiptTitle}</div>
          <div style={{ fontSize: "9px", marginTop: "6px", color: "#555" }}>
            <strong>Printed on :</strong> {data.paymentDateText}
          </div>
        </div>

        <QRPlaceholder value={data.qrUrl || data.receiptNo} />
      </div>

      {/* Field grid — mirrors PDF layout exactly */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <FieldCell label="Registration No." value={data.registrationNo} bold />
              <FieldCell label="Receipt No."      value={data.receiptNo} />
            </tr>
            <tr>
              <FieldCell label="Payment Initialization Date" value={data.paymentInitDate} />
              <FieldCell label="Owner Name"                  value={data.ownerName} />
            </tr>
            <tr>
              <FieldCell label="Chassis No." value={data.chassisNo} />
              <FieldCell label="Tax Mode"    value={data.taxMode} />
            </tr>
            <tr>
              <FieldCell label="Vehicle Type"  value={data.vehicleType} />
              <FieldCell label="Vehicle Class" value={data.vehicleClass} />
            </tr>
            <tr>
              <FieldCell label="Mobile No."     value={data.mobileNo} />
              <FieldCell label="CheckPost Name" value={data.checkpostName} />
            </tr>
            <tr>
              <FieldCell label={data.cap1Label || "Gross Vehicle Wt (In. Kg)"} value={String(data.cap1Value ?? data.grossVehicleWt ?? "")} />
              <FieldCell label={data.cap2Label || "Unladen Wt (In Kg.)"}       value={String(data.cap2Value ?? data.unladenWt ?? 0)} />
            </tr>
            <tr>
              <FieldCell label="Bank Ref. No." value={data.bankRefNo} />
              <FieldCell label="Payment Mode"  value={data.paymentMode} />
            </tr>
            <tr>
              <FieldCell label="Fitness Validity"   value={data.fitnessValidity} />
              <FieldCell label="Insurance Validity" value={data.insuranceValidity} />
            </tr>
            <tr>
              <FieldCell label="PUCC Validity" value={data.puccValidity} />
              <FieldCell label="Service Type"  value={data.serviceType} />
            </tr>
            <tr>
              <FieldCell label="Permit Type"                value={data.permitType} />
              <FieldCell label="Gross Combination Wt (kg)" value={String(data.grossCombinationWeight ?? "")} />
            </tr>
            <tr>
              <FieldCell label="Payment Confirmation Date" value={data.paymentConfirmDate} span={2} />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tax table */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          marginTop: "18px",
          border: "1px solid #87CEEB",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #87CEEB", background: "#f8f8f8" }}>
              <th style={{ ...taxCellStyle, textAlign: "left",   width: "55%" }}>Tax/Fee Particular</th>
              <th style={{ ...taxCellStyle, textAlign: "right", borderLeft: "1px solid #87CEEB" }}>Tax/Fees</th>
              <th style={{ ...taxCellStyle, textAlign: "right", borderLeft: "1px solid #87CEEB" }}>Fine</th>
              <th style={{ ...taxCellStyle, textAlign: "right", borderLeft: "1px solid #87CEEB" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {data.taxItems.map((item, i) => (
              <tr key={i} style={{ borderTop: "1px solid #87CEEB" }}>
                <td style={{ ...taxCellStyle, textAlign: "left",   fontWeight: 700 }}>{item.particular}</td>
                <td style={{ ...taxCellStyle, textAlign: "right", borderLeft: "1px solid #87CEEB" }}>{item.fees}</td>
                <td style={{ ...taxCellStyle, textAlign: "right", borderLeft: "1px solid #87CEEB" }}>{item.fine}</td>
                <td style={{ ...taxCellStyle, textAlign: "right", borderLeft: "1px solid #87CEEB" }}>{item.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Grand Total */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          marginTop: "10px",
          fontSize: "12px",
          fontWeight: 700,
        }}
      >
        Grand Total : {data.amount}/- {data.amountInWords} Rupees Only
      </div>

      {/* Notes */}
      <div style={{ position: "relative", zIndex: 1, marginTop: "14px", fontSize: "11px" }}>
        <strong>Note :</strong>
        <br />
        <strong>Terms and Conditions:</strong>
        <ol style={{ marginTop: "4px", paddingLeft: "20px", lineHeight: "1.8", fontSize: "10px" }}>
          <li>This is a computer generated printout and no signature is required.</li>
          <li>Should not carry unlawful/unaccompanied goods.</li>
          <li>If any false information/discrepancies are found at later, necessary action will be taken against the vehicle owner/driver.</li>
        </ol>
      </div>

      <div style={{ position: "relative", zIndex: 1, marginTop: "10px", fontSize: "12px", fontWeight: 700 }}>
        Scan the QR code for genuinity of the receipt.
      </div>
    </div>
  );
}

const taxCellStyle: React.CSSProperties = {
  padding: "6px 8px",
  fontFamily: "Arial, sans-serif",
  fontSize: "11px",
  verticalAlign: "top",
};
