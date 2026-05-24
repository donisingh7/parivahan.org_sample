/**
 * Punjab PDF receipt generator — finalized two-page design.
 *  Page 1: Punjab logo | title | QR header, 10 field rows, first 2 tax items.
 *  Page 2: remaining tax item(s), grand total, terms and conditions.
 */

const PDFDocument = require('pdfkit');
const QRCode      = require('qrcode');
const moment      = require('moment');
const fs          = require('fs');
const path        = require('path');
const sharp       = require('sharp');

// ── Number → words (Title case, Indian system) ────────────────────────────
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
    width: 138, margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
  });
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  return Buffer.from(base64, 'base64');
}

// ── Text watermark (tiled horizontal rows) ────────────────────────────────
function drawTextWatermark(doc, watermarkText, pageWidth) {
  doc.save();
  doc.opacity(0.5);
  doc.fontSize(15).fillColor('#aaaaaa').font('Helvetica');
  const startX   = 25;
  const startY   = 25;
  const endY     = 740;
  const tileStep = 20;
  for (let row = 0; ; row++) {
    const rowY = startY + row * tileStep;
    if (rowY > endY) break;
    const lineText = `${watermarkText}  `.repeat(2);
    doc.text(lineText, startX, rowY, { width: pageWidth + 100, lineBreak: false });
  }
  doc.restore();
}

// ── Image watermark (Punjab logo, centre-right offset) ───────────────────
async function drawImageWatermark(doc, imagePath) {
  try {
    const wmBuffer = await sharp(imagePath).png().toBuffer();
    doc.save();
    doc.opacity(0.40);
    doc.image(wmBuffer, 305, 188, { width: 230, height: 265 });
    doc.restore();
  } catch { /* skip if image unavailable */ }
}

// ── Main receipt generator ────────────────────────────────────────────────
async function generateReceipt(data) {
  const now            = moment(data.paymentDate || new Date());
  const printedOn      = now.format('DD-MMM-YYYY hh:mm:ss A').toUpperCase();
  const registrationNo = data.registrationNo || 'XX00X0000';
  const watermarkText  = `${registrationNo} ${now.format('DD-MMM-YYYY hh:mm A')}`;

  const grandTotal      = (data.taxItems || []).reduce((sum, item) => sum + (item.total || 0), 0);
  const grandTotalWords = numberToWords(grandTotal);

  const qrUrl    = data.qrUrl || `https://punjabparivahan.gov.in/verify?receipt=${data.receiptNo}`;
  const qrBuffer = await generateQRCode(qrUrl);
  const logoPath = path.join(process.cwd(), 'public', 'Images', 'Punjab_logo.png');

  const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false });
  doc.registerFont('Roboto',      path.join(process.cwd(), 'receipt-generator', 'fonts', 'Roboto-Regular.ttf'));
  doc.registerFont('Roboto-Bold', path.join(process.cwd(), 'receipt-generator', 'fonts', 'Roboto-Bold.ttf'));

  const pageWidth    = 595.28;
  const margin       = 30;
  const contentWidth = pageWidth - margin * 2;

  const chunks = [];
  doc.on('data', chunk => chunks.push(chunk));
  const pdfPromise = new Promise((resolve, reject) => {
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  // ── Field drawing helper ──────────────────────────────────────────────
  const labelWidth    = 95;
  const colonWidth    = 8;
  const fieldFontSize = 12;
  const col1X         = margin;
  const col2X         = pageWidth / 2;
  const maxValueWidth = 155;

  function drawField(label, value, x, yPos) {
    doc.fontSize(fieldFontSize).font('Helvetica').fillColor('#000000');
    doc.text(label,         x,                           yPos, { lineBreak: true,  width: labelWidth });
    doc.text(':',           x + labelWidth,              yPos, { lineBreak: false, width: colonWidth });
    doc.text(value || '-',  x + labelWidth + colonWidth, yPos, { lineBreak: true,  width: maxValueWidth });
  }

  // ── Tax table helpers ─────────────────────────────────────────────────
  const col = { particular: margin, fees: 380, fine: 450, total: 520 };
  const headerHeight   = 28;
  const rowHeight      = 40;
  const firstRowHeight = 50;
  const borderColor    = '#87CEEB';

  function drawTableHeader(y) {
    doc.rect(margin - 2, y, contentWidth + 4, headerHeight).lineWidth(0.8).stroke(borderColor);
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
    doc.text('Tax/Fee Particular', col.particular + 4, y + (headerHeight/2) - 5, { width: col.fees - col.particular - 10, align: 'center' });
    doc.text('Tax/Fees', col.fees,  y + (headerHeight/2) - 5, { width: 60, align: 'center' });
    doc.text('Fine',     col.fine,  y + (headerHeight/2) - 5, { width: 40, align: 'center' });
    doc.text('Total',    col.total, y + (headerHeight/2) - 5, { width: 50, align: 'center' });
    return y + headerHeight;
  }

  function drawTableBorders(tableStartY, tableEndY) {
    doc.rect(margin - 2, tableStartY, contentWidth + 4, tableEndY - tableStartY).lineWidth(0.8).stroke(borderColor);
    doc.moveTo(col.fees  - 5, tableStartY).lineTo(col.fees  - 5, tableEndY).lineWidth(0.5).stroke(borderColor);
    doc.moveTo(col.fine  - 5, tableStartY).lineTo(col.fine  - 5, tableEndY).lineWidth(0.5).stroke(borderColor);
    doc.moveTo(col.total - 5, tableStartY).lineTo(col.total - 5, tableEndY).lineWidth(0.5).stroke(borderColor);
  }

  // ==========================================================
  // PAGE 1
  // ==========================================================
  doc.addPage();

  await drawImageWatermark(doc, logoPath);
  drawTextWatermark(doc, watermarkText, pageWidth);

  // Printed on — top right
  let y = margin - 10;
  doc.fontSize(9).font('Helvetica').fillColor('#000000');
  doc.text(`Printed on : ${printedOn}`, margin, y, { width: contentWidth, align: 'right' });
  y += 14;

  // Punjab Logo (left)
  const emblemX = margin + 5;
  const emblemY = y;
  if (fs.existsSync(logoPath)) {
    const logoX = emblemX + 25;
    const logoY = emblemY + 25;
    doc.rect(logoX - 5, logoY - 5, 110, 130).fill('#ffffff');
    doc.image(logoPath, logoX, logoY, { width: 100, height: 120 });
  }

  // Title block (center)
  const titleX     = margin + 90;
  const titleWidth = contentWidth - 180;
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000');
  doc.text('GOVERNMENT OF PUNJAB', titleX, y + 43, { width: titleWidth, align: 'center', underline: true });
  doc.fontSize(11).font('Helvetica');
  doc.text('Department of Transport', titleX, y + 60, { width: titleWidth, align: 'center' });
  doc.fontSize(10).font('Helvetica');
  doc.text('Checkpost Tax e-Receipt', titleX, y + 75, { width: titleWidth, align: 'center' });

  // QR Code (top right)
  const qrW = 130;
  const qrX = pageWidth - margin - qrW - 25;
  doc.rect(qrX - 3, y - 3, qrW + 6, qrW + 6).fill('#ffffff');
  doc.image(qrBuffer, qrX, y, { width: qrW, height: qrW });

  y += 185;

  // ── FIELDS ─────────────────────────────────────────────────────────────
  const fh  = 28;
  const fh2 = fh * 1.5;
  const fh3 = fh * 2;

  // Row 1
  drawField('Registration\nNo.',             data.registrationNo    || '-', col1X, y);
  drawField('Receipt No.',                   data.receiptNo         || '-', col2X, y);
  y += fh * 1.6;

  // Row 2
  drawField('Payment\nInitialization\nDate', data.paymentInitDate   || '-', col1X, y);
  drawField('Owner\nName.',                  data.ownerName         || '-', col2X, y);
  y += fh3;

  // Row 3
  drawField('Chassis No.',                   data.chassisNo         || '-', col1X, y);
  drawField('Tax Mode',                      data.taxMode           || '-', col2X, y);
  y += fh;

  // Row 4
  drawField('Vehilce Type',                  data.vehicleType       || '-', col1X, y);
  drawField('Vehicle Class',                 data.vehicleClass      || '-', col2X, y);
  y += fh;

  // Row 5
  drawField('Vehicle\nCategory',             data.vehicleCategory   || '-', col1X, y);
  drawField('Mobile No.',                    data.mobileNo          || '-', col2X, y);
  y += fh2;

  // Row 6
  drawField('CheckPost\nName',               data.checkpostName     || '-', col1X, y);
  drawField('Gross Vehicle\nWt(In. Kg)',      String(data.grossVehicleWt ?? 0), col2X, y);
  y += fh2;

  // Row 7
  drawField('Unladen\nWt(In Kg.)',           String(data.unladenWt ?? 0), col1X, y);
  drawField('Bank Ref.\nNo.',                data.bankRefNo         || '-', col2X, y);
  y += fh2;

  // Row 8
  drawField('Payment\nMode',                 data.paymentMode       || 'ONLINE', col1X, y);
  drawField('Permit\nValidity',              data.permitValidity    || '-', col2X, y);
  y += fh2;

  // Row 9
  drawField('Service Type',                  data.serviceType       || '-', col1X, y);
  drawField('Permit Type',                   data.permitType        || 'NOT APPLICABLE', col2X, y);
  y += fh;

  // Row 10 — Payment Confirmation Date (left only)
  drawField('Payment\nConfirmation\nDate',   data.paymentDateText   || '-', col1X, y);
  y += fh3;

  y += 8;

  // ── Tax table — page 1: first 2 items ────────────────────────────────
  const taxItems   = data.taxItems || [];
  const page1Items = taxItems.slice(0, 2);
  const page2Items = taxItems.slice(2);

  const tableStartY1 = y;
  y = drawTableHeader(y);
  doc.moveTo(margin - 2, y).lineTo(pageWidth - margin + 2, y).lineWidth(0.5).stroke(borderColor);

  for (const item of page1Items) {
    const textY = y + (firstRowHeight / 2) - 8;
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000');
    doc.text(String(item.particular), col.particular + 4, textY, { width: col.fees - col.particular - 10 });
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
    doc.text(String(item.fees  ?? 0), col.fees,  textY, { width: 60 });
    doc.text(String(item.fine  ?? 0), col.fine,  textY, { width: 40 });
    doc.text(String(item.total ?? 0), col.total, textY, { width: 50 });
    y += firstRowHeight;
    doc.moveTo(margin - 2, y).lineTo(pageWidth - margin + 2, y).lineWidth(0.5).stroke(borderColor);
  }
  drawTableBorders(tableStartY1, y);

  // ==========================================================
  // PAGE 2
  // ==========================================================
  doc.addPage();

  let y2 = margin + 10;

  // ── Continued tax table — remaining item(s) ───────────────────────────
  const tableStartY2 = y2;
  y2 = drawTableHeader(y2);
  doc.moveTo(margin - 2, y2).lineTo(pageWidth - margin + 2, y2).lineWidth(0.5).stroke(borderColor);

  for (const item of page2Items) {
    const textY2 = y2 + (rowHeight / 2) - 6;
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000');
    doc.text(String(item.particular), col.particular + 4, textY2, { width: col.fees - col.particular - 10 });
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
    doc.text(String(item.fees  ?? 0), col.fees,  textY2, { width: 60 });
    doc.text(String(item.fine  ?? 0), col.fine,  textY2, { width: 40 });
    doc.text(String(item.total ?? 0), col.total, textY2, { width: 50 });
    y2 += rowHeight;
    doc.moveTo(margin - 2, y2).lineTo(pageWidth - margin + 2, y2).lineWidth(0.5).stroke(borderColor);
  }
  drawTableBorders(tableStartY2, y2);

  y2 += 15;

  // ── Grand Total ───────────────────────────────────────────────────────
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
  doc.text(`Grand Total : ${grandTotal}/- ${grandTotalWords} Rupees Only`, margin, y2);
  y2 += 25;

  // ── Note & Terms ──────────────────────────────────────────────────────
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
  doc.text('Note :', margin, y2);
  y2 += 16;
  doc.text('Terms and Conditions:', margin, y2);
  y2 += 16;

  const terms = data.terms || [
    'This is a computer generated printout and no signature is required.',
    'Should not carry unlawful/unaccompanied goods.',
    'If any false information/discrepancies are found at later, necessary action will be taken against the vehicle owner/driver.',
  ];

  terms.forEach((term, i) => {
    doc.fontSize(10).font('Helvetica').fillColor('#000000');
    doc.text(`${i + 1}. ${term}`, margin, y2, { width: contentWidth });
    y2 += 22;
  });

  y2 += 20;

  // ── QR scan note ──────────────────────────────────────────────────────
  doc.fontSize(18).font('Helvetica-Bold').fillColor('#000000');
  doc.text('Scan the QR code for genuinity of the receipt.', margin, y2, { width: contentWidth });

  doc.end();
  return pdfPromise;
}

module.exports = { generateReceipt };
