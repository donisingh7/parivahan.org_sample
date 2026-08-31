const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const PAGE = { width: 595, height: 841 };
const PRINT_FRAME = {
  x: 5.518333,
  y: 16.539383,
  width: 583.971108,
  height: 736.918259
};
const TABLE_BORDER = '#a6c3e0';

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
  notoSerif: path.join(
    __dirname,
    'node_modules',
    '@fontsource',
    'noto-serif',
    'files',
    'noto-serif-latin-400-normal.woff'
  )
};

function assertRuntimeFiles(data) {
  for (const [fontName, filePath] of Object.entries(FONT_FILES)) {
    if (!fs.existsSync(filePath)) {
      throw new Error(
        `Missing ${fontName} font. Run "npm install" before generating.`
      );
    }
  }
  if (!data.emblemImagePath || !fs.existsSync(data.emblemImagePath)) {
    throw new Error('A valid emblemImagePath is required.');
  }
}

function registerFonts(doc) {
  doc.registerFont('Roboto', FONT_FILES.roboto);
  doc.registerFont('Roboto-Bold', FONT_FILES.robotoBold);
  doc.registerFont('NotoSerif', FONT_FILES.notoSerif);
}

function text(doc, value, x, y, options = {}) {
  const font = options.font || 'Roboto';
  const size = options.size || 12.978;
  const color = options.color || '#000000';
  const scaleX = options.scaleX || 1;

  doc.save();
  doc.translate(x, y);
  doc.scale(scaleX, 1);
  doc.font(font).fontSize(size).fillColor(color);
  if (options.opacity !== undefined) doc.opacity(options.opacity);
  doc.text(String(value ?? ''), 0, 0, {
    width: options.width ? options.width / scaleX : undefined,
    height: options.height,
    align: options.align,
    lineBreak: options.lineBreak === undefined ? false : options.lineBreak,
    underline: Boolean(options.underline),
    lineGap: options.lineGap || 0
  });
  doc.restore();
}

function drawPrintFrame(doc) {
  doc.save();
  doc.rect(
    PRINT_FRAME.x,
    PRINT_FRAME.y,
    PRINT_FRAME.width,
    PRINT_FRAME.height
  );
  doc.fill('#ffffff');
  doc.restore();
}

function drawBrowserChrome(doc, data, pageNumber, totalPages) {
  text(doc, data.documentTitle, 0, 0.224, {
    font: 'NotoSerif',
    size: 9.722
  });
  text(doc, data.documentUrl, 317.054, 0.224, {
    font: 'NotoSerif',
    size: 9.722,
    width: 277.92
  });
  text(doc, `${pageNumber} of ${totalPages}`, 0, 758.557, {
    font: 'NotoSerif',
    size: 9.722
  });
  text(doc, data.browserPrintedAt, 527.345, 758.557, {
    font: 'NotoSerif',
    size: 9.722
  });
}

function drawTextWatermark(doc, data) {
  const watermark = `${data.registrationNo} ${data.watermarkDate}`;
  const row = `${watermark} ${watermark}`;

  for (let i = 0; i < 24; i += 1) {
    text(doc, row, 27.868, 27.258 + i * 23.072, {
      size: 15.141,
      opacity: 0.2
    });
  }
}

async function makeQrBuffer(data) {
  if (data.qrImagePath && fs.existsSync(data.qrImagePath)) {
    return fs.readFileSync(data.qrImagePath);
  }
  return QRCode.toBuffer(data.qrValue || data.receiptNo, {
    type: 'png',
    width: 1149,
    margin: 4,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#ffffff' }
  });
}

function drawHeading(doc, data, qrBuffer) {
  doc.image(data.emblemImagePath, 51.45274, 37.916298, {
    width: 110.008335,
    height: 108.909554
  });

  doc.image(qrBuffer, 407.290863, 45.611839, {
    width: 109.003327,
    height: 109.003319
  });

  text(doc, `Printed on : ${data.printedOn}`, 408.05, 31.598, {
    size: 11.536
  });

  text(doc, 'GOVERNMENT OF JHARKHAND', 203.734, 74.599, {
    font: 'Roboto-Bold',
    size: 11.536,
    scaleX: 0.99557
  });
  doc
    .save()
    .strokeColor('#000000')
    .lineWidth(0.481)
    .moveTo(203.384, 84.063)
    .lineTo(369.213, 84.063)
    .stroke()
    .restore();

  text(doc, 'Department of Transport', 228.065, 87.595, {
    size: 11.536
  });
  text(doc, 'Checkpost Tax e-Receipt', 232.283, 102.683, {
    size: 10.815
  });
}

function drawField(doc, label, value, labelX, valueX, y, options = {}) {
  const lineHeight = 17.304;
  String(label)
    .split('\n')
    .forEach((line, index) => {
      text(doc, line, labelX, y + index * lineHeight, {
        size: 12.978
      });
    });
  text(doc, `: ${value ?? ''}`, valueX, y, {
    size: 12.978,
    scaleX: options.valueScaleX || 1
  });
}

function drawDetails(doc, data) {
  const lx = 37.962;
  const lv = 121.225;
  const rx = 315.522;
  const rv = 398.785;

  drawField(doc, 'Registration\nNo.', data.registrationNo, lx, lv, 213.923);
  drawField(doc, 'Receipt No.', data.receiptNo, rx, rv, 213.923);

  text(doc, `Owner Name : ${data.ownerName}`, lx, 254.299, {
    size: 12.978
  });
  drawField(doc, 'Chassis No.', data.chassisNo, rx, rv, 254.299);

  drawField(doc, 'Tax Mode', data.taxMode, lx, lv, 277.371);
  drawField(doc, 'Vehilce Type', data.vehicleType, rx, rv, 277.371);

  text(doc, `Vehicle Class : ${data.vehicleClass}`, lx, 300.442, {
    size: 12.978,
    scaleX: data.vehicleClassScaleX || 1
  });
  drawField(
    doc,
    'Vehicle\nCategory',
    data.vehicleCategory,
    rx,
    rv,
    300.442
  );

  drawField(doc, 'Mobile No.', data.mobileNo, lx, lv, 340.818);
  drawField(doc, 'Checkpost\nName', data.checkpostName, rx, rv, 340.818);

  drawField(
    doc,
    'Seating\nCapacity',
    data.seatingCapacity,
    lx,
    lv,
    381.194
  );
  drawField(doc, 'Sleeper Cap.', data.sleeperCapacity, rx, rv, 381.194);

  text(doc, `Bank Ref. No. : ${data.bankReferenceNo}`, lx, 421.57, {
    size: 12.978
  });
  drawField(doc, 'Payment\nMode', data.paymentMode, rx, rv, 421.57);

  drawField(
    doc,
    'Fitness\nValidity',
    data.fitnessValidity,
    lx,
    lv,
    461.946
  );
  drawField(
    doc,
    'Insurance\nValidity',
    data.insuranceValidity,
    rx,
    rv,
    461.946
  );

  text(doc, `PUCC Validity : ${data.puccValidity}`, lx, 502.322, {
    size: 12.978
  });
  text(doc, `Service Type : ${data.serviceType}`, rx, 502.322, {
    size: 12.978
  });

  drawField(doc, 'Permit Type', data.permitType, lx, lv, 525.393);
  drawField(
    doc,
    'Payment\nConfirmation\nDate',
    data.paymentConfirmationDate,
    rx,
    rv,
    525.393,
    { valueScaleX: data.paymentDateScaleX || 1 }
  );
}

function drawTable(doc, data) {
  const x = [37.96236, 389.54611, 448.13708, 506.729, 565.32391];
  const top = 599.18927;
  const headerBottom = 626.10712;
  const bottom = 657.83362;

  doc.save().fillColor(TABLE_BORDER);
  doc.rect(x[0], top, x[4] - x[0], 0.4822).fill();
  doc.rect(x[0], headerBottom, x[4] - x[0], 1.4428).fill();
  doc.rect(x[0], bottom - 0.4822, x[4] - x[0], 0.4822).fill();
  for (const vx of x) {
    doc.rect(vx, top, 0.4822, bottom - top).fill();
  }
  doc.restore();

  text(doc, 'Tax/Fee Particular', 178.484, 607.512, {
    size: 8.652
  });
  text(doc, 'Tax/Fees', 401.032, 607.512, { size: 8.652 });
  text(doc, 'Fine', 469.305, 607.512, { size: 8.652 });
  text(doc, 'Total', 526.356, 607.512, { size: 8.652 });

  const item = data.taxItems[0] || {};
  text(doc, item.particular || '', 45.653, 635.841, { size: 11.536 });
  text(doc, item.fees ?? '', 397.235, 636.457, { size: 10.094 });
  text(doc, item.fine ?? '', 455.83, 636.457, { size: 10.094 });
  text(doc, item.total ?? '', 514.416, 636.457, { size: 10.094 });
}

function drawTotals(doc, data) {
  const total = (data.taxItems || []).reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );

  text(doc, 'Grand Total :', 38.463, 676.461, {
    font: 'Roboto-Bold',
    size: 10.094
  });

  if (data.rupeeGlyphPath && fs.existsSync(data.rupeeGlyphPath)) {
    doc.image(data.rupeeGlyphPath, 97.180077, 676.636414, {
      width: 7.87088,
      height: 7.84082
    });
  } else {
    text(doc, '₹', 97.18, 676.461, {
      font: 'Roboto-Bold',
      size: 10.094
    });
  }

  text(
    doc,
    `${total}/- ${data.amountInWords}  Rupees Only`,
    107.222,
    676.461,
    {
      font: 'Roboto-Bold',
      size: 10.094
    }
  );
  text(doc, 'Note:', 38.646, 697.524, {
    font: 'Roboto-Bold',
    size: 10.094
  });
  text(doc, 'Terms and Conditions:', 38.175, 717.8, {
    font: 'Roboto-Bold',
    size: 10.094
  });
}

function drawTermsPage(doc, data) {
  const terms = data.terms || [];
  const yPositions = [17.277, 51.404, 72.072];
  const lineHeight = 13.459;

  terms.forEach((term, index) => {
    String(term)
      .split('\n')
      .forEach((line, lineIndex) => {
        text(doc, `${lineIndex === 0 ? `${index + 1}. ` : ''}${line}`, 37.962, yPositions[index] + lineIndex * lineHeight, {
          size: 10.094
        });
      });
  });

  text(doc, 'Scan the QR code for genuinity of the receipt.', 38.57, 136.529, {
    font: 'Roboto-Bold',
    size: 14.421,
    scaleX: 1.18872
  });
}

async function generateReceipt(data, outputPath) {
  assertRuntimeFiles(data);
  const qrBuffer = await makeQrBuffer(data);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      autoFirstPage: false,
      size: [PAGE.width, PAGE.height],
      margin: 0,
      compress: true,
      info: {
        Title: 'Jharkhand Checkpost Tax e-Receipt',
        Author: 'Department of Transport, Government of Jharkhand'
      }
    });
    const output = fs.createWriteStream(outputPath);
    output.on('finish', () => resolve(outputPath));
    output.on('error', reject);
    doc.on('error', reject);
    doc.pipe(output);
    registerFonts(doc);

    doc.addPage({ size: [PAGE.width, PAGE.height], margin: 0 });
    drawPrintFrame(doc);
    drawTextWatermark(doc, data);
    doc.save();
    doc.opacity(0.3);
    doc.image(data.emblemImagePath, 257.455017, 196.377869, {
      width: 263.780579,
      height: 264.601654
    });
    doc.restore();
    drawHeading(doc, data, qrBuffer);
    drawDetails(doc, data);
    drawTable(doc, data);
    drawTotals(doc, data);
    drawBrowserChrome(doc, data, 1, 2);

    doc.addPage({ size: [PAGE.width, PAGE.height], margin: 0 });
    drawPrintFrame(doc);
    drawTermsPage(doc, data);
    drawBrowserChrome(doc, data, 2, 2);

    doc.end();
  });
}

module.exports = {
  generateReceipt
};
