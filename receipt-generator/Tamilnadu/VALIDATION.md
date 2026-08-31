# Visual validation

The generated receipt was rendered with Poppler at 150 DPI and 300 DPI and
compared pixel-by-pixel against renders of the supplied source PDF.

## Structural checks

- Page count: 1
- Page size: `612 × 792 pt` Letter
- Rotation: 0°
- Exact source emblem, QR, and transparent text-watermark assets included
- Exact embedded Segoe UI Bold, Segoe UI, Arial Bold, and Arial font subsets
  included
- Dynamic QR fallback passed
- Dynamic text-watermark fallback passed
- Live preview server started and regenerated successfully

## Coordinate verification

There are 89 text strings extractable from both files. Their source and
generated origin coordinates were compared:

- Mean coordinate delta: `0.00021 pt`
- Maximum coordinate delta: `0.00049 pt`

## Raster comparison

| Render | Mean absolute pixel error | RMSE | Exact RGB pixels |
| --- | ---: | ---: | ---: |
| 150 DPI | 1.567 / 255 | 13.017 / 255 | 97.154% |
| 300 DPI | 1.585 / 255 | 15.296 / 255 | 98.010% |

The remaining raster differences are concentrated around font anti-aliasing,
image resampling, transparency compositing, and the different PDF producers
(Chrome/Skia in the source versus PDFKit in the generated output). Page
geometry, text origins, table rules, logos, QR, and watermark placement align
with the reference. The repeating watermark is clipped at `x = 583.875 pt`,
preserving the source's `28.125 pt` right-side white margin. A matching opaque
protection strip makes this boundary independent of PDF-viewer clipping
behavior.
