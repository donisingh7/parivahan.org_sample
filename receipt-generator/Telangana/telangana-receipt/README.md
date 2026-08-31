# Telangana Checkpost Tax e-Receipt Generator

This project recreates the supplied one-page Telangana receipt as an editable,
data-driven A4 PDF.

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

Update `sampleData.js`. Receipt fields, tax values, text watermark, and QR
content are driven by that file.

- The included `qrImagePath` reproduces the supplied sample QR exactly.
- Set `qrImagePath: null` to generate a new QR from `qrValue`.
- The watermark automatically uses `registrationNo` and `watermarkDate`.
- `useReferenceWatermarkFont: true` preserves the supplied sample's exact
  embedded watermark glyphs. Set it to `false` when a changed registration
  number contains letters outside the sample font subset.

The source PDF's exact page geometry, 22 watermark rows, image rectangles,
opacity values, segmented table rules, and protected right-side watermark
boundary are encoded in `generateReceipt.js`.

## Files

- `generateReceipt.js` — reusable PDF generator
- `sampleData.js` — editable receipt data
- `generateSample.js` — one-command sample generation
- `devServer.js` — live local preview server
- `assets/` — source-extracted seal, sample QR, rupee glyph, and watermark font
- `VALIDATION.md` — source comparison and verification notes
