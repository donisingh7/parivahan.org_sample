"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Settings {
  warningEnabled:    boolean;
  warningMessage:    string;
  warningStartDate:  string;
  lockoutEnabled:    boolean;
  warningExpiryDate: string;
  lockoutActive:     boolean;
}

interface PortalAccount {
  id:                     string;
  type:                   string;
  isActive:               boolean;
  disableScheduledAt:     string | null;
  bookingCooldownMinutes: number;
  lastBookingAt:          string | null;
  sessionActive:          boolean;
}

const ACCOUNT_TYPES = ["family", "test", "reselling"];

function toDateInputValue(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function DoniDashboardPage() {
  const router = useRouter();

  const [settings, setSettings] = useState<Settings | null>(null);
  const [warningEnabled, setWarningEnabled] = useState(true);
  const [warningMessage, setWarningMessage] = useState("");
  const [startDate, setStartDate] = useState("");
  const [lockoutEnabled, setLockoutEnabled] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error,  setError]    = useState("");
  const [saved,  setSaved]    = useState(false);

  // ── Portal-user accounts ─────────────────────────────────────────────────
  const [accounts,   setAccounts]   = useState<PortalAccount[]>([]);
  const [accLoading, setAccLoading] = useState(true);
  const [accError,   setAccError]   = useState("");
  const [accMsg,     setAccMsg]     = useState("");
  const [busyId,     setBusyId]     = useState<string | null>(null);

  const [newId,      setNewId]      = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [newType,    setNewType]    = useState("family");
  const [newCd,      setNewCd]      = useState("0");
  const [creating,   setCreating]   = useState(false);

  // Per-row "Manage" panel — only one open at a time.
  const [manageId, setManageId] = useState<string | null>(null);
  const [mDays,    setMDays]    = useState("7");
  const [mCd,      setMCd]      = useState("0");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/doni/site-settings");
      if (res.status === 401) { router.replace("/doni"); return; }
      const data = await res.json();
      if (!data.success) { setError(data.message || "Failed to load settings"); return; }
      setSettings(data);
      setWarningEnabled(data.warningEnabled);
      setWarningMessage(data.warningMessage);
      setStartDate(toDateInputValue(data.warningStartDate));
      setLockoutEnabled(data.lockoutEnabled);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const loadAccounts = useCallback(async () => {
    setAccLoading(true);
    setAccError("");
    try {
      const res = await fetch("/api/doni/portal-users");
      if (res.status === 401) { router.replace("/doni"); return; }
      const data = await res.json();
      if (!data.success) { setAccError(data.message || "Failed to load accounts"); return; }
      setAccounts(data.users as PortalAccount[]);
    } catch {
      setAccError("Network error. Please try again.");
    } finally {
      setAccLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch("/api/doni/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warningEnabled,
          warningMessage,
          warningStartDate: startDate,
          lockoutEnabled,
        }),
      });
      if (res.status === 401) { router.replace("/doni"); return; }
      const data = await res.json();
      if (!data.success) { setError(data.message || "Failed to save settings"); return; }
      setSettings(data);
      setStartDate(toDateInputValue(data.warningStartDate));
      setSaved(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // One PATCH helper for every per-account mutation (toggle, schedule, cooldown).
  const patchAccount = async (id: string, body: Record<string, unknown>) => {
    setBusyId(id); setAccError(""); setAccMsg("");
    try {
      const res = await fetch("/api/doni/portal-users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...body }),
      });
      if (res.status === 401) { router.replace("/doni"); return; }
      const data = await res.json();
      if (!data.success) { setAccError(data.message || "Failed to update account"); return; }
      setAccMsg(data.message || "Updated");
      await loadAccounts();
    } catch {
      setAccError("Network error. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true); setAccError(""); setAccMsg("");
    try {
      const res = await fetch("/api/doni/portal-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newId,
          password: newPw,
          type: newType,
          bookingCooldownMinutes: Number(newCd) || 0,
        }),
      });
      if (res.status === 401) { router.replace("/doni"); return; }
      const data = await res.json();
      if (!data.success) { setAccError(data.message || "Failed to create account"); return; }
      setAccMsg(data.message || "Account created");
      setNewId(""); setNewPw(""); setNewType("family"); setNewCd("0");
      loadAccounts();
    } catch {
      setAccError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const openManage = (a: PortalAccount) => {
    if (manageId === a.id) { setManageId(null); return; }
    setManageId(a.id);
    setMDays("7");
    setMCd(String(a.bookingCooldownMinutes ?? 0));
  };

  const handleLogout = async () => {
    await fetch("/api/doni/logout", { method: "POST" });
    router.replace("/doni");
  };

  if (loading) {
    return (
      <div className="doni-page">
        <div className="doni-card">
          <i className="fa fa-spinner fa-spin"></i>
        </div>
      </div>
    );
  }

  return (
    <div className="doni-page">
      <div className="doni-stack">
        <div className="doni-card">
          <div className="admin-login-header">
            <div className="admin-login-logo"><i className="fa fa-cogs"></i></div>
            <h1>Site Control Panel</h1>
            <p>Login warning &amp; hosting-lockout settings</p>
          </div>

          <form className="admin-login-form" onSubmit={handleSave}>
            {error && <div className="admin-login-error"><i className="fa fa-exclamation-triangle"></i> {error}</div>}
            {saved && !error && (
              <div className="doni-success-msg"><i className="fa fa-check-circle"></i> Settings saved.</div>
            )}

            <label className="doni-check-row">
              <input
                type="checkbox"
                checked={warningEnabled}
                onChange={(e) => setWarningEnabled(e.target.checked)}
              />
              <span>Show hosting-expiry warning popup on login</span>
            </label>

            <div className="admin-form-field">
              <label>Warning message</label>
              <textarea
                rows={4}
                value={warningMessage}
                onChange={(e) => setWarningMessage(e.target.value)}
                placeholder="Your hosting plan is going to expire in 7 days..."
              />
            </div>

            <div className="admin-form-field">
              <label>Warning start date (7-day countdown begins here)</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <label className="doni-check-row">
              <input
                type="checkbox"
                checked={lockoutEnabled}
                onChange={(e) => setLockoutEnabled(e.target.checked)}
              />
              <span>Lock the site once 7 days from the start date have passed</span>
            </label>

            {settings && (
              <div className="doni-status-box">
                <div>Warning window ends: <strong>{new Date(settings.warningExpiryDate).toLocaleDateString("en-IN")}</strong></div>
                <div>Current lockout status: <strong className={settings.lockoutActive ? "doni-status-bad" : "doni-status-ok"}>
                  {settings.lockoutActive ? "SITE LOCKED" : "Site running normally"}
                </strong></div>
              </div>
            )}

            <button type="submit" className="admin-login-btn" disabled={saving}>
              {saving ? <><i className="fa fa-spinner fa-spin"></i> Saving...</> : "Save Settings"}
            </button>
          </form>
        </div>

        {/* ── Portal-user account management ──────────────────────────────── */}
        <div className="doni-card">
          <div className="admin-login-header">
            <div className="admin-login-logo"><i className="fa fa-users"></i></div>
            <h1>Portal User Accounts</h1>
            <p>Enable / disable, schedule auto-disable, set booking limits</p>
          </div>

          <div className="admin-login-form">
            {accError && <div className="admin-login-error"><i className="fa fa-exclamation-triangle"></i> {accError}</div>}
            {accMsg && !accError && (
              <div className="doni-success-msg"><i className="fa fa-check-circle"></i> {accMsg}</div>
            )}

            {/* Create account */}
            <form className="doni-acc-create" onSubmit={handleCreate}>
              <div className="admin-form-field">
                <label>New account — login ID</label>
                <input
                  type="text"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  placeholder="e.g. ramesh01"
                  autoComplete="off"
                  required
                />
              </div>
              <div className="admin-form-field">
                <label>Password (min 4 chars)</label>
                <input
                  type="text"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="Set a password"
                  autoComplete="off"
                  required
                />
              </div>
              <div className="admin-form-field">
                <label>Type</label>
                <select
                  className="doni-acc-select"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="admin-form-field">
                <label>Booking cooldown — minutes between receipts (0 = none)</label>
                <input
                  type="number"
                  min={0}
                  value={newCd}
                  onChange={(e) => setNewCd(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <button type="submit" className="admin-login-btn" disabled={creating}>
                {creating ? <><i className="fa fa-spinner fa-spin"></i> Creating...</> : <><i className="fa fa-plus"></i> Create Account</>}
              </button>
            </form>

            {/* Existing accounts */}
            <div className="doni-acc-list-head">
              Existing accounts ({accounts.length})
              <button type="button" className="doni-acc-refresh" onClick={loadAccounts} disabled={accLoading}>
                <i className={`fa fa-refresh${accLoading ? " fa-spin" : ""}`}></i>
              </button>
            </div>

            {accLoading ? (
              <div className="doni-acc-empty"><i className="fa fa-spinner fa-spin"></i> Loading…</div>
            ) : accounts.length === 0 ? (
              <div className="doni-acc-empty">No accounts</div>
            ) : (
              <ul className="doni-acc-list">
                {accounts.map((a) => {
                  const busy = busyId === a.id;
                  return (
                    <li key={a.id} className="doni-acc-row">
                      <div className="doni-acc-main">
                        <div className="doni-acc-info">
                          <span className="doni-acc-id">
                            {a.id}
                            {a.sessionActive && <span className="doni-acc-dot" title="Live session">●</span>}
                          </span>
                          <span className="doni-acc-type">{a.type}</span>
                        </div>
                        <span className={`doni-acc-status ${a.isActive ? "on" : "off"}`}>
                          {a.isActive ? "Enabled" : "Disabled"}
                        </span>
                        <button
                          type="button"
                          className={`doni-acc-toggle ${a.isActive ? "disable" : "enable"}`}
                          onClick={() => patchAccount(a.id, { isActive: !a.isActive })}
                          disabled={busy}
                        >
                          {busy ? <i className="fa fa-spinner fa-spin"></i> : a.isActive ? "Disable" : "Enable"}
                        </button>
                        <button
                          type="button"
                          className={`doni-acc-manage-btn${manageId === a.id ? " open" : ""}`}
                          onClick={() => openManage(a)}
                        >
                          <i className={`fa fa-chevron-${manageId === a.id ? "up" : "down"}`}></i>
                        </button>
                      </div>

                      {(a.disableScheduledAt || a.bookingCooldownMinutes > 0) && (
                        <div className="doni-acc-tags">
                          {a.disableScheduledAt && (
                            <span className="doni-acc-tag warn">⏳ auto-disable {fmtDate(a.disableScheduledAt)}</span>
                          )}
                          {a.bookingCooldownMinutes > 0 && (
                            <span className="doni-acc-tag">cooldown {a.bookingCooldownMinutes}m</span>
                          )}
                        </div>
                      )}

                      {manageId === a.id && (
                        <div className="doni-acc-manage">
                          <div className="doni-acc-manage-row">
                            <label>Auto-disable in</label>
                            <input
                              type="number"
                              min={1}
                              value={mDays}
                              onChange={(e) => setMDays(e.target.value)}
                            />
                            <span className="doni-acc-manage-unit">days</span>
                            <button
                              type="button"
                              className="doni-acc-mini"
                              disabled={busy}
                              onClick={() => patchAccount(a.id, { disableInDays: Number(mDays) || 0 })}
                            >
                              Set
                            </button>
                            {a.disableScheduledAt && (
                              <button
                                type="button"
                                className="doni-acc-mini ghost"
                                disabled={busy}
                                onClick={() => patchAccount(a.id, { disableInDays: null })}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                          <div className="doni-acc-manage-row">
                            <label>Booking cooldown</label>
                            <input
                              type="number"
                              min={0}
                              value={mCd}
                              onChange={(e) => setMCd(e.target.value)}
                            />
                            <span className="doni-acc-manage-unit">min</span>
                            <button
                              type="button"
                              className="doni-acc-mini"
                              disabled={busy}
                              onClick={() => patchAccount(a.id, { bookingCooldownMinutes: Number(mCd) || 0 })}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <button type="button" className="doni-logout-btn doni-stack-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
