import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { verifyQrToken, QR_TOKEN_TTL_DAYS } from "@/lib/qrToken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PublicTxn {
  transactionId: string;
  vehicleNo:     string;
  ownerName:     string;
  amount:        number;
  paidAt:        string | null;
  visitingState: string;
  receiptNo:     string;
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function fmtAmount(n: number): string {
  return `\u20B9${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function ExpiredView() {
  return (
    <div className="public-receipt-page">
      <div className="public-receipt-card public-receipt-card-error">
        <div className="public-receipt-error-icon">
          <i className="fa fa-clock-o"></i>
        </div>
        <h1>This receipt link has expired</h1>
        <p>
          For security, every QR receipt link is valid for{" "}
          <strong>{QR_TOKEN_TTL_DAYS} days</strong> from the date of payment.
        </p>
        <p className="public-receipt-muted">
          If you still need this receipt, please log in to the Checkpost Portal
          to download a fresh copy, or contact your local RTO office.
        </p>
        <a href="/login" className="public-receipt-btn">
          <i className="fa fa-sign-in"></i> Log in to portal
        </a>
      </div>
      <PublicReceiptFooter />
    </div>
  );
}

function NotFoundView() {
  return (
    <div className="public-receipt-page">
      <div className="public-receipt-card public-receipt-card-error">
        <div className="public-receipt-error-icon"><i className="fa fa-exclamation-triangle"></i></div>
        <h1>Receipt not found</h1>
        <p>We couldn&apos;t locate a transaction for this QR link.</p>
        <p className="public-receipt-muted">
          The link may have been mistyped or the transaction record may have been removed.
        </p>
      </div>
      <PublicReceiptFooter />
    </div>
  );
}

function PublicReceiptFooter() {
  return (
    <div className="public-receipt-footer">
      &copy; 2026 Ministry of Road Transport &amp; Highways &middot; Govt. of India
    </div>
  );
}

export default async function PublicReceiptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let payload;
  try {
    payload = await verifyQrToken(token);
  } catch {
    return <ExpiredView />;
  }

  await connectDB();
  const txnDoc = await Transaction.findOne({ transactionId: payload.tid }).lean();
  if (!txnDoc) {
    return <NotFoundView />;
  }

  const t = txnDoc as unknown as {
    transactionId: string;
    vehicleNo:     string;
    ownerName:     string;
    amount:        number;
    paidAt:        Date | string | null;
    visitingState: string;
    receiptNo:     string;
  };
  const txn: PublicTxn = {
    transactionId: t.transactionId,
    vehicleNo:     t.vehicleNo,
    ownerName:     t.ownerName,
    amount:        t.amount,
    paidAt:        t.paidAt ? new Date(t.paidAt).toISOString() : null,
    visitingState: t.visitingState,
    receiptNo:     t.receiptNo,
  };

  // Compute the expiry timestamp from the JWT exp (seconds since epoch).
  const expiresAt = payload.exp ? new Date(payload.exp * 1000).toISOString() : null;

  const pdfUrl      = `/api/r/${token}`;
  const downloadUrl = `/api/r/${token}?download=1`;

  return (
    <div className="public-receipt-page">
      {/* Slim top banner identifying the source */}
      <header className="public-receipt-topbar">
        <div className="public-receipt-topbar-inner">
          <div className="public-receipt-brand">
            <i className="fa fa-shield"></i>
            <div>
              <div className="public-receipt-brand-title">परिवहन सेवा &middot; Parivahan</div>
              <div className="public-receipt-brand-sub">Ministry of Road Transport &amp; Highways</div>
            </div>
          </div>
          <span className="public-receipt-verified">
            <i className="fa fa-check-circle"></i> Verified e-Receipt
          </span>
        </div>
      </header>

      <main className="public-receipt-main">
        {/* Summary card */}
        <div className="public-receipt-summary">
          <div className="public-receipt-summary-row public-receipt-summary-headline">
            <span>
              <i className="fa fa-check-circle public-receipt-headline-ok"></i>&nbsp;
              Checkpost Tax Payment &mdash; Successful
            </span>
            <span className="public-receipt-amount">{fmtAmount(txn.amount)}</span>
          </div>
          <div className="public-receipt-summary-grid">
            <div>
              <div className="public-receipt-label">Vehicle No.</div>
              <div className="public-receipt-value"><strong>{txn.vehicleNo || "—"}</strong></div>
            </div>
            <div>
              <div className="public-receipt-label">Owner</div>
              <div className="public-receipt-value">{txn.ownerName || "—"}</div>
            </div>
            <div>
              <div className="public-receipt-label">Receipt No.</div>
              <div className="public-receipt-value public-receipt-mono">{txn.receiptNo || "—"}</div>
            </div>
            <div>
              <div className="public-receipt-label">Transaction ID</div>
              <div className="public-receipt-value public-receipt-mono">{txn.transactionId}</div>
            </div>
            <div>
              <div className="public-receipt-label">State</div>
              <div className="public-receipt-value">{txn.visitingState || "—"}</div>
            </div>
            <div>
              <div className="public-receipt-label">Paid At</div>
              <div className="public-receipt-value">{fmtDateTime(txn.paidAt)}</div>
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="public-receipt-actions">
          <a href={downloadUrl} className="public-receipt-btn public-receipt-btn-primary" download={`receipt_${txn.transactionId}.pdf`}>
            <i className="fa fa-download"></i> Download PDF
          </a>
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="public-receipt-btn public-receipt-btn-ghost">
            <i className="fa fa-external-link"></i> Open in new tab
          </a>
          <span className="public-receipt-expiry">
            <i className="fa fa-clock-o"></i>
            &nbsp;Link expires {fmtDateTime(expiresAt)} (3 days from payment)
          </span>
        </div>

        {/* PDF preview */}
        <div className="public-receipt-pdf-wrap">
          <iframe
            src={pdfUrl}
            title="Checkpost Tax Receipt"
            className="public-receipt-pdf-iframe"
          />
        </div>
      </main>

      <PublicReceiptFooter />
    </div>
  );
}
