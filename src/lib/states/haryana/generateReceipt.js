/**
 * Haryana PDF receipt generator.
 * Returns a Buffer — does NOT write to disk.
 * Layout matches HaryanaReceiptTemplate.tsx exactly (two pages).
 */
/* eslint-disable @typescript-eslint/no-require-imports */

const PDFDocument = require('pdfkit');
const QRCode      = require('qrcode');
const moment      = require('moment');
const path        = require('path');
const sharp       = require('sharp');
const fs          = require('fs');

const STATE_WATERMARK_FILE = 'haryana-emblem.png';

const TERMS = [
  'This is a computer generated printout and no signature is required.',
  'Should not carry unlawful/unaccompanied goods.',
  'If any false information/discrepancies are found at later, necessary action will be taken against the vehicle owner/driver.',
];

function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'];
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

async function generateQRCode(text) {
  const dataUrl = await QRCode.toDataURL(text, {
    width: 138,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
  });
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  return Buffer.from(base64, 'base64');
}

function drawTextWatermark(doc, watermarkText, pageWidth, limitY) {
  doc.save();
  doc.opacity(0.5);
  doc.fontSize(16.5).fillColor('#aaaaaa').font('Helvetica');
  const tileStep = 20;
  const startY   = 25;
  const endY     = limitY || 600;
  const startX   = 25;
  for (let row = 0; ; row++) {
    const rowY = startY + row * tileStep;
    if (rowY > endY) break;
    const lineText = `${watermarkText}  `.repeat(2);
    doc.text(lineText, startX, rowY, { width: pageWidth, lineBreak: false });
  }
  doc.restore();
}

async function drawImageWatermark(doc, imagePath, pageWidth, pageHeight) {
  if (!imagePath || !fs.existsSync(imagePath)) return;
  const wmBuffer = await sharp(imagePath).blur(2).png().toBuffer();
  const wmWidth  = 160;
  const wmHeight = 200;
  const wmX      = ((pageWidth - wmWidth) / 2) + 120;
  const wmY      = (pageHeight - wmHeight) / 2 - 80;
  doc.save();
  doc.opacity(0.32);
  doc.image(wmBuffer, wmX, wmY, { width: wmWidth, height: wmHeight });
  doc.restore();
}

async function generateReceipt(data) {
  const emblemPath = path.join(process.cwd(), 'public', 'Images', STATE_WATERMARK_FILE);

  const now           = moment(data.paymentDate || new Date());
  const printedOn     = now.format('DD-MMM-YYYY hh:mm:ss A').toUpperCase();
  const watermarkText = `${data.registrationNo || 'XX00X0000'} ${now.format('DD-MMM-YYYY hh:mm A')}`;

  const grandTotal      = (data.taxItems || []).reduce((sum, item) => sum + (item.total || 0), 0);
  const grandTotalWords = data.amountInWords || numberToWords(grandTotal);

  const qrUrl    = data.qrUrl || `https://haryanaparivahan.gov.in/verify?receipt=${data.receiptNo}`;
  const qrBuffer = await generateQRCode(qrUrl);

  const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false });
  doc.registerFont('Roboto',      path.join(process.cwd(), 'receipt-generator', 'fonts', 'Roboto-Regular.ttf'));
  doc.registerFont('Roboto-Bold', path.join(process.cwd(), 'receipt-generator', 'fonts', 'Roboto-Bold.ttf'));

  const pageWidth    = 595.28;
  const pageHeight   = 841.89;
  const margin       = 30;
  const contentWidth = pageWidth - margin * 2;

  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  const pdfPromise = new Promise((resolve, reject) => {
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  // =========================================================
  // PAGE 1
  // =========================================================
  doc.addPage();

  await drawImageWatermark(doc, emblemPath, pageWidth, pageHeight);
  drawTextWatermark(doc, watermarkText, pageWidth);

  // ── Printed on (top right) ──
  let y = margin - 10;
  doc.fontSize(11).font('Helvetica').fillColor('#000000');
  doc.text(`Printed on : ${printedOn}`, margin, y, { width: contentWidth, align: 'right' });

  y += 20;

  // ── Emblem (left) ──
  const emblemX = margin + 5;
  const emblemY = y;
  if (fs.existsSync(emblemPath)) {
    const logoX = emblemX + 20;
    const logoY = emblemY + 20;
    const logoW = 80;
    const logoH = 100;
    doc.rect(logoX - 5, logoY - 5, logoW + 10, logoH + 10).fill('#ffffff');
    doc.image(emblemPath, logoX, logoY, { width: logoW, height: logoH });
  } else {
    doc.save();
    doc.circle(emblemX + 35, emblemY + 35, 35).fillAndStroke('#f5f5f5', '#cccccc');
    doc.fontSize(6).fillColor('#999999').font('Helvetica-Bold');
    doc.text('GOVT. OF\nHARYANA', emblemX + 10, emblemY + 28, { width: 50, align: 'center' });
    doc.restore();
  }

  // ── Titles (center) ──
  const titleX     = margin + 55;
  const titleWidth = contentWidth - 160;
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000');
  doc.text('GOVERNMENT OF HARYANA', titleX, y + 55, { width: titleWidth, align: 'center', underline: true });
  doc.fontSize(11).font('Helvetica');
  doc.text('Department of Transport', titleX, y + 73, { width: titleWidth, align: 'center' });
  doc.fontSize(10).font('Helvetica');
  doc.text('Checkpost Tax e-Receipt', titleX, y + 88, { width: titleWidth, align: 'center' });

  // ── QR code (right) ──
  doc.rect(pageWidth - margin - 172, y, 138, 138).fill('#ffffff');
  doc.image(qrBuffer, pageWidth - margin - 172, y, { width: 138, height: 138 });

  y += 88 + 95;  // header height + gap before fields

  // ── Field drawing helper ──
  const labelWidth    = 95;
  const colonWidth    = 8;
  const fieldFontSize = 13.5;
  const col1X         = margin;
  const col2X         = pageWidth / 2 + 10;
  const maxValueWidth = 155;

  function drawField(label, value, x, yPos) {
    doc.fontSize(fieldFontSize).font('Helvetica').fillColor('#000000');
    doc.text(label, x, yPos, { lineBreak: true, width: labelWidth });
    doc.text(':', x + labelWidth, yPos, { lineBreak: false, width: colonWidth });
    doc.text(value || '-', x + labelWidth + colonWidth, yPos, { lineBreak: true, width: maxValueWidth });
  }

  const fh  = 28;   // standard field line height
  const fh2 = fh * 1.5;
  const fh3 = fh * 2;

  drawField('Registration\nNo.',              data.registrationNo           || '-', col1X, y);
  drawField('Receipt No.',                    data.receiptNo                || '-', col2X, y);
  y += fh * 1.6;

  drawField('Payment\nInitialization\nDate',  data.paymentInitDate          || '-', col1X, y);
  drawField('Owner Name.',                    data.ownerName                || '-', col2X, y);
  y += fh3;

  drawField('Chassis No.',                    data.chassisNo                || '-', col1X, y);
  drawField('Tax Mode',                       data.taxMode                  || '-', col2X, y);
  y += fh;

  drawField('Vehicle Type',                   data.vehicleType              || '-', col1X, y);
  drawField('Vehicle Class',                  data.vehicleClass             || '-', col2X, y);
  y += fh;

  drawField('Vehicle\nCategory',              data.vehicleCategory          || '-', col1X, y);
  drawField('Mobile No.',                     data.mobileNo                 || '-', col2X, y);
  y += fh2;

  drawField('CheckPost\nName',                data.checkpostName            || '-', col1X, y);
  drawField('Seating\nCapacity',              String(data.seatingCapacity ?? ''), col2X, y);
  y += fh2;

  drawField('Sleeper Cap',                    String(data.sleeperCap ?? 0), col1X, y);
  drawField('Bank Ref. No.',                  data.bankRefNo                || '-', col2X, y);
  y += fh;

  drawField('Payment\nMode',                  data.paymentMode              || 'ONLINE', col1X, y);
  drawField('Fitness\nValidity',              data.fitnessValidity          || '-', col2X, y);
  y += fh2;

  drawField('Insurance\nValidity',            data.insuranceValidity        || '-', col1X, y);
  drawField('PUCC Validity',                  data.puccValidity             || '-', col2X, y);
  y += fh2;

  drawField('Service Type',                   data.serviceType              || '-', col1X, y);
  drawField('Permit Type',                    data.permitType || 'NOT APPLICABLE', col2X, y);
  y += fh;

  drawField('Payment\nConfirmation\nDate',    data.paymentDateText          || '-', col1X, y);
  y += fh3 + 16;

  // ── Tax table ──
  const col = {
    particular: margin,
    fees:       360,
    fine:       440,
    total:      510,
  };
  const tableStartY   = y;
  const headerHeight  = 30;
  const rowHeight     = 35;
  const borderColor   = '#87CEEB';

  doc.rect(margin - 2, y, contentWidth + 4, headerHeight).lineWidth(0.8).stroke(borderColor);
  doc.fontSize(11.5).font('Helvetica-Bold').fillColor('#000000');
  doc.text('Tax/Fee Particular', col.particular + 4, y + 9, { width: col.fees - col.particular - 10 });
  doc.text('Tax/Fees',           col.fees,            y + 9, { width: 60 });
  doc.text('Fine',               col.fine,            y + 9, { width: 40 });
  doc.text('Total',              col.total,           y + 9, { width: 50 });
  y += headerHeight;

  doc.moveTo(margin - 2, y).lineTo(pageWidth - margin + 2, y).lineWidth(0.5).stroke(borderColor);

  doc.font('Helvetica-Bold').fontSize(11.5).fillColor('#000000');
  for (const item of (data.taxItems || [])) {
    doc.text(String(item.particular),  col.particular + 4, y + 10, { width: col.fees - col.particular - 10 });
    doc.text(String(item.fees  ?? 0),  col.fees,            y + 10, { width: 60 });
    doc.text(String(item.fine  ?? 0),  col.fine,            y + 10, { width: 40 });
    doc.text(String(item.total ?? 0),  col.total,           y + 10, { width: 50 });
    y += rowHeight;
  }

  doc.rect(margin - 2, tableStartY, contentWidth + 4, y - tableStartY).lineWidth(0.8).stroke(borderColor);
  doc.moveTo(col.fees  - 5, tableStartY).lineTo(col.fees  - 5, y).lineWidth(0.5).stroke(borderColor);
  doc.moveTo(col.fine  - 5, tableStartY).lineTo(col.fine  - 5, y).lineWidth(0.5).stroke(borderColor);
  doc.moveTo(col.total - 5, tableStartY).lineTo(col.total - 5, y).lineWidth(0.5).stroke(borderColor);

  y += 15;

  // ── Grand total ──
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000');
  doc.text(`Grand Total : ${grandTotal}/- ${grandTotalWords} Rupees Only`, margin, y);

  // =========================================================
  // PAGE 2
  // =========================================================
  doc.addPage();

  let y2 = margin + 10;

  doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000');
  doc.text('Note :', margin, y2);
  y2 += 16;

  doc.text('Terms and Conditions:', margin, y2);
  y2 += 14;

  for (let i = 0; i < TERMS.length; i++) {
    doc.fontSize(12).font('Helvetica').fillColor('#000000');
    doc.text(`${i + 1}. ${TERMS[i]}`, margin, y2, { width: contentWidth });
    y2 += 20;
  }

  y2 += 20;
  doc.fontSize(15).font('Helvetica-Bold').fillColor('#000000');
  doc.text('Scan the QR code for genuinity of the receipt.', margin, y2);

  doc.end();
  return pdfPromise;
}

module.exports = { generateReceipt };
