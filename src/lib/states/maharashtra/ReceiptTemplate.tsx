"use client";

import type { ReceiptData } from "../types";
import { maharashtraConfig } from "./config";

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
        src={maharashtraConfig.watermarkImage}
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

export default function MaharashtraReceiptTemplate({ data }: { data: ReceiptData }) {
  return (
    <div
      id="maharashtra-receipt"
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
        <div style={{ fontSize: "10px", lineHeight: "1.6", minWidth: "150px" }}>
          <strong>Receipt Printing Date :</strong>
          <br />
          {data.paymentDateText}
        </div>

        <div style={{ textAlign: "center", flex: 1, padding: "0 16px" }}>
          <div style={{ fontWeight: 900, fontSize: "15px", textDecoration: "underline" }}>
            {maharashtraConfig.govLabel}
          </div>
          <div style={{ fontSize: "13px", marginTop: "2px" }}>{maharashtraConfig.deptLabel}</div>
          <div style={{ fontSize: "12px", marginTop: "2px" }}>{maharashtraConfig.receiptTitle}</div>
        </div>

        <QRPlaceholder value={data.receiptNo} />
      </div>

      {/* Field grid */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr><FieldCell label="Registration No." value={data.registrationNo} bold span={2} /></tr>
            <tr><FieldCell label="Receipt No."      value={data.receiptNo}      span={2} /></tr>
            <tr><FieldCell label="Payment Date"     value={data.paymentDateText} span={2} /></tr>
            <tr><FieldCell label="Owner Name"       value={data.ownerName}       span={2} /></tr>
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
              <FieldCell label="Checkpost Name" value={data.checkpostName} />
            </tr>
            <tr><td colSpan={4} style={{ height: "10px" }} /></tr>
            <tr>
              <FieldCell label="Sleeper Cap."     value={data.sleeperCap || 0} />
              <FieldCell label="Seating Capacity" value={data.seatingCapacity || 0} />
            </tr>
            <tr>
              <FieldCell label="Bank Ref. No." value={data.bankRefNo} />
              <FieldCell label="Payment Mode"  value={data.paymentMode} />
            </tr>
            <tr><FieldCell label="Service Type" value={data.serviceType} span={2} /></tr>
            <tr>
              <FieldCell label="Permit Type"     value={data.permitType} />
              <FieldCell label="Permit Category" value={data.permitCategory} />
            </tr>
            <tr><FieldCell label="Payment Confirmation Date" value={data.paymentDateText} span={2} /></tr>
          </tbody>
        </table>
      </div>

      {/* Tax table */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          marginTop: "18px",
          borderTop: "1px solid #000",
          paddingTop: "6px",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #000" }}>
              <th style={{ ...taxCellStyle, textAlign: "left",   width: "60%" }}>Particular</th>
              <th style={{ ...taxCellStyle, textAlign: "right" }}>Fees/Tax</th>
              <th style={{ ...taxCellStyle, textAlign: "right" }}>Fine</th>
              <th style={{ ...taxCellStyle, textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {data.taxItems.map((item, i) => (
              <tr key={i}>
                <td style={{ ...taxCellStyle, textAlign: "left" }}>{item.particular}</td>
                <td style={{ ...taxCellStyle, textAlign: "right" }}>{item.fees}</td>
                <td style={{ ...taxCellStyle, textAlign: "right" }}>{item.fine}</td>
                <td style={{ ...taxCellStyle, textAlign: "right" }}>{item.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ borderTop: "1px solid #000", marginTop: "2px" }} />
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
        Grand Total : &#8377; {data.amount} &nbsp; ( {data.amountInWords} ONLY/- )
      </div>

      {/* Notes */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          marginTop: "16px",
          fontSize: "11px",
          fontStyle: "italic",
          lineHeight: "1.6",
        }}
      >
        <span style={{ fontWeight: 700, fontStyle: "normal" }}>Note :</span>{" "}
        1) This is a computer generated printout and no signature is required.
        <br />
        <span style={{ marginLeft: "30px" }}>
          2) Incorrect mentioning of vehicle class or seating capacity may lead to tax evasion and
          defaulter shall be liable for penal action
        </span>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          marginTop: "12px",
          fontSize: "11px",
          fontStyle: "italic",
        }}
      >
        You will also receive the payment confirmation message.
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          marginTop: "10px",
          fontSize: "11px",
        }}
      >
        Scan the QR code for genuinity of the receipt, It should land at{" "}
        <span style={{ color: "#0000EE", textDecoration: "underline" }}>
          https://kms.parivahan.gov.in
        </span>{" "}
        site. In case the URL is different, then receipt could be a fake one, please raise a complain
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
