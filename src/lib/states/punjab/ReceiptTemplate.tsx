"use client";

import type { ReceiptData } from "../types";
import { punjabConfig } from "./config";

/**
 * Punjab on-screen receipt — visually identical to the
 * GOVERNMENT OF PUNJAB checkpost portal's "Checkpost Tax e-Receipt" page.
 *
 * Layout (matches the inspect HTML):
 *   ┌────────────────────────────────────────────────────────────────────┐
 *   │  [PB_Bord]   GOVERNMENT OF PUNJAB           Printed on: …  [QR]    │
 *   │              Department of Transport                                │
 *   │              Checkpost Tax e-Receipt                                │
 *   ├────────────────────────────────────────────────────────────────────┤
 *   │  Registration No. : …    │  Receipt No.  : …                        │
 *   │  Payment Init. Dt : …    │  Owner Name   : …                        │
 *   │  Chassis No.      : …    │  Tax Mode     : …                        │
 *   │  Vehicle Type     : …    │  Vehicle Class: …                        │
 *   │  Vehicle Category : …    │  Mobile No.   : …                        │
 *   │  Checkpost Name   : …    │  Seating Cap. : …                        │
 *   │  Sleeper Cap.     : 0    │  Bank Ref. No.: …                        │
 *   │  Payment Mode     : …    │  Permit Vali. : (blank)                  │
 *   │  Service Type     : …    │  Permit Type  : (blank)                  │
 *   │  Payment Confirmation Date : …                                       │
 *   ├────────────────────────────────────────────────────────────────────┤
 *   │  Tax/Fee Particular    │ Tax/Fees │ Fine │ Total                   │
 *   │  MV Tax(…)             │   1000   │   0  │  1000                   │
 *   │  Civic Infra Cess(…)   │      0   │   0  │     0                   │
 *   │  Service/User Charge(…)│      0   │   0  │     0                   │
 *   │                                                                     │
 *   │  Grand Total : ₹ 1000/-  ONE THOUSAND  Rupees Only                  │
 *   │  Note:                                                              │
 *   │  Terms and Conditions:                                              │
 *   │   1. …  2. …  3. …                                                  │
 *   │  Scan the QR code for genuinity of the receipt.                     │
 *   └────────────────────────────────────────────────────────────────────┘
 */

// ── Watermark — tiled "<RegNo> <Date>" matching the original ──────────────

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
            left: `${(i % 8) * 170 - 60}px`,
            transform: "rotate(0deg)",
            fontSize: "10px",
            fontWeight: 700,
            whiteSpace: "nowrap",
            color: "rgba(0,0,0,0.08)",
            fontFamily: "Geneva, Arial, Helvetica, sans-serif",
          }}
        >
          {text}
        </span>
      ))}
    </div>
  );
}

// ── Center emblem (PB_Bord) — grey washed-out look like the original ──────

function EmblemWatermark() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "140px",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.18,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={punjabConfig.watermarkImage}
        alt=""
        style={{
          width: "320px",
          height: "auto",
          filter: "grayscale(100%)",
        }}
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
    </div>
  );
}

// ── QR placeholder (the PDF carries a real QR; on-screen is a stand-in) ───

function QRPlaceholder({ value }: { value: string }) {
  return (
    <div
      style={{
        width: 110,
        height: 110,
        border: "1px solid #000",
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
      <svg width="90" height="90" viewBox="0 0 7 7" style={{ imageRendering: "pixelated" }}>
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

// ── Single label-value cell used everywhere in the field grid ─────────────

function Row({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: React.ReactNode;
  bold?: boolean;
}) {
  return (
    <tr>
      <td style={rowLabelStyle}><label>{label}</label></td>
      <td style={rowValueStyle}>
        : <span style={{ fontWeight: bold ? 700 : 400, marginLeft: 4 }}>{value || "-"}</span>
      </td>
    </tr>
  );
}

const rowLabelStyle: React.CSSProperties = {
  width:        "27%",
  fontWeight:   700,
  padding:      "8px 4px",
  fontFamily:   "Geneva, Arial, Helvetica, sans-serif",
  fontSize:     "13px",
  verticalAlign:"top",
  whiteSpace:   "nowrap",
};
const rowValueStyle: React.CSSProperties = {
  width:        "23%",
  padding:      "8px 4px 8px 0",
  fontFamily:   "Geneva, Arial, Helvetica, sans-serif",
  fontSize:     "13px",
  verticalAlign:"top",
};

// ── Main receipt ───────────────────────────────────────────────────────────

export default function PunjabReceiptTemplate({ data }: { data: ReceiptData }) {
  const printedOn = data.paymentDateText;

  return (
    <div
      id="punjab-receipt"
      style={{
        position: "relative",
        maxWidth: "900px",
        margin:   "0 auto",
        background: "#fff",
        padding:  "20px 24px 32px",
        fontFamily: "Geneva, Arial, Helvetica, sans-serif",
        color:    "#000",
        fontSize: "13px",
        boxSizing: "border-box",
        minHeight: "1100px",
      }}
    >
      <EmblemWatermark />
      <Watermark text={`${data.registrationNo} ${printedOn}`} />

      {/* Header strip */}
      <table
        id="pb-tbl-report"
        style={{
          position: "relative",
          zIndex: 1,
          width:  "100%",
          borderCollapse: "collapse",
          marginBottom: "8px",
        }}
      >
        <tbody>
          <tr style={{ verticalAlign: "middle" }}>
            <td style={{ width: "20%", padding: "20px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={punjabConfig.watermarkImage}
                alt=""
                style={{ width: "150px" }}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            </td>
            <td style={{ width: "45%", textAlign: "center" }}>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: "#000",
                  textDecoration: "underline",
                  paddingRight: "15px",
                }}
              >
                {punjabConfig.govLabel}
              </div>
              <div style={{ fontWeight: "bold", fontSize: "16px" }}>
                <b>{punjabConfig.deptLabel}</b>
              </div>
              <div style={{ fontWeight: "bold", fontSize: "15px" }}>
                <b>{punjabConfig.receiptTitle}</b>
              </div>
            </td>
            <td style={{ width: "35%", textAlign: "left", paddingRight: "20px" }}>
              <div style={{ fontWeight: "bold", fontSize: "16px", marginBottom: "8px" }}>
                <b>Printed on : {printedOn}</b>
              </div>
              <QRPlaceholder value={data.receiptNo} />
            </td>
          </tr>
        </tbody>
      </table>

      {/* Field grid — two columns × ten rows, mirroring the inspect HTML */}
      <table
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "10px",
        }}
      >
        <tbody>
          <tr>
            <td style={{ width: "50%", verticalAlign: "top" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <Row label="Registration No."          value={data.registrationNo} bold />
                  <Row label="Payment Initialization Date" value={data.paymentInitDate || data.paymentDateText} />
                  <Row label="Chassis No."               value={data.chassisNo} />
                  <Row label="Vehicle Type"              value={data.vehicleType} />
                  <Row label="Vehicle Category"          value={data.vehicleCategory} />
                  <Row label="Checkpost Name"            value={data.checkpostName} />
                  <Row label="Sleeper Cap."              value={data.sleeperCap} />
                  <Row label="Payment Mode"              value={data.paymentMode} />
                  <Row label="Service Type"              value={data.serviceType} />
                  <Row label="Payment Confirmation Date" value={data.paymentDateText} />
                </tbody>
              </table>
            </td>
            <td style={{ width: "50%", verticalAlign: "top" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <Row label="Receipt No."     value={data.receiptNo} />
                  <Row label="Owner Name"      value={data.ownerName} />
                  <Row label="Tax Mode"        value={data.taxMode} />
                  <Row label="Vehicle Class"   value={data.vehicleClass} />
                  <Row label="Mobile No."      value={data.mobileNo} />
                  <Row label="Seating Capacity" value={data.seatingCapacity} />
                  <Row label="Bank Ref. No."   value={data.bankRefNo} />
                  <Row label="Permit Validity" value={""} />
                  <Row label="Permit Type"     value={data.permitType || ""} />
                  <Row label="" value="" />
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Tax breakup table — three rows for Punjab */}
      <div style={{ position: "relative", zIndex: 1, marginTop: "24px" }}>
        <table
          style={{
            width:  "95%",
            borderCollapse: "collapse",
            fontSize: "14px",
          }}
        >
          <thead>
            <tr style={{ textAlign: "center", fontSize: "12px", borderTop: "1px solid #A6C3E0" }}>
              <th style={{ ...txCellHeadStyle, width: "60%" }}>
                <span>Tax/Fee Particular</span>
              </th>
              <th style={{ ...txCellHeadStyle, width: "10%" }}>
                <span>Tax/Fees</span>
              </th>
              <th style={{ ...txCellHeadStyle, width: "10%" }}>
                <span>Fine</span>
              </th>
              <th style={{ ...txCellHeadStyle, width: "10%" }}>
                <span>Total</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.taxItems.map((item, i) => (
              <tr key={i}>
                <td style={{ ...txCellStyle, fontSize: "16px", textAlign: "left" }}>{item.particular}</td>
                <td style={txCellStyle}>{item.fees}</td>
                <td style={txCellStyle}>{item.fine}</td>
                <td style={txCellStyle}>{item.total}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Grand total + notes block */}
        <table
          style={{
            width: "95%",
            borderCollapse: "collapse",
            fontSize: "14px",
            marginTop: "10px",
          }}
        >
          <tbody>
            <tr>
              <td colSpan={4} style={{ paddingBottom: "10px" }}>
                <span style={{ fontSize: "14px", fontWeight: 600 }}>
                  Grand Total : <span style={{ fontFamily: "Arial" }}>&#8377;</span>{" "}
                  {data.amount}/- {data.amountInWords} &nbsp;&nbsp; Rupees Only
                </span>
              </td>
            </tr>
            <tr>
              <td style={{ paddingBottom: "10px" }}>
                <span style={{ fontSize: "14px", fontWeight: 600 }}>Note: </span>
              </td>
            </tr>
            <tr>
              <td style={{ paddingBottom: "10px" }} width="50%">
                <span style={{ fontSize: "14px", fontWeight: 600 }}>Terms and Conditions: </span>
              </td>
            </tr>
            <tr>
              <td colSpan={1} width="50%" style={{ paddingBottom: "10px" }}>
                1. This is a computer generated printout and no signature is required.
              </td>
            </tr>
            <tr>
              <td colSpan={1} width="50%" style={{ paddingBottom: "10px" }}>
                2. Should not carry unlawful/unaccompanied goods.
              </td>
            </tr>
            <tr>
              <td colSpan={1} style={{ paddingBottom: "10px" }}>
                3. If any false information/discrepancies are found at later, necessary action will be taken against the vehicle owner/driver.
              </td>
            </tr>
            <tr><td colSpan={4}>&nbsp;</td></tr>
            <tr>
              <td colSpan={4}>
                <b style={{ fontSize: "24px", fontWeight: 600 }}>
                  Scan the QR code for genuinity of the receipt.
                </b>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

const txCellHeadStyle: React.CSSProperties = {
  border: "1px solid #A6C3E0",
  padding: "10px",
  fontWeight: 600,
  textAlign: "center",
};
const txCellStyle: React.CSSProperties = {
  border: "1px solid #A6C3E0",
  borderTop: "2px solid #A6C3E0",
  padding: "10px",
  textAlign: "center",
};
