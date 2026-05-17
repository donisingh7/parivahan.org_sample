/**
 * Punjab PDF receipt generator. Each state has its own copy of this file
 * under src/lib/states/<state>/generateReceipt.js so the per-state design is
 * editable in isolation.
 *
 * The layout mirrors GOVERNMENT OF PUNJAB's Checkpost Tax e-Receipt:
 *   • Watermark = PB transport emblem (tiled "<RegNo> <Date>" overlay).
 *   • Header = emblem on the left, gov/dept/receipt headings centre, QR
 *     on the right with "Printed on : …" above it.
 *   • Two-column field grid (10 rows, no fitness/insurance/PUCC fields).
 *   • Three-row tax table — MV Tax, Civic Infra Cess, Service/User Charge.
 *   • Notes & Terms-and-Conditions tied to the Punjab inspect HTML.
 *
 * CommonJS `require()` is intentional here — pdfkit, sharp, qrcode and moment
 * are all CJS-only and this file runs in the Node receipt-generator context.
 */
/* eslint-disable @typescript-eslint/no-require-imports */

const PDFDocument = require('pdfkit');
const QRCode      = require('qrcode');
const moment      = require('moment');
const path        = require('path');
const sharp       = require('sharp');
const fs          = require('fs');

// State-specific constants — duplicated per state so designs can diverge.
const STATE_GOV_LABEL      = 'GOVERNMENT OF PUNJAB';
const STATE_DEPT_LABEL     = 'Department of Transport';
const STATE_RECEIPT_TITLE  = 'Checkpost Tax e-Receipt';
const STATE_WATERMARK_FILE = 'Punjab-Transport-Department.png';

// Greyscale + blur the watermark image. Returns null if the file is
// missing so the PDF still renders without the watermark (useful while
// the user is still sourcing the Punjab emblem image).
async function loadGreyscaleImage(imagePath) {
  try {
    if (!fs.existsSync(imagePath)) return null;
    return await sharp(imagePath).grayscale().png().blur(2).toBuffer();
  } catch {
    return null;
  }
}

function numberToWords(num) {
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
    'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
    'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  if (num === 0) return 'ZERO';

  function convert(n) {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 ? ' AND ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    return convert(Math.floor(n / 100000)) + ' LAKH' + (n % 100000 ? ' ' + convert(n % 100000) : '');
  }

  return convert(num);
}

async function generateQRCode(text) {
  const dataUrl = await QRCode.toDataURL(text, {
    width: 120,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
  });
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  return Buffer.from(base64, 'base64');
}

/**
 * Generates a Punjab checkpost tax receipt PDF and returns it as a Buffer.
 * @param {Object} data - Booking/payment data produced by buildPunjabReceiptData.
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateReceipt(data) {
  const now            = moment(data.paymentDate || new Date());
  const formattedDate  = now.format('DD-MMM-YYYY hh:mm A').toUpperCase();
  const registrationNo = data.registrationNo || 'XX00X0000';
  const watermarkText  = `${registrationNo} ${formattedDate}`;

  const grandTotal       = (data.taxItems || []).reduce((sum, item) => sum + (item.total || 0), 0);
  const grandTotalWords  = data.amountInWords || numberToWords(grandTotal);

  const qrUrl    = data.qrUrl || `https://kms.parivahan.gov.in/verify?receipt=${data.receiptNo}`;
  const qrBuffer = await generateQRCode(qrUrl);

  const doc = new PDFDocument({
    size: 'A4',
    margin: 0,
    info: {
      Title:   STATE_RECEIPT_TITLE,
      Author:  STATE_DEPT_LABEL,
      Subject: `Receipt - ${data.receiptNo}`,
    },
  });
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

  // ===== 1. WATERMARK ====================================================
  const imagePath = path.join(process.cwd(), 'public', 'Images', STATE_WATERMARK_FILE);
  const wmBuffer  = await loadGreyscaleImage(imagePath);

  if (wmBuffer) {
    const wmWidth  = 220;
    const wmHeight = 280;
    const wmX      = (pageWidth - wmWidth) / 2;
    const wmY      = (pageHeight - wmHeight) / 2;

    doc.save();
    doc.opacity(0.7);
    doc.image(wmBuffer, wmX - 10, wmY - 230, { width: wmWidth, height: wmHeight });
    doc.restore();
  }

  // Tiled text watermark — "<RegNo> <Date>" repeated across the page.
  doc.save();
  doc.opacity(0.5);
  doc.fontSize(15).fillColor('#cccccc').font('Helvetica');
  const tileRows = 22;
  const tileStep = 20;
  for (let row = 0; row < tileRows; row++) {
    const rowY = (row * tileStep) + 20;
    const lineText = `${watermarkText},  `.repeat(2);
    doc.text(lineText, 30, rowY, { width: pageWidth, lineBreak: false });
  }
  doc.restore();

  // ===== 2. HEADER =======================================================
  let y = 15;

  doc.fontSize(11).fillColor('#000000').font('Helvetica-Bold');
  doc.text('Printed on :', margin + 305, y, { lineBreak: false });
  doc.font('Helvetica-Bold').text(formattedDate, margin + 305, y + 13, { lineBreak: false });

  const titleX = margin + 80;
  const titleWidth = contentWidth - 170;

  doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000');
  doc.text(STATE_GOV_LABEL, titleX, y, { width: titleWidth, align: 'center', underline: true });

  doc.fontSize(13).font('Helvetica-Bold');
  doc.text(STATE_DEPT_LABEL, titleX, y + 16, { width: titleWidth, align: 'center' });

  doc.fontSize(12).font('Helvetica-Bold');
  doc.text(STATE_RECEIPT_TITLE, titleX, y + 32, { width: titleWidth, align: 'center' });

  // QR code below the "Printed on" line, right side
  doc.image(qrBuffer, pageWidth - margin - 110, y + 32, { width: 95, height: 95 });

  y += 70;

  // ===== 3. FIELDS (two-column layout) ===================================
  const col1X      = margin;
  const col2X      = pageWidth / 2 + 15;
  const fieldFont  = 9.5;
  const lineHeight = 22;
  const labelWidth = 95;
  const colonWidth = 8;
  const maxValueW  = 165;

  function drawField(label, value, x, yPos, bold = false) {
    doc.fontSize(fieldFont).font('Helvetica-Bold').fillColor('#000000');
    doc.text(label, x, yPos, { lineBreak: false, width: labelWidth });

    doc.font('Helvetica').text(':', x + labelWidth, yPos, { lineBreak: false, width: colonWidth });

    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica');
    doc.text(value || '-', x + labelWidth + colonWidth + 2, yPos, {
      lineBreak: true,
      width: maxValueW,
    });
  }

  // Punjab field grid — 10 rows, mirroring the inspect HTML.
  drawField('Registration No.', data.registrationNo || '-', col1X, y, true);
  drawField('Receipt No.',      data.receiptNo      || '-', col2X, y);
  y += lineHeight;

  drawField('Payment Initialization Date', data.paymentInitDate || formattedDate, col1X, y);
  drawField('Owner Name',                  data.ownerName       || '-',           col2X, y);
  y += lineHeight;

  drawField('Chassis No.', data.chassisNo || '-', col1X, y);
  drawField('Tax Mode',    data.taxMode   || '-', col2X, y);
  y += lineHeight;

  drawField('Vehicle Type',  data.vehicleType  || '-', col1X, y);
  drawField('Vehicle Class', data.vehicleClass || '-', col2X, y);
  y += lineHeight;

  drawField('Vehicle Category', data.vehicleCategory || '-', col1X, y);
  drawField('Mobile No.',       data.mobileNo        || '-', col2X, y);
  y += lineHeight;

  drawField('Checkpost Name',   data.checkpostName    || '-', col1X, y);
  drawField('Seating Capacity', String(data.seatingCapacity ?? 0), col2X, y);
  y += lineHeight;

  drawField('Sleeper Cap.',  String(data.sleeperCap ?? 0), col1X, y);
  drawField('Bank Ref. No.', data.bankRefNo || '-',        col2X, y);
  y += lineHeight;

  drawField('Payment Mode',     data.paymentMode || 'ONLINE', col1X, y);
  drawField('Permit Validity',  '',                           col2X, y);
  y += lineHeight;

  drawField('Service Type', data.serviceType || 'NOT APPLICABLE', col1X, y);
  drawField('Permit Type',  data.permitType  || '',               col2X, y);
  y += lineHeight;

  drawField('Payment Confirmation Date', formattedDate, col1X, y);
  y += lineHeight * 1.5;

  // ===== 4. TAX TABLE ====================================================
  // Header row with light blue borders matching the inspect HTML.
  const tableLeft  = margin;
  const tableRight = pageWidth - margin;
  const tableWidth = tableRight - tableLeft;
  const colP = { particular: tableLeft, fees: tableLeft + tableWidth * 0.60, fine: tableLeft + tableWidth * 0.75, total: tableLeft + tableWidth * 0.88 };
  const headBottom = y + 24;

  doc.save();
  doc.lineWidth(0.7).strokeColor('#A6C3E0');
  doc.rect(tableLeft, y, tableWidth, 24).stroke();
  doc.moveTo(colP.fees,  y).lineTo(colP.fees,  headBottom).stroke();
  doc.moveTo(colP.fine,  y).lineTo(colP.fine,  headBottom).stroke();
  doc.moveTo(colP.total, y).lineTo(colP.total, headBottom).stroke();
  doc.restore();

  doc.fontSize(10).font('Helvetica-Bold').fillColor('#000');
  doc.text('Tax/Fee Particular', colP.particular + 8, y + 7, { width: colP.fees - colP.particular - 16 });
  doc.text('Tax/Fees', colP.fees + 6,  y + 7, { width: colP.fine  - colP.fees  - 12, align: 'center' });
  doc.text('Fine',     colP.fine + 6,  y + 7, { width: colP.total - colP.fine  - 12, align: 'center' });
  doc.text('Total',    colP.total + 6, y + 7, { width: tableRight - colP.total - 12, align: 'center' });
  y = headBottom;

  // Body rows — Punjab has 3: MV Tax, Civic Infra Cess, Service/User Charge.
  const taxItems = data.taxItems || [];
  doc.font('Helvetica').fontSize(10);
  for (const item of taxItems) {
    const rowHeight = 28;
    doc.save();
    doc.lineWidth(0.7).strokeColor('#A6C3E0');
    doc.rect(tableLeft, y, tableWidth, rowHeight).stroke();
    doc.moveTo(colP.fees,  y).lineTo(colP.fees,  y + rowHeight).stroke();
    doc.moveTo(colP.fine,  y).lineTo(colP.fine,  y + rowHeight).stroke();
    doc.moveTo(colP.total, y).lineTo(colP.total, y + rowHeight).stroke();
    doc.restore();

    doc.fontSize(10).fillColor('#000');
    doc.text(String(item.particular), colP.particular + 8, y + 8, { width: colP.fees - colP.particular - 16 });
    doc.text(String(item.fees ?? 0), colP.fees + 6,  y + 8, { width: colP.fine  - colP.fees  - 12, align: 'center' });
    doc.text(String(item.fine ?? 0), colP.fine + 6,  y + 8, { width: colP.total - colP.fine  - 12, align: 'center' });
    doc.text(String(item.total ?? 0), colP.total + 6, y + 8, { width: tableRight - colP.total - 12, align: 'center' });
    y += rowHeight;
  }

  y += 14;

  // ===== 5. GRAND TOTAL + NOTES =========================================
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#000');
  doc.text(`Grand Total :  Rs. ${grandTotal}/-  ${grandTotalWords}   Rupees Only`, margin, y);
  y += 22;

  doc.fontSize(11).font('Helvetica-Bold');
  doc.text('Note:', margin, y);
  y += 18;

  doc.font('Helvetica-Bold').text('Terms and Conditions:', margin, y);
  y += 16;

  doc.font('Helvetica').fontSize(10.5);
  doc.text('1. This is a computer generated printout and no signature is required.', margin, y);
  y += 14;
  doc.text('2. Should not carry unlawful/unaccompanied goods.', margin, y);
  y += 14;
  doc.text(
    '3. If any false information/discrepancies are found at later, necessary action will be taken against the vehicle owner/driver.',
    margin,
    y,
    { width: contentWidth }
  );
  y += 30;

  doc.fontSize(14).font('Helvetica-Bold').fillColor('#000');
  doc.text('Scan the QR code for genuinity of the receipt.', margin, y);

  // ===== 6. FINALIZE ====================================================
  doc.end();
  return pdfPromise;
}

module.exports = { generateReceipt };
