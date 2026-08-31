# Validation

The generated sample was checked against the supplied `Odisha.pdf`.

## Structural checks

- Two pages
- A4 page size: `595 x 841 pt`
- No encryption, JavaScript, or interactive form fields
- State seal rectangles:
  - header: `27.392361, 12.808960, 136.767349, 122.183960`
  - watermark: `165.934021, 209.683990, 421.142333, 472.183990`
- QR rectangle:
  - `460.805817, 12.617081, 571.715881, 122.567741`
- Rupee glyph rectangle:
  - `78.750000, 366.515533, 86.527779, 374.308502`
- All five receipt-table rules and four column segments reproduced
- Temporary-permit section and source second-page verification notice included

## Pixel comparison

Poppler rendered both source and generated PDFs at 150 and 300 DPI.

| DPI | Page | Mean absolute RGB delta | Pixels with delta > 64 |
| ---: | ---: | ---: | ---: |
| 150 | 1 | 0.5703 / 255 | 0.2602% |
| 150 | 2 | 0.0028 / 255 | 0.0010% |
| 300 | 1 | 0.5749 / 255 | 0.2928% |
| 300 | 2 | 0.0004 / 255 | 0.0001% |

Page 2 and the source outlined artwork are effectively exact. The remaining
page-1 delta is concentrated in editable Roboto text rasterization and
anti-aliasing around text laid over the translucent seal.
