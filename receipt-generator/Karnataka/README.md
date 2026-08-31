# Karnataka Checkpost Tax e-Receipt Generator

Editable Node.js/PDFKit implementation of the supplied one-page Karnataka
checkpost tax receipt.

## Requirements

- Node.js 20 or newer
- npm

## Install and generate

```bash
npm install
npm run generate
```

The generated file is written to `receipts/preview.pdf`.

## Edit receipt values

Update `sampleData.js`, then run:

```bash
npm run generate
```

The receipt number, dates, vehicle and owner details, validity values, payment
details, tax rows, totals, and QR value are all data-driven.

`useReferenceQr: true` reproduces the QR artwork in the supplied sample.
Set it to `false` to generate a fresh QR from `qrValue`.

## Live local preview

```bash
npm run dev
```

Open `http://localhost:3001`. Changes to `sampleData.js` or
`generateReceipt.js` automatically regenerate and reload the PDF.

## Project files

- `generateReceipt.js` — PDF layout and drawing code
- `sampleData.js` — editable sample receipt data
- `generateSample.js` — one-off generation command
- `devServer.js` — local live-preview server
- `assets/` — reconstructed logo, watermark, rupee glyph, and reference QR path

The original spelling and wording, including source-document typos, are
preserved intentionally for visual fidelity.
