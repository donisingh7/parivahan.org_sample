"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DoniLoginPage() {
  const router = useRouter();

  const [id,       setId]       = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/doni/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || "Invalid credentials"); setLoading(false); return; }
      router.replace("/doni/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="doni-page">
      <div className="doni-card">
        <div className="admin-login-header">
          <div className="admin-login-logo"><i className="fa fa-lock"></i></div>
          <h1>Control Panel</h1>
          <p>Restricted access</p>
        </div>
        <form className="admin-login-form" onSubmit={handleLogin}>
          {error && <div className="admin-login-error"><i className="fa fa-exclamation-triangle"></i> {error}</div>}
          <div className="admin-form-field">
            <label>ID</label>
            <input type="text" placeholder="ID" value={id}
              onChange={(e) => setId(e.target.value)} autoComplete="off" required />
          </div>
          <div className="admin-form-field">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={password}
              onChange={(e) => setPassword(e.target.value)} autoComplete="off" required />
          </div>
          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? <><i className="fa fa-spinner fa-spin"></i> Signing in...</> : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
