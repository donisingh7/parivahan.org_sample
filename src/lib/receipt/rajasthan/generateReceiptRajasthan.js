const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const moment = require('moment');
const path = require('path');
const sharp = require('sharp');

// Converts webp → greyscale PNG buffer (for watermark)
async function loadGreyscaleImage(imagePath) {
  const buffer = await sharp(imagePath)
    .grayscale()          // ← makes it black & white
    .png()
    .blur(2)         // ← converts webp to PNG (PDFKit needs this)
    .toBuffer();
  return buffer;
}

/**
 * Converts a number to words (Indian numbering system)
 */
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

/**
 * Generates a QR code as a base64 PNG buffer
 */
async function generateQRCode(text) {
  const dataUrl = await QRCode.toDataURL(text, {
    width: 120,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' }
  });
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  return Buffer.from(base64, 'base64');
}

/**
 * Generates a Rajasthan checkpost tax receipt PDF and returns it as a Buffer.
 * @param {Object} data - Booking/payment data
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateReceiptRajasthan(data) {
  // --- Defaults & computed fields ---
  const now = moment(data.paymentDate || new Date());
  const formattedDate = now.format('DD-MMM-YYYY hh:mm A').toUpperCase();
  const registrationNo = data.registrationNo || 'XX00X0000';
  const watermarkText = `${registrationNo} / ${formattedDate}`;

  const grandTotal = (data.taxItems || []).reduce((sum, item) => sum + item.total, 0);
  const grandTotalWords = numberToWords(grandTotal);

  // QR code pointing to verification URL
  const qrUrl = data.qrUrl || `https://kms.parivahan.gov.in/verify?receipt=${data.receiptNo}`;
  const qrBuffer = await generateQRCode(qrUrl);

  // --- PDF Setup ---
  const doc = new PDFDocument({
    size: 'A4',
    margin: 0,
    info: {
      Title: 'Checkpost Tax e-Receipt',
      Author: 'Department of Transport',
      Subject: `Receipt - ${data.receiptNo}`
    }
  });
  doc.registerFont('Roboto',      path.join(process.cwd(), 'receipt-generator', 'fonts', 'Roboto-Regular.ttf'));
  doc.registerFont('Roboto-Bold', path.join(process.cwd(), 'receipt-generator', 'fonts', 'Roboto-Bold.ttf'));

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 30;
  const contentWidth = pageWidth - margin * 2;

  // Collect output into a Buffer (no temp file needed)
  const chunks = [];
  doc.on('data', chunk => chunks.push(chunk));
  const pdfPromise = new Promise((resolve, reject) => {
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  // =====================================================
  // 1. IMAGE WATERMARK
  // =====================================================
  const imagePath = path.join(process.cwd(), 'public', 'Images', 'Rajasthan-Transport-Department.png');
  const wmBuffer = await loadGreyscaleImage(imagePath);

  const wmWidth = 220;   // ← CHANGE THIS to make image bigger/smaller
  const wmHeight = 280;  // ← CHANGE THIS to make image bigger/smaller

  // Center of page
  const wmX = (pageWidth - wmWidth) / 2;
  const wmY = (pageHeight - wmHeight) / 2;

  doc.save();
  doc.opacity(0.7);   // ← CHANGE THIS — lower = more faint (0.05 to 0.15 recommended)
  doc.image(wmBuffer, wmX-10, wmY - 230, {   // ← minus 230 shifts it UP
    width: wmWidth,
    height: wmHeight,
  });
  doc.restore();

  doc.save();
  doc.opacity(0.5);
  doc.fontSize(15).fillColor('#cccccc').font('Helvetica');

  const tileRows = 22;
  const tileStep = 20;
  for (let row = 0; row < tileRows; row++) {
    const rowY = (row * tileStep)+20;
    const lineText = `${watermarkText},  `.repeat(2);
    doc.text(lineText, 30, rowY, { width: pageWidth, lineBreak: false });
  }
  doc.restore();

  // =====================================================
  // 2. HEADER SECTION
  // =====================================================
  let y = 15;

  // Receipt Printing Date (top left)
  doc.fontSize(10).fillColor('#000000').font('Helvetica');
  doc.text('Receipt Printing Date :', margin, y);
  doc.text(formattedDate, margin, y + 11);

  // --- Title Block (center) ---
  const titleX = margin + 80;
  const titleWidth = contentWidth - 170;

  doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000');
  doc.text('GOVERNMENT OF RAJASTHAN', titleX, y, { width: titleWidth, align: 'center', underline: true });

  doc.fontSize(14).font('Helvetica');
  doc.text('Department of Transport', titleX, y + 13, { width: titleWidth, align: 'center' });

  doc.fontSize(12).font('Helvetica');
  doc.text('Checkpost Tax e-Receipt', titleX, y + 27, { width: titleWidth, align: 'center' });

  // --- QR Code (top right) ---
  doc.image(qrBuffer, pageWidth - margin - 85, y, { width: 80, height: 80 });

  y += 48;

  // =====================================================
  // 4. FIELDS (two-column layout)
  // =====================================================
  const col1X = margin;
  const col2X = pageWidth / 2 + 35;
  const colWidth = contentWidth / 2 - 10;  // eslint-disable-line no-unused-vars
  const fieldFontSize = 9.5;
  const fieldLineHeight = 25;
  const labelWidth = 80;  // ← sabke liye fixed, sirf yahi badlo alignment ke liye
  const colonWidth = 10;  // ← colon ki fixed width

  function drawField(label, value, x, yPos) {
    const maxValueWidth = 160;
    // Label
    doc.fontSize(fieldFontSize).font('Helvetica').fillColor('#000000');
    doc.text(label, x, yPos, { lineBreak: false, width: labelWidth });

    // Colon
    doc.fontSize(fieldFontSize).font('Helvetica').fillColor('#000000');
    doc.text(':', x + labelWidth, yPos, { lineBreak: false, width: colonWidth });

    // Value — wrap hoga agar zyada lamba ho
    doc.fontSize(fieldFontSize).font('Helvetica').fillColor('#000000');
    doc.text(value || '-', x + labelWidth + colonWidth, yPos, {
      lineBreak: true,          // ← nayi line use karega agar text lamba ho
      width: maxValueWidth,     // ← itni width ke baad wrap hoga
    });
  }

  // Row 1
  doc.fontSize(fieldFontSize).font('Helvetica').fillColor('#000000');
  doc.text('Registration No.', col1X, y, { lineBreak: false, width: labelWidth });
  doc.text(':', col1X + labelWidth, y, { lineBreak: false, width: colonWidth });
  doc.font('Helvetica-Bold');
  doc.text(data.registrationNo || '-', col1X + labelWidth + colonWidth, y, { lineBreak: false });
  y += fieldLineHeight;

  // Row 2
  drawField('Receipt No.', data.receiptNo || '-', col1X, y);
  y += fieldLineHeight;

  // Row 3
  drawField('Payment Date', formattedDate, col1X, y);
  y += fieldLineHeight;

  // Row 4
  drawField('Owner Name', data.ownerName || '-', col1X, y);
  y += fieldLineHeight;

  // Row 5 - two columns
  const row5Y = y;
  drawField('Chassis No.', data.chassisNo || '-', col1X, row5Y);
  drawField('Tax Mode', data.taxMode || '-', col2X, row5Y);
  y += fieldLineHeight;

  // Row 6
  const row6Y = y;
  drawField('Vehicle Type', data.vehicleType || '-', col1X, row6Y);
  drawField('Vehicle Class', data.vehicleClass || '-', col2X, row6Y);
  y += fieldLineHeight;

  // Row 7
  const row7Y = y;
  drawField('Mobile No.', data.mobileNo || '-', col1X, row7Y);
  drawField('Checkpost Name', data.checkpostName || '-', col2X, row7Y);
  y += fieldLineHeight * 1.4;

  // Row 8
  const row8Y = y;
  drawField('Sleeper Cap.', String(data.sleeperCap ?? 0), col1X, row8Y);
  drawField('Seating Capacity', String(data.seatingCapacity ?? 0), col2X, row8Y);
  y += fieldLineHeight;

  // Row 9
  const row9Y = y;
  drawField('Bank Ref. No.', data.bankRefNo || '-', col1X, row9Y);
  drawField('Payment Mode', data.paymentMode || 'ONLINE', col2X, row9Y);
  y += fieldLineHeight;

  // Row 10
  drawField('Service Type', data.serviceType || 'NOT APPLICABLE', col1X, y);
  y += fieldLineHeight;

  // Row 11
  const row11Y = y;
  drawField('Permit Type', data.permitType || 'NOT APPLICABLE', col1X, row11Y);
  drawField('Permit Category', data.permitCategory || '-', col2X, row11Y);
  y += fieldLineHeight;

  // Row 12 - Payment Confirmation Date
  drawField('Payment Confirmation Date', formattedDate, col1X, y);
  y += fieldLineHeight * 1.5;

  // =====================================================
  // 5. TAX TABLE
  // =====================================================
  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).lineWidth(1).stroke('#000000');
  y += 4;

  // Table header
  const col = {
    particular: margin,
    fees: 350,
    fine: 440,
    total: 510,
  };

  doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#000000');
  doc.text('Particular', col.particular, y);
  doc.text('Fees/Tax', col.fees, y);
  doc.text('Fine', col.fine, y);
  doc.text('Total', col.total, y);
  y += 13;

  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).lineWidth(0.5).stroke('#000000');
  y += 5;

  // Table rows
  doc.font('Helvetica').fontSize(10.5);
  const taxItems = data.taxItems || [];
  for (const item of taxItems) {
    doc.text(item.particular, col.particular, y, { width: col.fees - col.particular - 10 });
    doc.text(String(item.fees ?? 0), col.fees, y);    // ← same col.fees
    doc.text(String(item.fine ?? 0), col.fine, y);    // ← same col.fine
    doc.text(String(item.total ?? 0), col.total, y);  // ← same col.total
    y += 14;
  }

  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).lineWidth(0.5).stroke('#000000');
  y += 18;

  // Grand Total
  doc.fontSize(9).font('Roboto-Bold');
  doc.text(
    `Grand Total : ₹ ${grandTotal}  ( ${grandTotalWords} ONLY/-)`,
    margin, y
  );
  y += 18;

  // =====================================================
  // 6. NOTES
  // =====================================================
  doc.fontSize(10.5).font('Helvetica-Oblique').fillColor('#000000');
  const notes = data.notes || [
    'This is a computer generated printout and no signature is required.',
    'Incorrect mentioning of vehicle class or seating capacity may lead to tax evasion and defaulter shall be liable for penal action'
  ];
  doc.text('Note :', margin, y, { continued: true });
  doc.text(` 1) ${notes[0]}`, { font: 'Helvetica-Oblique' });
  if (notes[1]) {
    doc.text(`2) ${notes[1]}`, margin, y + 11);
  }
  y += 50;

  doc.fontSize(10.5).font('Helvetica-Oblique');
  doc.text('You will also receive the payment confirmation message.', margin, y);
  y += 26;

  // QR verification note
  doc.font('Helvetica').fontSize(10.5).fillColor('#000000');
  doc.text(
    'Scan the QR code for genuinity of the receipt, It should land at ',
    margin, y, { continued: true }
  );
  doc.fillColor('#0000EE').text('https://kms.parivahan.gov.in', { continued: true });
  doc.fillColor('#000000');
  doc.text(
    ' site. In case the URL is different, then receipt could be a fake one, please raise a complain'
  );

  // =====================================================
  // 7. FINALIZE
  // =====================================================
  doc.end();
  return pdfPromise;
}

module.exports = { generateReceiptRajasthan };