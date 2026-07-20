/**
 * Chhattisgarh PDF receipt generator — placeholder cloned from the Maharashtra
 * design; will be replaced by the exact Chhattisgarh receipt code later.
 * Returns a Buffer so it plugs into the existing S3-upload pipeline.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const PDFDocument = require('pdfkit');
const QRCode      = require('qrcode');
const moment      = require('moment');
const fs          = require('fs');
const path        = require('path');
const sharp       = require('sharp');

// -- Image loader (greyscale + blur for watermark) --------------------------
async function loadGreyscaleImage(imagePath) {
  try {
    if (!fs.existsSync(imagePath)) return null;
    return await sharp(imagePath).grayscale().blur(2).png().toBuffer();
  } catch {
    return null;
  }
}

// -- Number -> words (UPPERCASE) -------------------------------------------
function numberToWords(num) {
  const ones = [
    '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE',
    'SIX', 'SEVEN', 'EIGHT', 'NINE',
    'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN',
    'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
    'SEVENTEEN', 'EIGHTEEN', 'NINETEEN',
  ];
  const tens = [
    '', '', 'TWENTY', 'THIRTY', 'FORTY',
    'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY',
  ];
  if (num === 0) return 'ZERO';
  function convert(n) {
    if (n < 20)     return ones[n];
    if (n < 100)    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000)   return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 ? ' AND ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    return convert(Math.floor(n / 100000)) + ' LAKH' + (n % 100000 ? ' ' + convert(n % 100000) : '');
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
  const now = moment(data.paymentDate || new Date());
  // Receipt Printing Date — prefer upstream value; fall back to current time.
  const printedDateTime = data.printedOnDate || now.format('DD-MMM-YYYY hh:mm:ss A').toUpperCase();
  const registrationNo  = data.registrationNo || 'XX00X0000';
  // Watermark uses Payment Init date at HH:MM (no seconds, non-padded hour).
  const initDateHHMM = data.paymentInitDate
    ? String(data.paymentInitDate).replace(
        /^(\d{2}-[A-Za-z]{3}-\d{4})\s+(\d{1,2}):(\d{2}):\d{2}\s+(AM|PM)$/i,
        (_m, d, h, mm, ap) => `${d} ${parseInt(h, 10)}:${mm} ${ap}`)
    : now.format('DD-MMM-YYYY hh:mm A').toUpperCase();
  const watermarkText  = `${registrationNo} / ${initDateHHMM}`;

  const grandTotal      = (data.taxItems || []).reduce((sum, item) => sum + (item.total || 0), 0);
  const grandTotalWords = numberToWords(grandTotal);

  const qrUrl = data.qrUrl ||
    `https://kms.parivahan.gov.in/verify?receipt=${data.receiptNo}`;

  const qrBuffer = await generateQRCode(qrUrl);
  const logoPath = path.join(process.cwd(), 'public', 'Images', 'MMVD_logo.jpg');

  // PDF setup
  const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false,
    info: { Title: 'Checkpost Tax e-Receipt', Author: 'Department of Transport',
            Subject: `Receipt - ${data.receiptNo}` } });

  const fontsDir = path.join(process.cwd(), 'receipt-generator', 'fonts');
  if (fs.existsSync(path.join(fontsDir, 'Roboto-Regular.ttf'))) {
    doc.registerFont('Roboto',      path.join(fontsDir, 'Roboto-Regular.ttf'));
    doc.registerFont('Roboto-Bold', path.join(fontsDir, 'Roboto-Bold.ttf'));
  }

  const pageWidth    = 595.28;
  const pageHeight   = 841.89;   // eslint-disable-line no-unused-vars
  const margin       = 30;
  const contentWidth = pageWidth - margin * 2;

  // Collect chunks -> Buffer
  const chunks     = [];
  const pdfPromise = new Promise((resolve, reject) => {
    doc.on('data',  chunk => chunks.push(chunk));
    doc.on('end',   ()    => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  // PAGE
  doc.addPage();

  // -- Watermark image --------------------------------------------------------
  const wmBuffer = await loadGreyscaleImage(logoPath);
  if (wmBuffer) {
    const wmWidth  = 205;
    const wmHeight = 185;
    const wmX = (pageWidth - wmWidth) / 2 + 5;
    const wmY = ((pageHeight - wmHeight) / 2) - 48;
    doc.save();
    doc.opacity(0.7);
    doc.image(wmBuffer, wmX - 10, wmY - 230, { width: wmWidth, height: wmHeight });
    doc.restore();
  }

  // -- Text watermark (tiled) ------------------------------------------------
  doc.save();
  doc.opacity(0.3);
  doc.fontSize(14).fillColor('#555555').font('Helvetica');
  for (let row = 0; row < 19; row++) {
    const rowY = (row * 20) + 20;
    doc.text(`${watermarkText},  `.repeat(2), 30, rowY, { width: pageWidth, lineBreak: false });
  }
  doc.restore();

  // -- Header ----------------------------------------------------------------
  let y = 15;
  doc.fontSize(9).fillColor('#000000').font('Helvetica-Bold');
  doc.text('Receipt Printing Date :', margin, y);
  doc.text(printedDateTime, margin, y + 11);

  // -- Title block -----------------------------------------------------------
  const titleX     = margin + 80;
  const titleWidth = contentWidth - 170;

  doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000');
  doc.text('GOVERNMENT OF CHHATTISGARH', titleX, y + 2,
    { width: titleWidth, align: 'center', underline: true });

  doc.fontSize(11).font('Helvetica-Bold');
  doc.text('Department of Transport', titleX, y + 13 + 5 + 3,
    { width: titleWidth, align: 'center' });

  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('Checkpost Tax e-Receipt', titleX, y + 27 + 5 + 5 + 2,
    { width: titleWidth, align: 'center' });

  // -- QR code ---------------------------------------------------------------
  doc.image(qrBuffer, pageWidth - margin - 105, y, { width: 110, height: 110 });

  y += 48;

  // -- Field system ----------------------------------------------------------
  const col1X         = margin;
  const col2X         = pageWidth / 2;
  const fieldFontSize = 9.5;
  const fieldLineHeight = 23;
  const labelWidth    = 80;
  const colonWidth    = 10;

  function drawField(label, value, x, yPos) {
    const maxValueWidth = 160;
    doc.fontSize(fieldFontSize).font('Helvetica').fillColor('#000000');
    doc.text(label, x, yPos, { lineBreak: false, width: labelWidth });
    doc.text(':', x + labelWidth, yPos, { lineBreak: false, width: colonWidth });
    doc.text(value || '-', x + labelWidth + colonWidth, yPos, { lineBreak: true, width: maxValueWidth });
  }

  // Row 1 -- Registration No. (bold value)
  doc.fontSize(fieldFontSize).font('Helvetica').fillColor('#000000');
  doc.text('Registration No.', col1X, y, { lineBreak: false, width: labelWidth });
  doc.text(':', col1X + labelWidth, y, { lineBreak: false, width: colonWidth });
  doc.font('Helvetica-Bold');
  doc.text(data.registrationNo || '-', col1X + labelWidth + colonWidth, y, { lineBreak: false });
  y += fieldLineHeight;

  // Row 2
  drawField('Receipt No.',  data.receiptNo  || '-', col1X, y);
  y += fieldLineHeight;

  // Row 3
  drawField('Payment Init Date', initDateHHMM || '-', col1X, y);
  y += fieldLineHeight;

  // Row 4
  drawField('Owner Name', data.ownerName || '-', col1X, y);
  y += fieldLineHeight;

  // Row 5 - two columns
  const row5Y = y;
  drawField('Chassis No.', data.chassisNo || '-', col1X, row5Y);
  drawField('Tax Mode',    data.taxMode   || '-', col2X, row5Y);
  y += fieldLineHeight;

  // Row 6 - two columns
  const row6Y = y;
  drawField('Vehicle Type',  data.vehicleType  || '-', col1X, row6Y);
  drawField('Vehicle Class', data.vehicleClass || '-', col2X, row6Y);
  y += fieldLineHeight;

  // Row 7 - two columns
  const row7Y = y;
  drawField('Mobile No.',     data.mobileNo     || '-', col1X, row7Y);
  drawField('Checkpost Name', data.checkpostName || '-', col2X, row7Y);
  y += fieldLineHeight * 1.4;

  // Row 8 - MH-specific: Unladen Weight | Laden Weight
  const row8Y = y;
  drawField(data.cap2Label || 'Unladen Weight', String(data.cap2Value !== undefined ? data.cap2Value : (data.unladenWeight || '-')), col1X, row8Y);
  drawField(data.cap1Label || 'Laden Weight',   String(data.cap1Value !== undefined ? data.cap1Value : (data.ladenWeight   || '-')), col2X, row8Y);
  y += fieldLineHeight;

  // Row 9 - two columns
  const row9Y = y;
  drawField('Bank Ref. No.', data.bankRefNo  || '-',     col1X, row9Y);
  drawField('Payment Mode',  data.paymentMode || 'ONLINE', col2X, row9Y);
  y += fieldLineHeight;

  // Row 10
  drawField('Service Type', data.serviceType || 'NOT APPLICABLE', col1X, y);
  y += fieldLineHeight;

  // Row 11 - two columns
  const row11Y = y;
  drawField('Permit Type',     data.permitType     || '-', col1X, row11Y);
  drawField('Permit Category', data.permitCategory || '-', col2X, row11Y);
  y += fieldLineHeight * 1.5;

  // -- Tax table -------------------------------------------------------------
  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).lineWidth(0.5).stroke('#000000');
  y += 4;

  const col = { particular: margin, fees: 350, fine: 440, total: 510 };

  doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
  doc.text('Particular', col.particular, y);
  doc.text('Fees/Tax',   col.fees,       y);
  doc.text('Fine',       col.fine,       y);
  doc.text('Total',      col.total,      y);
  y += 10;

  // White rectangle behind the whole row area so the tiled watermark is
  // fully hidden under every row, not just the header. Drawn BEFORE the
  // separator line below so the line paints on top of the fill instead of
  // being erased by it.
  const taxItems = data.taxItems || [];
  doc.save();
  doc.fillColor('#ffffff');
  doc.rect(margin, y, contentWidth, (taxItems.length * 12) + 5).fill();
  doc.restore();

  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).lineWidth(0.5).stroke('#000000');

  y += 5;

  doc.font('Helvetica').fontSize(9).fillColor('#000000');
  taxItems.forEach((item, index) => {
    doc.text(item.particular, col.particular, y, { width: col.fees - col.particular - 10 });
    doc.text(String(item.fees  ?? 0), col.fees,  y);
    doc.text(String(item.fine  ?? 0), col.fine,  y);
    doc.text(String(item.total ?? 0), col.total, y);
    y += 12;

    // Separator only between rows — not after the last one.
    if (index < taxItems.length - 1) {
      doc.moveTo(margin, y - 3).lineTo(pageWidth - margin, y - 3).lineWidth(0.5).stroke('#000000');
    }
  });

  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).lineWidth(0.5).stroke('#000000');
  y += 18;

  // -- Grand total -----------------------------------------------------------
  doc.fontSize(9).font('Roboto-Bold');
  doc.text(`Grand Total : Rs. ${grandTotal}  ( ${grandTotalWords} ONLY/-)`, margin, y);
  y += 13;

  // -- Notes -----------------------------------------------------------------
  doc.fontSize(9).font('Helvetica-Oblique').fillColor('#000000');
  const notes = data.notes || [
    'This is a computer generated printout and no signature is required.',
    'Incorrect mentioning of vehicle class or seating capacity may lead to tax evasion and defaulter shall be liable for penal action',
  ];
  doc.text('Note :', margin, y, { continued: true });
  doc.text(` 1) ${notes[0]}`, { font: 'Helvetica-Oblique' });
  if (notes[1]) doc.text(`2) ${notes[1]}`, margin, y + 11);
  y += 40;

  // -- Confirmation note -----------------------------------------------------
  doc.fontSize(9.5).font('Helvetica-Oblique');
  doc.text('You will also receive the payment confirmation message.', margin, y);
  y += 21;

  // -- QR note ---------------------------------------------------------------
  doc.font('Helvetica-Bold').fontSize(13).fillColor('#000000');
  doc.text('Scan the QR code for genuinity of the receipt, It should land at ', margin, y, { continued: true });
  doc.font('Helvetica').fillColor('#060606').text('https://kms.parivahan.gov.in', { underline: true, continued: true });
  doc.font('Helvetica-Bold').fillColor('#000000')
     .text(' site. In case the URL is different, then receipt could be a fake one, please raise a complain', { underline: false });

  doc.end();
  return pdfPromise;
}

module.exports = { generateReceipt };
