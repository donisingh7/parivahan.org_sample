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
  ),
  watermarkReference: path.join(
    __dirname,
    'assets',
    'reference-watermark.ttf'
  )
};

function assertRuntimeFiles(data) {
  for (const [name, filePath] of Object.entries(FONT_FILES)) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing ${name} font. Run "npm install" first.`);
    }
  }
  for (const [name, filePath] of [
    ['sealImagePath', data.sealImagePath],
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
  doc.registerFont('Roboto-Reference-Watermark', FONT_FILES.watermarkReference);
}

function drawText(doc, value, x, y, options = {}) {
  const scaleX = options.scaleX || 1;
  doc.save();
  doc.translate(x, y);
  doc.scale(scaleX, 1);
  doc
    .font(options.font || 'Roboto')
    .fontSize(options.size || 9.479)
    .fillColor(options.color || BLACK);
  if (options.opacity !== undefined) doc.opacity(options.opacity);
  doc.text(String(value ?? ''), 0, 0, {
    width: options.width ? options.width / scaleX : undefined,
    align: options.align,
    lineBreak: options.lineBreak === undefined ? false : options.lineBreak,
    lineGap: options.lineGap || 0
  });
  doc.restore();
}

function drawPageFrame(doc) {
  doc
    .save()
    .fillColor('#ffffff')
    .rect(5.518333, 5.518272, 583.963356, 758.963356)
    .fill()
    .restore();
}

function drawWatermarks(doc, data) {
  const stamp =
    `${data.registrationNo} / ${data.watermarkDate}, ` +
    `${data.registrationNo} / ${data.watermarkDate},`;

  // Exact source geometry: 22 rows and a protected right boundary at 536.890 pt.
  doc.save();
  doc.rect(28.122, 12, 508.768, 430).clip();
  for (let row = 0; row < 22; row += 1) {
    drawText(doc, stamp, 28.122, 14.603 + row * 19.444444, {
      font: data.useReferenceWatermarkFont
        ? 'Roboto-Reference-Watermark'
        : 'Roboto',
      size: 14.583,
      opacity: 0.2,
      scaleX: data.useReferenceWatermarkFont ? 0.999019 : 0.999802
    });
  }
  doc.restore();

  doc.save();
  doc.opacity(0.6);
  doc.image(data.sealImagePath, 222.971069, 58.908508, {
    width: 147.777771,
    height: 147.777771
  });
  doc.restore();
}

async function makeQrBuffer(data) {
  if (data.qrImagePath && fs.existsSync(data.qrImagePath)) {
    return fs.readFileSync(data.qrImagePath);
  }
  return QRCode.toBuffer(data.qrValue || data.receiptNo, {
    type: 'png',
    width: 1146,
    margin: 4,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#ffffff' }
  });
}

function drawHeader(doc, qrBuffer) {
  doc.image(qrBuffer, 459.840637, 12.617081, {
    width: 109.950684,
    height: 109.95066
  });

  drawText(doc, 'GOVERNMENT OF TELANGANA', 175.532, 14.2, {
    font: 'Roboto-Bold',
    size: 15.3,
    scaleX: 0.9989
  });
  doc
    .save()
    .strokeColor(BLACK)
    .lineWidth(0.486111)
    .moveTo(175, 29.40966)
    .lineTo(393.263885, 29.40966)
    .stroke()
    .restore();
  drawText(doc, 'Department of Transport', 218.762, 34.427, {
    size: 13.125
  });
  drawText(doc, 'Checkpost Tax e-Receipt', 231.024, 51.524, {
    size: 10.938
  });
}

function drawField(doc, label, value, labelX, valueX, y, options = {}) {
  drawText(doc, label, labelX, y, { size: 9.479 });
  const rendered =
    value === undefined || value === null || value === '' ? ':' : `: ${value}`;
  drawText(doc, rendered, valueX, y, {
    font: options.valueBold ? 'Roboto-Bold' : 'Roboto',
    size: 9.479,
    scaleX: options.valueScaleX || 1
  });
}

function drawDetails(doc, data) {
  const lx = 27.392;
  const lvTop = 106.477;
  const lv = 110.6;
  const rx = 339.816;
  const rv = 415.744;

  drawField(doc, 'Registration No.', data.registrationNo, lx, lvTop, 72.077, {
    valueBold: true
  });
  drawField(doc, 'Receipt No.', data.receiptNo, lx, lvTop, 90.55);
  drawField(doc, 'Payment Date', data.paymentDate, lx, 106.487, 109.022);
  drawField(doc, 'Owner Name', data.ownerName, lx, lvTop, 127.494);

  drawField(doc, 'Chassis No.', data.chassisNo, lx, lv, 153.258);
  drawField(doc, 'Tax Mode', data.taxMode, rx, rv, 153.258);
  drawField(doc, 'Vehilce Type', data.vehicleType, lx, lv, 171.73);
  drawField(doc, 'Vehicle Class', data.vehicleClass, rx, 415.735, 171.73);
  drawField(doc, 'Mobile No.', data.mobileNo, lx, 110.591, 190.202);
  drawField(doc, 'Checkpost Name', data.checkpostName, rx, 415.735, 190.202);
  drawField(doc, 'Sleeper Cap.', data.sleeperCapacity, lx, 110.61, 208.675);
  drawField(doc, 'Laden Weight', data.ladenWeight, 332.524, 415.742, 208.675);
  drawField(doc, 'Bank Ref. No.', data.bankReferenceNo, lx, lv, 227.147);
  drawField(doc, 'Payment Mode', data.paymentMode, rx, 415.735, 227.147);
  drawField(doc, 'Service Type', data.serviceType, lx, 110.591, 251.452);
  drawField(doc, 'Permit Type', data.permitType, lx, lv, 275.758);
  drawField(doc, 'Permit Category', data.permitCategory, rx, rv, 275.758);
}

function drawTableRule(doc, y) {
  const segments = [
    [27.393333, 397.26358],
    [397.262634, 458.899597],
    [458.900543, 520.537476],
    [520.541382, 582.193909]
  ];
  doc.save().fillColor(BLACK);
  for (const [x1, x2] of segments) {
    doc.rect(x1, y, x2 - x1, 0.486115).fill();
  }
  doc.restore();
}

function drawTable(doc, data) {
  drawTableRule(doc, 299.129364);
  drawTableRule(doc, 312.254364);
  drawTableRule(doc, 325.379364);

  drawText(doc, 'Particular', 28.001, 300.76, {
    font: 'Roboto-Bold',
    size: 9.479
  });
  drawText(doc, 'Fees/Tax', 397.87, 300.76, {
    font: 'Roboto-Bold',
    size: 9.479
  });
  drawText(doc, 'Fine', 459.508, 300.76, {
    font: 'Roboto-Bold',
    size: 9.479
  });
  drawText(doc, 'Total', 520.739, 300.76, {
    font: 'Roboto-Bold',
    size: 9.479
  });

  const item = data.taxItems?.[0] || {};
  drawText(doc, item.particular || '', 27.392, 313.675, { size: 9.479 });
  drawText(doc, item.fees || '', 397.262, 313.675, { size: 9.479 });
  drawText(doc, item.fine || '', 458.905, 313.675, { size: 9.479 });
  drawText(doc, item.total || '', 520.54, 313.675, { size: 9.479 });
}

function drawFooter(doc, data) {
  drawText(doc, 'Grand Total :', 27.338, 340.31, {
    font: 'Roboto-Bold',
    size: 8.75,
    scaleX: 1
  });
  doc.image(data.rupeeGlyphPath, 78.75, 340.250366, {
    width: 7.777779,
    height: 8.795563
  });
  drawText(
    doc,
    `${data.grandTotal} ( ${data.amountInWords} ONLY/-)`,
    88.105,
    339.96,
    { font: 'Roboto-Bold', size: 9.479, scaleX: 0.9975 }
  );

  drawText(
    doc,
    'Note : 1) This is a computer generated printout and no signature is required.',
    27.667,
    351.99,
    { font: 'Roboto-Italic', size: 9.479, scaleX: 0.9956 }
  );
  drawText(
    doc,
    '2) Incorrect mentioning of vehicle class or seating capacity may lead to tax evasion and defaulter shall be liable for penal action',
    27.499,
    364.87,
    { font: 'Roboto-Italic', size: 9.479 }
  );

  drawText(
    doc,
    'You will also receive the payment confirmation message.',
    27.448,
    390.29,
    { font: 'Roboto-Italic', size: 9.479, scaleX: 1.002 }
  );

  drawText(
    doc,
    'Scan the QR code for genuinity of the receipt, It should land at',
    27.532,
    415.15,
    { font: 'Roboto-Bold', size: 10.938, scaleX: 0.9955 }
  );
  drawText(doc, 'https://kms.parivahan.gov.in', 333.071, 414.895, {
    size: 10.938
  });
  doc
    .save()
    .strokeColor(BLACK)
    .lineWidth(0.486111)
    .moveTo(332.986115, 426.562439)
    .lineTo(346.111115, 426.562439)
    .moveTo(348.541656, 426.562439)
    .lineTo(392.291656, 426.562439)
    .moveTo(394.722229, 426.562439)
    .lineTo(442.847229, 426.562439)
    .moveTo(448.680542, 426.562439)
    .lineTo(471.527771, 426.562439)
    .stroke()
    .restore();
  drawText(doc, 'site. In case the URL', 474.14, 415.35, {
    font: 'Roboto-Bold',
    size: 10.938,
    scaleX: 0.9952
  });
  drawText(
    doc,
    'is different, then receipt could be a fake one, please raise a complain',
    27.536,
    429.61,
    { font: 'Roboto-Bold', size: 10.938, scaleX: 0.9957 }
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
        Title: 'Telangana Checkpost Tax e-Receipt',
        Author: 'Department of Transport',
        Creator: 'Telangana Receipt Generator'
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
    drawHeader(doc, qrBuffer);
    drawDetails(doc, data);
    drawTable(doc, data);
    drawFooter(doc, data);
    doc.end();
  });
}

module.exports = { generateReceipt };
