/**
 * Bihar PDF receipt generator — adapted from the reference design.
 * Returns a Buffer (instead of writing to a file) so it plugs into the
 * existing S3-upload pipeline without any temp-file handling.
 */

const PDFDocument = require('pdfkit');
const QRCode      = require('qrcode');
const moment      = require('moment');
const fs          = require('fs');
const path        = require('path');
const sharp       = require('sharp');

// -- Image watermark (colour, no grayscale) ---------------------------------
async function drawImageWatermark(doc, imagePath, pageWidth) {
  if (!imagePath || !fs.existsSync(imagePath)) return;
  try {
    const wmBuffer = await sharp(imagePath).png().toBuffer();
    const wmWidth  = 180;
    const wmHeight = 180;
    const wmX = ((pageWidth - wmWidth) / 2) + 25;
    const wmY = 150;
    doc.save();
    doc.opacity(0.25);
    doc.image(wmBuffer, wmX, wmY, { width: wmWidth, height: wmHeight });
    doc.restore();
  } catch {
    // watermark is decorative
  }
}

// -- Number -> words --------------------------------------------------------
function numberToWords(num) {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five',
    'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen',
    'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty',
    'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ];
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

// -- QR Generator -----------------------------------------------------------
async function generateQRCode(text) {
  const dataUrl = await QRCode.toDataURL(text, {
    width: 120, margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
  });
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  return Buffer.from(base64, 'base64');
}

// -- Main Generator ---------------------------------------------------------
async function generateReceipt(data) {
  const now       = moment(data.paymentDate || new Date());
  const printedOn = now.format('DD-MMM-YYYY hh:mm:ss A').toUpperCase();

  const grandTotal      = (data.taxItems || []).reduce((sum, item) => sum + (item.total || 0), 0);
  const grandTotalWords = numberToWords(grandTotal);

  const qrUrl = data.qrUrl ||
    `https://biharparivahan.gov.in/verify?receipt=${data.receiptNo}`;

  const qrBuffer = await generateQRCode(qrUrl);
  const logoPath = path.join(process.cwd(), 'public', 'Images', 'bihar_logo.png');

  // PDF setup
  const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false });

  const fontsDir = path.join(process.cwd(), 'receipt-generator', 'fonts');
  if (fs.existsSync(path.join(fontsDir, 'Roboto-Regular.ttf'))) {
    doc.registerFont('Roboto',      path.join(fontsDir, 'Roboto-Regular.ttf'));
    doc.registerFont('Roboto-Bold', path.join(fontsDir, 'Roboto-Bold.ttf'));
  }

  const pageWidth    = 595.28;
  const pageHeight   = 841.89;   // eslint-disable-line no-unused-vars
  const margin       = 30;
  const contentWidth = pageWidth - margin * 2;

  const chunks     = [];
  const pdfPromise = new Promise((resolve, reject) => {
    doc.on('data',  chunk => chunks.push(chunk));
    doc.on('end',   ()    => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  // Field helper
  const labelWidth    = 90;
  const colonWidth    = 8;
  const fieldFontSize = 8.5;
  const col1X         = margin;
  const col2X         = pageWidth / 2 + 10;
  const maxValueWidth = 155;

  function drawField(label, value, x, yPos) {
    doc.fontSize(fieldFontSize).font('Helvetica-Bold').fillColor('#000000');
    doc.text(label, x, yPos, { lineBreak: true, width: labelWidth });
    doc.text(':', x + labelWidth, yPos, { lineBreak: false, width: colonWidth });
    doc.fontSize(fieldFontSize).font('Helvetica-Bold').fillColor('#000000');
    doc.text(value || '', x + labelWidth + colonWidth, yPos, { lineBreak: true, width: maxValueWidth });
  }

  // Table config
  const col = { particular: margin, fees: 360, fine: 440, total: 505 };
  const headerHeight = 22;
  const rowHeight    = 28;
  const borderColor  = '#87CEEB';

  function drawTableHeader(d, y) {
    d.rect(margin - 2, y, contentWidth + 4, headerHeight).lineWidth(0.8).stroke(borderColor);
    d.fontSize(7).font('Helvetica-Bold').fillColor('#000000');
    d.text('Tax/Fee Particular', col.particular + 4, y + (headerHeight / 2) - 5,
      { width: col.fees - col.particular - 10, align: 'center' });
    d.text('Tax/Fees', col.fees,  y + (headerHeight / 2) - 5, { width: 60, align: 'center' });
    d.text('Fine',     col.fine,  y + (headerHeight / 2) - 5, { width: 40, align: 'center' });
    d.text('Total',    col.total, y + (headerHeight / 2) - 5, { width: 50, align: 'center' });
    return y + headerHeight;
  }

  function drawTableRow(d, item, y) {
    const textY = y + (rowHeight / 2) - 5;
    d.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
    d.text(String(item.particular), col.particular + 4, textY, { width: col.fees - col.particular - 10 });
    d.fontSize(7).font('Helvetica').fillColor('#000000');
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

  // PAGE
  doc.addPage();

  await drawImageWatermark(doc, logoPath, pageWidth);

  // Text watermark (tiled)
  doc.save();
  doc.opacity(0.5);
  doc.fontSize(15).fillColor('#cccccc').font('Helvetica');
  const watermarkText = 'GOVERNMENT OF BIHAR';
  for (let row = 0; row < 22; row++) {
    const rowY = (row * 20) + 20;
    doc.text(`${watermarkText},  `.repeat(2), 30, rowY, { width: pageWidth, lineBreak: false });
  }
  doc.restore();

  // Printed on (top-right)
  let y = margin - 10;
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#000000');
  doc.text(`Printed on : ${printedOn}`, margin, y, { width: contentWidth, align: 'right' });
  y += 19;

  // Logo (left side)
  const emblemY = y;
  if (fs.existsSync(logoPath)) {
    const logoX = margin + 40;
    const logoY = emblemY + 15;
    doc.rect(logoX, logoY, 80, 80).fill('#ffffff');
    doc.image(logoPath, logoX, logoY, { width: 80, height: 80 });
  }

  // Title block (center)
  const titleX     = margin + 70;
  const titleWidth = contentWidth - 170;
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
  doc.text('GOVERNMENT OF BIHAR', titleX, y + 35, { width: titleWidth, align: 'center', underline: true });
  doc.fontSize(9).font('Helvetica-Bold');
  doc.text('Department of Transport', titleX, y + 49, { width: titleWidth, align: 'center' });
  doc.text('Checkpost Tax e-Receipt', titleX, y + 60, { width: titleWidth, align: 'center' });

  // QR (top-right)
  const qrW = 100;
  const qrX = pageWidth - margin - qrW - 60;
  const qrY = y;
  doc.rect(qrX - 3, qrY - 3, qrW + 6, qrW + 6).fill('#ffffff');
  doc.image(qrBuffer, qrX, qrY, { width: qrW, height: qrW });

  y += 136;

  // Fields (Bihar layout -- 11 rows)
  const fh  = 20;
  const fh2 = fh * 1.5;

  // Row 1
  drawField('Registration No.', data.registrationNo || '-', col1X, y);
  drawField('Receipt No.',       data.receiptNo      || '-', col2X, y);
  y += fh;

  // Row 2
  drawField('Payment\nInitialization Date', data.paymentInitDate || '-', col1X, y);
  drawField('Owner Name.',                  data.ownerName        || '-', col2X, y);
  y += fh2;

  // Row 3
  drawField('Chassis No.', data.chassisNo || '-', col1X, y);
  drawField('Tax Mode',    data.taxMode   || '-', col2X, y);
  y += fh;

  // Row 4
  drawField('Vehicle Type',  data.vehicleType  || '-', col1X, y);
  drawField('Vehicle Class', data.vehicleClass || '-', col2X, y);
  y += fh;

  // Row 5 -- Bihar-specific: Vehicle Category | Mobile No.
  drawField('Vehicle Category', data.vehicleCategory || '-', col1X, y);
  drawField('Mobile No.',        data.mobileNo        || '-', col2X, y);
  y += fh;

  // Row 6
  drawField('CheckPost Name',          data.checkpostName             || '-', col1X, y);
  drawField(data.cap1Label || 'Gross Vehicle\nWt(In. Kg)', String(data.cap1Value ?? data.grossVehicleWt ?? ''), col2X, y);
  y += fh2;

  // Row 7
  drawField(data.cap2Label || 'Unladen\nWt(In Kg.)', String(data.cap2Value ?? data.unladenWt ?? ''), col1X, y);
  drawField('Bank Ref. No.',       data.bankRefNo  || '-',      col2X, y);
  y += fh;

  // Row 8
  drawField('Payment Mode',     data.paymentMode     || 'ONLINE', col1X, y);
  drawField('Fitness Validity', data.fitnessValidity  || '-',     col2X, y);
  y += fh;

  // Row 9
  drawField('Insurance Validity', data.insuranceValidity || '-', col1X, y);
  drawField('PUCC Validity',       data.puccValidity      || '-', col2X, y);
  y += fh;

  // Row 10
  drawField('Service Type', data.serviceType || 'NOT APPLICABLE', col1X, y);
  drawField('Permit Type',  data.permitType  || 'NOT APPLICABLE', col2X, y);
  y += fh;

  // Row 11
  drawField('Gross Combination\nWeight(in kg.)', String(data.grossCombinationWeight ?? ''), col1X, y);
  drawField('Payment\nConfirmation Date',         data.paymentConfirmDate || '-',            col2X, y);
  y += fh2;

  y += 10;

  // Tax table
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

  // Grand total
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000');
  doc.text(`Grand Total : ${grandTotal}/- ${grandTotalWords} Rupees Only`, margin, y);
  y += 13;

  // Notes
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000');
  doc.text('Note :', margin, y);
  y += 13;
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

  // QR note
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000');
  doc.text('Scan the QR code for genuinity of the receipt.', margin, y, { width: contentWidth });

  doc.end();
  return pdfPromise;
}

module.exports = { generateReceipt };
