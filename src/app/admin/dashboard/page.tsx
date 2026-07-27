"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// Extended Transaction type with all fields from every state
interface Transaction {
  _id: string;
  transactionId: string;
  receiptNo: string;
  vehicleNo: string;
  chassisNo: string;
  ownerName: string;
  mobileNo: string;
  fromState: string;
  visitingState: string;
  vehicleType: string;
  vehicleCategory: string;
  vehicleClass: string;
  seatingCap: number;
  sleeperCap: number;
  grossVehicleWt: number;
  unladenWt: number;
  permitType: string;
  permitNumber: string;
  checkpostName: string;
  borderDistrict: string;
  districtEntering: string;
  taxMode: string;
  noOfPeriods: number;
  serviceType: string;
  purposeOfVisit: string;
  taxFrom: string;
  taxTo: string;
  amount: number;
  userCharge: number;
  status: "SUCCESS" | "PENDING" | "FAILED";
  paymentMethod: string;
  bankName: string;
  orderRef: string;
  s3Key: string;
  createdAt: string;
  paidAt: string;
  userId: string;
  userIdLabel: string;
  // state-specific extras
  fitnessValidity: string;
  insuranceValidity: string;
  puccValidity: string;
  fuelType: string;
  permitFrom: string;
  permitUpto: string;
  vehicleCategory2: string;
}

interface Stats {
  totalAmount: number;
  totalCount: number;
  successCount: number;
  pendingCount: number;
  failedCount: number;
}

interface Pagination {
  page: number;
  pages: number;
  total: number;
}

interface UserBookingRow {
  portalUserId:   string;
  type:           string;
  isActive:       boolean;
  bookingCount:   number;
  successCount:   number;
  pendingCount:   number;
  failedCount:    number;
  totalAmount:    number;
  successAmount:  number;
  firstBookingAt: string | null;
  lastBookingAt:  string | null;
}

interface UsersSummary {
  totalUsers:         number;
  activeUserCount:    number;
  totalBookings:      number;
  totalAmount:        number;
  totalSuccessAmount: number;
}

// ── Detail Modal ────────────────────────────────────────────────────────────
function DetailModal({ txn, onClose }: { txn: Transaction; onClose: () => void }) {
  const fmt = (iso: string | null | undefined) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  };
  const fmtDate = (iso: string | null | undefined) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };
  const fmtAmt = (n: number | undefined) =>
    n != null && !isNaN(n) ? `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—";

  const Row = ({ label, value }: { label: string; value?: string | number | null }) =>
    value !== undefined && value !== null && value !== "" && value !== 0 ? (
      <div className="adm-detail-row">
        <span className="adm-detail-label">{label}</span>
        <span className="adm-detail-value">{value}</span>
      </div>
    ) : null;

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal-header">
          <div>
            <h2 className="adm-modal-title">Booking Details</h2>
            <span className="adm-modal-txnid">{txn.transactionId}</span>
          </div>
          <button className="adm-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="adm-modal-body">
          {/* ── Status banner ── */}
          <div className={`adm-detail-banner adm-banner-${txn.status.toLowerCase()}`}>
            <strong>{txn.status}</strong>
            {txn.amount > 0 && <span>&nbsp;·&nbsp;{fmtAmt(txn.amount)}</span>}
            <span>&nbsp;·&nbsp;{fmt(txn.paidAt || txn.createdAt)}</span>
          </div>

          <div className="adm-detail-grid">
            {/* ── Transaction ── */}
            <section className="adm-detail-section">
              <h3 className="adm-detail-section-title"><i className="fa fa-file-text-o"></i> Transaction</h3>
              <Row label="Transaction ID"   value={txn.transactionId} />
              <Row label="Receipt No."      value={txn.receiptNo} />
              <Row label="Order / Bank Ref" value={txn.orderRef} />
              <Row label="State"            value={txn.visitingState} />
              <Row label="Status"           value={txn.status} />
              <Row label="Payment Method"   value={txn.paymentMethod} />
              <Row label="Bank Name"        value={txn.bankName} />
              <Row label="Paid At"          value={fmt(txn.paidAt)} />
              <Row label="Created At"       value={fmt(txn.createdAt)} />
            </section>

            {/* ── Amounts ── */}
            <section className="adm-detail-section">
              <h3 className="adm-detail-section-title"><i className="fa fa-inr"></i> Payment Amounts</h3>
              <Row label="Total Amount"    value={fmtAmt(txn.amount)} />
              <Row label="User Charge"     value={txn.userCharge > 0 ? fmtAmt(txn.userCharge) : undefined} />
              <Row label="Tax From"        value={fmtDate(txn.taxFrom)} />
              <Row label="Tax Upto"        value={fmtDate(txn.taxTo)} />
              <Row label="Tax Mode"        value={txn.taxMode} />
              <Row label="No. of Periods"  value={txn.noOfPeriods > 0 ? txn.noOfPeriods : undefined} />
            </section>

            {/* ── Vehicle ── */}
            <section className="adm-detail-section">
              <h3 className="adm-detail-section-title"><i className="fa fa-car"></i> Vehicle</h3>
              <Row label="Registration No." value={txn.vehicleNo} />
              <Row label="Chassis No."      value={txn.chassisNo} />
              <Row label="Vehicle Type"     value={txn.vehicleType} />
              <Row label="Vehicle Category" value={txn.vehicleCategory} />
              <Row label="Vehicle Class"    value={txn.vehicleClass} />
              <Row label="Seating Cap."     value={txn.seatingCap > 0 ? txn.seatingCap : undefined} />
              <Row label="Sleeper Cap."     value={txn.sleeperCap > 0 ? txn.sleeperCap : undefined} />
              <Row label="Gross Vehicle Wt" value={txn.grossVehicleWt > 0 ? `${txn.grossVehicleWt} kg` : undefined} />
              <Row label="Unladen Wt."      value={txn.unladenWt > 0 ? `${txn.unladenWt} kg` : undefined} />
              <Row label="Fuel Type"        value={txn.fuelType} />
              <Row label="Service Type"     value={txn.serviceType} />
            </section>

            {/* ── Owner ── */}
            <section className="adm-detail-section">
              <h3 className="adm-detail-section-title"><i className="fa fa-user"></i> Owner / Operator</h3>
              <Row label="Owner Name"     value={txn.ownerName} />
              <Row label="Mobile No."     value={txn.mobileNo} />
              <Row label="From State"     value={txn.fromState} />
              <Row label="Booked By"      value={txn.userIdLabel || "Anonymous"} />
              <Row label="Portal User ID" value={txn.userId} />
            </section>

            {/* ── Checkpost / Permit ── */}
            <section className="adm-detail-section">
              <h3 className="adm-detail-section-title"><i className="fa fa-map-marker"></i> Checkpost / Permit</h3>
              <Row label="Checkpost Name"       value={txn.checkpostName} />
              <Row label="Border District"      value={txn.borderDistrict || txn.districtEntering} />
              <Row label="Purpose of Visit"     value={txn.purposeOfVisit} />
              <Row label="Permit Type"          value={txn.permitType} />
              <Row label="Permit Number"        value={txn.permitNumber} />
              <Row label="Permit Valid From"    value={fmtDate(txn.permitFrom)} />
              <Row label="Permit Valid Upto"    value={fmtDate(txn.permitUpto)} />
            </section>

            {/* ── Validity Docs ── */}
            {(txn.fitnessValidity || txn.insuranceValidity || txn.puccValidity) && (
              <section className="adm-detail-section">
                <h3 className="adm-detail-section-title"><i className="fa fa-check-square-o"></i> Validity Documents</h3>
                <Row label="Fitness Validity"   value={fmtDate(txn.fitnessValidity)} />
                <Row label="Insurance Validity" value={fmtDate(txn.insuranceValidity)} />
                <Row label="PUCC Validity"      value={fmtDate(txn.puccValidity)} />
              </section>
            )}

            {/* ── Receipt ── (always available; regenerated on the fly when not in S3) */}
            <section className="adm-detail-section">
              <h3 className="adm-detail-section-title"><i className="fa fa-file-pdf-o"></i> Receipt</h3>
              {txn.s3Key && <Row label="S3 Key" value={txn.s3Key} />}
              <div className="adm-detail-row">
                <span className="adm-detail-label">PDF</span>
                <span>
                  <a
                    className="adm-detail-link"
                    href={`/api/receipt/${txn.transactionId}?state=${txn.visitingState}`}
                    target="_blank" rel="noreferrer"
                    style={{ marginRight: "16px" }}
                  >
                    <i className="fa fa-eye"></i> View Receipt
                  </a>
                  <a
                    className="adm-detail-link"
                    href={`/api/receipt/${txn.transactionId}?state=${txn.visitingState}&download=1`}
                    target="_blank" rel="noreferrer"
                  >
                    <i className="fa fa-download"></i> Download Receipt
                  </a>
                </span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats,        setStats]        = useState<Stats | null>(null);
  const [pagination,   setPagination]   = useState<Pagination>({ page: 1, pages: 1, total: 0 });
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stateFilter,  setStateFilter]  = useState("");
  const [userFilter,   setUserFilter]   = useState("");
  const [page,         setPage]         = useState(1);
  const [selectedTxn,  setSelectedTxn]  = useState<Transaction | null>(null);

  const [users,        setUsers]        = useState<UserBookingRow[]>([]);
  const [usersSummary, setUsersSummary] = useState<UsersSummary | null>(null);
  const [usersLoading, setUsersLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search)       params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (userFilter)   params.set("userId", userFilter);
      if (stateFilter)  params.set("state", stateFilter);

      const res = await fetch(`/api/admin/payments?${params}`);
      if (res.status === 401) { router.push("/admin"); return; }
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data);
        setStats(data.stats);
        setPagination(data.pagination);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, search, statusFilter, userFilter, stateFilter, router]);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/admin/users-bookings");
      if (res.status === 401) { router.push("/admin"); return; }
      const data = await res.json();
      if (data.success) { setUsers(data.users); setUsersSummary(data.summary); }
    } catch { /* ignore */ }
    finally { setUsersLoading(false); }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin");
  };

  const handleSelectUser = (loginId: string) => {
    setUserFilter((prev) => (prev === loginId ? "" : loginId));
    setPage(1);
  };

  // ── Password change (family / test portal users only) ─────────────────────
  const PWD_CHANGEABLE_TYPES = ["family", "test"];
  const [pwdModalUser, setPwdModalUser] = useState<string | null>(null);
  const [pwdValue,     setPwdValue]     = useState("");
  const [pwdShow,      setPwdShow]      = useState(false);
  const [pwdSaving,    setPwdSaving]    = useState(false);
  const [pwdMsg,       setPwdMsg]       = useState<{ ok: boolean; text: string } | null>(null);

  const openPwdModal = (loginId: string) => {
    setPwdModalUser(loginId); setPwdValue(""); setPwdShow(false); setPwdMsg(null);
  };
  const closePwdModal = () => { setPwdModalUser(null); setPwdValue(""); setPwdMsg(null); };

  const handleChangePassword = async () => {
    if (!pwdModalUser) return;
    if (pwdValue.trim().length < 4) { setPwdMsg({ ok: false, text: "Password must be at least 4 characters" }); return; }
    setPwdSaving(true); setPwdMsg(null);
    try {
      const res = await fetch("/api/admin/change-user-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: pwdModalUser, newPassword: pwdValue }),
      });
      if (res.status === 401) { router.push("/admin"); return; }
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        setPwdMsg({ ok: true, text: data.message || "Password updated" });
        setPwdValue("");
      } else {
        setPwdMsg({ ok: false, text: data.message || "Failed to update password" });
      }
    } catch {
      setPwdMsg({ ok: false, text: "Network error — please try again" });
    } finally {
      setPwdSaving(false);
    }
  };

  // ── Reset account (family / test users) — irreversible ────────────────────
  const [resetModalUser, setResetModalUser] = useState<string | null>(null);
  const [resetDelTxns,     setResetDelTxns]     = useState(true);
  const [resetDelReceipts, setResetDelReceipts] = useState(true);
  const [resetSaving,      setResetSaving]      = useState(false);
  const [resetMsg,         setResetMsg]         = useState<{ ok: boolean; text: string } | null>(null);
  const resetTargetRow = users.find((u) => u.portalUserId === resetModalUser) ?? null;

  const openResetModal = (loginId: string) => {
    setResetModalUser(loginId); setResetDelTxns(true); setResetDelReceipts(true); setResetMsg(null);
  };
  const closeResetModal = () => { setResetModalUser(null); setResetMsg(null); };

  const handleResetUser = async () => {
    if (!resetModalUser) return;
    if (!resetDelTxns && !resetDelReceipts) { setResetMsg({ ok: false, text: "Select at least one thing to delete" }); return; }
    setResetSaving(true); setResetMsg(null);
    try {
      const res = await fetch("/api/admin/reset-user-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: resetModalUser, deleteTransactions: resetDelTxns, deleteReceipts: resetDelReceipts }),
      });
      if (res.status === 401) { router.push("/admin"); return; }
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        setResetMsg({ ok: true, text: data.message || "Account reset" });
        fetchUsers();   // refresh so amount/booking counts drop to 0
        fetchData();
      } else {
        setResetMsg({ ok: false, text: data.message || "Failed to reset account" });
      }
    } catch {
      setResetMsg({ ok: false, text: "Network error — please try again" });
    } finally {
      setResetSaving(false);
    }
  };

  const fmt = (iso: string | null | undefined) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };
  const fmtDT = (iso: string | null | undefined) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  };
  const fmtAmt    = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtAmtShort = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const selectedUser = users.find((u) => u.portalUserId === userFilter) ?? null;

  const STATE_CODES = ["AP","BR","CG","GJ","HR","HP","JH","MH","MP","OR","PB","RJ","TS","UK","UP"];

  return (
    <div className="admin-page">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <i className="fa fa-shield"></i>
          <span>Admin Portal</span>
        </div>
        <nav className="admin-nav">
          <a className="admin-nav-item active"><i className="fa fa-dashboard"></i> Dashboard</a>
        </nav>
        <button className="admin-logout-btn" onClick={handleLogout}>
          <i className="fa fa-sign-out"></i> Logout
        </button>
      </aside>

      {/* Main */}
      <main className="admin-main">
        <div className="admin-topbar">
          <h1 className="admin-page-title">Payment Dashboard</h1>
          <span className="admin-topbar-sub">Checkpost Parivahan — MoRTH, Govt. of India</span>
        </div>

        {/* ── Stats cards ── */}
        {stats && (
          <div className="admin-stats-grid">
            <div className="admin-stat-card stat-total">
              <div className="admin-stat-icon"><i className="fa fa-database"></i></div>
              <div>
                <div className="admin-stat-value">{stats.totalCount.toLocaleString("en-IN")}</div>
                <div className="admin-stat-label">Total Bookings</div>
              </div>
            </div>
            <div className="admin-stat-card stat-money">
              <div className="admin-stat-icon"><i className="fa fa-inr"></i></div>
              <div>
                <div className="admin-stat-value">{fmtAmtShort(stats.totalAmount)}</div>
                <div className="admin-stat-label">{userFilter ? `Collected by ${selectedUser?.portalUserId ?? userFilter}` : "Total Collected"}</div>
              </div>
            </div>
            <div className="admin-stat-card stat-success">
              <div className="admin-stat-icon"><i className="fa fa-check-circle"></i></div>
              <div>
                <div className="admin-stat-value">{stats.successCount.toLocaleString("en-IN")}</div>
                <div className="admin-stat-label">Successful</div>
              </div>
            </div>
            <div className="admin-stat-card stat-pending">
              <div className="admin-stat-icon"><i className="fa fa-clock-o"></i></div>
              <div>
                <div className="admin-stat-value">{stats.pendingCount.toLocaleString("en-IN")}</div>
                <div className="admin-stat-label">Pending</div>
              </div>
            </div>
            <div className="admin-stat-card stat-failed">
              <div className="admin-stat-icon"><i className="fa fa-times-circle"></i></div>
              <div>
                <div className="admin-stat-value">{stats.failedCount.toLocaleString("en-IN")}</div>
                <div className="admin-stat-label">Failed</div>
              </div>
            </div>
          </div>
        )}

        {/* ── Per-user overview ── */}
        <div className="admin-section">
          <div className="admin-section-header">
            <div>
              <h2 className="admin-section-title">
                <i className="fa fa-users"></i>&nbsp; Bookings by Portal User
              </h2>
              {usersSummary && (
                <span className="admin-section-sub">
                  {usersSummary.activeUserCount}/{usersSummary.totalUsers} active users &nbsp;·&nbsp;
                  {usersSummary.totalBookings.toLocaleString("en-IN")} total bookings &nbsp;·&nbsp;
                  {fmtAmtShort(usersSummary.totalAmount)} collected
                </span>
              )}
            </div>
            {userFilter && (
              <button className="admin-clear-filter-btn" onClick={() => { setUserFilter(""); setPage(1); }}>
                <i className="fa fa-times"></i> Clear filter
              </button>
            )}
          </div>

          <div className="admin-users-wrap">
            {usersLoading ? (
              <div className="admin-loading"><i className="fa fa-spinner fa-spin"></i> Loading users…</div>
            ) : users.length === 0 ? (
              <div className="admin-empty"><i className="fa fa-user-times"></i><br />No portal users found</div>
            ) : (
              <table className="admin-table admin-users-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Login ID</th>
                    <th>Type</th>
                    <th className="num">Total Bookings</th>
                    <th className="num">Success</th>
                    <th className="num">Pending</th>
                    <th className="num">Failed</th>
                    <th className="num">Total Amount</th>
                    <th className="num">Success Amount</th>
                    <th>First Booking</th>
                    <th>Last Booking</th>
                    <th>Status</th>
                    <th>Password</th>
                    <th>Reset</th>
                    <th>Filter</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, idx) => {
                    const selected = userFilter === u.portalUserId;
                    return (
                      <tr
                        key={u.portalUserId}
                        className={`admin-user-row${selected ? " admin-user-row-selected" : ""}${u.bookingCount === 0 ? " admin-user-row-empty" : ""}`}
                        onClick={() => handleSelectUser(u.portalUserId)}
                      >
                        <td className="num">{idx + 1}</td>
                        <td className="admin-txn-id">{u.portalUserId}</td>
                        <td>{u.type || "—"}</td>
                        <td className="num"><strong>{u.bookingCount}</strong></td>
                        <td className="num" style={{ color: "var(--admin-success)" }}>{u.successCount}</td>
                        <td className="num" style={{ color: "var(--admin-pending)" }}>{u.pendingCount}</td>
                        <td className="num" style={{ color: "var(--admin-failed)" }}>{u.failedCount}</td>
                        <td className="num admin-amount">{fmtAmt(u.totalAmount)}</td>
                        <td className="num" style={{ color: "var(--admin-success)" }}>{fmtAmt(u.successAmount)}</td>
                        <td className="admin-date-cell">{fmt(u.firstBookingAt)}</td>
                        <td className="admin-date-cell">{fmtDT(u.lastBookingAt)}</td>
                        <td>
                          <span className={`admin-status ${u.isActive ? "admin-status-success" : "admin-status-failed"}`}>
                            {u.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          {PWD_CHANGEABLE_TYPES.includes((u.type || "").toLowerCase()) ? (
                            <button
                              type="button"
                              className="admin-user-view-btn"
                              onClick={(e) => { e.stopPropagation(); openPwdModal(u.portalUserId); }}
                            >
                              <i className="fa fa-key"></i> Change
                            </button>
                          ) : (
                            <span style={{ color: "#bbb" }}>—</span>
                          )}
                        </td>
                        <td>
                          {PWD_CHANGEABLE_TYPES.includes((u.type || "").toLowerCase()) ? (
                            <button
                              type="button"
                              className="admin-user-reset-btn"
                              onClick={(e) => { e.stopPropagation(); openResetModal(u.portalUserId); }}
                            >
                              <i className="fa fa-eraser"></i> Reset
                            </button>
                          ) : (
                            <span style={{ color: "#bbb" }}>—</span>
                          )}
                        </td>
                        <td className="num">
                          <button
                            type="button"
                            className={`admin-user-view-btn${selected ? " active" : ""}`}
                            onClick={(e) => { e.stopPropagation(); handleSelectUser(u.portalUserId); }}
                          >
                            {selected ? <><i className="fa fa-check"></i> On</> : <><i className="fa fa-filter"></i> Filter</>}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="admin-filters">
          <div className="admin-search-wrap">
            <i className="fa fa-search"></i>
            <input type="text" placeholder="Search vehicle, owner, transaction ID…"
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select aria-label="Filter by state" title="Filter by state" value={stateFilter}
            onChange={(e) => { setStateFilter(e.target.value); setPage(1); }}>
            <option value="">All States</option>
            {STATE_CODES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select aria-label="Filter by status" title="Filter by status" value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
          {userFilter && (
            <span className="admin-active-user-pill">
              <i className="fa fa-user"></i>&nbsp;{selectedUser?.portalUserId ?? userFilter}
              <button onClick={() => { setUserFilter(""); setPage(1); }} aria-label="Clear user filter">×</button>
            </span>
          )}
          <button className="admin-refresh-btn" onClick={() => { fetchData(); fetchUsers(); }}>
            <i className="fa fa-refresh"></i> Refresh
          </button>
        </div>

        {/* ── Transactions table ── */}
        <div className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">
              <i className="fa fa-list-alt"></i>&nbsp; All Bookings
              {pagination.total > 0 && (
                <span className="admin-section-sub" style={{ marginLeft: "12px" }}>
                  {pagination.total.toLocaleString("en-IN")} record{pagination.total !== 1 ? "s" : ""}
                </span>
              )}
            </h2>
          </div>
          <div className="admin-table-wrap">
            {loading ? (
              <div className="admin-loading"><i className="fa fa-spinner fa-spin"></i> Loading…</div>
            ) : transactions.length === 0 ? (
              <div className="admin-empty"><i className="fa fa-inbox"></i><br />No transactions found</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Transaction ID</th>
                    <th>Receipt No.</th>
                    <th>Booked By</th>
                    <th>Vehicle No.</th>
                    <th>Owner Name</th>
                    <th>Mobile</th>
                    <th>State</th>
                    <th>From State</th>
                    <th>Vehicle Type</th>
                    <th>Vehicle Category</th>
                    <th>Vehicle Class</th>
                    <th>Checkpost</th>
                    <th>Tax Period</th>
                    <th>Tax Mode</th>
                    <th className="num">Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Date &amp; Time</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, idx) => (
                    <tr key={t._id} className="admin-txn-row">
                      <td className="num">{((page - 1) * 20) + idx + 1}</td>
                      <td className="admin-txn-id">{t.transactionId}</td>
                      <td className="admin-txn-id">{t.receiptNo || "—"}</td>
                      <td>
                        {t.userIdLabel
                          ? <span className="admin-user-badge"><i className="fa fa-user"></i> {t.userIdLabel}</span>
                          : <span className="admin-anon-tag"><i className="fa fa-user-secret"></i> anon</span>}
                      </td>
                      <td><strong>{t.vehicleNo}</strong></td>
                      <td>{t.ownerName || "—"}</td>
                      <td>{t.mobileNo || "—"}</td>
                      <td><span className="admin-state-badge">{t.visitingState || "—"}</span></td>
                      <td>{t.fromState || "—"}</td>
                      <td>{t.vehicleType || "—"}</td>
                      <td>{t.vehicleCategory || "—"}</td>
                      <td>{t.vehicleClass || "—"}</td>
                      <td className="admin-cp-cell" title={t.checkpostName || t.borderDistrict || ""}>
                        {(t.checkpostName || t.borderDistrict || "—").substring(0, 22)}{(t.checkpostName || t.borderDistrict || "").length > 22 ? "…" : ""}
                      </td>
                      <td className="admin-date-cell" style={{ whiteSpace: "nowrap" }}>
                        {fmt(t.taxFrom)} – {fmt(t.taxTo)}
                      </td>
                      <td>{t.taxMode || "—"}</td>
                      <td className="num admin-amount">{t.amount > 0 ? `₹${Number(t.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—"}</td>
                      <td>{t.bankName || t.paymentMethod || "—"}</td>
                      <td>
                        <span className={`admin-status admin-status-${(t.status ?? "").toLowerCase()}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="admin-date-cell">{fmtDT(t.paidAt || t.createdAt)}</td>
                      <td className="num">
                        <button className="admin-detail-btn" onClick={() => setSelectedTxn(t)} title="View full details">
                          <i className="fa fa-eye"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="admin-pagination">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <i className="fa fa-chevron-left"></i> Prev
              </button>
              <span>Page {pagination.page} of {pagination.pages} &nbsp;({pagination.total.toLocaleString("en-IN")} records)</span>
              <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>
                Next <i className="fa fa-chevron-right"></i>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Detail modal */}
      {selectedTxn && <DetailModal txn={selectedTxn} onClose={() => setSelectedTxn(null)} />}

      {/* Change-password modal (family / test users) */}
      {pwdModalUser && (
        <div className="adm-modal-overlay" onClick={closePwdModal}>
          <div className="admin-pwd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-pwd-modal-header">
              <span><i className="fa fa-key"></i>&nbsp; Change Password</span>
              <button className="admin-pwd-modal-close" onClick={closePwdModal} aria-label="Close">×</button>
            </div>
            <div className="admin-pwd-modal-body">
              <p className="admin-pwd-modal-user">
                Login ID: <strong>{pwdModalUser}</strong>
              </p>
              <label className="admin-pwd-label">New Password</label>
              <div className="admin-pwd-input-row">
                <input
                  type={pwdShow ? "text" : "password"}
                  className="admin-pwd-input"
                  value={pwdValue}
                  autoFocus
                  autoComplete="new-password"
                  placeholder="Enter new password (min 4 chars)"
                  onChange={(e) => { setPwdValue(e.target.value); setPwdMsg(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleChangePassword(); }}
                />
                <button type="button" className="admin-pwd-eye" onClick={() => setPwdShow((s) => !s)} aria-label="Toggle visibility">
                  <i className={`fa fa-eye${pwdShow ? "-slash" : ""}`}></i>
                </button>
              </div>
              {pwdMsg && (
                <div className={`admin-pwd-msg ${pwdMsg.ok ? "ok" : "err"}`}>
                  <i className={`fa ${pwdMsg.ok ? "fa-check-circle" : "fa-exclamation-triangle"}`}></i>&nbsp;{pwdMsg.text}
                </div>
              )}
            </div>
            <div className="admin-pwd-modal-footer">
              <button className="admin-pwd-cancel" onClick={closePwdModal}>Cancel</button>
              <button className="admin-pwd-save" onClick={handleChangePassword} disabled={pwdSaving}>
                {pwdSaving ? <><i className="fa fa-spinner fa-spin"></i> Saving…</> : <><i className="fa fa-check"></i> Update Password</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset-account modal (family / test users) — irreversible */}
      {resetModalUser && (
        <div className="adm-modal-overlay" onClick={closeResetModal}>
          <div className="admin-pwd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-pwd-modal-header admin-reset-header">
              <span><i className="fa fa-exclamation-triangle"></i>&nbsp; Reset Account</span>
              <button className="admin-pwd-modal-close" onClick={closeResetModal} aria-label="Close">×</button>
            </div>
            <div className="admin-pwd-modal-body">
              <p className="admin-pwd-modal-user">
                Login ID: <strong>{resetModalUser}</strong>
              </p>
              <div className="admin-reset-warn">
                <i className="fa fa-exclamation-triangle"></i>&nbsp;
                This permanently deletes the selected data. <strong>It cannot be undone.</strong>
                {resetTargetRow && (
                  <div className="admin-reset-scope">
                    Currently: <strong>{resetTargetRow.bookingCount}</strong> booking(s),
                    total <strong>{fmtAmt(resetTargetRow.totalAmount)}</strong>.
                  </div>
                )}
              </div>

              <p className="admin-pwd-label" style={{ marginTop: 14 }}>Choose what to delete</p>
              <label className="admin-reset-check">
                <input type="checkbox" checked={resetDelTxns} onChange={(e) => { setResetDelTxns(e.target.checked); setResetMsg(null); }} />
                <span><strong>Booking transactions</strong> — clears all bookings &amp; history; amount becomes ₹0 (database)</span>
              </label>
              <label className="admin-reset-check">
                <input type="checkbox" checked={resetDelReceipts} onChange={(e) => { setResetDelReceipts(e.target.checked); setResetMsg(null); }} />
                <span><strong>Receipt PDFs</strong> — deletes the generated receipts from storage (S3)</span>
              </label>

              {resetMsg && (
                <div className={`admin-pwd-msg ${resetMsg.ok ? "ok" : "err"}`}>
                  <i className={`fa ${resetMsg.ok ? "fa-check-circle" : "fa-exclamation-triangle"}`}></i>&nbsp;{resetMsg.text}
                </div>
              )}
            </div>
            <div className="admin-pwd-modal-footer">
              <button className="admin-pwd-cancel" onClick={closeResetModal}>Cancel</button>
              <button className="admin-reset-confirm" onClick={handleResetUser} disabled={resetSaving || (!resetDelTxns && !resetDelReceipts)}>
                {resetSaving ? <><i className="fa fa-spinner fa-spin"></i> Deleting…</> : <><i className="fa fa-eraser"></i> Delete &amp; Reset</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
