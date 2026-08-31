# Visual validation

The generated PDF was rendered with Poppler at both 150 DPI and 300 DPI and
compared against renders of the supplied source PDF.

## Geometry checks

- Page count: 2
- Page size: 595 × 841 points on both pages
- Rotation: 0°
- Source assets: exact extracted Jharkhand seal, QR artwork, and rupee glyph
- Embedded body font: Roboto
- Browser print font: Noto Serif

For text strings that are extractable from both files:

- Page 1: 59 matched text origins; mean coordinate delta `0.0015 pt`;
  maximum delta `0.0265 pt`
- Page 2: 10 matched text origins; mean coordinate delta `0.0003 pt`;
  maximum delta `0.0008 pt`

## Raster comparison

| Render | Mean absolute pixel error | Exact RGB pixels |
| --- | ---: | ---: |
| 150 DPI, page 1 | 3.659 / 255 | 92.62% |
| 150 DPI, page 2 | 1.178 / 255 | 99.07% |
| 300 DPI, page 1 | 3.797 / 255 | 93.86% |
| 300 DPI, page 2 | 1.280 / 255 | 99.23% |

The residual raster difference is concentrated around font anti-aliasing,
transparency compositing, and the different PDF producers (Firefox/Cairo in the
source versus PDFKit in the generated file). The measured positions, page
geometry, table rules, and embedded source artwork align with the reference.

## Runtime checks

- `node --check` passed for generator, sample data, and development server
- Sample generation passed
- Dynamic QR fallback passed
- Live preview server started and regenerated the PDF successfully
