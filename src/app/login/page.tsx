"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

const BG_URL = "/Images/preview.png";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect     = searchParams.get("redirect") || "/checkpost";

  const [userId,   setUserId]   = useState("");
  const [password, setPassword] = useState("");
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
    <div
      className="full-page-bg"
      style={{ backgroundImage: `url("${BG_URL}")`, minHeight: "730px" }}
    >
      <div className="log-overlay"></div>
      <div className="full-page-bg-inner">
        <div className="rto-form-row">

          <div className="log-right">
            <div className="login-form text-center">

              {error && (
                <div className="login-error-msg">
                  <i className="fa fa-exclamation-triangle"></i> {error}
                </div>
              )}

              <form name="form1" onSubmit={handleLogin}>

                {/* Username */}
                <div className="form-group">
                  <div className="input-group">
                    <span className="input-group-addon">
                      <i className="fa fa-user"></i>
                    </span>
                    <input
                      name="txtUserName"
                      type="text"
                      className="ui-inputfield ui-inputtext ui-widget ui-state-default ui-corner-all form-control"
                      autoComplete="off"
                      placeholder="User Name"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="form-group">
                  <div className="input-group">
                    <span className="input-group-addon">
                      <i className="fa fa-lock"></i>
                    </span>
                    <input
                      name="txtPassword"
                      type="password"
                      className="ui-inputfield ui-inputtext ui-widget ui-state-default ui-corner-all form-control"
                      autoComplete="off"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Submit */}
                <div className="form-group">
                  <div className="ui-grid-row">
                    <div className="ui-grid-col-12 center-position">
                      <button
                        id="btnisValidate"
                        type="submit"
                        style={{ backgroundColor: "#b73333" }}
                        className="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-icon-left btn btn-primary btn-login"
                        disabled={loading}
                      >
                        <span className="ui-button-icon-left ui-icon ui-c">
                          <i className={loading ? "fa fa-spinner fa-spin" : "fa fa-unlock"}></i>
                        </span>
                        <span className="ui-button-text ui-c">
                          {loading ? "Submitting..." : "Submit"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <i className="fa fa-spinner fa-spin" style={{ fontSize: 32 }}></i>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
