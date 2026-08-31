const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const PAGE = { width: 595, height: 841 };
const BLACK = '#000000';

const FONT_FILES = {
  roboto: path.join(
    __dirname,
    'node_modules',
    '@fontsource',
    'roboto',
    'files',
    'roboto-latin-400-normal.woff'
  ),
  robotoBold: path.join(
    __dirname,
    'node_modules',
    '@fontsource',
    'roboto',
    'files',
    'roboto-latin-700-normal.woff'
  ),
  robotoItalic: path.join(
    __dirname,
    'node_modules',
    '@fontsource',
    'roboto',
    'files',
    'roboto-latin-400-italic.woff'
  )
};

function assertRuntimeFiles(data) {
  for (const [name, filePath] of Object.entries(FONT_FILES)) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing ${name} font. Run "npm install" first.`);
    }
  }
  for (const [name, filePath] of [
    ['emblemImagePath', data.emblemImagePath],
    ['rupeeGlyphPath', data.rupeeGlyphPath]
  ]) {
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error(`A valid ${name} is required.`);
    }
  }
}

function registerFonts(doc) {
  doc.registerFont('Roboto', FONT_FILES.roboto);
  doc.registerFont('Roboto-Bold', FONT_FILES.robotoBold);
  doc.registerFont('Roboto-Italic', FONT_FILES.robotoItalic);
}

function drawText(doc, value, x, y, options = {}) {
  const scaleX = options.scaleX || 1;
  doc.save();
  doc.translate(x, y);
  doc.scale(scaleX, 1);
  doc
    .font(options.font || 'Roboto')
    .fontSize(options.size || 8.75)
    .fillColor(options.color || BLACK);
  if (options.opacity !== undefined) doc.opacity(options.opacity);
  doc.text(String(value ?? ''), 0, 0, {
    width: options.width ? options.width / scaleX : undefined,
    align: options.align,
    lineBreak: options.lineBreak === undefined ? false : options.lineBreak,
    lineGap: options.lineGap || 0,
    underline: Boolean(options.underline)
  });
  doc.restore();
}

function drawPageFrame(doc) {
  doc.save();
  doc.fillColor('#ffffff');
  doc.rect(5.518333, 5.518272, 583.963357, 758.963356).fill();
  doc.restore();
}

function drawWatermarks(doc, data) {
  const stamp =
    `${data.registrationNo} / ${data.watermarkDate}, ` +
    `${data.registrationNo} / ${data.watermarkDate},`;

  // These are the exact source boundaries: 17 rows, x=27.392..540.507 pt.
  doc.save();
  doc.rect(27.392, 12.5, 513.115, 370).clip();
  for (let row = 0; row < 17; row += 1) {
    drawText(doc, stamp, 27.392, 15.089 + row * 21.875, {
      size: 14.583,
      opacity: 0.2,
      scaleX: 0.999834
    });
  }
  doc.restore();

  doc.save();
  doc.opacity(0.5);
  doc.image(data.emblemImagePath, 187.809021, 49.267273, {
    width: 203.4375,
    height: 218.75
  });
  doc.restore();
}

async function makeQrBuffer(data) {
  if (data.qrImagePath && fs.existsSync(data.qrImagePath)) {
    return fs.readFileSync(data.qrImagePath);
  }
  return QRCode.toBuffer(data.qrValue || data.receiptNo, {
    type: 'png',
    width: 700,
    margin: 4,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#ffffff' }
  });
}

function drawHeader(doc, data, qrBuffer) {
  doc.image(qrBuffer, 460.128448, 12.808968, {
    width: 102.083344,
    height: 102.083328
  });

  drawText(doc, 'Receipt Printing Date :', 27.94, 14.41, {
    font: 'Roboto-Bold',
    size: 8.75,
    scaleX: 0.988
  });

  const printed = String(data.receiptPrintingDate || '').trim();
  const suffix = printed.endsWith(' AM')
    ? 'AM'
    : printed.endsWith(' PM')
      ? 'PM'
      : '';
  const dateTime = suffix ? printed.slice(0, -3) : printed;
  drawText(doc, dateTime, 27.804, 27.42, {
    font: 'Roboto-Bold',
    size: 8.75
  });
  if (suffix) {
    drawText(doc, suffix, 27.423, 40.38, {
      font: 'Roboto-Bold',
      size: 8.75
    });
  }

  drawText(doc, 'GOVERNMENT OF CHHATTISGARH', 181.357, 15.16, {
    font: 'Roboto-Bold',
    size: 13.125
  });
  doc
    .save()
    .strokeColor(BLACK)
    .lineWidth(0.486111)
    .moveTo(180.833328, 28.437439)
    .lineTo(390.347229, 28.437439)
    .stroke()
    .restore();
  drawText(doc, 'Department of Transport', 225.922, 34.58, {
    font: 'Roboto-Bold',
    size: 11.8,
    scaleX: 0.9895
  });
  drawText(doc, 'Checkpost Tax e-Receipt', 230.901, 51.97, {
    font: 'Roboto-Bold',
    size: 10.6,
    scaleX: 1.01
  });
}

function drawField(doc, label, value, labelX, valueX, y, options = {}) {
  const lines = String(label).split('\n');
  lines.forEach((line, index) => {
    drawText(doc, line, labelX, y + index * 13.125, {
      size: 8.75
    });
  });
  const rendered =
    value === undefined || value === null || value === '' ? ':' : `: ${value}`;
  drawText(doc, rendered, valueX, y + (options.valueYOffset || 0), {
    font: options.valueBold ? 'Roboto-Bold' : 'Roboto',
    size: 8.75,
    scaleX: options.valueScaleX || 1
  });
}

function drawDetails(doc, data) {
  const lx = 27.392;
  const lvTop = 106.495;
  const lv = 107.273;
  const rx = 293.684;
  const rv = 373.572;

  drawField(doc, 'Registration No.', data.registrationNo, lx, lvTop, 71.052, {
    valueBold: true
  });
  drawField(doc, 'Receipt No.', data.receiptNo, lx, lvTop, 87.823);
  drawField(
    doc,
    'Payment Initiation\nDate',
    data.paymentInitiationDate,
    lx,
    lvTop,
    104.594,
    { valueYOffset: 6.562 }
  );
  drawField(doc, 'Owner Name', data.ownerName, lx, lvTop, 134.489);

  drawField(doc, 'Chassis No.', data.chassisNo, lx, lv, 151.26);
  drawField(doc, 'Tax Mode', data.taxMode, rx, rv, 151.26);
  drawField(doc, 'Vehilce Type', data.vehicleType, lx, lv, 168.031);
  drawField(doc, 'Vehicle Class', data.vehicleClass, rx, 373.563, 168.031);
  drawField(doc, 'Mobile No.', data.mobileNo, lx, lv, 184.802);
  drawField(doc, 'Checkpost Name', data.checkpostName, rx, rv, 184.802);
  drawField(doc, 'Unladen Weight', data.unladenWeight, lx, lv, 201.573);
  drawField(doc, 'Laden Weight', data.ladenWeight, rx, rv, 201.573);
  drawField(doc, 'Bank Ref. No.', data.bankReferenceNo, lx, lv, 218.344);
  drawField(doc, 'Payment Mode', data.paymentMode, rx, 373.563, 218.344);

  drawField(doc, 'Service Type', data.serviceType, lx, lv, 249.698);
  drawField(doc, 'Permit Type', data.permitType, lx, lv, 273.76);
  drawField(doc, 'Permit Category', data.permitCategory, rx, rv, 273.76);
}

function drawTable(doc, data) {
  const left = 27.393333;
  const right = 576.638611;
  const feesX = 379.459;
  const fineX = 445.361;
  const totalX = 510.914;

  doc.save().fillColor(BLACK);
  doc.rect(left, 303.747437, right - left, 0.486114).fill();
  doc.rect(left, 317.358551, right - left, 0.486114).fill();
  doc.rect(left, 330.969666, right - left, 0.486084).fill();
  doc.restore();

  drawText(doc, 'Particular', 27.94, 305.71, {
    font: 'Roboto-Bold',
    size: 8.75,
    scaleX: 0.983
  });
  drawText(doc, 'Fees/Tax', feesX, 305.71, {
    font: 'Roboto-Bold',
    size: 8.75,
    scaleX: 0.983
  });
  drawText(doc, 'Fine', fineX, 305.71, {
    font: 'Roboto-Bold',
    size: 8.75,
    scaleX: 0.983
  });
  drawText(doc, 'Total', totalX, 305.71, {
    font: 'Roboto-Bold',
    size: 8.75,
    scaleX: 0.983
  });

  const item = data.taxItems?.[0] || {};
  drawText(doc, item.particular || '', 27.392, 319.212, { size: 8.75 });
  drawText(doc, item.fees || '', 378.911, 319.212, { size: 8.75 });
  drawText(doc, item.fine || '', 444.816, 319.212, { size: 8.75 });
  drawText(doc, item.total || '', 510.733, 319.212, { size: 8.75 });
}

function drawFooter(doc, data) {
  drawText(doc, 'Grand Total :', 27.324, 345.95, {
    font: 'Roboto-Bold',
    size: 8.75,
    scaleX: 0.98
  });
  doc.image(data.rupeeGlyphPath, 78.731407, 346.038116, {
    width: 8.835785,
    height: 8.886719
  });
  drawText(
    doc,
    ` ${data.grandTotal}/- ( ${data.amountInWords})`,
    86.795,
    344.489,
    { size: 8.75 }
  );

  drawText(
    doc,
    'Note : 1) This is a computer generated printout and no signature is required.',
    27.651,
    357.83,
    { font: 'Roboto-Italic', size: 8.75 }
  );
  drawText(
    doc,
    '2) Incorrect mentioning of vehicle class or seating capacity may lead to tax evasion and defaulter shall be liable for penal action.',
    27.499,
    370.955,
    { font: 'Roboto-Italic', size: 8.75 }
  );

  drawText(
    doc,
    'You will also receive the payment confirmation message.',
    27.387,
    402.15,
    { font: 'Roboto-Italic', size: 8.75 }
  );

  drawText(
    doc,
    'Scan the QR code for genuinity of the receipt, It should land at',
    27.594,
    417.51,
    { font: 'Roboto-Bold', size: 13.125, scaleX: 0.9993 }
  );
  drawText(doc, 'https://kms.parivahan.gov.in', 395.585, 417.604, {
    size: 13.125
  });
  doc
    .save()
    .strokeColor(BLACK)
    .lineWidth(0.486111)
    .moveTo(395.694428, 430.937439)
    .lineTo(411.736115, 430.937439)
    .moveTo(414.166656, 430.937439)
    .lineTo(466.666656, 430.937439)
    .moveTo(469.097229, 430.937439)
    .lineTo(527.430542, 430.937439)
    .moveTo(534.236084, 430.937439)
    .lineTo(561.458313, 430.937439)
    .stroke()
    .restore();
  drawText(
    doc,
    'site. In case the URL is different, then receipt could be a fake one, please raise a complain.',
    27.502,
    437.21,
    { font: 'Roboto-Bold', size: 13.125 }
  );
}

async function generateReceipt(data, outputPath) {
  assertRuntimeFiles(data);
  const qrBuffer = await makeQrBuffer(data);
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [PAGE.width, PAGE.height],
      margin: 0,
      autoFirstPage: true,
      info: {
        Title: 'Chhattisgarh Checkpost Tax e-Receipt',
        Author: 'Department of Transport',
        Creator: 'Chhattisgarh Receipt Generator'
      }
    });
    const stream = fs.createWriteStream(outputPath);
    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
    doc.on('error', reject);
    doc.pipe(stream);

    registerFonts(doc);
    drawPageFrame(doc);
    drawWatermarks(doc, data);
    drawHeader(doc, data, qrBuffer);
    drawDetails(doc, data);
    drawTable(doc, data);
    drawFooter(doc, data);
    doc.end();
  });
}

module.exports = { generateReceipt };
