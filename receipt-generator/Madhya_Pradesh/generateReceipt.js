const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 841;
const BODY_COLOR = '#212529';
const TABLE_BORDER = '#9fc4e3';
const PRINT_FRAME = { x: 35, y: 35, width: 525, height: 700 };

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
  for (const [name, filePath] of Object.entries(FONT_FILES)) {
    if (!fs.existsSync(filePath)) {
      throw new Error(
        `Missing ${name} font. Run "npm install" before generating the PDF.`
      );
    }
  }

  if (!data.emblemImagePath || !fs.existsSync(data.emblemImagePath)) {
    throw new Error('A valid emblemImagePath is required.');
  }
}

function numberToWordsIndian(value) {
  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen'
  ];
  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety'
  ];

  const convert = (number) => {
    if (number < 20) return ones[number];
    if (number < 100) {
      return `${tens[Math.floor(number / 10)]}${
        number % 10 ? ` ${ones[number % 10]}` : ''
      }`;
    }
    if (number < 1000) {
      return `${ones[Math.floor(number / 100)]} Hundred${
        number % 100 ? ` ${convert(number % 100)}` : ''
      }`;
    }
    if (number < 100000) {
      return `${convert(Math.floor(number / 1000))} Thousand${
        number % 1000 ? ` ${convert(number % 1000)}` : ''
      }`;
    }
    if (number < 10000000) {
      return `${convert(Math.floor(number / 100000))} Lakh${
        number % 100000 ? ` ${convert(number % 100000)}` : ''
      }`;
    }
    return `${convert(Math.floor(number / 10000000))} Crore${
      number % 10000000 ? ` ${convert(number % 10000000)}` : ''
    }`;
  };

  return value === 0 ? 'Zero' : convert(Math.round(value));
}

async function buildQrBuffer(data) {
  if (data.qrImagePath && fs.existsSync(data.qrImagePath)) {
    return fs.readFileSync(data.qrImagePath);
  }

  return QRCode.toBuffer(data.qrValue || data.receiptNo, {
    type: 'png',
    width: 200,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#ffffff' }
  });
}

function registerFonts(doc) {
  doc.registerFont('Roboto', FONT_FILES.roboto);
  doc.registerFont('Roboto-Bold', FONT_FILES.robotoBold);
  doc.registerFont('NotoSerif', FONT_FILES.notoSerif);
}

function drawSingleLine(doc, text, x, y, options = {}) {
  const scaleX = options.scaleX || 1;
  doc.save();
  doc.translate(x, y);
  doc.scale(scaleX, 1);
  doc
    .font(options.font || 'Roboto-Bold')
    .fontSize(options.size || 12)
    .fillColor(options.color || BODY_COLOR)
    .text(String(text ?? ''), 0, 0, {
      width: options.width ? options.width / scaleX : undefined,
      align: options.align,
      underline: Boolean(options.underline),
      lineBreak: false
    });
  doc.restore();
}

function drawLines(doc, text, x, y, options = {}) {
  const lineHeight = options.lineHeight || 17.5;
  String(text ?? '')
    .split('\n')
    .forEach((line, index) => {
      drawSingleLine(doc, line, x, y + index * lineHeight, options);
    });
}

function drawBrowserChrome(doc, data, pageNumber, totalPages) {
  doc.font('NotoSerif').fontSize(9.72).fillColor('#000000');
  doc.text(data.documentTitle || 'CheckPost V4.7.3', 0, 0, {
    lineBreak: false
  });
  doc.text(
    data.documentUrl ||
      'https://services.parivahan.gov.in/checkpostv4/#/public/repor...',
    309.4,
    0,
    { lineBreak: false }
  );
  doc.text(`${pageNumber} of ${totalPages}`, 0, 758.4, {
    lineBreak: false
  });
  doc.text(data.browserPrintedAt || '', 520, 758.4, {
    width: 75,
    align: 'right',
    lineBreak: false
  });
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

function drawDynamicTextWatermark(doc, data) {
  const watermarkText = `${data.registrationNo} ${data.watermarkDate}`;
  doc.save();
  doc.opacity(0.18);
  doc.font('Roboto').fontSize(13.5).fillColor('#777777');

  for (let y = 45; y <= 545; y += 22.6) {
    doc.text(`${watermarkText}  ${watermarkText}`, 35, y, {
      width: 525,
      lineBreak: false
    });
  }
  doc.restore();
}

function drawPageOneBackground(doc, data) {
  drawPrintFrame(doc);

  if (
    data.referenceWatermarkImagePath &&
    fs.existsSync(data.referenceWatermarkImagePath)
  ) {
    doc.image(data.referenceWatermarkImagePath, 35, 35, {
      width: 408.333,
      height: 522.812
    });
  } else {
    drawDynamicTextWatermark(doc, data);
  }

  doc.save();
  doc.opacity(0.3);
  doc.image(data.emblemImagePath, 312.083, 217.292, {
    width: 218.75,
    height: 218.75
  });
  doc.restore();
}

function drawPageOneHeader(doc, data, qrBuffer) {
  drawSingleLine(
    doc,
    `Printed on : ${data.printedOn}`,
    381.9,
    38.45,
    { size: 10.6, scaleX: 0.963 }
  );

  doc.image(data.emblemImagePath, 64.75, 77.413, {
    width: 102.083,
    height: 102.083
  });
  doc.image(qrBuffer, 400.458, 53.229, {
    width: 145.834,
    height: 145.833
  });

  drawSingleLine(doc, 'Transport Department MADHYA', 190, 97.25, {
    width: 204.25,
    align: 'center',
    size: 11.6,
    scaleX: 0.942,
    underline: true
  });
  drawSingleLine(doc, 'PRADESH', 190, 113.65, {
    width: 204.25,
    align: 'center',
    size: 11.6,
    scaleX: 0.945,
    underline: true
  });
  drawSingleLine(doc, 'DTO SATNA', 190, 130.45, {
    width: 204.25,
    align: 'center',
    size: 11.6,
    scaleX: 0.993,
    underline: true
  });
  drawSingleLine(doc, 'Checkpost Tax e-Receipt', 190, 147.15, {
    width: 204.25,
    align: 'center',
    size: 11.6,
    scaleX: 0.95
  });
}

const FIELD_COLUMNS = {
  left: { labelX: 44.2, colonX: 130.9, valueX: 137.2 },
  right: { labelX: 306.7, colonX: 393.4, valueX: 399.7 }
};

function drawField(doc, column, label, value, y, options = {}) {
  const anchors = FIELD_COLUMNS[column];
  drawLines(doc, label, anchors.labelX, y, {
    size: options.size || 12,
    lineHeight: options.lineHeight || 17.5,
    scaleX: options.scaleX || 0.97
  });

  if (options.showColon !== false) {
    drawSingleLine(doc, ':', anchors.colonX, y, {
      size: options.size || 12,
      scaleX: options.scaleX || 0.97
    });
  }

  drawLines(doc, value, anchors.valueX, y, {
    size: options.valueSize || options.size || 12,
    lineHeight: options.valueLineHeight || options.lineHeight || 17.5,
    scaleX: options.valueScaleX || options.scaleX || 0.97
  });
}

function drawPageOneFields(doc, data) {
  const offsetY = -1.8;
  drawField(doc, 'left', 'Registration\nNo.', data.registrationNo, 243.3 + offsetY);
  drawField(doc, 'right', 'Receipt No.', data.receiptNo, 243.3 + offsetY);

  drawField(
    doc,
    'left',
    'Payment\nInitialization\nDate',
    data.paymentInitializationDate,
    284.4 + offsetY
  );
  drawField(doc, 'right', 'Owner\nName.', data.ownerName, 284.4 + offsetY);

  drawField(doc, 'left', 'Chassis No.', data.chassisNo, 342.6 + offsetY);
  drawField(doc, 'right', 'Tax Mode', data.taxMode, 342.6 + offsetY);

  drawField(doc, 'left', 'Vehilce Type', data.vehicleType, 365.9 + offsetY);
  drawField(doc, 'right', 'Vehicle\nClass', data.vehicleClass, 365.9 + offsetY);

  drawField(
    doc,
    'left',
    'Vehicle\nCategory',
    'HEAVY PASSENGER\nVEHICLE',
    406.8 + offsetY
  );
  drawField(doc, 'right', 'Mobile No.', data.mobileNo, 406.8 + offsetY);

  drawField(doc, 'left', 'CheckPost\nName', data.checkpostName, 447.6 + offsetY);
  drawField(
    doc,
    'right',
    'Seating\nCapacity',
    data.seatingCapacity,
    447.6 + offsetY
  );

  drawField(doc, 'left', 'Sleeper Cap', data.sleeperCapacity, 488.4 + offsetY);
  drawField(
    doc,
    'right',
    'Bank Ref.\nNo.',
    data.bankReferenceNo,
    488.4 + offsetY
  );

  drawField(doc, 'left', 'Payment\nMode', data.paymentMode, 529.7 + offsetY);
  drawField(doc, 'right', 'Permit\nNumber', data.permitNumber, 529.7 + offsetY);

  drawField(doc, 'left', 'Permit\nValidity', data.permitValidity, 570.4 + offsetY);
  drawField(doc, 'right', 'Fitness\nValidity', data.fitnessValidity, 570.4 + offsetY);

  drawField(
    doc,
    'left',
    'Insurance\nValidity',
    data.insuranceValidity,
    611.3 + offsetY
  );
  drawField(doc, 'right', 'PUCC\nValidity', data.puccValidity, 611.3 + offsetY);

  drawField(doc, 'left', 'Service Type', data.serviceType, 651.8 + offsetY);
  drawField(doc, 'right', 'Permit Type', data.permitType, 651.8 + offsetY);

  drawField(
    doc,
    'left',
    'Standing\nCapacity',
    data.standingCapacity,
    675.0 + offsetY
  );

  drawSingleLine(doc, ':', FIELD_COLUMNS.right.colonX, 675.0 + offsetY, {
    scaleX: 0.97
  });
  drawSingleLine(
    doc,
    data.grossCombinationWeight,
    FIELD_COLUMNS.right.valueX,
    675.0 + offsetY,
    { scaleX: 0.97 }
  );
}

function drawPageTwoContinuation(doc, data) {
  drawLines(
    doc,
    'Gross\nCombination\nWeight(in\nkg.)',
    FIELD_COLUMNS.right.labelX,
    37.5,
    { size: 12, lineHeight: 17.2, scaleX: 0.97 }
  );

  drawField(
    doc,
    'left',
    'Payment\nConfirmation\nDate',
    data.paymentConfirmationDate,
    113.4
  );
}

function drawTaxTable(doc, data) {
  const x = [43.75, 357.292, 416.028, 474.771, 533.75];
  const y = [175, 199.55, 229.687, 259.34, 288.993, 318.646, 348.542];

  doc.save();
  doc.lineWidth(0.486).strokeColor(TABLE_BORDER);
  x.forEach((xPos) => {
    doc.moveTo(xPos, y[0]).lineTo(xPos, y[y.length - 1]).stroke();
  });
  y.forEach((yPos) => {
    doc.moveTo(x[0], yPos).lineTo(x[x.length - 1], yPos).stroke();
  });
  doc.restore();

  const headerY = 183.2;
  drawSingleLine(doc, 'Tax/Fee Particular', x[0], headerY, {
    width: x[1] - x[0],
    align: 'center',
    size: 8.4
  });
  drawSingleLine(doc, 'Tax/Fees', x[1], headerY, {
    width: x[2] - x[1],
    align: 'center',
    size: 8.4
  });
  drawSingleLine(doc, 'Fine', x[2], headerY, {
    width: x[3] - x[2],
    align: 'center',
    size: 8.4
  });
  drawSingleLine(doc, 'Total', x[3], headerY, {
    width: x[4] - x[3],
    align: 'center',
    size: 8.4
  });

  const rowTops = [208.3, 237.95, 267.6, 297.25, 326.9];
  data.taxItems.slice(0, 5).forEach((item, index) => {
    const rowY = rowTops[index];
    drawSingleLine(doc, item.particular, 50.5, rowY, {
      font: 'Roboto-Bold',
      size: 11.6
    });
    drawSingleLine(doc, item.fees, 363.6, rowY, {
      font: 'Roboto-Bold',
      size: 8.4
    });
    drawSingleLine(doc, item.fine, 422.45, rowY, {
      font: 'Roboto-Bold',
      size: 8.4
    });
    drawSingleLine(doc, item.total, 481.1, rowY, {
      font: 'Roboto-Bold',
      size: 8.4
    });
  });
}

function drawPermitHeading(doc, data, grandTotal, grandTotalWords) {
  drawSingleLine(
    doc,
    `Grand Total : ${grandTotal}/- ${grandTotalWords} Rupees Only`,
    44.15,
    362.5,
    { font: 'Roboto-Bold', size: 9.48, scaleX: 1.008 }
  );

  const centeredLines = [
    ['Transport Department MADHYA PRADESH', 377.9, 10.8],
    ['DTO SATNA', 394.3, 10.8],
    [data.formName, 410.3, 10.8],
    [data.ruleReference, 426.3, 10.8],
    [`TEMP. PERMIT No. : ${data.receiptNo}`, 443.5, 10.9],
    [data.grantHeading, 459.2, 10.9]
  ];

  centeredLines.forEach(([text, y, size]) => {
    drawSingleLine(doc, text, 43.75, y, {
      width: 462,
      align: 'center',
      font: 'Roboto-Bold',
      size,
      underline: true
    });
  });
}

function drawPermitField(doc, label, value, y, options = {}) {
  const adjustedY = y - 1.4;
  drawSingleLine(doc, label, 44.2, adjustedY, {
    size: options.size || 12,
    scaleX: options.scaleX || 0.97
  });
  drawLines(doc, `: ${value ?? ''}`, 289.45, adjustedY, {
    size: options.valueSize || options.size || 12,
    lineHeight: options.lineHeight || 17.5,
    scaleX: options.valueScaleX || options.scaleX || 0.97
  });
}

function drawWrappedTerm(doc, number, term, y) {
  const firstX = 56.91;
  const continuationX = 67.08;
  const rightEdge = 307.26;
  const lineHeight = 14.22;
  const words = `${number}. ${term}`.trim().split(/\s+/);
  const lines = [];
  let currentLine = '';

  doc.font('Roboto').fontSize(9.48);

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    const x = lines.length === 0 ? firstX : continuationX;
    if (
      currentLine &&
      doc.widthOfString(candidate) > rightEdge - x
    ) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  }
  if (currentLine) lines.push(currentLine);

  lines.forEach((line, index) => {
    drawSingleLine(
      doc,
      line,
      index === 0 ? firstX : continuationX,
      y + index * lineHeight,
      { font: 'Roboto', size: 9.48, color: BODY_COLOR }
    );
  });

  return y + lines.length * lineHeight;
}

function drawPageTwoPermitDetails(doc, data) {
  drawPermitField(doc, '1). Name of Permit Holder', data.ownerName, 513.9);
  drawPermitField(doc, '2). Routes or Area', data.routesOrArea, 537.25);
  drawPermitField(doc, '3). (i) Type of Vehicle', data.vehicleClass, 560.6);
  drawPermitField(
    doc,
    '(ii) Registration Mark',
    data.registrationNo,
    583.9
  );
  drawPermitField(
    doc,
    '(iii) Seating Capacity',
    data.seatingCapacity,
    607.25
  );
  drawPermitField(
    doc,
    '(iv) Gross Vehicle Weight',
    data.grossVehicleWeight,
    630.6
  );
  drawPermitField(
    doc,
    '4). Purpose Of Journey',
    '87(1)(A)- Will be granted for short period\n(FOR Passenger Vehicle)',
    653.9
  );
  drawPermitField(doc, '5). Permit Validity', data.permitValidity, 694.75);
  drawPermitField(
    doc,
    '6). Permit Issue Date',
    data.permitIssueDate,
    718.1
  );
}

function drawPageThree(doc, data) {
  drawSingleLine(doc, '7). Other Details Of Vehicle :', 44.2, 40.0, {
    size: 12,
    scaleX: 0.97
  });
  drawPermitField(doc, '(i) Fitness Validity', data.fitnessValidity, 64.7);
  drawPermitField(
    doc,
    '(ii) Insurance Validity',
    data.insuranceValidity,
    88.0
  );
  drawPermitField(doc, '(iii) PUCC Validity', data.puccValidity, 111.35);
  drawPermitField(
    doc,
    '(iv) Road Tax Validity',
    data.roadTaxValidity,
    134.7
  );

  drawSingleLine(doc, 'Note :', 44.2, 151.6, {
    font: 'Roboto-Bold',
    size: 9.7
  });
  drawSingleLine(doc, 'Terms and Conditions:', 43.95, 166.35, {
    font: 'Roboto-Bold',
    size: 9.5,
    color: '#000000'
  });

  const terms = data.terms || [];
  if (data.preserveReferenceTermBreaks) {
    const referenceLines = [
      ['1. This is a computer generated printout and no signature is', 56.91, 179.0],
      ['required.', 67.08, 193.22],
      ['2. Should not carry unlawful/unaccompanied goods.', 56.91, 207.44],
      ['3. If any false information/discrepancies are found at later,', 56.91, 221.66],
      ['necessary action will be taken against the vehicle owner/', 67.08, 235.88],
      ['driver.', 67.08, 250.1]
    ];
    referenceLines.forEach(([line, x, y]) => {
      drawSingleLine(doc, line, x, y, {
        font: 'Roboto',
        size: 9.48,
        color: BODY_COLOR,
        scaleX: 0.916
      });
    });
  } else {
    drawWrappedTerm(
      doc,
      1,
      terms[0] ||
        'This is a computer generated printout and no signature is required.',
      180.5
    );
    drawWrappedTerm(
      doc,
      2,
      terms[1] || 'Should not carry unlawful/unaccompanied goods.',
      208.94
    );
    drawWrappedTerm(
      doc,
      3,
      terms[2] ||
        'If any false information/discrepancies are found at later, necessary action will be taken against the vehicle owner/driver.',
      223.16
    );
  }

  drawSingleLine(
    doc,
    'Scan the QR code for genuinity of the receipt.',
    44.2,
    276.25,
    { font: 'Roboto-Bold', size: 16.45, color: '#000000' }
  );
}

async function generateReceipt(data, outputPath) {
  assertRuntimeFiles(data);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const qrBuffer = await buildQrBuffer(data);
  const grandTotal = data.taxItems.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );
  const grandTotalWords =
    data.grandTotalWords || numberToWordsIndian(grandTotal);

  const doc = new PDFDocument({
    size: [PAGE_WIDTH, PAGE_HEIGHT],
    margin: 0,
    autoFirstPage: false,
    compress: true,
    info: {
      Title: `${data.receiptNo} CheckPost Receipt`,
      Author: 'Transport Department Madhya Pradesh'
    }
  });
  registerFonts(doc);

  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  doc.addPage();
  drawBrowserChrome(doc, data, 1, 3);
  drawPageOneBackground(doc, data);
  drawPageOneHeader(doc, data, qrBuffer);
  drawPageOneFields(doc, data);

  doc.addPage();
  drawBrowserChrome(doc, data, 2, 3);
  drawPrintFrame(doc);
  drawPageTwoContinuation(doc, data);
  drawTaxTable(doc, data);
  drawPermitHeading(doc, data, grandTotal, grandTotalWords);
  drawPageTwoPermitDetails(doc, data);

  doc.addPage();
  drawBrowserChrome(doc, data, 3, 3);
  drawPrintFrame(doc);
  drawPageThree(doc, data);

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
}

module.exports = {
  generateReceipt,
  numberToWordsIndian
};
