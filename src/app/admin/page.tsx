"use client";
import { useState } from "react";

export default function AdminLoginPage() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); setLoading(false); return; }
      window.location.href = "/admin/dashboard";
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-login-logo">
            <i className="fa fa-shield"></i>
          </div>
          <h1>Admin Portal</h1>
          <p>Checkpost Parivahan — MoRTH</p>
        </div>
        <form className="admin-login-form" onSubmit={handleLogin}>
          {error && <div className="admin-login-error"><i className="fa fa-exclamation-triangle"></i> {error}</div>}
          <div className="admin-form-field">
            <label>Email Address</label>
            <input type="email" placeholder="admin@parivahan.gov.in" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="admin-form-field">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={password}
              onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? <><i className="fa fa-spinner fa-spin"></i> Signing in...</> : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
