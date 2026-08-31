const PDFDocument = require('pdfkit');
const QRCode      = require('qrcode');
const moment      = require('moment');
const fs          = require('fs');
const path        = require('path');
const sharp       = require('sharp');

// ── Image loader ──────────────────────────────────────────────────────────
async function loadBlurredImage(imagePath) {
  try {
    if (!fs.existsSync(imagePath)) return null;
    return await sharp(imagePath).blur(2).png().toBuffer();
  } catch { return null; }
}

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

// ── Text watermark ────────────────────────────────────────────────────────
function drawTextWatermark(doc, watermarkText, pageWidth) {
  doc.save();
  doc.opacity(0.5);
  doc.fontSize(11).fillColor('#aaaaaa').font('Helvetica');
  const startX   = 25;
  const startY   = 25;
  const endY     = 550;
  const tileStep = 20;
  for (let row = 0; ; row++) {
    const rowY = startY + row * tileStep;
    if (rowY > endY) break;
    const lineText = `${watermarkText}  `.repeat(2);
    doc.text(lineText, startX, rowY, { width: pageWidth + 100, lineBreak: false });
  }
  doc.restore();
}

// ── Image watermark ───────────────────────────────────────────────────────
async function drawImageWatermark(doc, imagePath, pageWidth, pageHeight) {
  if (!imagePath || !fs.existsSync(imagePath)) return;
  const wmBuffer = await sharp(imagePath).png().toBuffer();
  if (!wmBuffer) return;
  const wmWidth  = 180;  // ← size
  const wmHeight = 180;  // ← size
  const wmX      = ((pageWidth - wmWidth) / 2)+25;
  const wmY      = 150;  // ← position
  doc.save();
  doc.opacity(0.30);
  doc.image(wmBuffer, wmX, wmY, { width: wmWidth, height: wmHeight });
  doc.restore();
}

// ── Main receipt generator ────────────────────────────────────────────────
async function generateReceipt(data, outputPath) {
  const now            = moment(data.paymentDate || new Date());
  const printedOn      = now.format('DD-MMM-YYYY hh:mm:ss A').toUpperCase();
  const registrationNo = data.registrationNo || 'XX00X0000';
  const watermarkText  = `${registrationNo} ${now.format('DD-MMM-YYYY hh:mm A')}`;

  const grandTotal      = (data.taxItems || []).reduce((sum, item) => sum + (item.total || 0), 0);
  const grandTotalWords = numberToWords(grandTotal);

  const qrUrl    = data.qrUrl || `https://apparivahan.gov.in/verify?receipt=${data.receiptNo}`;
  const qrBuffer = await generateQRCode(qrUrl);

  const logoPath = data.emblemImagePath || path.join(__dirname, 'images', 'Andhra_Pradesh_logo.png');

  // ── PDF setup ──
  const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false });
  doc.registerFont('Roboto',      path.join(__dirname, 'fonts', 'Roboto-Regular.ttf'));
  doc.registerFont('Roboto-Bold', path.join(__dirname, 'fonts', 'Roboto-Bold.ttf'));

  const pageWidth    = 595.28;
  const pageHeight   = 841.89;
  const margin       = 30;
  const contentWidth = pageWidth - margin * 2;

  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // ── Field helper ──────────────────────────────────────────
  const labelWidth    = 90;
  const colonWidth    = 8;
  const fieldFontSize = 8.5;
  const col1X         = margin;
  const col2X         = pageWidth / 2 + 10;
  const maxValueWidth = 155;

  function drawField(label, value, x, yPos) {
    doc.fontSize(fieldFontSize).font('Helvetica-Bold').fillColor('#000000');
    doc.text(label, x, yPos, { lineBreak: true, width: labelWidth });
    doc.fontSize(fieldFontSize).font('Helvetica-Bold').fillColor('#000000');
    doc.text(':', x + labelWidth, yPos, { lineBreak: false, width: colonWidth });
    doc.fontSize(fieldFontSize).font('Helvetica-Bold').fillColor('#000000');
    doc.text(value || '', x + labelWidth + colonWidth, yPos, { lineBreak: true, width: maxValueWidth });
  }

  // ── Table helpers ─────────────────────────────────────────
  const col = {
    particular: margin,
    fees:  360,
    fine:  440,
    total: 505,
  };
  const headerHeight = 22;
  const rowHeight    = 28;
  const borderColor  = '#87CEEB';

  function drawTableHeader(doc, y) {
    doc.rect(margin - 2, y, contentWidth + 4, headerHeight).lineWidth(0.8).stroke(borderColor);
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#000000');
    doc.text('Tax/Fee Particular', col.particular + 4, y + (headerHeight/2) - 5, { width: col.fees - col.particular - 10, align: 'center' });
    doc.text('Tax/Fees', col.fees,  y + (headerHeight/2) - 5, { width: 60, align: 'center' });
    doc.text('Fine',     col.fine,  y + (headerHeight/2) - 5, { width: 40, align: 'center' });
    doc.text('Total',    col.total, y + (headerHeight/2) - 5, { width: 50, align: 'center' });
    return y + headerHeight;
  }

  function drawTableRow(doc, item, y) {
    const textY = y + (rowHeight / 2) - 5;
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
    doc.text(String(item.particular), col.particular + 4, textY, { width: col.fees - col.particular - 10 });
    doc.fontSize(7).font('Helvetica').fillColor('#000000');
    doc.text(String(item.fees  ?? 0), col.fees,  textY, { width: 60 });
    doc.text(String(item.fine  ?? 0), col.fine,  textY, { width: 40 });
    doc.text(String(item.total ?? 0), col.total, textY, { width: 50 });
    return y + rowHeight;
  }

  function drawTableBorders(doc, tableStartY, tableEndY) {
    doc.rect(margin - 2, tableStartY, contentWidth + 4, tableEndY - tableStartY).lineWidth(0.8).stroke(borderColor);
    doc.moveTo(col.fees  - 5, tableStartY).lineTo(col.fees  - 5, tableEndY).lineWidth(0.5).stroke(borderColor);
    doc.moveTo(col.fine  - 5, tableStartY).lineTo(col.fine  - 5, tableEndY).lineWidth(0.5).stroke(borderColor);
    doc.moveTo(col.total - 5, tableStartY).lineTo(col.total - 5, tableEndY).lineWidth(0.5).stroke(borderColor);
  }

  // ==========================================================
  // PAGE 1 (single page)
  // ==========================================================
  doc.addPage();

  // Watermarks first
  await drawImageWatermark(doc, logoPath, pageWidth, pageHeight);
  drawTextWatermark(doc, watermarkText, pageWidth);

  // ── Printed on (top right) ────────────────────────────────
  let y = margin - 10;
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#000000');
  doc.text(`Printed on : ${printedOn}`, margin, y, { width: contentWidth, align: 'right' });
  y += 19;

  // ── AP Logo (left) ────────────────────────────────────────
  const emblemX = margin + 5;
  const emblemY = y;
  if (fs.existsSync(logoPath)) {
    const logoX = emblemX + 35;
    const logoY = emblemY + 15;
    const logoW = 80;   // ← width
    const logoH = 80;   // ← height
    doc.rect(logoX, logoY, logoW, logoH).fill('#ffffff');
    doc.image(logoPath, logoX, logoY, { width: logoW, height: logoH });
  }

  // ── Title block (center) ──────────────────────────────────
  const titleX     = margin + 70;
  const titleWidth = contentWidth - 170;

  doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
  doc.text('GOVERNMENT OF ANDHRA PRADESH', titleX, y + 35, { width: titleWidth, align: 'center', underline: true });

  doc.fontSize(9).font('Helvetica-Bold');
  doc.text('Department of Transport', titleX, y + 49, { width: titleWidth, align: 'center' });

  doc.fontSize(9).font('Helvetica-Bold');
  doc.text('Checkpost Tax e-Receipt', titleX, y + 60, { width: titleWidth, align: 'center' });

  // ── QR Code (top right) ───────────────────────────────────
  const qrW = 100;
  const qrH = 100;
  const qrX = pageWidth - margin - qrW - 60;
  const qrY = y;
  doc.rect(qrX - 3, qrY - 3, qrW + 6, qrH + 6).fill('#ffffff');
  doc.image(qrBuffer, qrX, qrY, { width: qrW, height: qrH });

  y += 136;

  // ── FIELDS ────────────────────────────────────────────────
  const fh  = 20;
  const fh2 = fh * 1.5;
  const fh3 = fh * 2;

  // Row 1
  drawField('Registration No.',              data.registrationNo    || '-', col1X, y);
  drawField('Receipt No.',                   data.receiptNo         || '-', col2X, y);
  y += fh;

  // Row 2
  drawField('Payment\nInitialization Date',  data.paymentInitDate   || '-', col1X, y);
  drawField('Owner Name.',                   data.ownerName         || '-', col2X, y);
  y += fh2;

  // Row 3
  drawField('Chassis No.',                   data.chassisNo         || '-', col1X, y);
  drawField('Tax Mode',                      data.taxMode           || '-', col2X, y);
  y += fh;

  // Row 4
  drawField('Vehilce Type',                  data.vehicleType       || '-', col1X, y);
  drawField('Vehicle Class',                 data.vehicleClass      || '-', col2X, y);
  y += fh;

  // Row 5
  drawField('Vehicle Category',              data.vehicleCategory   || '-', col1X, y);
  drawField('Mobile No.',                    data.mobileNo          || '-', col2X, y);
  y += fh;

  // Row 6
  drawField('CheckPost Name',                data.checkpostName     || '-', col1X, y);
  drawField('Gross Vehicle\nWt(In. Kg)',     String(data.grossVehicleWt ?? ''), col2X, y);
  y += fh2;

  // Row 7
  drawField('Unladen Wt(In\nKg.)',           String(data.unladenWt ?? 0), col1X, y);
  drawField('Bank Ref. No.',                 data.bankRefNo         || '-', col2X, y);
  y += fh2;

  // Row 8
  drawField('Payment Mode',                  data.paymentMode       || 'ONLINE', col1X, y);
  drawField('Permit Validity',               data.permitValidity    || '-', col2X, y);
  y += fh;

  // Row 9
  drawField('Fitness Validity',              data.fitnessValidity   || '-', col1X, y);
  drawField('Insurance Validity',            data.insuranceValidity || '-', col2X, y);
  y += fh;

  // Row 10
  drawField('PUCC Validity',                 data.puccValidity      || '-', col1X, y);
  drawField('Service Type',                  data.serviceType       || '-', col2X, y);
  y += fh;

  // Row 11
  drawField('Permit Type',                   data.permitType        || 'NOT APPLICABLE', col1X, y);
  drawField('Name of Goods',                 data.nameOfGoods       || '-', col2X, y);  // ← AP specific
  y += fh;

  // Row 12 — AP specific: Route
  drawField('Route',                         data.route             || '-', col1X, y);  // ← AP specific
  drawField('Payment\nConfirmation Date',    data.paymentConfirmDate || '-', col2X, y);
  y += fh2;

  y += 10;

  // ── TAX TABLE ─────────────────────────────────────────────
  const taxItems    = data.taxItems || [];
  const tableStartY = y;
  y = drawTableHeader(doc, y);
  doc.moveTo(margin - 2, y).lineTo(pageWidth - margin + 2, y).lineWidth(0.5).stroke(borderColor);

  taxItems.forEach((item) => {
    y = drawTableRow(doc, item, y);
    doc.moveTo(margin - 2, y).lineTo(pageWidth - margin + 2, y).lineWidth(0.5).stroke(borderColor);
  });

  drawTableBorders(doc, tableStartY, y);
  y += 10;

  // ── Grand Total ───────────────────────────────────────────
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000');
  doc.text(`Grand Total : ${grandTotal}/- ${grandTotalWords} Rupees Only`, margin, y);
  y += 13;

  // ── Note & Terms ──────────────────────────────────────────
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000');
  doc.text('Note :', margin, y);
  y += 13;

  doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000');
  doc.text('Terms and Conditions:', margin, y);
  y += 13;

  const terms = data.terms || [
    'This is a computer generated printout and no signature is required.',
    'Should not carry unlawful/unaccompanied goods.',
    'If any false information/discrepancies are found at later, necessary action will be taken against the vehicle owner/driver.',
  ];

  terms.forEach((term, i) => {
    doc.fontSize(7.5).font('Helvetica').fillColor('#000000');
    doc.text(`${i + 1}. ${term}`, margin + 10, y, { width: contentWidth - 10 });
    y += 10;
  });

  y += 10;

  // ── QR scan note ──────────────────────────────────────────
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000');
  doc.text('Scan the QR code for genuinity of the receipt.', margin, y, { width: contentWidth });

  // ── Finalize ──────────────────────────────────────────────
  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(outputPath));
    stream.on('error',  reject);
  });
}

module.exports = { generateReceipt };
