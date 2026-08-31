# Validation

The supplied reference and generated sample were rendered with Poppler at both
150 DPI and 300 DPI and compared on identical 595 × 841 pt A4 canvases.

## Exact structural checks

- Page count: 1
- Page size: 595 × 841 pt
- Text watermark: 17 rows
- Watermark opacity: 20%
- Seal opacity: 50%
- QR rectangle: 460.128448, 12.808968 to 562.211792, 114.892296 pt
- Seal rectangle: 187.809021, 49.267273 to 391.246521, 268.017273 pt
- Rupee glyph rectangle: 78.731407, 346.038116 to 87.567192, 354.924835 pt
- Table horizontal rules: 303.747437, 317.358551, and 330.969666 pt
- Watermark visible right boundary: 540.507 pt

## Render comparison

At 300 DPI, the tuned sample produced a full-page mean absolute grayscale
pixel delta of approximately 1.34 on a 0–255 scale. The remaining small
differences are rasterizer/font contour differences between the supplied
Firefox/Cairo PDF and the editable PDFKit output.

## Functional checks

- Default source-extracted QR mode generated successfully.
- Dynamic QR mode generated successfully from `qrValue`.
- Changed registration/date values propagated through all 17 watermark rows.
- The local live-preview page and PDF endpoint returned HTTP 200.
- The final packaged PDF was extracted from the ZIP and independently checked
  for page size, page count, image rectangles, text, and render dimensions.
