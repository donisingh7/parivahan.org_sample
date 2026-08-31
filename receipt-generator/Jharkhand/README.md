# Jharkhand Checkpost Tax e-Receipt Generator

This project recreates the supplied two-page Jharkhand receipt as an A4 PDF.
The receipt data, QR value, timestamps, watermark text, tax row, and vehicle
details are editable in `sampleData.js`.

## Run locally

```bash
npm install
npm run generate
```

The generated file is written to `receipts/preview.pdf`.

For a live browser preview that regenerates whenever `generateReceipt.js` or
`sampleData.js` changes:

```bash
npm run dev
```

Open `http://localhost:3001`.

## Use from another JavaScript file

```js
const { generateReceipt } = require('./generateReceipt');

await generateReceipt(receiptData, './receipts/output.pdf');
```

`receiptData` follows the structure shown in `sampleData.js`.

## QR and watermark behavior

- When `qrImagePath` points to an image, that exact QR artwork is used.
- When `qrImagePath` is absent, a QR is generated from `qrValue`.
- The repeating watermark is generated from `registrationNo` and
  `watermarkDate`.
- The faint image watermark is drawn from `emblemImagePath` with 30% opacity.

The included seal, reference QR, and rupee glyph were extracted losslessly from
the supplied PDF. Set `qrImagePath` to `null` for production data-driven QR
generation.

## Layout

All positions use PDF points on an exact `595 × 841 pt` A4 canvas. The measured
coordinates are centralized in `generateReceipt.js`, including the browser
print header/footer, receipt header, two-column details, tax table, total, and
page-two terms.
