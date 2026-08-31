# Validation

The supplied reference and generated sample were rendered with Poppler at 150
DPI and 300 DPI on identical 595 × 841 pt A4 canvases.

## Exact structural checks

- Page count: 1
- Page size: 595 × 841 pt
- Text watermark: 22 rows
- Watermark bounds: 28.122 to 536.890 pt
- Watermark opacity: 20%
- Telangana seal opacity: 60%
- QR rectangle: 459.840637, 12.617081 to 569.791321, 122.567741 pt
- Seal rectangle: 222.971069, 58.908508 to 370.748840, 206.686279 pt
- Rupee glyph rectangle: 78.750000, 340.250366 to 86.527779, 349.045929 pt
- Table horizontal rules: 299.129364, 312.254364, and 325.379364 pt

## Render comparison

At 300 DPI, the tuned sample produced a full-page mean absolute grayscale
pixel delta of approximately 1.61 on a 0–255 scale. Remaining differences are
minor rasterizer/font-contour differences between the supplied Firefox/Cairo
PDF and the editable PDFKit output.

## Functional checks

- Default source-extracted QR mode generated successfully.
- Dynamic QR mode generated successfully from `qrValue`.
- Changed registration/date values propagated through all 22 watermark rows.
- The local live-preview page and PDF endpoint returned HTTP 200.
- The final packaged PDF was extracted from the ZIP and independently checked
  for page size, page count, image rectangles, text, and render dimensions.
