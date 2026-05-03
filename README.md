# Parivahan — Checkpost Tax Payment Portal

Next.js replica of the [parivahan.gov.in](https://parivahan.gov.in) Checkpost Tax collection flow, built with **Next.js 16**, **TypeScript**, and **Tailwind CSS**.

---

## Pages / Routes

| Route | Description |
|---|---|
| `/` | Homepage — full parivahan.gov.in replica with animations |
| `/en/node/579` | Checkpost Tax — state selector with redirect |
| `/checkpost?state=XX` | Intermediate page — confirm state and proceed |
| `/checkpost/payment?state=XX` | Full tax collection form with date validation |
| `/payment/sbi` | Multi-step SBI Payment Gateway (Login to OTP to Success) |

---

## Getting Started (Local Development)

### Prerequisites
- **[Node.js](https://nodejs.org/) v18 or higher** — download and install from nodejs.org
- npm comes bundled with Node.js, no separate install needed

### Steps

```bash
# 1. Clone the repo OR extract the ZIP into a folder, then open terminal inside it

# 2. Install all dependencies (only needed once)
npm install

# 3. Start the development server
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## Available Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start local dev server at http://localhost:3000 |
| `npm run build` | Create optimized production build |
| `npm start` | Run production build (must run npm run build first) |
| `npm run lint` | Run ESLint code checks |

---

## Push to GitHub (First Time Setup)

```bash
# Step 1 — Initialize Git inside the project folder
git init

# Step 2 — Stage all files
git add .

# Step 3 — Make the first commit
git commit -m "Initial commit — Parivahan portal"

# Step 4 — Go to github.com, create a New Repository (empty), then link it:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Step 5 — Push
git push -u origin main
```

Replace YOUR_USERNAME and YOUR_REPO_NAME with your actual GitHub username and repo name.

---

## Project Structure

```
Parivahan/
├── src/
│   ├── app/
│   │   ├── layout.tsx                   <- Root layout (loads Font Awesome CDN)
│   │   ├── globals.css                  <- All custom CSS for the entire site
│   │   ├── page.tsx                     <- Homepage
│   │   ├── en/node/579/page.tsx         <- Checkpost Tax state selector
│   │   ├── checkpost/page.tsx           <- Intermediate checkpost page
│   │   ├── checkpost/payment/page.tsx   <- Tax collection form
│   │   └── payment/sbi/page.tsx         <- SBI Payment Gateway
│   └── components/
│       ├── CheckpostTax.tsx             <- State selector component
│       ├── CheckpostTaxPayment.tsx      <- Intermediate page component
│       ├── TaxCollectionForm.tsx        <- Full tax form with date validation
│       └── SBIPaymentGateway.tsx        <- Multi-step payment gateway
├── public/                              <- Static assets
├── package.json                         <- Dependencies list
├── next.config.ts                       <- Next.js config
├── tsconfig.json                        <- TypeScript config
└── README.md
```

---

## Tech Stack

| Technology | Version |
|---|---|
| Next.js | 16.2.4 |
| React | 19 |
| TypeScript | 5 |
| Tailwind CSS | 4 |
| Font Awesome | 6.5.1 (CDN) |

---

## Notes

- All images are fetched from parivahan.gov.in CDN directly — no local image files needed.
- Font Awesome icons are loaded via CDN link in layout.tsx — not an npm package.
- The payment gateway is a UI/UX demo only — no real transactions are processed.
