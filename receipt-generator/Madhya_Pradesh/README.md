# Madhya Pradesh CheckPost receipt generator

This project creates the supplied three-page Madhya Pradesh CheckPost tax
receipt and temporary permit using JavaScript and PDFKit. Receipt values live
in `sampleData.js`; the page construction lives in `generateReceipt.js`.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm run generate
```

The generated file is written to `receipts/preview.pdf`.

For automatic regeneration and an in-browser PDF preview:

```bash
npm run dev
```

Open `http://localhost:3001`.

## Integration

```js
const { generateReceipt } = require('./generateReceipt');

await generateReceipt(receiptData, '/absolute/path/to/receipt.pdf');
```

All receipt, vehicle, payment, tax, permit, browser-header, watermark and QR
values are supplied through `receiptData`.

The included reference watermark and QR assets are used only so the supplied
approval sample can be reproduced closely. For live receipts:

- omit `referenceWatermarkImagePath` to generate the watermark from
  `registrationNo` and `watermarkDate`;
- omit `qrImagePath` and supply the production verification value through
  `qrValue`.

The emblem is kept in `assets/madhya-pradesh-emblem.png`.
