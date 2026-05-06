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

export default function AdminDashboard() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats,        setStats]        = useState<Stats | null>(null);
  const [pagination,   setPagination]   = useState<Pagination>({ page: 1, pages: 1, total: 0 });
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page,         setPage]         = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (search)       params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

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
  }, [page, search, statusFilter, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin");
  };

  const fmt = (iso: string) => {
    if (!iso) return "—";
    // toLocaleDateString output differs between Node.js (server) and browser — use UTC to stay consistent
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
  };

  const fmtAmt = (n: number) => `₹${n.toFixed(2)}`;

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

        {/* Stats cards */}
        {stats && (
          <div className="admin-stats-grid">
            <div className="admin-stat-card stat-total">
              <div className="admin-stat-icon"><i className="fa fa-inr"></i></div>
              <div>
                <div className="admin-stat-value">₹{stats.totalAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
                <div className="admin-stat-label">Total Collected</div>
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

        {/* Filters */}
        <div className="admin-filters">
          <div className="admin-search-wrap">
            <i className="fa fa-search"></i>
            <input type="text" placeholder="Search vehicle, owner, transaction ID..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
          <button className="admin-refresh-btn" onClick={fetchData}>
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
