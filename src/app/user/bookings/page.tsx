"use client";

import { useEffect, useState } from "react";

interface BookingRow {
  transactionId: string;
  receiptNo:     string;
  state:         string;
  stateLabel:    string;
  vehicleNo:     string;
  ownerName:     string;
  vehicleType:   string;
  checkpostName: string;
  taxFrom:       string | null;
  taxTo:         string | null;
  amount:        number;
  status:        "PENDING" | "SUCCESS" | "FAILED";
  paymentMethod: string;
  bankRefNo:     string;
  paidAt:        string | null;
  createdAt:     string | null;
}

interface Stats {
  totalCount:    number;
  successCount:  number;
  pendingCount:  number;
  failedCount:   number;
  totalAmount:   number;
  successAmount: number;
}

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  SUCCESS: { bg: "#e6f4ea", fg: "#1e7e34" },
  PENDING: { bg: "#fff4e5", fg: "#b26a00" },
  FAILED:  { bg: "#fdecea", fg: "#c62828" },
};

function fmtDate(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  const dd = String(ist.getUTCDate()).padStart(2, "0");
  const mm = String(ist.getUTCMonth() + 1).padStart(2, "0");
  const yy = ist.getUTCFullYear();
  const hh = String(ist.getUTCHours()).padStart(2, "0");
  const mn = String(ist.getUTCMinutes()).padStart(2, "0");
  return `${dd}-${mm}-${yy} ${hh}:${mn}`;
}

export default function UserBookingsPage() {
  const [rows,    setRows]    = useState<BookingRow[]>([]);
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [status,  setStatus]  = useState("");
  const [userId,  setUserId]  = useState("");
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Fetch lives inside the effect; setState only runs in the promise callbacks
  // (never synchronously in the effect body) to satisfy react-hooks rules.
  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (status) params.set("status", status);

    fetch(`/api/user/bookings?${params.toString()}`)
      .then(async (res) => {
        if (res.status === 401) { window.location.href = "/login?redirect=/user/bookings"; return null; }
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Failed to load bookings");
        return json;
      })
      .then((json) => {
        if (!active || !json) return;
        setRows(json.data);
        setStats(json.stats);
        setPages(json.pagination.pages);
        setUserId(json.user?.userId || "");
        setError("");
      })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : "Failed to load bookings"); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [page, status, reloadKey]);

  const refresh = () => { setLoading(true); setReloadKey((k) => k + 1); };

  const logout = async () => {
    await fetch("/api/auth/user-logout", { method: "POST" }).catch(() => {});
    window.location.href = "/login";
  };

  const receiptUrl = (r: BookingRow, dl: boolean) =>
    `/api/receipt/${r.transactionId}?state=${r.state}${dl ? "&download=1" : ""}`;

  return (
    <div style={{ minHeight: "100vh", background: "#f1f3f6", fontFamily: "Arial, sans-serif" }}>
      {/* Header bar */}
      <div style={{ background: "#1565C0", color: "#fff", padding: "14px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <a href="/checkpost" style={{ color: "#fff", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>← Back</a>
          <span style={{ fontSize: "18px", fontWeight: 700 }}>My Bookings</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "13px" }}>
          {userId && <span>👤 {userId}</span>}
          <button onClick={logout} style={{ background: "rgba(255,255,255,0.18)", border: "none", color: "#fff", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}>Logout</button>
        </div>
      </div>

      <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "20px" }}>

        {/* Summary cards */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <StatCard label="Total Bookings" value={String(stats.totalCount)} color="#1565C0" />
            <StatCard label="Successful"     value={String(stats.successCount)} color="#1e7e34" />
            <StatCard label="Pending"        value={String(stats.pendingCount)} color="#b26a00" />
            <StatCard label="Failed"         value={String(stats.failedCount)}  color="#c62828" />
            <StatCard label="Paid (₹)"       value={`₹${stats.successAmount.toLocaleString("en-IN")}`} color="#1565C0" />
          </div>
        )}

        {/* Filter */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "14px", alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ fontSize: "13px", fontWeight: 600 }}>Status:</label>
          <select
            value={status}
            onChange={(e) => { setLoading(true); setPage(1); setStatus(e.target.value); }}
            style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "13px" }}
          >
            <option value="">All</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
          <button onClick={refresh} style={{ padding: "7px 14px", borderRadius: "6px", border: "1px solid #1565C0", background: "#fff", color: "#1565C0", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>↻ Refresh</button>
        </div>

        {error && <div style={{ background: "#fdecea", color: "#c62828", padding: "10px 14px", borderRadius: "6px", marginBottom: "14px", fontSize: "13px" }}>{error}</div>}

        {/* Table */}
        <div style={{ background: "#fff", borderRadius: "10px", overflow: "auto", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "900px" }}>
            <thead>
              <tr style={{ background: "#f4f6f8", textAlign: "left" }}>
                {["Receipt No", "State", "Vehicle No", "Type", "Checkpost", "Tax Period", "Amount", "Bank Ref", "Booked On", "Status", "Receipt"].map((h) => (
                  <th key={h} style={{ padding: "10px 12px", fontWeight: 700, color: "#333", whiteSpace: "nowrap", borderBottom: "2px solid #e3e6ea" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} style={{ padding: "30px", textAlign: "center", color: "#888" }}>Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={11} style={{ padding: "30px", textAlign: "center", color: "#888" }}>No bookings found.</td></tr>
              ) : rows.map((r) => {
                const sc = STATUS_COLORS[r.status] || STATUS_COLORS.PENDING;
                return (
                  <tr key={`${r.state}-${r.transactionId}`} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600, whiteSpace: "nowrap" }}>{r.receiptNo || "—"}</td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{r.stateLabel}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600, whiteSpace: "nowrap" }}>{r.vehicleNo}</td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{r.vehicleType || "—"}</td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{r.checkpostName || "—"}</td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap", fontSize: "12px" }}>{fmtDate(r.taxFrom)} <br/>→ {fmtDate(r.taxTo)}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, whiteSpace: "nowrap" }}>₹{r.amount.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap", fontFamily: "monospace", fontSize: "12px" }}>{r.bankRefNo || "—"}</td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap", fontSize: "12px" }}>{fmtDate(r.createdAt)}</td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <span style={{ background: sc.bg, color: sc.fg, padding: "3px 10px", borderRadius: "12px", fontWeight: 700, fontSize: "11px" }}>{r.status}</span>
                    </td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <a href={receiptUrl(r, false)} target="_blank" rel="noopener noreferrer" style={{ color: "#1565C0", fontWeight: 600, marginRight: "10px", textDecoration: "none" }}>View</a>
                      <a href={receiptUrl(r, true)} style={{ color: "#1e7e34", fontWeight: 600, textDecoration: "none" }}>PDF</a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginTop: "18px" }}>
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{ padding: "7px 14px", borderRadius: "6px", border: "1px solid #ccc", background: page <= 1 ? "#eee" : "#fff", cursor: page <= 1 ? "default" : "pointer", fontWeight: 600 }}>‹ Prev</button>
            <span style={{ fontSize: "13px", fontWeight: 600 }}>Page {page} of {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}
              style={{ padding: "7px 14px", borderRadius: "6px", border: "1px solid #ccc", background: page >= pages ? "#eee" : "#fff", cursor: page >= pages ? "default" : "pointer", fontWeight: 600 }}>Next ›</button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: "10px", padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "22px", fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
