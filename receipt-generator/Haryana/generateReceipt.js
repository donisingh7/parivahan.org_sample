const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Converts image → greyscale PNG buffer (for watermark)
async function loadGreyscaleImage(imagePath) {
  const buffer = await sharp(imagePath)
    .grayscale()
    .blur(2)
    .png()
    .toBuffer();
  return buffer;
}

// Number to words (Indian system)
function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  function convert(n) {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
  }

  return convert(num);
}

// Generate QR code buffer
async function generateQRCode(text) {
  const dataUrl = await QRCode.toDataURL(text, {
    width: 120,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' }
  });
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  return Buffer.from(base64, 'base64');
}

// Draw tiled text watermark up to a Y limit
function drawTextWatermark(doc, watermarkText, pageWidth, limitY) {
  doc.save();
  doc.opacity(0.5);
  doc.fontSize(16).fillColor('#aaaaaa').font('Helvetica');

  const tileStep = 20;
  const startY = 25;    // ← page ke upar se kitna niche se shuru ho
  const endY = 600;      // ← yahan tak aana chahiye, niche nahi
  const startX = 25; 

  for (let row = 0; ; row++) {
    const rowY = startY + row * tileStep;
    if (rowY > endY) break;
    const lineText = `${watermarkText}  `.repeat(2);
    doc.text(lineText, startX, rowY, { width: pageWidth, lineBreak: false });
  }

  doc.restore();
}

// Draw image watermark (center of page)
async function drawImageWatermark(doc, imagePath, pageWidth, pageHeight) {
  if (!imagePath || !fs.existsSync(imagePath)) return;

  const wmBuffer = await sharp(imagePath).blur(2).png().toBuffer();
  const wmWidth = 160;
  const wmHeight = 200;
  const wmX = ((pageWidth - wmWidth) / 2 ) + 120;
  const wmY = (pageHeight - wmHeight) / 2 - 80;

  doc.save();
  doc.opacity(0.32);
  doc.image(wmBuffer, wmX, wmY, { width: wmWidth, height: wmHeight });
  doc.restore();
}

/**
 * Main receipt generator
 * @param {Object} data - Booking/payment data
 * @param {string} outputPath - Where to save the PDF
 */
async function generateReceipt(data, outputPath) {
  const now = moment(data.paymentDate || new Date());
  const printedOn = now.format('DD-MMM-YYYY hh:mm:ss A').toUpperCase();
  const registrationNo = data.registrationNo || 'XX00X0000';
  const watermarkText = `${registrationNo} ${now.format('DD-MMM-YYYY hh:mm A')}`;

  const grandTotal = (data.taxItems || []).reduce((sum, item) => sum + item.total, 0);
  const grandTotalWords = numberToWords(grandTotal);

  const qrUrl = data.qrUrl || `https://haryanaparivahan.gov.in/verify?receipt=${data.receiptNo}`;
  const qrBuffer = await generateQRCode(qrUrl);

  // PDF Setup
  const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false });
  doc.registerFont('Roboto', './fonts/Roboto-Regular.ttf');
  doc.registerFont('Roboto-Bold', './fonts/Roboto-Bold.ttf');

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 30;
  const contentWidth = pageWidth - margin * 2;

  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // =========================================================
  // PAGE 1
  // =========================================================
  doc.addPage();

  // --- Image watermark ---
  await drawImageWatermark(doc, data.emblemImagePath, pageWidth, pageHeight);

  // --- Text watermark (only up to tax table end, set after table) ---
  // We'll draw it after we know the tableEndY
  // For now store a reference — we draw it FIRST in z-order by drawing before content

  // We draw watermark first (behind everything)
  // Text watermark placeholder — drawn after table so we know the Y limit
  // SOLUTION: draw watermark covering full page first, content on top
  drawTextWatermark(doc, watermarkText, pageWidth, pageHeight * 0.85);

  // =====================================================
  // HEADER
  // =====================================================
  let y = margin - 10;

  // Printed on (top right)
  doc.fontSize(11).font('Helvetica').fillColor('#000000');
  doc.text(`Printed on : ${printedOn}`, margin, y, { width: contentWidth, align: 'right' });

  y += 20;

  // Haryana emblem (left side) — circle placeholder
  const emblemX = margin + 5;
  const emblemY = y;
  if (data.emblemImagePath && fs.existsSync(data.emblemImagePath)) {
    // White background pehle (watermark cover karne ke liye)
    const logoX = emblemX + 20;   // ← right shift karo
    const logoY = emblemY + 20;   // ← niche karo
    const logoW = 80;            // ← width badao
    const logoH = 100;            // ← height badao

    doc.rect(logoX - 5, logoY - 5, logoW + 10, logoH + 10)
       .fill('#ffffff');          // ← white rectangle watermark cover karega

    doc.image(data.emblemImagePath, logoX, logoY, { width: logoW, height: logoH }); 
  } else {
    // Placeholder circle
    doc.save();
    doc.circle(emblemX + 35, emblemY + 35, 35).fillAndStroke('#f5f5f5', '#cccccc');
    doc.fontSize(6).fillColor('#999999').font('Helvetica-Bold');
    doc.text('GOVT. OF\nHARYANA', emblemX + 10, emblemY + 28, { width: 50, align: 'center' });
    doc.restore();
  }

  // Title block (center)
  const titleX = margin + 55;
  const titleWidth = contentWidth - 160;

  doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000');
  doc.text('GOVERNMENT OF HARYANA', titleX, y + 55, { width: titleWidth, align: 'center', underline: true });

  doc.fontSize(11).font('Helvetica');
  doc.text('Department of Transport', titleX, y + 73, { width: titleWidth, align: 'center' });

  doc.fontSize(10).font('Helvetica');
  doc.text('Checkpost Tax e-Receipt', titleX, y + 88, { width: titleWidth, align: 'center' });

  // QR Code (top right)
  doc.rect(pageWidth - margin - 172, y, 138, 138)
   .fill('#ffffff');
  doc.image(qrBuffer, pageWidth - margin - 172, y, { width: 138, height: 138 });

  y += 88;

  // =====================================================
  // FIELDS — two column layout with border box
  // =====================================================
  const labelWidth = 95;
  const colonWidth = 8;
  const fieldFontSize = 13.5;
  const fieldLineHeight = 28;
  const col1X = margin;
  const col2X = pageWidth / 2 + 10;
  const maxValueWidth = 155;

  // Draw outer border box around fields
  y+=95;
  const fieldsStartY = y;

  function drawField(label, value, x, yPos) {
    doc.fontSize(fieldFontSize).font('Helvetica').fillColor('#000000');
    doc.text(label, x, yPos, { lineBreak: true, width: labelWidth });

    doc.fontSize(fieldFontSize).font('Helvetica').fillColor('#000000');
    doc.text(':', x + labelWidth, yPos, { lineBreak: false, width: colonWidth });

    doc.fontSize(fieldFontSize).font('Helvetica').fillColor('#000000');
    doc.text(value || '', x + labelWidth + colonWidth, yPos, {
      lineBreak: true,
      width: maxValueWidth,
    });
  }

  // Row 1
  let row1Y = y;
  drawField('Registration\nNo.', data.registrationNo || '-', col1X, row1Y);
  drawField('Receipt No.', data.receiptNo || '-', col2X, row1Y);
  y += fieldLineHeight * 1.6;

  // Row 2
  let row2Y = y;
  drawField('Payment\nInitialization\nDate', data.paymentInitDate || '-', col1X, row2Y);
  drawField('Owner Name.', data.ownerName || '-', col2X, row2Y);
  y += fieldLineHeight * 2;

  // Row 3
  let row3Y = y;
  drawField('Chassis No.', data.chassisNo || '-', col1X, row3Y);
  drawField('Tax Mode', data.taxMode || '-', col2X, row3Y);
  y += fieldLineHeight;

  // Row 4
  let row4Y = y;
  drawField('Vehilce Type', data.vehicleType || '-', col1X, row4Y);
  drawField('Vehicle Class', data.vehicleClass || '-', col2X, row4Y);
  y += fieldLineHeight;

  // Row 5
  let row5Y = y;
  drawField('Vehicle\nCategory', data.vehicleCategory || '-', col1X, row5Y);
  drawField('Mobile No.', data.mobileNo || '-', col2X, row5Y);
  y += fieldLineHeight * 1.5;

  // Row 6
  let row6Y = y;
  drawField('CheckPost\nName', data.checkpostName || '', col1X, row6Y);
  drawField('Seating\nCapacity', String(data.seatingCapacity ?? ''), col2X, row6Y);
  y += fieldLineHeight * 1.5;

  // Row 7
  let row7Y = y;
  drawField('Sleeper Cap', String(data.sleeperCap ?? 0), col1X, row7Y);
  drawField('Bank Ref. No.', data.bankRefNo || '-', col2X, row7Y);
  y += fieldLineHeight;

  // Row 8
  let row8Y = y;
  drawField('Payment\nMode', data.paymentMode || 'ONLINE', col1X, row8Y);
  drawField('Fitness\nValidity', data.fitnessValidity || '', col2X, row8Y);
  y += fieldLineHeight * 1.5;

  // Row 9
  let row9Y = y;
  drawField('Insurance\nValidity', data.insuranceValidity || '', col1X, row9Y);
  drawField('PUCC Validity', data.puccValidity || '', col2X, row9Y);
  y += fieldLineHeight * 1.5;

  // Row 10
  let row10Y = y;
  drawField('Service Type', data.serviceType || '-', col1X, row10Y);
  drawField('Permit Type', data.permitType || 'NOT APPLICABLE', col2X, row10Y);
  y += fieldLineHeight;

  // Row 11
  drawField('Payment\nConfirmation\nDate', data.paymentConfirmDate || '', col1X, y);
  y += fieldLineHeight * 2;

  // Draw border box around all fields
  // doc.rect(margin - 2, fieldsStartY - 4, contentWidth + 4, y - fieldsStartY + 4)
  //   .lineWidth(0.5)
  //   .stroke('#000000');

  // Vertical divider line (middle)
  // doc.moveTo(pageWidth / 2 + 8, fieldsStartY - 4)
  //   .lineTo(pageWidth / 2 + 8, y)
  //   .lineWidth(0.5)
  //   .stroke('#000000');

  y += 16;

  // =====================================================
  // TAX TABLE
  // =====================================================
  const col = {
  particular: margin,
  fees: 360,
  fine: 440,
  total: 510,
};

const tableStartY = y;
const headerHeight = 30;  // ← header cell height
const rowHeight = 35;     // ← data row cell height
const borderColor = '#87CEEB';  // ← sky blue

// Header row — NO fill, transparent rakhenge taaki watermark dikhe
doc.rect(margin - 2, y, contentWidth + 4, headerHeight)
   .lineWidth(0.8)
   .stroke(borderColor);  // ← sirf border, fill nahi

doc.fontSize(11.5).font('Helvetica-Bold').fillColor('#000000');
doc.text('Tax/Fee Particular', col.particular + 4, y + 9, { width: col.fees - col.particular - 10 });
doc.text('Tax/Fees', col.fees, y + 9, { width: 60 });
doc.text('Fine', col.fine, y + 9, { width: 40 });
doc.text('Total', col.total, y + 9, { width: 50 });
y += headerHeight;

// Separator
doc.moveTo(margin - 2, y).lineTo(pageWidth - margin + 2, y).lineWidth(0.5).stroke(borderColor);

// Table rows — transparent background
doc.font('Helvetica-Bold').fontSize(11.5).fillColor('#000000');
const taxItems = data.taxItems || [];
for (const item of taxItems) {
  doc.text(item.particular, col.particular + 4, y + 10, { width: col.fees - col.particular - 10 });
  doc.text(String(item.fees ?? 0), col.fees, y + 10, { width: 60 });
  doc.text(String(item.fine ?? 0), col.fine, y + 10, { width: 40 });
  doc.text(String(item.total ?? 0), col.total, y + 10, { width: 50 });
  y += rowHeight;
}

// Table outer border
doc.rect(margin - 2, tableStartY, contentWidth + 4, y - tableStartY)
   .lineWidth(0.8)
   .stroke(borderColor);

// Vertical lines
doc.moveTo(col.fees - 5, tableStartY).lineTo(col.fees - 5, y).lineWidth(0.5).stroke(borderColor);
doc.moveTo(col.fine - 5, tableStartY).lineTo(col.fine - 5, y).lineWidth(0.5).stroke(borderColor);
doc.moveTo(col.total - 5, tableStartY).lineTo(col.total - 5, y).lineWidth(0.5).stroke(borderColor);

y += 15;

// Grand Total
doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000');
doc.text(
  `Grand Total : ${grandTotal}/- ${grandTotalWords} Rupees Only`,
  margin, y
);
y += 20;
  // =====================================================
  // PAGE 2
  // =====================================================
  doc.addPage();

  // Text watermark page 2
  //drawTextWatermark(doc, watermarkText, pageWidth, pageHeight * 0.6);

  let y2 = margin + 10;

  // Note section
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000');
  doc.text('Note :', margin, y2);
  y2 += 16;

  doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000');
doc.text('Terms and Conditions:', margin, y2);
y2 += 14;

const terms = data.terms || [
  'This is a computer generated printout and no signature is required.',
  'Should not carry unlawful/unaccompanied goods.',
  'If any false information/discrepancies are found at later, necessary action will be taken against the vehicle owner/driver.',
];

terms.forEach((term, i) => {
  doc.fontSize(12).font('Helvetica').fillColor('#000000');  // ← normal font
  doc.text(`${i + 1}. ${term}`, margin, y2, { width: contentWidth });
  y2 += 20;
});

  y2 += 20;

  // QR scan note
  doc.fontSize(15).font('Helvetica-Bold').fillColor('#000000');
  doc.text('Scan the QR code for genuinity of the receipt.', margin, y2);
  y2 += 30;

  // QR code (center on page 2)
  // doc.image(qrBuffer, (pageWidth - 100) / 2, y2, { width: 100, height: 100 });

  // =====================================================
  // FINALIZE
  // =====================================================
  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
}

module.exports = { generateReceipt };
