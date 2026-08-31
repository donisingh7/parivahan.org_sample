# Chhattisgarh Checkpost Tax e-Receipt Generator

This project recreates the supplied one-page Chhattisgarh receipt as an
editable, data-driven A4 PDF.

## Run

```bash
npm install
npm run generate
```

The generated receipt is written to `receipts/preview.pdf`.

For a live browser preview that regenerates when the code or sample data
changes:

```bash
npm run dev
```

Open `http://localhost:3001`.

## Edit receipt data

Update `sampleData.js`. Receipt values, tax values, text watermark, and QR
content are driven by that file.

- The included `qrImagePath` reproduces the supplied sample QR exactly.
- Set `qrImagePath: null` to generate a new QR from `qrValue`.
- The gray text watermark automatically uses `registrationNo` and
  `watermarkDate`.

The source PDF's exact A4 page geometry, 17 watermark rows, image rectangles,
opacity values, table rules, and protected right-side watermark boundary are
encoded in `generateReceipt.js`.

## Files

- `generateReceipt.js` — reusable PDF generator
- `sampleData.js` — editable receipt data
- `generateSample.js` — one-command sample generation
- `devServer.js` — live local preview server
- `assets/` — source-extracted seal, sample QR, and rupee glyph
- `VALIDATION.md` — source comparison and verification notes
