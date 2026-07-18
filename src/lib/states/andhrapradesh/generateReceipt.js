/**
 * Andhra Pradesh PDF receipt generator.
 *  Page 1: AP logo | title | QR header, field grid (blank below — tax table
 *          moved to page 2).
 *  Page 2: Tax table (dynamic — zero-total rows are dropped upstream in
 *          buildReceiptData), Grand Total, Notes, QR scan note.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const PDFDocument = require('pdfkit');
const QRCode      = require('qrcode');
const moment      = require('moment');
const fs          = require('fs');
const path        = require('path');
const sharp       = require('sharp');

// ── Number → words (Title case) ───────────────────────────────────────────
function numberToWords(num) {
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
    'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen',
    'Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  if (num === 0) return 'Zero';
  function convert(n) {
    if (n < 20)     return ones[n];
    if (n < 100)    return tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '');
    if (n < 1000)   return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' '+convert(n%100) : '');
    if (n < 100000) return convert(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' '+convert(n%1000) : '');
    return convert(Math.floor(n/100000)) + ' Lakh' + (n%100000 ? ' '+convert(n%100000) : '');
  }
  return convert(num);
}

// ── QR code → buffer ──────────────────────────────────────────────────────
async function generateQRCode(text) {
  const dataUrl = await QRCode.toDataURL(text, {
    width: 120, margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
  });
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  return Buffer.from(base64, 'base64');
}

// ── Tiled text watermark, capped to a Y limit ─────────────────────────────
function drawTextWatermark(doc, watermarkText, pageWidth, limitY) {
  doc.save();
  doc.opacity(0.5);
  doc.fontSize(15).fillColor('#aaaaaa').font('Helvetica');
  const tileStep  = 25;
  const startY    = 55;
  const startX    = 25;
  const rowWidth  = pageWidth - 170;
  const rowHeight = doc.currentLineHeight(true);
  for (let row = 0; ; row++) {
    const rowY = startY + row * tileStep;
    if (rowY > limitY) break;
    doc.text(`${watermarkText}  `.repeat(2), startX, rowY, { width: rowWidth, height: rowHeight, lineBreak: false });
  }
  doc.restore();
}

// ── Blurred image watermark (center of page) ──────────────────────────────
async function drawImageWatermark(doc, imagePath, pageWidth, pageHeight) {
  if (!imagePath || !fs.existsSync(imagePath)) return;
  try {
    const wmBuffer = await sharp(imagePath).blur(1).png().toBuffer();
    const wmWidth  = 240;
    const wmHeight = 240;
    const wmX = ((pageWidth - wmWidth) / 2) + 120;
    const wmY = (pageHeight - wmHeight) / 2 - 80;
    doc.save();
    doc.opacity(0.32);
    doc.image(wmBuffer, wmX, wmY, { width: wmWidth, height: wmHeight });
    doc.restore();
  } catch {
    // watermark is decorative
  }
}

// ── Main receipt generator — returns a Buffer ─────────────────────────────
async function generateReceipt(data) {
  const now            = moment(data.paymentDate || new Date());
  // "Printed on" — prefer upstream value (comma + non-padded hour,
  // e.g. "23-JUN-2026, 9:47:54 PM"); fall back to current time.
  const printedOn      = data.printedOnDate || now.format('DD-MMM-YYYY hh:mm:ss A').toUpperCase();
  const registrationNo = data.registrationNo || 'XX00X0000';
  // Watermark uses the Payment Init date at HH:MM (no seconds, non-padded hour).
  const initDateHHMM   = data.paymentInitDate
    ? String(data.paymentInitDate).replace(
        /^(\d{2}-[A-Za-z]{3}-\d{4})\s+(\d{1,2}):(\d{2}):\d{2}\s+(AM|PM)$/i,
        (_m, d, h, mm, ap) => `${d} ${parseInt(h, 10)}:${mm} ${ap}`)
    : now.format('DD-MMM-YYYY hh:mm A').toUpperCase();
  const watermarkText  = `${registrationNo} ${initDateHHMM}`;

  const grandTotal      = (data.taxItems || []).reduce((sum, item) => sum + (item.total || 0), 0);
  const grandTotalWords = numberToWords(grandTotal);

  const qrUrl    = data.qrUrl || `https://apparivahan.gov.in/verify?receipt=${data.receiptNo}`;
  const qrBuffer = await generateQRCode(qrUrl);
  const logoPath = path.join(process.cwd(), 'public', 'Images', 'Andhra_Pradesh_logo.png');

  // ── PDF setup ──────────────────────────────────────────────────────────
  const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false });
  doc.registerFont('Roboto',      path.join(process.cwd(), 'receipt-generator', 'fonts', 'Roboto-Regular.ttf'));
  doc.registerFont('Roboto-Bold', path.join(process.cwd(), 'receipt-generator', 'fonts', 'Roboto-Bold.ttf'));

  const pageWidth    = 595.28;
  const pageHeight   = 841.89;
  const margin       = 30;
  const contentWidth = pageWidth - margin * 2;

  const chunks = [];
  doc.on('data', chunk => chunks.push(chunk));
  const pdfPromise = new Promise((resolve, reject) => {
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  // ── Field helper ──────────────────────────────────────────────────────
  const labelWidth    = 95;
  const colonWidth    = 8;
  const fieldFontSize = 11.5;
  const col1X         = margin + 10;
  const col2X         = pageWidth / 2 + 10;
  const maxValueWidth = 155;

  function drawField(label, value, x, yPos) {
    doc.fontSize(fieldFontSize).font('Helvetica-Bold').fillColor('#000000');
    doc.text(label, x, yPos, { lineBreak: true, width: labelWidth });
    doc.text(':', x + labelWidth, yPos, { lineBreak: false, width: colonWidth });
    doc.text(value || '-', x + labelWidth + colonWidth, yPos, { lineBreak: true, width: maxValueWidth });
  }

  // ── Table helpers ─────────────────────────────────────────────────────
  const col = { particular: margin, fees: 360, fine: 440, total: 510 };
  const headerHeight = 30;
  const rowHeight    = 35;
  const borderColor  = '#87CEEB';

  function drawTableHeader(y) {
    doc.rect(margin - 2, y, contentWidth + 4, headerHeight).lineWidth(0.8).stroke(borderColor);
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000');
    doc.text('Tax/Fee Particular', col.particular + 4, y + 9, { width: col.fees - col.particular - 10, align: 'center' });
    doc.text('Tax/Fees', col.fees,  y + 9, { width: 60, align: 'center' });
    doc.text('Fine',     col.fine,  y + 9, { width: 40, align: 'center' });
    doc.text('Total',    col.total, y + 9, { width: 50, align: 'center' });
    return y + headerHeight;
  }

  function drawTableRow(item, y) {
    doc.font('Helvetica-Bold').fontSize(11.5).fillColor('#000000');
    doc.text(String(item.particular), col.particular + 4, y + 10, { width: col.fees - col.particular - 10 });
    doc.text(String(item.fees  ?? 0), col.fees,  y + 10, { width: 60 });
    doc.text(String(item.fine  ?? 0), col.fine,  y + 10, { width: 40 });
    doc.text(String(item.total ?? 0), col.total, y + 10, { width: 50 });
    return y + rowHeight;
  }

  function drawTableBorders(tableStartY, tableEndY) {
    doc.rect(margin - 2, tableStartY, contentWidth + 4, tableEndY - tableStartY).lineWidth(0.8).stroke(borderColor);
    doc.moveTo(col.fees  - 5, tableStartY).lineTo(col.fees  - 5, tableEndY).lineWidth(0.5).stroke(borderColor);
    doc.moveTo(col.fine  - 5, tableStartY).lineTo(col.fine  - 5, tableEndY).lineWidth(0.5).stroke(borderColor);
    doc.moveTo(col.total - 5, tableStartY).lineTo(col.total - 5, tableEndY).lineWidth(0.5).stroke(borderColor);
  }

  // ==========================================================
  // PAGE 1 — header + field grid
  // ==========================================================
  doc.addPage();

  await drawImageWatermark(doc, logoPath, pageWidth, pageHeight);
  drawTextWatermark(doc, watermarkText, pageWidth, pageHeight * 0.78);

  // Printed on (top right)
  let y = margin - 10;
  y += 20;
  doc.fontSize(10).font('Helvetica').fillColor('#000000');
  doc.text(`Printed on : ${printedOn}`, margin, y, { width: contentWidth, align: 'right' });
  y += 20;

  // AP emblem (left side)
  const emblemX = margin + 5;
  const emblemY = y;
  if (fs.existsSync(logoPath)) {
    const logoX = emblemX + 30;
    const logoY = emblemY + 20;
    const logoW = 100;
    const logoH = 100;
    doc.rect(logoX - 5, logoY - 5, logoW + 10, logoH + 10).fill('#ffffff');
    doc.image(logoPath, logoX, logoY, { width: logoW, height: logoH });
  } else {
    doc.save();
    doc.circle(emblemX + 35, emblemY + 35, 35).fillAndStroke('#f5f5f5', '#cccccc');
    doc.fontSize(6).fillColor('#999999').font('Helvetica-Bold');
    doc.text('GOVT. OF\nANDHRA PRADESH', emblemX + 10, emblemY + 28, { width: 50, align: 'center' });
    doc.restore();
  }

  // QR Code (top right) — drawn before title so the title's background
  // rectangle can't paint over it.
  doc.rect(pageWidth - margin - 172, y, 138, 138).fill('#ffffff');
  doc.image(qrBuffer, pageWidth - margin - 172, y, { width: 138, height: 138 });

  // Title block (center, between logo and QR)
  const titleX     = margin + 140;
  const titleWidth = 250;
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000');
  doc.text('GOVERNMENT OF ANDHRA\nPRADESH', titleX, y + 55, { width: titleWidth, align: 'center', underline: true });
  doc.fontSize(11).font('Helvetica-Bold');
  doc.text('Department of Transport', titleX, y + 85, { width: titleWidth, align: 'center' });
  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('Checkpost Tax e-Receipt', titleX, y + 100, { width: titleWidth, align: 'center' });

  y += 88;

  // ── FIELDS — two column layout ────────────────────────────────────────
  const fieldLineHeight = 24;

  y += 105;

  // Row 1
  drawField('Registration\nNo.',             data.registrationNo    || '-', col1X, y);
  drawField('Receipt No.',                   data.receiptNo         || '-', col2X, y);
  y += fieldLineHeight * 1.8;

  // Row 2
  drawField('Payment\nInitialization\nDate', data.paymentInitDate   || '-', col1X, y);
  drawField('Owner Name.',                   data.ownerName         || '-', col2X, y);
  y += fieldLineHeight * 2;

  // Row 3
  drawField('Chassis No.',                   data.chassisNo         || '-', col1X, y);
  drawField('Tax Mode',                      data.taxMode           || '-', col2X, y);
  y += fieldLineHeight;

  // Row 4
  drawField('Vehilce Type',                  data.vehicleType       || '-', col1X, y);
  drawField('Vehicle Class',                 data.vehicleClass      || '-', col2X, y);
  y += fieldLineHeight * 1.6;

  // Row 5
  drawField('Vehicle\nCategory',             data.vehicleCategory   || '-', col1X, y);
  drawField('Mobile No.',                    data.mobileNo          || '-', col2X, y);
  y += fieldLineHeight * 1.8;

  // Row 6
  drawField('CheckPost\nName',               data.checkpostName     || '', col1X, y);
  drawField(data.cap1Label || 'Gross Vehicle\nWt(In. Kg)', String(data.cap1Value ?? data.grossVehicleWt ?? ''), col2X, y);
  y += fieldLineHeight * 1.8;

  // Row 7
  drawField(data.cap2Label || 'Unladen\nWt(In Kg.)', String(data.cap2Value ?? data.unladenWt ?? 0), col1X, y);
  drawField('Bank Ref. No.',                 data.bankRefNo         || '-', col2X, y);
  y += fieldLineHeight * 1.8;

  // Row 8
  drawField('Payment\nMode',                 data.paymentMode       || 'ONLINE', col1X, y);
  drawField('Permit Validity',               data.permitValidity    || '-', col2X, y);
  y += fieldLineHeight * 1.8;

  // Row 9
  drawField('Fitness\nValidity',             data.fitnessValidity   || '', col1X, y);
  drawField('Insurance\nValidity',           data.insuranceValidity || '', col2X, y);
  y += fieldLineHeight * 1.8;

  // Row 10
  drawField('PUCC Validity',                 data.puccValidity      || '', col1X, y);
  drawField('Service Type',                  data.serviceType       || '-', col2X, y);
  y += fieldLineHeight;

  // Row 11 — AP specific: Name of Goods
  drawField('Permit Type',                   data.permitType        || 'NOT APPLICABLE', col1X, y);
  drawField('Name of Goods',                 data.nameOfGoods       || '-', col2X, y);
  y += fieldLineHeight * 1.6;

  // Row 12 — AP specific: Route
  drawField('Route',                         data.route             || '-', col1X, y);
  drawField('Payment\nConfirmation\nDate',   data.paymentConfirmDate || '', col2X, y);
  y += fieldLineHeight * 2;

  // Page 1 ends here — the tax table has moved to page 2, so the rest of
  // page 1 below the fields is intentionally left blank.

  // ==========================================================
  // PAGE 2 — Tax Table, Grand Total, Notes, QR note
  // ==========================================================
  doc.addPage();
  let y2 = margin + 10;

  const taxItems    = data.taxItems || [];
  const tableStartY = y2;
  y2 = drawTableHeader(y2);
  doc.moveTo(margin - 2, y2).lineTo(pageWidth - margin + 2, y2).lineWidth(0.5).stroke(borderColor);

  for (const item of taxItems) {
    y2 = drawTableRow(item, y2);
    doc.moveTo(margin - 2, y2).lineTo(pageWidth - margin + 2, y2).lineWidth(0.5).stroke(borderColor);
  }
  drawTableBorders(tableStartY, y2);
  y2 += 16;

  // Grand Total
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
  doc.text(`Grand Total : ${grandTotal}/- ${grandTotalWords} Rupees Only`, margin, y2);
  y2 += 16;

  // Note & Terms
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
  doc.text('Note :', margin, y2);
  y2 += 16;
  doc.text('Terms and Conditions:', margin, y2);
  y2 += 14;

  const terms = data.terms || [
    'This is a computer generated printout and no signature is required.',
    'Should not carry unlawful/unaccompanied goods.',
    'If any false information/discrepancies are found at later, necessary action will be taken against the vehicle owner/driver.',
  ];
  terms.forEach((term, i) => {
    doc.fontSize(10).font('Helvetica').fillColor('#000000');
    doc.text(`${i + 1}. ${term}`, margin, y2, { width: contentWidth });
    y2 += 15;
  });

  y2 += 20;

  // QR scan note
  doc.fontSize(15).font('Helvetica-Bold').fillColor('#000000');
  doc.text('Scan the QR code for genuinity of the receipt.', margin, y2);

  doc.end();
  return pdfPromise;
}

module.exports = { generateReceipt };
