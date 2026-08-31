# Visual validation

The generated sample was rendered at 300 DPI and compared pixel-by-pixel with
the supplied `Karnataka.pdf`.

- Page count: 1
- Page size: 612 × 792 pt (US Letter)
- Mean absolute RGB difference: 1.23373 / 255
- RGB RMSE: 14.63000
- Pixels whose maximum channel difference exceeds 64: 0.61159%

The page geometry, text baselines, header, receipt box, logo, watermark,
reference QR path, table rules, totals, notes, and footer were measured from
the source PDF and reproduced at PDF-point coordinates.

Minor raster differences remain around font anti-aliasing because the source
was produced by Chrome/Skia while this editable version is rendered by
PDFKit. The receipt content itself remains selectable and data-driven.

An additional dynamic-data test was run with changed identifiers, owner,
vehicle, tax rows, total, amount in words, and a newly generated QR. It
successfully produced one Letter-size page without overflow.
