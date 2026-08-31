# Validation

Reference: `Madhya Pradesh.pdf`

- Reference page size: 595 x 841 pt
- Generated page size: 595 x 841 pt
- Reference pages: 3
- Generated pages: 3
- Printable content frame: x=35, y=35, width=525, height=700 pt
- Reference and generated table bounds: x=43.75 to 533.75 pt,
  y=175 to 348.542 pt
- Reference and generated page-one watermark image bounds:
  x=35, y=35, width=408.333, height=522.812 pt
- Central emblem watermark: 30% opacity at
  x=312.083, y=217.292, width=218.75, height=218.75 pt
- Main emblem bounds: x=64.75, y=77.413,
  width=102.083, height=102.083 pt
- QR bounds: x=400.458, y=53.229,
  width=145.834, height=145.833 pt

Checks completed:

- Generated and reopened successfully with Poppler.
- Three pages render without clipped tables or missing images.
- Sample QR and watermark assets reproduce the approval sample.
- Live mode generates a new QR and registration/date watermark when the
  reference asset paths are omitted.
- Extracted generated text contains receipt number, tax items, grand total,
  permit details, terms and the genuineness instruction.
- The development preview server starts and regenerates the PDF successfully.

The reference was printed by Firefox/Cairo and most bold receipt text was
converted to vector outlines. The generated PDF uses embedded, selectable
Roboto text. Coordinates and visual geometry are matched; low-level PDF object
structure is intentionally different.
