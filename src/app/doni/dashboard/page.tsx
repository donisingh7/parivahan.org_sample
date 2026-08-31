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

function toDateInputValue(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
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

  useEffect(() => { load(); }, [load]);

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
          <button type="button" className="doni-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}
