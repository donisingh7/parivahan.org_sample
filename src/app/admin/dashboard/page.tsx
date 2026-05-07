"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Transaction {
  _id: string;
  transactionId: string;
  vehicleNo: string;
  ownerName: string;
  visitingState: string;
  amount: number;
  status: "SUCCESS" | "PENDING" | "FAILED";
  paymentMethod: string;
  bankName: string;
  taxFrom: string;
  taxTo: string;
  createdAt: string;
  userIdLabel?: string;
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
  name:           string;
  mobileNo:       string;
  email:          string;
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

export default function AdminDashboard() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats,        setStats]        = useState<Stats | null>(null);
  const [pagination,   setPagination]   = useState<Pagination>({ page: 1, pages: 1, total: 0 });
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [userFilter,   setUserFilter]   = useState("");
  const [page,         setPage]         = useState(1);

  const [users,        setUsers]        = useState<UserBookingRow[]>([]);
  const [usersSummary, setUsersSummary] = useState<UsersSummary | null>(null);
  const [usersLoading, setUsersLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (search)       params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (userFilter)   params.set("userId", userFilter);

      const res = await fetch(`/api/admin/payments?${params}`);
      if (res.status === 401) { router.push("/admin"); return; }
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data);
        setStats(data.stats);
        setPagination(data.pagination);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, userFilter, router]);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/admin/users-bookings");
      if (res.status === 401) { router.push("/admin"); return; }
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        setUsersSummary(data.summary);
      }
    } catch {
      // ignore
    } finally {
      setUsersLoading(false);
    }
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

  const fmt = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
  };

  const fmtDateTime = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  };

  const fmtAmt = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtAmtShort = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const selectedUser = users.find((u) => u.portalUserId === userFilter) ?? null;

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
          <a className="admin-nav-item"><i className="fa fa-list"></i> Transactions</a>
          <a className="admin-nav-item"><i className="fa fa-car"></i> Vehicles</a>
          <a className="admin-nav-item"><i className="fa fa-users"></i> Admins</a>
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

        {/* Stats cards (driven by the active filter so totals always match the table) */}
        {stats && (
          <div className="admin-stats-grid">
            <div className="admin-stat-card stat-total">
              <div className="admin-stat-icon"><i className="fa fa-inr"></i></div>
              <div>
                <div className="admin-stat-value">{fmtAmtShort(stats.totalAmount)}</div>
                <div className="admin-stat-label">{userFilter ? `Collected by ${selectedUser?.name ?? userFilter}` : "Total Collected"}</div>
              </div>
            </div>
            <div className="admin-stat-card stat-success">
              <div className="admin-stat-icon"><i className="fa fa-check-circle"></i></div>
              <div>
                <div className="admin-stat-value">{stats.successCount}</div>
                <div className="admin-stat-label">Successful</div>
              </div>
            </div>
            <div className="admin-stat-card stat-pending">
              <div className="admin-stat-icon"><i className="fa fa-clock-o"></i></div>
              <div>
                <div className="admin-stat-value">{stats.pendingCount}</div>
                <div className="admin-stat-label">Pending</div>
              </div>
            </div>
            <div className="admin-stat-card stat-failed">
              <div className="admin-stat-icon"><i className="fa fa-times-circle"></i></div>
              <div>
                <div className="admin-stat-value">{stats.failedCount}</div>
                <div className="admin-stat-label">Failed</div>
              </div>
            </div>
          </div>
        )}

        {/* ── Per-user bookings overview ───────────────────────────── */}
        <div className="admin-section">
          <div className="admin-section-header">
            <div>
              <h2 className="admin-section-title">
                <i className="fa fa-users"></i>&nbsp; Bookings by Portal User
              </h2>
              {usersSummary && (
                <span className="admin-section-sub">
                  {usersSummary.activeUserCount} of {usersSummary.totalUsers} users active &middot;{" "}
                  {usersSummary.totalBookings} bookings &middot; {fmtAmtShort(usersSummary.totalAmount)} total
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
              <div className="admin-loading"><i className="fa fa-spinner fa-spin"></i> Loading users...</div>
            ) : users.length === 0 ? (
              <div className="admin-empty"><i className="fa fa-user-times"></i><br />No portal users found</div>
            ) : (
              <table className="admin-table admin-users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Login ID</th>
                    <th>Mobile</th>
                    <th className="num">Bookings</th>
                    <th className="num">Successful</th>
                    <th className="num">Total Amount</th>
                    <th>Last Booking</th>
                    <th className="num">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const selected = userFilter === u.portalUserId;
                    return (
                      <tr
                        key={u.portalUserId}
                        className={`admin-user-row${selected ? " admin-user-row-selected" : ""}${u.bookingCount === 0 ? " admin-user-row-empty" : ""}`}
                        onClick={() => handleSelectUser(u.portalUserId)}
                      >
                        <td>
                          <div className="admin-user-name">{u.name}</div>
                          {!u.isActive && (
                            <span className="admin-user-inactive-tag">Inactive</span>
                          )}
                        </td>
                        <td className="admin-txn-id">{u.portalUserId}</td>
                        <td>{u.mobileNo || "—"}</td>
                        <td className="num"><strong>{u.bookingCount}</strong></td>
                        <td className="num">
                          {u.successCount}
                          {u.pendingCount > 0 && <span className="admin-user-sub-count" title="Pending">&nbsp;+{u.pendingCount}P</span>}
                          {u.failedCount > 0  && <span className="admin-user-sub-count admin-user-sub-count-fail" title="Failed">&nbsp;+{u.failedCount}F</span>}
                        </td>
                        <td className="num admin-amount">{fmtAmt(u.totalAmount)}</td>
                        <td className="admin-date-cell">{fmtDateTime(u.lastBookingAt)}</td>
                        <td className="num">
                          <button
                            type="button"
                            className={`admin-user-view-btn${selected ? " active" : ""}`}
                            onClick={(e) => { e.stopPropagation(); handleSelectUser(u.portalUserId); }}
                          >
                            {selected ? <><i className="fa fa-check"></i> Filtering</> : <><i className="fa fa-filter"></i> View</>}
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

        {/* Filters */}
        <div className="admin-filters">
          <div className="admin-search-wrap">
            <i className="fa fa-search"></i>
            <input type="text" placeholder="Search vehicle, owner, transaction ID..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select
            aria-label="Filter by transaction status"
            title="Filter by transaction status"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Status</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
          {userFilter && (
            <span className="admin-active-user-pill">
              <i className="fa fa-user"></i>&nbsp;
              {selectedUser?.name ?? userFilter}
              <button onClick={() => { setUserFilter(""); setPage(1); }} aria-label="Clear user filter">×</button>
            </span>
          )}
          <button className="admin-refresh-btn" onClick={() => { fetchData(); fetchUsers(); }}>
            <i className="fa fa-refresh"></i> Refresh
          </button>
        </div>

        {/* Table */}
        <div className="admin-table-wrap">
          {loading ? (
            <div className="admin-loading"><i className="fa fa-spinner fa-spin"></i> Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="admin-empty"><i className="fa fa-inbox"></i><br />No transactions found</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>User</th>
                  <th>Vehicle No.</th>
                  <th>Owner</th>
                  <th>State</th>
                  <th>Tax Period</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t._id}>
                    <td className="admin-txn-id">{t.transactionId}</td>
                    <td>{t.userIdLabel || <span className="admin-anon-tag">anon</span>}</td>
                    <td><strong>{t.vehicleNo}</strong></td>
                    <td>{t.ownerName || "—"}</td>
                    <td>{t.visitingState || "—"}</td>
                    <td className="admin-date-cell">{fmt(t.taxFrom)} – {fmt(t.taxTo)}</td>
                    <td className="admin-amount">{fmtAmt(t.amount)}</td>
                    <td>{t.bankName || t.paymentMethod}</td>
                    <td>
                      <span className={`admin-status admin-status-${t.status.toLowerCase()}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>{fmt(t.createdAt)}</td>
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
            <span>Page {pagination.page} of {pagination.pages} ({pagination.total} records)</span>
            <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>
              Next <i className="fa fa-chevron-right"></i>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
