const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const REFERENCE_PATHS = require('./assets/reference-paths.json');

const PAGE = { width: 612, height: 792 };
const BLACK = '#000000';
const GRID = '#eeeeee';

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
  robotoBlack: path.join(
    __dirname,
    'node_modules',
    '@fontsource',
    'roboto',
    'files',
    'roboto-latin-900-normal.woff'
  )
};

function assertRuntimeFiles(data) {
  for (const [name, filePath] of Object.entries(FONT_FILES)) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing ${name} font. Run "npm install" first.`);
    }
  }
  for (const [name, filePath] of [
    ['logoImagePath', data.logoImagePath],
    ['watermarkImagePath', data.watermarkImagePath],
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
  doc.registerFont('Roboto-Black', FONT_FILES.robotoBlack);
}

function resolveFont(requested) {
  return requested || 'Roboto';
}

function drawText(doc, value, x, y, options = {}) {
  const scaleX = options.scaleX || 1;
  doc.save();
  doc.translate(x, y);
  doc.scale(scaleX, 1);
  doc
    .font(resolveFont(options.font))
    .fontSize(options.size || 9.75)
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

function drawField(doc, label, value, labelX, valueX, y, options = {}) {
  drawText(doc, label, labelX, y, {
    size: 9.75,
    font: options.labelFont || 'Roboto'
  });
  const rendered =
    value === undefined || value === null || value === '' ? ':' : `: ${value}`;
  drawText(doc, rendered, valueX, y, {
    size: 9.75,
    font: options.valueBold ? 'Roboto-Bold' : 'Roboto',
    scaleX: options.valueScaleX || 1
  });
}

function drawReferenceQr(doc) {
  const entry = REFERENCE_PATHS.referenceQr;
  doc.save().fillColor('#ffffff').rect(474, 13.5, 105, 105).fill().restore();
  doc
    .save()
    .fillColor(BLACK)
    .path(entry.path)
    .fill(entry.fillRule || 'even-odd')
    .restore();
}

async function makeQrBuffer(data) {
  return QRCode.toBuffer(data.qrValue || data.receiptNo, {
    type: 'png',
    width: 840,
    margin: 4,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#ffffff' }
  });
}

function drawImages(doc, data, qrBuffer) {
  doc.image(data.logoImagePath, 28.5, 39, {
    width: 96.75,
    height: 97.5
  });
  doc.save().opacity(0.5);
  doc.image(data.watermarkImagePath, 216, 163.5, {
    width: 225,
    height: 225
  });
  doc.restore();
  if (data.useReferenceQr) {
    drawReferenceQr(doc);
  } else {
    doc.image(qrBuffer, 474, 13.5, { width: 105, height: 105 });
  }
}

function drawHeader(doc, data) {
  drawText(doc, 'Receipt Printing date', 28.5, 14.150393, { size: 9 });
  drawText(doc, data.receiptPrintingDate, 28.5, 26.900394, { size: 9 });

  drawText(doc, 'GOVERNMENT OF KARNATAKA', 198.140625, 14.475591, {
    size: 13.5,
    font: 'Roboto-Bold'
  });
  doc
    .save()
    .fillColor(BLACK)
    .rect(198.140625, 27.75, 191.671875, 0.75)
    .fill()
    .restore();
  drawText(doc, 'Department of Transport', 224.542969, 33.97559, {
    size: 13.5,
    font: 'Roboto-Bold'
  });
  drawText(doc, 'Checkpost Tax e-Receipt', 232.523438, 52.617191, {
    size: 12,
    font: 'Roboto-Bold'
  });

  doc
    .save()
    .strokeColor(BLACK)
    .lineWidth(0.75)
    .rect(196.125, 81.375, 207, 19.5)
    .stroke()
    .restore();
  drawText(doc, `Receipt No.: ${data.receiptNo}`, 197.824219, 82.725594, {
    size: 13.5,
    font: 'Roboto-Bold'
  });
}

function drawDetails(doc, data) {
  const lx = 28.5;
  const lv = 114.105469;
  const rx = 370.933594;
  const rv = 456.539063;
  const rows = [
    147.70459,
    172.45459,
    197.95459,
    222.70459,
    248.20459,
    272.95459,
    298.45459,
    323.95459,
    348.70459,
    374.20459
  ];

  drawField(doc, 'Vehicle No.', data.vehicleNo, lx, lv, rows[0], {
    valueBold: true
  });
  drawField(doc, 'Payment Date', data.paymentDate, rx, rv, rows[0]);
  drawField(doc, 'Owner Name', data.ownerName, lx, lv, rows[1]);
  drawField(doc, 'Mobile No.', data.mobileNo, rx, rv, rows[1]);
  drawField(doc, 'Chassis No.', data.chassisNo, lx, lv, rows[2]);
  drawField(doc, 'Tax Mode', data.taxMode, rx, rv, rows[2]);
  drawField(doc, 'Vehilce Type', data.vehicleType, lx, lv, rows[3]);
  drawField(doc, 'Vehicle Class', data.vehicleClass, rx, rv, rows[3]);
  drawField(doc, 'Permit Type', data.permitType, lx, lv, rows[4]);
  drawField(doc, 'Floor Area', data.floorArea, rx, rv, rows[4]);
  drawField(doc, 'Laden Weight', data.ladenWeight, lx, lv, rows[5]);
  drawField(doc, 'Un Laden Weight', data.unladenWeight, rx, rv, rows[5]);
  drawField(doc, 'Permit Validity', data.permitValidity, lx, lv, rows[6]);
  drawField(doc, 'Fitness Validity', data.fitnessValidity, rx, rv, rows[6]);
  drawField(doc, 'Insurance Validity', data.insuranceValidity, lx, lv, rows[7]);
  drawField(doc, 'Tax Validity', data.taxValidity, rx, rv, rows[7]);
  drawField(doc, 'Checkpost Name', data.checkpostName, lx, lv, rows[8]);
  drawField(doc, 'Bank Ref. No.', data.bankReferenceNo, rx, rv, rows[8]);
  drawField(doc, 'Payment Mode', data.paymentMode, lx, lv, rows[9]);
  drawField(doc, 'Payment Status', data.paymentStatus, rx, rv, rows[9]);
}

const TABLE_CELLS = [
  [28.5, 390.75],
  [390, 459],
  [458.25, 526.5],
  [525.75, 594]
];

function drawBlackTableRule(doc, y, rightEdges = false) {
  doc.save().fillColor(BLACK);
  for (const [x0, x1] of TABLE_CELLS) {
    const end = rightEdges ? x1 : x1 - 0.75;
    doc.rect(x0, y, end - x0, 0.75).fill();
  }
  doc.restore();
}

function drawRowBorder(doc, top) {
  doc.save().fillColor(GRID);
  for (const [x0, x1] of TABLE_CELLS) {
    doc.rect(x0, top, x1 - x0, 0.75).fill();
    doc.rect(x0, top, 0.75, 18.75).fill();
    doc.rect(x1 - 0.75, top, 0.75, 18.75).fill();
  }
  doc.restore();
  drawBlackTableRule(doc, top + 18.75, true);
}

function drawTable(doc, data) {
  drawBlackTableRule(doc, 399, false);
  drawBlackTableRule(doc, 414, false);

  drawText(doc, 'Particular', 28.5, 399.70459, {
    size: 9.75,
    font: 'Roboto-Bold'
  });
  drawText(doc, 'Fees/Tax', 390.128906, 399.70459, {
    size: 9.75,
    font: 'Roboto-Bold'
  });
  drawText(doc, 'Fine', 457.921875, 399.70459, {
    size: 9.75,
    font: 'Roboto-Bold'
  });
  drawText(doc, 'Total', 525.714844, 399.70459, {
    size: 9.75,
    font: 'Roboto-Bold'
  });

  const rowTops = [414.75, 434.25, 453.75];
  const textY = [417.70459, 437.20459, 456.70459];
  rowTops.forEach((top) => drawRowBorder(doc, top));

  const items = data.taxItems || [];
  textY.forEach((y, index) => {
    const item = items[index] || {};
    drawText(doc, item.particular || '', 29.25, y, { size: 9.75 });
    drawText(doc, item.fees || '', index === 2 ? 390.972656 : 390.878906, y, {
      size: 9.75
    });
    drawText(doc, item.fine || '', 458.671875, y, { size: 9.75 });
    drawText(doc, item.total || '', index === 2 ? 526.558594 : 526.464844, y, {
      size: 9.75
    });
  });
}

function drawFooter(doc, data) {
  drawText(doc, 'Grand Total : ', 28.5, 481.400391, {
    size: 9,
    font: 'Roboto-Bold'
  });
  doc.image(data.rupeeGlyphPath, 81.75, 483.75, {
    width: 7.5,
    height: 7.5
  });
  drawText(doc, data.grandTotal, 91.464844, 481.400391, {
    size: 9,
    font: 'Roboto-Bold'
  });
  drawText(
    doc,
    `/- ( ${data.amountInWords} ONLY)`,
    106.957031,
    481.400391,
    { size: 9 }
  );

  drawText(
    doc,
    'Note : 1) This is a computer generated printout and no signature is required.',
    28.5,
    494.150391,
    { size: 9, font: 'Roboto-Italic' }
  );
  drawText(
    doc,
    '2) Incorrect mentioning of vehicle class or seating capacity may lead to tax evasion and defaulter shall be liable for penal action.',
    28.5,
    506.900391,
    { size: 9, font: 'Roboto-Italic' }
  );
  drawText(
    doc,
    "3) To get a Green Card issued for Chardham Yatra: It is mandatory to produce passenger's list duly verified by any border checkpost of Uttarakhand.",
    28.5,
    519.650391,
    { size: 9, font: 'Roboto-Italic' }
  );
  drawText(
    doc,
    'You will also receive the payment confirmation message.',
    28.5,
    532.400391,
    { size: 9, font: 'Roboto-Italic' }
  );

  drawText(
    doc,
    'Scan the QR code for genuinity of the receipt, It should land at ',
    28.5,
    576.008789,
    { size: 10.5, font: 'Roboto-Black' }
  );
  drawText(
    doc,
    'https://kms.parivahan.gov.in',
    325.628906,
    576.008789,
    { size: 10.5 }
  );
  drawText(doc, ' site. In case', 458.90625, 576.008789, {
    size: 10.5,
    font: 'Roboto-Black'
  });
  drawText(
    doc,
    'the URL is different, then receipt could be a fake one, please raise a complain',
    28.5,
    591.008789,
    { size: 10.5, font: 'Roboto-Black' }
  );
}

async function generateReceipt(data, outputPath) {
  assertRuntimeFiles(data);
  const qrBuffer = data.useReferenceQr ? null : await makeQrBuffer(data);
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [PAGE.width, PAGE.height],
      margin: 0,
      autoFirstPage: true,
      info: {
        Title: 'Online Tax Payment Portal',
        Author: 'Government of Karnataka',
        Creator: 'Karnataka Receipt Generator'
      }
    });
    const stream = fs.createWriteStream(outputPath);
    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
    doc.on('error', reject);
    doc.pipe(stream);

    registerFonts(doc);
    drawImages(doc, data, qrBuffer);
    drawHeader(doc, data);
    drawDetails(doc, data);
    drawTable(doc, data);
    drawFooter(doc, data);
    doc.end();
  });
}

module.exports = { generateReceipt };
