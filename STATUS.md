# Parivahan — Project Status & Testing Guide

> **Note:** This file is the project status / testing guide.
> The other file at the repo root, `README.txt`, is the **inspect-codes reference**
> (raw HTML pulled from each state's official portal). Do not confuse them.

---

## 1. What this project is

A Next.js 16 (App Router) clone of India's parivahan checkpost border-tax flow,
built for **10 Indian states**. Each state has its own:

| Layer | File path |
|---|---|
| Tax-collection form (UI) | `src/components/states/<state>/TaxCollectionForm.tsx` |
| MongoDB transaction model | `src/lib/states/<state>/model.ts` |
| Receipt-data builder | `src/lib/states/<state>/buildReceiptData.ts` |
| On-screen receipt template (React) | `src/lib/states/<state>/ReceiptTemplate.tsx` |
| PDF generator (PDFKit) | `src/lib/states/<state>/generateReceipt.js` |
| State config (code, label, payment gateway) | `src/lib/states/<state>/config.ts` |

End-to-end flow: **signup → login → state select → fill form → SBI mock pay →
PDF generated → uploaded to S3 → SMS sent via SNS → QR on PDF links to a
public-tokenized download URL**.

---

## 2. Implementation status (as of this commit)

### 2.1 Cross-cutting infrastructure — DONE

- Per-state MongoDB collections (`<state>_transactions`) with their own schemas
- AWS S3 receipt upload, state-first folder structure
  `<state>/<userId>/<MM-YYYY>/<txnId>.pdf`
- AWS SNS SMS notification on successful payment
- JWT-signed QR receipt tokens (`/r/<token>` public route)
- Mandatory login wall on `/checkpost`
- Identical-credentials check between portal login and pay-tax confirmation
- Admin dashboard pulling from all 10 per-state collections

### 2.2 Per-state alignment to inspect HTML — STATUS

The "finishing" pass means: every form field, dropdown option, validity
placeholder, label punctuation, and source-portal typo is replicated
verbatim from `README.txt`.

| State | Code | Form aligned | Schema | Receipt template | PDF | Notes |
|---|---|---|---|---|---|---|
| Haryana | HR | ✅ | ✅ | ✅ | ✅ | byte-for-byte aligned (incl. `---Select State---`, `&` in Andaman/J&K) |
| Punjab | PB | ✅ | ✅ | ✅ | ✅ | 9 districts + 10 checkposts, User Charge + Infra Cess |
| Uttarakhand | UK | ✅ | ✅ | ✅ | ✅ | Permit Type/Number/From/Upto, 13 districts, 14 barriers (KAUDIA), `SEPECIAL PERMIT` typo preserved |
| Himachal Pradesh | HP | ✅ | ✅ | ✅ | ✅ | 12 HP districts, `Fule Type` typo preserved, 3-row tax table (Tax / Cess / Service Charge) |
| Uttar Pradesh | UP | ✅ | ✅ | ✅ | ✅ | 35 UP districts, UP-only `GOODS CARRIER`, Permit Type/Upto/No, single MV Tax row |
| Rajasthan | RJ | ⏳ pending inspect | ⏳ | ⏳ | ⏳ | Currently running on auto-scaffold clone of generic template |
| Bihar | BR | ⏳ pending inspect | ⏳ | ⏳ | ⏳ | Auto-scaffold clone |
| Andhra Pradesh | AP | ⏳ pending inspect | ⏳ | ⏳ | ⏳ | Auto-scaffold clone |
| Maharashtra | MH | ⏳ pending inspect | ⏳ | ⏳ | ⏳ | Auto-scaffold clone |
| Jharkhand | JH | ⏳ pending inspect | ⏳ | ⏳ | ⏳ | Auto-scaffold clone |

---

## 3. What is still REMAINING

### 3.1 Need user input

1. **Inspect HTML for the remaining 5 states** (RJ, BR, AP, MH, JH) — paste each
   state's form + receipt page inspect into `README.txt` under headings the
   same way HR/PB/UK/HP/UP are organized. Once that's in, each state takes
   ~one pass to align (form, model, buildReceiptData, ReceiptTemplate,
   generateReceipt).
2. **Per-state transaction-number generation algorithm** — you said you'd
   define the format (length, prefix per state, random vs. sequential, etc.).
   Currently using a generic random generator.

### 3.2 Engineering tasks queued

1. **Self-contain every state's `model.ts`** — currently they all extend
   `src/lib/states/shared/baseSchema.ts`. Per your call, each state's schema
   should be standalone (state-specific fields + universal payment/audit
   fields inline). Will do once all 10 inspect codes are processed so we
   know each state's exact field set.
2. **Refresh `scripts/setup-db.mjs`** — drop and recreate the 10 per-state
   collections with the right indexes once schemas are finalized.
3. **Admin-dashboard regression check** — verify `/api/admin/payments` and
   `/api/admin/users-bookings` aggregations still work cleanly when
   state-specific fields (`fuelType`, `permitNumber`, `taxItems`, etc.)
   diverge across collections.
4. **Full end-to-end smoke test** per state (see section 6 below).

---

## 4. Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20.x |
| npm | bundled with Node |
| MongoDB Atlas (or local) | URI configured in `.env.local` |
| AWS account | with S3 bucket + SNS SMS access in `ap-south-1` |

A populated `.env.local` already exists at the repo root. Required vars:

```
MONGODB_URI=...
JWT_SECRET=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-south-1
S3_BUCKET_NAME=parivahan-receipts
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 5. Quick start (run locally)

```bash
npm install

node --env-file=.env.local scripts/setup-db.mjs

npm run dev
```

The dev server starts at `http://localhost:3000`.

`scripts/setup-db.mjs` is idempotent — it seeds 1 superadmin, 5 portal users,
and 5 sample vehicles (upsert; rerunning won't duplicate).

### Seed credentials

| Role | Email / User ID | Password |
|---|---|---|
| Super admin | `admin@parivahan.gov.in` | `Admin@123` |
| Portal user (UP) | `UP12345` (vehicle `UP32AB1234`) | `User@123` |
| Portal user (DL) | `DL56789` (vehicle `DL01AA9999`) | `User@123` |
| Portal user (MH) | `MH90123` (vehicle `MH12CD5678`) | `User@123` |
| Portal user (RJ) | `RJ45678` (vehicle `RJ14EF3456`) | `User@123` |
| Portal user (GJ) | `GJ23456` (vehicle `GJ01GH7890`) | `User@123` |

---

## 6. How to test the implementation

### 6.1 Sanity / build checks (no browser)

```bash
npx tsc --noEmit -p tsconfig.json
npm run lint
npm run build
```

All three should complete with **0 errors**. Lint will report ~80–120
pre-existing stylistic warnings (inline CSS, missing `title` attrs) — these
are project-wide and present in every state's form, not regressions.

### 6.2 Optional infrastructure smoke checks

Standalone diagnostic scripts (won't change app state):

```bash
node --env-file=.env.local scripts/test-mongo.mjs
node --env-file=.env.local scripts/test-db.mjs
node --env-file=.env.local scripts/test-sns.mjs
```

If `test-sns.mjs` fails with DNS / TLS errors, you're behind a corporate
proxy — that's a network issue, not an app bug. The other two should always
succeed.

### 6.3 End-to-end manual test (per state)

Do this for **each of the 5 finished states (HR, PB, UK, HP, UP)**:

1. Open `http://localhost:3000` → click **Checkpost**.
2. Get redirected to `/login` (mandatory). Sign in with one of the seeded
   portal users above.
3. On `/checkpost`, pick the state from the state selector.
4. Fill the tax-collection form. Verify against the inspect HTML in
   `README.txt`:
   - **All dropdown options** appear in exact inspect order, with exact text
     (including typos like `Fule Type`, `SEPECIAL PERMIT`, UP's
     `GOODS CARRIER`).
   - **All input fields** are present (e.g. HP must have Sleeper Cap, Fuel
     Type, User Charge, Cess; UP must have Permit Type, Permit Upto, Permit
     No).
   - **Validity placeholders** match (HR/HP/UP/PB use `DD-MM-YYYY HH:MM`; UK
     uses just `DD-MM-YYYY` for fitness/PUCC/permit dates).
5. Click **Pay Tax** → confirm modal pops → re-enter your portal password to
   confirm payment.
6. SBI mock gateway loads → click **Pay**.
7. The receipt page renders. Verify:
   - All form values appear in the field grid in the order shown by the
     inspect HTML.
   - Tax breakdown table matches state-specific row count (HP has 3 rows;
     HR/PB/UK/UP have 1 row each).
   - The QR code is present at the bottom.
8. Click **Download PDF** → receipt PDF downloads. Open it and confirm:
   - Field grid mirrors the on-screen receipt.
   - Footer notes section matches inspect (HR uses `Note :`, HP/UP have
     "Terms and Conditions" + QR-scan message).
9. **Scan the QR code** with a phone (or copy the URL from the PDF). It
   should land on `/r/<token>` and serve the same PDF without requiring
   login.
10. Check **AWS S3 console** — the same PDF is at
    `<state>/<userId>/<MM-YYYY>/<txnId>.pdf`.
11. Check **mobile** that registered with the user — the SNS SMS arrives
    with the receipt link (skip if your account is in SNS sandbox mode and
    the number isn't whitelisted).

### 6.4 Admin dashboard

1. Sign out, then sign in at `/admin` as the super admin.
2. Open the dashboard at `/admin/dashboard`. You should see:
   - **Payments** table aggregating all transactions across the 10
     `<state>_transactions` collections.
   - **Users & Bookings** view linking each portal user to their
     transactions across states.
3. State-specific fields (HP `fuelType`, UK `permitNumber`, UP
   `permitValidityText`, etc.) should render gracefully or be hidden when
   absent — this is the regression case currently flagged as **PENDING**
   in section 3.2.4 above.

### 6.5 What "byte-for-byte aligned" means for HR/PB/UK/HP/UP

For these 5 states, every dropdown option list, every input placeholder,
every label string in the form and the receipt has been hand-verified
against `README.txt`. Source-portal typos and odd spacing are preserved
intentionally so saved data round-trips pixel-for-pixel:

- HP fuel dropdown: label literally reads **"Fule Type"** with
  **"---Select Fule Type---"** placeholder.
- UK and UP permit dropdowns: option literally reads **"SEPECIAL PERMIT"**.
- UP vehicle category: option literally reads **"GOODS CARRIER"** (every
  other state uses **"GOODS VEHICLE"**).
- The triple-space inside **"CONTRACT CARRIAGE/PASSENGER   VEHICLES"** —
  preserved.
- HP cess label is bare **"Cess"** (HR has no cess; PB uses **"Infra Cess"**;
  UK uses **"Civic Infra Cess"**).
- Trailing periods — **"Total Amount."**, **"Service/User Charge."**,
  **"Permit No."**, **"Permit Upto."** — preserved.

---

## 7. Project layout (high level)

```
src/
  app/
    page.tsx                         home (parivahan portal mock)
    login/                           portal user login
    checkpost/                       state selector + tax form host
      payment/                       SBI mock gateway page
    payment/sbi/                     SBI flow component host
    admin/                           admin dashboard
    r/[token]/                       public QR receipt download
    api/
      auth/                          login/register/logout/verify-payment
      payment/                       writes <state>_transactions, S3, SNS
      receipt/                       on-screen + PDF endpoints
      r/[token]/                     public token resolver
      vehicle/[regNo]/               VAHAN-style lookup
      admin/payments|users-bookings  cross-state aggregations
  components/
    states/<state>/TaxCollectionForm.tsx     state-specific form UI (10)
    SBIPaymentGateway.tsx                    shared payment gateway
    CheckpostTaxPayment.tsx                  state-selector wrapper
  lib/
    states/
      types.ts                        shared TS interfaces (ReceiptData, TxnLike)
      shared/baseSchema.ts            common payment/audit fields (slated for removal)
      <state>/
        config.ts                     code/label/gateway
        model.ts                      mongoose schema for <state>_transactions
        buildReceiptData.ts           txn-doc -> ReceiptData
        ReceiptTemplate.tsx           on-screen JSX receipt
        generateReceipt.js            PDFKit PDF generator
    aws/                              S3 + SNS clients
    auth/                             jose JWT helpers
scripts/
  setup-db.mjs                        seeds users + indexes (idempotent)
  scaffold-states.mjs                 generates per-state file stubs
  test-{mongo,db,sns}.mjs             standalone diagnostics
README.txt                            inspect-code reference (HR/PB/UK/HP/UP)
STATUS.md                             this file
```

---

## 8. Known non-blocking issues

- **~118 lint warnings** across each state's TaxCollectionForm/ReceiptTemplate
  for inline CSS and missing `title` attributes. Same pattern is present in
  every shipped state — they're cosmetic and don't affect runtime. Will be
  cleaned up in a separate styling pass.
- **AWS SNS in sandbox mode** — SMS only delivers to whitelisted numbers
  unless your AWS account is graduated out of the SNS sandbox.
- **Corporate-proxy environments** — the `test-sns.mjs` script may show
  DNS/TLS errors. The app itself uses the `https-proxy-agent` and works
  fine when the OS-level proxy is set.

---

## 9. Next handoff

When you're ready to continue, the most useful next step is:

1. Paste **Rajasthan's inspect HTML** (form + receipt page) into `README.txt`
   under a `# RAJASTHAN TAX COLLECTION PAGE` heading like the existing 5
   states. Then I'll align it the same way.
2. Repeat for Bihar / AP / Maharashtra / Jharkhand.
3. After all 10 states are aligned, I'll do the schema self-contain pass,
   the `setup-db.mjs` refresh, and the admin-dashboard regression check.
