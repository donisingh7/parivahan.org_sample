const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// ======================================================
// IMAGE LOADER
// ======================================================
async function loadGreyscaleImage(imagePath) {
  try {
    if (!fs.existsSync(imagePath)) return null;

    return await sharp(imagePath)
      .grayscale()
      .blur(2)
      .png()
      .toBuffer();

  } catch {
    return null;
  }
}

// ======================================================
// NUMBER TO WORDS
// ======================================================
function numberToWords(num) {

  const ones = [
    '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE',
    'SIX', 'SEVEN', 'EIGHT', 'NINE',
    'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN',
    'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
    'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'
  ];

  const tens = [
    '', '', 'TWENTY', 'THIRTY', 'FORTY',
    'FIFTY', 'SIXTY', 'SEVENTY',
    'EIGHTY', 'NINETY'
  ];

  if (num === 0) return 'ZERO';

  function convert(n) {

    if (n < 20) {
      return ones[n];
    }

    if (n < 100) {
      return tens[Math.floor(n / 10)] +
        (n % 10 ? ' ' + ones[n % 10] : '');
    }

    if (n < 1000) {
      return ones[Math.floor(n / 100)] +
        ' HUNDRED' +
        (n % 100 ? ' AND ' + convert(n % 100) : '');
    }

    if (n < 100000) {
      return convert(Math.floor(n / 1000)) +
        ' THOUSAND' +
        (n % 1000 ? ' ' + convert(n % 1000) : '');
    }

    return convert(Math.floor(n / 100000)) +
      ' LAKH' +
      (n % 100000 ? ' ' + convert(n % 100000) : '');
  }

  return convert(num);
}

// ======================================================
// QR CODE
// ======================================================
async function generateQRCode(text) {

  const dataUrl = await QRCode.toDataURL(text, {
    width: 120,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });

  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');

  return Buffer.from(base64, 'base64');
}

// ======================================================
// MAIN GENERATOR
// ======================================================
async function generateReceipt(data, outputPath) {

  const now = moment(data.paymentDate || new Date());
  const printedDateTime = now
    .format('DD-MMM-YYYY hh:mm:ss A')
    .toUpperCase();
  const formattedDate = now
    .format('DD-MMM-YYYY hh:mm A')
    .toUpperCase();

  const registrationNo =
    data.registrationNo || 'XX00X0000';

  const watermarkText =
    `${registrationNo} / ${formattedDate}`;

  const grandTotal =
    (data.taxItems || [])
      .reduce((sum, item) => sum + item.total, 0);

  const grandTotalWords =
    numberToWords(grandTotal);

  const qrUrl =
    data.qrUrl ||
    `https://kms.parivahan.gov.in/verify?receipt=${data.receiptNo}`;

  const qrBuffer =
    await generateQRCode(qrUrl);

  // ======================================================
  // PDF SETUP
  // ======================================================

  const doc = new PDFDocument({
    size: 'A4',
    margin: 0,
    info: {
      Title: 'Checkpost Tax e-Receipt',
      Author: 'Department of Transport',
      Subject: `Receipt - ${data.receiptNo}`
    }
  });

  doc.registerFont(
    'Roboto',
    './fonts/Roboto-Regular.ttf'
  );

  doc.registerFont(
    'Roboto-Bold',
    './fonts/Roboto-Bold.ttf'
  );

  const pageWidth = 595.28;
  const pageHeight = 841.89;

  const margin = 30;

  const contentWidth =
    pageWidth - margin * 2;

  const stream =
    fs.createWriteStream(outputPath);

  doc.pipe(stream);

  // ======================================================
  // WATERMARK IMAGE
  // ======================================================

  const imagePath =
    data.emblemImagePath ||
    './images/MMVD_logo.jpg';

  const wmBuffer =
    await loadGreyscaleImage(imagePath);

  if (wmBuffer) {

    const wmWidth = 205;
    const wmHeight = 185;

    const wmX =
      (pageWidth - wmWidth) / 2 +5;

    const wmY =
      ((pageHeight - wmHeight) / 2) - 48;

    doc.save();

    doc.opacity(0.7);

    doc.image(
      wmBuffer,
      wmX - 10,
      wmY - 230,
      {
        width: wmWidth,
        height: wmHeight
      }
    );

    doc.restore();
  }

  // ======================================================
  // TEXT WATERMARK
  // ======================================================

  doc.save();

  doc.opacity(0.3);

  doc.fontSize(14)
    .fillColor('#555555')
    .font('Helvetica');

  const tileRows = 19;
  const tileStep = 20;

  for (let row = 0; row < tileRows; row++) {

    const rowY =
      (row * tileStep) + 20;

    const lineText =
      `${watermarkText},  `.repeat(2);

    doc.text(
      lineText,
      30,
      rowY,
      {
        width: pageWidth,
        lineBreak: false
      }
    );
  }

  doc.restore();

  // ======================================================
  // HEADER
  // ======================================================

  let y = 15;

  doc.fontSize(9)
    .fillColor('#000000')
    .font('Helvetica-Bold');

  doc.text(
    'Receipt Printing Date :',
    margin,
    y
  );

  doc.text(
    printedDateTime,
    margin,
    y + 11
  );

  // ======================================================
  // TITLE BLOCK
  // ======================================================

  const titleX =
    margin + 80;

  const titleWidth =
    contentWidth - 170;

  doc.fontSize(13)
    .font('Helvetica-Bold')
    .fillColor('#000000');

  doc.text(
    'GOVERNMENT OF MAHARASHTRA',
    titleX,
    y+2,
    {
      width: titleWidth,
      align: 'center',
      underline: true
    }
  );

  doc.fontSize(11)
    .font('Helvetica-Bold');

  doc.text(
    'Department of Transport',
    titleX,
    y + 13+5+3,
    {
      width: titleWidth,
      align: 'center'
    }
  );

  doc.fontSize(10)
    .font('Helvetica-Bold');

  doc.text(
    'Checkpost Tax e-Receipt',
    titleX,
    y + 27+5+5+2,
    {
      width: titleWidth,
      align: 'center'
    }
  );

  // ======================================================
  // QR CODE
  // ======================================================

  doc.image(
    qrBuffer,
    pageWidth - margin - 105,
    y,
    {
      width: 110,
      height: 110
    }
  );

  y += 48;

  // ======================================================
  // FIELD SYSTEM
  // ======================================================

  const col1X = margin;
  const col2X = pageWidth / 2 ;

  const fieldFontSize = 9.5;

  const fieldLineHeight = 23;

  const labelWidth = 80;
  const colonWidth = 10;

  function drawField(label, value, x, yPos) {

    const maxValueWidth = 160;

    doc.fontSize(fieldFontSize)
      .font('Helvetica')
      .fillColor('#000000');

    doc.text(
      label,
      x,
      yPos,
      {
        lineBreak: false,
        width: labelWidth
      }
    );

    doc.text(
      ':',
      x + labelWidth,
      yPos,
      {
        lineBreak: false,
        width: colonWidth
      }
    );

    doc.text(
      value || '-',
      x + labelWidth + colonWidth,
      yPos,
      {
        lineBreak: true,
        width: maxValueWidth
      }
    );
  }

  // ======================================================
  // FIELDS
  // ======================================================

  // Row 1
  doc.fontSize(fieldFontSize)
    .font('Helvetica')
    .fillColor('#000000');

  doc.text(
    'Registration No.',
    col1X,
    y,
    {
      lineBreak: false,
      width: labelWidth
    }
  );

  doc.text(
    ':',
    col1X + labelWidth,
    y,
    {
      lineBreak: false,
      width: colonWidth
    }
  );

  doc.font('Helvetica-Bold');

  doc.text(
    data.registrationNo || '-',
    col1X + labelWidth + colonWidth,
    y,
    {
      lineBreak: false
    }
  );

  y += fieldLineHeight;

  // Row 2
  drawField(
    'Receipt No.',
    data.receiptNo || '-',
    col1X,
    y
  );

  y += fieldLineHeight;

  // Row 3
  drawField(
    'Payment Date',
    formattedDate,
    col1X,
    y
  );

  y += fieldLineHeight;

  // Row 4
  drawField(
    'Owner Name',
    data.ownerName || '-',
    col1X,
    y
  );

  y += fieldLineHeight;

  // Row 5
  const row5Y = y;

  drawField(
    'Chassis No.',
    data.chassisNo || '-',
    col1X,
    row5Y
  );

  drawField(
    'Tax Mode',
    data.taxMode || '-',
    col2X,
    row5Y
  );

  y += fieldLineHeight;

  // Row 6
  const row6Y = y;

  drawField(
    'Vehicle Type',
    data.vehicleType || '-',
    col1X,
    row6Y
  );

  drawField(
    'Vehicle Class',
    data.vehicleClass || '-',
    col2X,
    row6Y
  );

  y += fieldLineHeight;

  // Row 7
  const row7Y = y;

  drawField(
    'Mobile No.',
    data.mobileNo || '-',
    col1X,
    row7Y
  );

  drawField(
    'Checkpost Name',
    data.checkpostName || '-',
    col2X,
    row7Y
  );

  y += fieldLineHeight * 1.4;

  // ======================================================
  // MH SPECIFIC ROW
  // ======================================================

  const row8Y = y;

  drawField(
    'Unladen Weight',
    String(data.unladenWeight || '0'),
    col1X,
    row8Y
  );

  drawField(
    'Laden Weight',
    String(data.ladenWeight || '0'),
    col2X,
    row8Y
  );

  y += fieldLineHeight;

  // Row 9
  const row9Y = y;

  drawField(
    'Bank Ref. No.',
    data.bankRefNo || '-',
    col1X,
    row9Y
  );

  drawField(
    'Payment Mode',
    data.paymentMode || 'ONLINE',
    col2X,
    row9Y
  );

  y += fieldLineHeight;

  // Row 10
  drawField(
    'Service Type',
    data.serviceType || 'NOT APPLICABLE',
    col1X,
    y
  );

  y += fieldLineHeight;

  // Row 11
  const row11Y = y;

  drawField(
    'Permit Type',
    data.permitType || '-',
    col1X,
    row11Y
  );

  drawField(
    'Permit Category',
    data.permitCategory || '-',
    col2X,
    row11Y
  );

  y += fieldLineHeight * 1.5;

  // ======================================================
  // TAX TABLE
  // ======================================================

  doc.moveTo(margin, y)
    .lineTo(pageWidth - margin, y)
    .lineWidth(0.5)
    .stroke('#000000');

  y += 4;

  const col = {
    particular: margin,
    fees: 350,
    fine: 440,
    total: 510
  };

  doc.fontSize(9)
    .font('Helvetica-Bold')
    .fillColor('#000000');

  doc.text(
    'Particular',
    col.particular,
    y
  );

  doc.text(
    'Fees/Tax',
    col.fees,
    y
  );

  doc.text(
    'Fine',
    col.fine,
    y
  );

  doc.text(
    'Total',
    col.total,
    y
  );

  y += 10;

  doc.moveTo(margin, y)
    .lineTo(pageWidth - margin, y)
    .lineWidth(0.5)
    .stroke('#000000');

  const taxItems =
    data.taxItems || [];

  doc.save();
  doc.fillColor('#ffffff');
  doc.rect(
    margin,
    y,
    contentWidth,
    (taxItems.length * 12) + 5
  ).fill();
  doc.restore();

  y += 5;

  doc.font('Helvetica')
    .fontSize(9)
    .fillColor('#000000');

  taxItems.forEach((item, index) => {

    doc.text(
      item.particular,
      col.particular,
      y,
      {
        width: col.fees - col.particular - 10
      }
    );

    doc.text(
      String(item.fees ?? 0),
      col.fees,
      y
    );

    doc.text(
      String(item.fine ?? 0),
      col.fine,
      y
    );

    doc.text(
      String(item.total ?? 0),
      col.total,
      y
    );

    y += 12;

    if (index < taxItems.length - 1) {

      doc.moveTo(margin, y - 3)
        .lineTo(pageWidth - margin, y - 3)
        .lineWidth(0.5)
        .stroke('#000000');
    }
  });

  doc.moveTo(margin, y)
    .lineTo(pageWidth - margin, y)
    .lineWidth(0.5)
    .stroke('#000000');

  y += 18;

  // ======================================================
  // GRAND TOTAL
  // ======================================================

  doc.fontSize(9)
    .font('Roboto-Bold');

  doc.text(
    `Grand Total : ₹ ${grandTotal}  ( ${grandTotalWords} ONLY/-)`,
    margin,
    y
  );

  y += 13;

  // ======================================================
  // NOTES
  // ======================================================

  doc.fontSize(9)
    .font('Helvetica-Oblique')
    .fillColor('#000000');

  const notes = data.notes || [
    'This is a computer generated printout and no signature is required.',
    'Incorrect mentioning of vehicle class or seating capacity may lead to tax evasion and defaulter shall be liable for penal action'
  ];

  doc.text(
    'Note :',
    margin,
    y,
    {
      continued: true
    }
  );

  doc.text(
    ` 1) ${notes[0]}`,
    {
      font: 'Helvetica-Oblique'
    }
  );

  if (notes[1]) {

    doc.text(
      `2) ${notes[1]}`,
      margin,
      y + 11
    );
  }

  y += 40;

  // ======================================================
  // CONFIRMATION NOTE
  // ======================================================

  doc.fontSize(9.5)
    .font('Helvetica-Oblique');

  doc.text(
    'You will also receive the payment confirmation message.',
    margin,
    y
  );

  y += 21;

  // ======================================================
  // QR NOTE
  // ======================================================

// 1. Start with Bold font for the first part
doc.font('Helvetica-Bold')
   .fontSize(13)
   .fillColor('#000000');

doc.text(
  'Scan the QR code for genuinity of the receipt, It should land at ',
  margin,
  y,
  { continued: true }
);

// 2. Switch to Regular font, change color, and add underline for the link
doc.font('Helvetica')
   .fillColor('#060606')
   .text(
     'https://kms.parivahan.gov.in',
     { underline: true, continued: true }
   );

// 3. Switch back to Bold font, reset color, and turn off underline for the final part
doc.font('Helvetica-Bold')
   .fillColor('#000000')
   .text(
     ' site. In case the URL is different, then receipt could be a fake one, please raise a complain',
     { underline: false } 
   );

  // ======================================================
  // FINALIZE
  // ======================================================

  doc.end();

  return new Promise((resolve, reject) => {

    stream.on(
      'finish',
      () => resolve(outputPath)
    );

    stream.on(
      'error',
      reject
    );
  });
}

module.exports = {
  generateReceipt
};