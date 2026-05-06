"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect     = searchParams.get("redirect") || "/en/node/579";

  const [userId,   setUserId]   = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/user-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId.trim(), password }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); setLoading(false); return; }
      // Hard navigation ensures the user_token cookie is sent with the next request
      // before middleware checks it — router.push (soft nav) has a timing race here
      window.location.href = redirect;
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="portal-login-page">
      {/* Header */}
      <div className="portal-login-topbar">
        <div className="portal-login-topbar-inner">
          <img
            src="https://parivahan.gov.in/sites/default/files/Parivahan_logo1.png"
            alt="Parivahan"
            className="portal-login-logo-img"
          />
          <div className="portal-login-brand">
            <div className="portal-login-brand-title">परिवहन सेवा</div>
            <div className="portal-login-brand-sub">Ministry of Road Transport &amp; Highways — Govt. of India</div>
          </div>
        </div>
      </div>

      {/* Orange divider */}
      <div className="portal-login-divider"></div>

      {/* Page title bar */}
      <div className="portal-login-titlebar">
        <div className="portal-login-titlebar-inner">
          <i className="fa fa-lock"></i>&nbsp; Checkpost Portal — Secure Login
        </div>
      </div>

      {/* Card */}
      <div className="portal-login-body">
        <div className="portal-login-card">
          <div className="portal-login-card-header">
            <div className="portal-login-card-icon">
              <i className="fa fa-user-circle"></i>
            </div>
            <h2>User Login</h2>
            <p>Enter your credentials to access the Checkpost Tax Payment portal</p>
          </div>

          <form className="portal-login-form" onSubmit={handleLogin}>
            {error && (
              <div className="portal-login-error">
                <i className="fa fa-exclamation-triangle"></i> {error}
              </div>
            )}

            <div className="portal-login-field">
              <label>User ID</label>
              <div className="portal-login-input-wrap">
                <i className="fa fa-id-card portal-login-icon"></i>
                <input
                  type="text"
                  placeholder="Enter your User ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="portal-login-field">
              <label>Password</label>
              <div className="portal-login-input-wrap">
                <i className="fa fa-lock portal-login-icon"></i>
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="portal-login-eye"
                  onClick={() => setShowPwd(!showPwd)}
                  tabIndex={-1}
                >
                  <i className={`fa fa-eye${showPwd ? "-slash" : ""}`}></i>
                </button>
              </div>
            </div>

            <button type="submit" className="portal-login-btn" disabled={loading}>
              {loading
                ? <><i className="fa fa-spinner fa-spin"></i> Signing in...</>
                : <><i className="fa fa-sign-in"></i> Login to Portal</>}
            </button>
          </form>

          <div className="portal-login-footer-note">
            <i className="fa fa-info-circle"></i>&nbsp;
            Contact your RTO office if you don&apos;t have login credentials.
          </div>
        </div>

        {/* Info box */}
        <div className="portal-login-info">
          <div className="portal-login-info-title">
            <i className="fa fa-shield"></i> Secure Portal Access
          </div>
          <ul className="portal-login-info-list">
            <li><i className="fa fa-check"></i> Your User ID is provided by the RTO office</li>
            <li><i className="fa fa-check"></i> Credentials are required to pay checkpost tax</li>
            <li><i className="fa fa-check"></i> Session expires after 8 hours of inactivity</li>
            <li><i className="fa fa-check"></i> All transactions are recorded and traceable</li>
          </ul>
          <div className="portal-login-helpline">
            <i className="fa fa-phone"></i>&nbsp; Helpline: <strong>1800-XXX-XXXX</strong>
          </div>
        </div>
      </div>

      <div className="portal-login-page-footer">
        © 2026 Ministry of Road Transport &amp; Highways, Govt. of India. All rights reserved.
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <i className="fa fa-spinner fa-spin" style={{ fontSize: 32, color: "#1a3060" }}></i>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
