# Odisha Checkpost Tax e-Receipt Generator

This project generates the supplied two-page Odisha Checkpost Tax e-Receipt
and temporary permit as an A4 PDF. Receipt and permit values are controlled by
`sampleData.js`; the layout is implemented in JavaScript with PDFKit.

## Run

```bash
npm install
npm run generate
```

The PDF is written to:

```text
receipts/preview.pdf
```

For a live browser preview that regenerates when the generator or sample data
changes:

```bash
npm run dev
```

Then open `http://localhost:3001`.

## Edit receipt data

Edit `sampleData.js`. It contains:

- receipt and vehicle details
- payment and bank details
- all tax-table rows
- grand total and amount in words
- temporary-permit fields
- QR value and image selection

The included `reference-qr.png` reproduces the supplied sample QR exactly. To
generate a fresh QR after changing the receipt, set:

```js
qrImagePath: null,
qrValue: 'YOUR-QR-CONTENT'
```

The supplied state seal and rupee glyph are preserved as extracted reference
assets. Static outlined headings and legal notes are stored in
`assets/reference-paths.json`; editable values remain live PDF text.

## Main files

- `generateReceipt.js` - two-page PDF generator
- `sampleData.js` - editable receipt data
- `generateSample.js` - one-command generation entry point
- `devServer.js` - live local preview
- `assets/` - seal, QR, rupee glyph, and reference vector paths

## Notes

- Output page size is exactly `595 x 841 pt` (A4), matching the source.
- The source spelling and punctuation are intentionally preserved, including
  `Vehilce`, `Orisha`, and `complain`.
- When the sample grand total is unchanged, its original vector artwork is
  used. A changed total is rendered dynamically using Roboto Bold.
