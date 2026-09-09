"use client";
import { useEffect, useState } from "react";

interface Status {
  warningActive: boolean;
  daysRemaining: number;
  message:       string;
}

// Per-account top banner — shown only to the logged-in portal user, and only
// while a scheduled auto-disable is armed on their account (set from
// /doni/dashboard). Sits under the site-wide HostingWarningBanner.
export default function AccountWarningBanner() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    fetch("/api/user/account-status")
      .then((res) => res.json())
      .then((data) => {
        if (data?.warningActive) {
          setStatus({
            warningActive: true,
            daysRemaining: typeof data.daysRemaining === "number" ? data.daysRemaining : 0,
            message: data.message ?? "",
          });
        }
      })
      .catch(() => {});
  }, []);

  if (!status?.warningActive) return null;

  return (
    <div className="doni-hosting-banner doni-hosting-banner--account">
      <i className="fa fa-exclamation-triangle"></i>{" "}
      {status.message || "Your account will be disabled — hosting issue!"}{" "}
      {status.daysRemaining > 0
        ? <>⏳ <strong>{status.daysRemaining} day{status.daysRemaining === 1 ? "" : "s"}</strong> remaining</>
        : <><strong>disabling now</strong></>}
    </div>
  );
}
