"use client";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

const BG_URL = "/Images/preview.png";
const DEFAULT_WARNING_MSG =
  "Your hosting plan is going to expire in 7 days. Please purchase a plan to avoid service interruption.";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect     = searchParams.get("redirect") || "/checkpost";

  const [userId,   setUserId]   = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [warningEnabled, setWarningEnabled] = useState(true);
  const [warningMessage, setWarningMessage] = useState(DEFAULT_WARNING_MSG);

  // Read the admin-configured warning (enabled? + message) from /doni's settings.
  useEffect(() => {
    fetch("/api/site-status")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.warningEnabled === "boolean") setWarningEnabled(data.warningEnabled);
        if (data.warningMessage) setWarningMessage(data.warningMessage);
      })
      .catch(() => {});
  }, []);

  // Show the hosting-expiry notice first (unless disabled); the actual login
  // runs once the user confirms, or immediately when the warning is off.
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (warningEnabled) {
      setShowExpiryModal(true);
    } else {
      submitLogin();
    }
  };

  const submitLogin = async () => {
    setShowExpiryModal(false);
    setLoading(true);
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

      {showExpiryModal && (
        <div className="cp-modal-overlay">
          <div className="cp-modal">
            <div className="cp-modal-header">
              <span><i className="fa fa-exclamation-triangle"></i> Hosting Expiry Notice</span>
              <button type="button" className="cp-modal-close" onClick={() => setShowExpiryModal(false)}>&times;</button>
            </div>
            <div className="cp-modal-body">
              <p className="small-text-font">
                {warningMessage}{" "}
                <a href="https://github.com/login" target="_blank" rel="noopener noreferrer">
                  Click here to know more
                </a>
              </p>
              <div className="ui-grid-row" style={{ marginTop: 16, textAlign: "right" }}>
                <button
                  type="button"
                  style={{ backgroundColor: "#b73333" }}
                  className="ui-button ui-widget ui-state-default ui-corner-all btn btn-primary"
                  onClick={submitLogin}
                >
                  Continue to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
