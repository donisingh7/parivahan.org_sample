# Tamil Nadu CheckPost Receipt Generator

This project recreates the supplied Tamil Nadu CheckPost tax receipt as an
editable, data-driven PDF.

The source receipt is a single `612 × 792 pt` Letter-size page. The generator
preserves that exact page size rather than converting it to A4.

## Generate the PDF

```bash
npm install
npm run generate
```

The result is written to `receipts/preview.pdf`.

## Live local preview

```bash
npm run dev
```

Open `http://localhost:3001`. The PDF automatically regenerates whenever
`generateReceipt.js` or `sampleData.js` changes.

## Edit receipt data

Update `sampleData.js`. It contains:

- browser print header and footer
- printed and watermark timestamps
- registration, receipt, vehicle, permit, and payment details
- all four tax rows
- total amount in words
- terms and conditions
- QR content and asset paths

## Use from another JavaScript file

```js
const { generateReceipt } = require('./generateReceipt');

await generateReceipt(receiptData, './receipts/output.pdf');
```

## QR and watermark modes

- `qrImagePath` uses the exact supplied QR artwork.
- Set `qrImagePath` to `null` to generate a QR from `qrValue`.
- `referenceTextWatermarkPath` uses the exact transparent text-watermark layer
  extracted from the source PDF.
- Set `referenceTextWatermarkPath` to `null` to generate the repeating
  watermark from `registrationNo` and `watermarkDate`.
- Both watermark modes are clipped to the source PDF's printable content box,
  preserving the `28.125 pt` white margin on the right.
- An opaque protection strip is also painted behind the receipt content over
  that margin, preventing any PDF viewer from displaying watermark pixels past
  the source boundary.
- The faint Tamil Nadu emblem watermark is always drawn dynamically at 30%
  opacity.

The supplied PDF's embedded Segoe UI and Arial font subsets are included in the
`fonts` directory so the sample output uses the same typography as the source.
