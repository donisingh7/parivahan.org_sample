/**
 * Bihar PDF receipt generator.
 * Returns a Buffer (instead of writing to a file) so it plugs into the
 * existing S3-upload pipeline without any temp-file handling.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const PDFDocument = require('pdfkit');
const QRCode      = require('qrcode');
const moment      = require('moment');
const fs          = require('fs');
const path        = require('path');
const sharp       = require('sharp');

// -- Number -> words --------------------------------------------------------
function numberToWords(num) {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (num === 0) return 'Zero';
  function convert(n) {
    if (n < 20)     return ones[n];
    if (n < 100)    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000)   return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
  }
  return convert(num);
}

// -- QR Generator -------------------------------------------------------------
async function generateQRCode(text) {
  const dataUrl = await QRCode.toDataURL(text, {
    width: 120, margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
  });
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  return Buffer.from(base64, 'base64');
}

// -- Tiled text watermark, capped to a Y limit -------------------------------
function drawTextWatermark(doc, watermarkText, pageWidth, limitY) {
  doc.save();
  doc.opacity(0.5);
  doc.fontSize(14).fillColor('#aaaaaa').font('Helvetica');
  const tileStep = 20;
  const startY   = 25;
  const startX   = 25;
  for (let row = 0; ; row++) {
    const rowY = startY + row * tileStep;
    if (rowY > limitY) break;
    doc.text(`${watermarkText}  `.repeat(2), startX, rowY, { width: pageWidth, lineBreak: false });
  }
  doc.restore();
}

// -- Blurred greyscale image watermark (center of page) ----------------------
async function drawImageWatermark(doc, imagePath, pageWidth, pageHeight) {
  if (!imagePath || !fs.existsSync(imagePath)) return;
  try {
    const wmBuffer = await sharp(imagePath).blur(2).png().toBuffer();
    const wmWidth  = 160;
    const wmHeight = 200;
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

// -- Main Generator -----------------------------------------------------------
async function generateReceipt(data) {
  const now       = moment(data.paymentDate || new Date());
  const printedOn = data.printedOnDate || now.format('DD-MMM-YYYY hh:mm:ss A').toUpperCase();
  const registrationNo = data.registrationNo || 'XX00X0000';
  // Watermark uses Payment Init date at HH:MM precision (strip seconds if present).
  const initDateHHMM = data.paymentInitDate
    ? data.paymentInitDate.replace(/(\d{2}:\d{2}):\d{2}/, '$1')
    : now.format('DD-MMM-YYYY hh:mm A').toUpperCase();
  const watermarkText  = `${registrationNo} ${initDateHHMM}`;

  const grandTotal      = (data.taxItems || []).reduce((sum, item) => sum + (item.total || 0), 0);
  const grandTotalWords = numberToWords(grandTotal);

  const qrUrl    = data.qrUrl || `https://biharparivahan.gov.in/verify?receipt=${data.receiptNo}`;
  const qrBuffer = await generateQRCode(qrUrl);
  const logoPath = path.join(process.cwd(), 'public', 'Images', 'bihar_logo.png');

  const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false });

  const fontsDir = path.join(process.cwd(), 'receipt-generator', 'fonts');
  if (fs.existsSync(path.join(fontsDir, 'Roboto-Regular.ttf'))) {
    doc.registerFont('Roboto',      path.join(fontsDir, 'Roboto-Regular.ttf'));
    doc.registerFont('Roboto-Bold', path.join(fontsDir, 'Roboto-Bold.ttf'));
  }

  const pageWidth    = 595.28;
  const pageHeight   = 841.89;
  const margin       = 30;
  const contentWidth = pageWidth - margin * 2;

  const chunks     = [];
  const pdfPromise = new Promise((resolve, reject) => {
    doc.on('data',  chunk => chunks.push(chunk));
    doc.on('end',   ()    => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  // -- Field helper -----------------------------------------------------------
  const labelWidth    = 95;
  const colonWidth    = 8;
  const fieldFontSize = 10.5;
  const col1X         = margin;
  const col2X         = pageWidth / 2 + 10;
  const maxValueWidth = 155;

  function drawField(label, value, x, yPos) {
    doc.fontSize(fieldFontSize).font('Helvetica-Bold').fillColor('#000000');
    doc.text(label, x, yPos, { lineBreak: true, width: labelWidth });
    doc.text(':', x + labelWidth, yPos, { lineBreak: false, width: colonWidth });
    doc.text(value || '', x + labelWidth + colonWidth, yPos, { lineBreak: true, width: maxValueWidth });
  }

  // -- Table config -------------------------------------------------------------
  const col = { particular: margin, fees: 360, fine: 440, total: 505 };
  const headerHeight = 22;
  const rowHeight    = 28;
  const borderColor  = '#87CEEB';

  function drawTableHeader(d, y) {
    d.rect(margin - 2, y, contentWidth + 4, headerHeight).lineWidth(0.8).stroke(borderColor);
    d.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
    d.text('Tax/Fee Particular', col.particular + 4, y + (headerHeight / 2) - 5,
      { width: col.fees - col.particular - 10, align: 'center' });
    d.text('Tax/Fees', col.fees,  y + (headerHeight / 2) - 5, { width: 60, align: 'center' });
    d.text('Fine',     col.fine,  y + (headerHeight / 2) - 5, { width: 40, align: 'center' });
    d.text('Total',    col.total, y + (headerHeight / 2) - 5, { width: 50, align: 'center' });
    return y + headerHeight;
  }

  function drawTableRow(d, item, y) {
    const textY = y + (rowHeight / 2) - 5;
    d.fontSize(10.5).font('Helvetica-Bold').fillColor('#000000');
    d.text(String(item.particular), col.particular + 4, textY, { width: col.fees - col.particular - 10 });
    d.fontSize(9).font('Helvetica').fillColor('#000000');
    d.text(String(item.fees  ?? 0), col.fees,  textY);
    d.text(String(item.fine  ?? 0), col.fine,  textY);
    d.text(String(item.total ?? 0), col.total, textY);
    return y + rowHeight;
  }

  function drawTableBorders(d, tableStartY, tableEndY) {
    d.rect(margin - 2, tableStartY, contentWidth + 4, tableEndY - tableStartY)
      .lineWidth(0.8).stroke(borderColor);
    d.moveTo(col.fees  - 5, tableStartY).lineTo(col.fees  - 5, tableEndY).lineWidth(0.5).stroke(borderColor);
    d.moveTo(col.fine  - 5, tableStartY).lineTo(col.fine  - 5, tableEndY).lineWidth(0.5).stroke(borderColor);
    d.moveTo(col.total - 5, tableStartY).lineTo(col.total - 5, tableEndY).lineWidth(0.5).stroke(borderColor);
  }

  // =========================================================
  // PAGE
  // =========================================================
  doc.addPage();

  await drawImageWatermark(doc, logoPath, pageWidth, pageHeight);
  drawTextWatermark(doc, watermarkText, pageWidth, pageHeight * 0.85);

  // -- Header: Printed on (top right) ------------------------------------------
  let y = margin - 10;
  doc.fontSize(11).font('Helvetica').fillColor('#000000');
  doc.text(`Printed on : ${printedOn}`, margin, y, { width: contentWidth, align: 'right' });
  y += 20;

  // -- Logo (left side) ---------------------------------------------------------
  const emblemX = margin + 5;
  const emblemY = y;
  if (fs.existsSync(logoPath)) {
    const logoX = emblemX + 20;
    const logoY = emblemY + 20;
    const logoW = 80;
    const logoH = 100;
    doc.rect(logoX - 5, logoY - 5, logoW + 10, logoH + 10).fill('#ffffff');
    doc.image(logoPath, logoX, logoY, { width: logoW, height: logoH });
  } else {
    doc.save();
    doc.circle(emblemX + 35, emblemY + 35, 35).fillAndStroke('#f5f5f5', '#cccccc');
    doc.fontSize(6).fillColor('#999999').font('Helvetica-Bold');
    doc.text('GOVT. OF\nBIHAR', emblemX + 10, emblemY + 28, { width: 50, align: 'center' });
    doc.restore();
  }

  // -- Title block (center) -----------------------------------------------------
  const titleX     = margin + 65;
  const titleWidth = contentWidth - 160;
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000');
  doc.text('GOVERNMENT OF BIHAR', titleX, y + 55, { width: titleWidth, align: 'center', underline: true });
  doc.fontSize(11).font('Helvetica-Bold');
  doc.text('Department of Transport', titleX, y + 73, { width: titleWidth, align: 'center' });
  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('Checkpost Tax e-Receipt', titleX, y + 88, { width: titleWidth, align: 'center' });

  // -- QR Code (top right) --------------------------------------------------------
  doc.rect(pageWidth - margin - 172, y, 138, 138).fill('#ffffff');
  doc.image(qrBuffer, pageWidth - margin - 172, y, { width: 138, height: 138 });

  y += 193;

  // =====================================================
  // FIELDS — two column layout
  // =====================================================
  const fh  = 28;
  const fh2 = fh * 1.5;

  // Row 1
  drawField('Registration\nNo.',           data.registrationNo || '-', col1X, y);
  drawField('Receipt No.',                 data.receiptNo      || '-', col2X, y);
  y += fh * 1.8;

  // Row 2
  drawField('Payment\nInitialization\nDate', data.paymentInitDate || '-', col1X, y);
  drawField('Owner Name.',                   data.ownerName        || '-', col2X, y);
  y += fh2 * 1.3;

  // Row 3
  drawField('Chassis No.', data.chassisNo || '-', col1X, y);
  drawField('Tax Mode',    data.taxMode   || '-', col2X, y);
  y += fh;

  // Row 4
  drawField('Vehilce Type', data.vehicleType  || '-', col1X, y);
  drawField('Vehicle Class', data.vehicleClass || '-', col2X, y);
  y += fh * 1.6;

  // Row 5 — Bihar-specific: Vehicle Category | Mobile No.
  drawField('Vehicle\nCategory', data.vehicleCategory || '-', col1X, y);
  drawField('Mobile No.',        data.mobileNo        || '-', col2X, y);
  y += fh2 * 1.2;

  // Row 6
  drawField('CheckPost\nName', data.checkpostName || '-', col1X, y);
  drawField(data.cap1Label || 'Gross Vehicle\nWt(In. Kg)', String(data.cap1Value ?? data.grossVehicleWt ?? ''), col2X, y);
  y += fh2 * 1.2;

  // Row 7
  drawField(data.cap2Label || 'Unladen\nWt(In Kg.)', String(data.cap2Value ?? data.unladenWt ?? ''), col1X, y);
  drawField('Bank Ref. No.', data.bankRefNo || '-', col2X, y);
  y += fh;

  // Row 8
  drawField('Payment\nMode',     data.paymentMode     || 'ONLINE', col1X, y);
  drawField('Fitness\nValidity', data.fitnessValidity  || '-',      col2X, y);
  y += fh2 * 1.2;

  // Row 9
  drawField('Insurance\nValidity', data.insuranceValidity || '-', col1X, y);
  drawField('PUCC Validity',        data.puccValidity      || '-', col2X, y);
  y += fh2;

  // Row 10
  drawField('Service Type', data.serviceType || 'NOT APPLICABLE', col1X, y);
  drawField('Permit Type',  data.permitType  || 'NOT APPLICABLE', col2X, y);
  y += fh * 1.8;

  // Row 11
  drawField('Gross Combination\nWeight(in kg.)', String(data.grossCombinationWeight ?? ''), col1X, y);
  drawField('Payment\nConfirmation\nDate',        data.paymentConfirmDate || '-',            col2X, y);
  y += fh2 * 1.3;

  y += 16;

  // =====================================================
  // TAX TABLE
  // =====================================================
  const taxItems    = data.taxItems || [];
  const tableStartY = y;

  y = drawTableHeader(doc, y);
  doc.moveTo(margin - 2, y).lineTo(pageWidth - margin + 2, y).lineWidth(0.5).stroke(borderColor);

  taxItems.forEach((item) => {
    y = drawTableRow(doc, item, y);
    doc.moveTo(margin - 2, y).lineTo(pageWidth - margin + 2, y).lineWidth(0.5).stroke(borderColor);
  });

  drawTableBorders(doc, tableStartY, y);

  // =========================================================
  // PAGE 2 — Grand Total, Notes, Terms, QR note
  // =========================================================
  doc.addPage();
  let y2 = margin + 10;

  doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000');
  doc.text(`Grand Total : ${grandTotal}/- ${grandTotalWords} Rupees Only`, margin, y2);
  y2 += 26;

  doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
  doc.text('Note :', margin, y2);
  y2 += 18;
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

  doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000');
  doc.text('Scan the QR code for genuinity of the receipt.', margin, y2, { width: contentWidth });

  doc.end();
  return pdfPromise;
}

module.exports = { generateReceipt };
