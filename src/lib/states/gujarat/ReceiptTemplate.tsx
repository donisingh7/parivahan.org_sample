"use client";

import type { ReceiptData } from "../types";
import { gujaratConfig } from "./config";

// -- Watermark (tiled text overlay) -----------------------------------------

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

// -- Centre emblem watermark ------------------------------------------------

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
        src={gujaratConfig.watermarkImage}
        alt=""
        style={{ width: "260px", height: "auto", filter: "grayscale(100%)" }}
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
    </div>
  );
}

// -- QR placeholder ---------------------------------------------------------

function QRPlaceholder({ value }: { value: string }) {
  return (
    <div
      style={{
        width: 90,
        height: 90,
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

// -- Single field row helper -------------------------------------------------

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
  padding: "5px 0",
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

// -- Main Receipt -----------------------------------------------------------

export default function GujaratReceiptTemplate({ data }: { data: ReceiptData }) {
  const printedOn = data.printedOnDate || data.paymentDateText || "-";
  // Watermark uses Payment Init date at HH:MM precision (strip seconds).
  const initDateHHMM = data.paymentInitDate
    ? data.paymentInitDate.replace(/(\d{2}:\d{2}):\d{2}/, "$1")
    : printedOn;

  return (
    <div
      id="gujarat-receipt"
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
      <Watermark text={`${data.registrationNo} / ${initDateHHMM}`} />

      {/* Header */}
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
        <div style={{ minWidth: "100px", display: "flex", alignItems: "flex-start" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Images/Gujarat.png"
            alt="Gujarat Emblem"
            style={{ width: "70px", height: "70px", objectFit: "contain" }}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        </div>

        <div style={{ textAlign: "center", flex: 1, padding: "0 16px" }}>
          <div style={{ fontWeight: 900, fontSize: "15px", textDecoration: "underline" }}>
            {gujaratConfig.govLabel}
          </div>
          <div style={{ fontSize: "13px", marginTop: "2px" }}>{gujaratConfig.deptLabel}</div>
          <div style={{ fontSize: "12px", marginTop: "2px" }}>{gujaratConfig.receiptTitle}</div>
          <div style={{ fontSize: "9px", marginTop: "6px", color: "#555" }}>
            <strong>Printed on :</strong> {printedOn}
          </div>
        </div>

        <QRPlaceholder value={data.qrUrl || data.receiptNo} />
      </div>

      {/* Field grid -- mirrors Gujarat PDF layout */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {/* Rows 1-4: single column */}
            <tr>
              <FieldCell label="Registration No." value={data.registrationNo} bold span={2} />
            </tr>
            <tr>
              <FieldCell label="Receipt No."  value={data.receiptNo} span={2} />
            </tr>
            <tr>
              <FieldCell label="Payment Init Date" value={initDateHHMM} span={2} />
            </tr>
            <tr>
              <FieldCell label="Owner Name" value={data.ownerName} span={2} />
            </tr>
            {/* Row 5 */}
            <tr>
              <FieldCell label="Chassis No." value={data.chassisNo} />
              <FieldCell label="Tax Mode"    value={data.taxMode} />
            </tr>
            {/* Row 6 */}
            <tr>
              <FieldCell label="Vehicle Type"  value={data.vehicleType} />
              <FieldCell label="Vehicle Class" value={data.vehicleClass} />
            </tr>
            {/* Row 7 */}
            <tr>
              <FieldCell label="Mobile No."     value={data.mobileNo} />
              <FieldCell label="Checkpost Name" value={data.checkpostName} />
            </tr>
            {/* Row 8 -- MH-specific */}
            <tr>
              <FieldCell label={data.cap2Label || "Unladen Weight"} value={data.cap2Value ?? data.unladenWeight} />
              <FieldCell label={data.cap1Label || "Laden Weight"}   value={data.cap1Value ?? data.ladenWeight} />
            </tr>
            {/* Row 9 */}
            <tr>
              <FieldCell label="Bank Ref. No." value={data.bankRefNo} />
              <FieldCell label="Payment Mode"  value={data.paymentMode} />
            </tr>
            {/* Row 10 -- Maker Status sits below Payment Mode (right column of
                Row 9) and above Permit Category (right column of Row 11). */}
            <tr>
              <FieldCell label="Service Type" value={data.serviceType} />
              <FieldCell label="Maker Status" value={data.makerStatus} />
            </tr>
            {/* Row 11 */}
            <tr>
              <FieldCell label="Permit Type"     value={data.permitType} />
              <FieldCell label="Permit Category" value={data.permitCategory} />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tax table */}
      <div style={{ position: "relative", zIndex: 1, marginTop: "18px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", borderTop: "1px solid #000" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #000" }}>
              <th style={{ ...taxCellStyle, textAlign: "left", width: "55%" }}>Particular</th>
              <th style={{ ...taxCellStyle, textAlign: "right" }}>Fees/Tax</th>
              <th style={{ ...taxCellStyle, textAlign: "right" }}>Fine</th>
              <th style={{ ...taxCellStyle, textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {data.taxItems.map((item, i) => (
              <tr key={i} style={{ borderTop: "1px solid #aaa" }}>
                <td style={{ ...taxCellStyle, textAlign: "left" }}>{item.particular}</td>
                <td style={{ ...taxCellStyle, textAlign: "right" }}>{item.fees}</td>
                <td style={{ ...taxCellStyle, textAlign: "right" }}>{item.fine}</td>
                <td style={{ ...taxCellStyle, textAlign: "right" }}>{item.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ borderTop: "1px solid #000", height: 0 }} />
      </div>

      {/* Grand Total */}
      <div style={{ position: "relative", zIndex: 1, marginTop: "10px", fontSize: "12px", fontWeight: 700 }}>
        Grand Total : Rs. {data.amount} ( {data.amountInWords} ONLY/-)
      </div>

      {/* Notes */}
      <div style={{ position: "relative", zIndex: 1, marginTop: "14px", fontSize: "11px", fontStyle: "italic" }}>
        <strong>Note :</strong>{" "}
        1) This is a computer generated printout and no signature is required.
        <br />
        2) Incorrect mentioning of vehicle class or seating capacity may lead to tax evasion and defaulter shall be liable for penal action
      </div>

      <div style={{ position: "relative", zIndex: 1, marginTop: "10px", fontSize: "11px", fontStyle: "italic" }}>
        You will also receive the payment confirmation message.
      </div>

      <div style={{ position: "relative", zIndex: 1, marginTop: "10px", fontSize: "12px", fontWeight: 700 }}>
        Scan the QR code for genuinity of the receipt, It should land at{" "}
        <span style={{ textDecoration: "underline", fontWeight: 400 }}>https://kms.parivahan.gov.in</span>{" "}
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
