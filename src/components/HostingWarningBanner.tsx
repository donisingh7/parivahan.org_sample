"use client";
import { useEffect, useState } from "react";

interface Status {
  warningEnabled: boolean;
  warningMessage: string;
  daysRemaining:  number;
}

// Site-wide top banner — shown on every page (including /admin and /doni)
// as long as the warning is enabled from /doni/dashboard. Disabling it there
// removes this banner everywhere, including the /login popup.
export default function HostingWarningBanner() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    fetch("/api/site-status")
      .then((res) => res.json())
      .then((data) => {
        if (data.warningEnabled) {
          setStatus({
            warningEnabled: true,
            warningMessage: data.warningMessage ?? "",
            daysRemaining: typeof data.daysRemaining === "number" ? data.daysRemaining : 0,
          });
        }
      })
      .catch(() => {});
  }, []);

  if (!status?.warningEnabled) return null;

  return (
    <div className="doni-hosting-banner">
      <i className="fa fa-exclamation-triangle"></i>{" "}
      {status.daysRemaining > 0
        ? <>Hosting will expire in <strong>{status.daysRemaining} day{status.daysRemaining === 1 ? "" : "s"}</strong> remaining — {status.warningMessage}</>
        : <><strong>Warning period has ended</strong> — {status.warningMessage}</>}
    </div>
  );
}
