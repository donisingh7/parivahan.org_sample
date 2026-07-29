/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Tamil Nadu single-page (Letter 612x792) CheckPost receipt generator.
 *
 * Adapted from the supplied receipt-generator/Tamilnadu project to the project
 * convention: returns a Buffer (no file write), uses the bundled Segoe/Arial
 * TTFs under receipt-generator/fonts-tn, draws the emblem from public/Images,
 * generates the QR from the signed verification URL, reads the standard
 * ReceiptData shape, and lets the two capacity labels toggle for goods
 * vehicles (Gross/Unladen Wt) vs passenger (Seating/Sleeper).
 */
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const PAGE = { width: 612, height: 792 };
const BODY_COLOR = '#212529';
const TABLE_BORDER = '#9fc4e3';
const WATERMARK_PRINT_AREA = {
  x: 28.5,
  y: 28.5,
  width: 555.375,
  height: 400
};
const WATERMARK_PROTECTION_EDGE = 584;

// Bundled Tamil Nadu fonts (Segoe UI + Arial) — committed under
// receipt-generator/fonts-tn so the exact reference typefaces are available.
const FONTS_DIR = path.join(process.cwd(), 'receipt-generator', 'fonts-tn');
const FONT_FILES = {
  segoeBold: path.join(FONTS_DIR, 'SegoeUI-Bold.ttf'),
  segoe:     path.join(FONTS_DIR, 'SegoeUI.ttf'),
  arialBold: path.join(FONTS_DIR, 'Arial-BoldMT.ttf'),
  arial:     path.join(FONTS_DIR, 'ArialMT.ttf')
};

function registerFonts(doc) {
  doc.registerFont('SegoeUI-Bold', FONT_FILES.segoeBold);
  doc.registerFont('SegoeUI', FONT_FILES.segoe);
  doc.registerFont('Arial-Bold', FONT_FILES.arialBold);
  doc.registerFont('Arial', FONT_FILES.arial);
}

function drawText(doc, value, x, y, options = {}) {
  const scaleX = options.scaleX || 1;
  doc.save();
  doc.translate(x, y);
  doc.scale(scaleX, 1);
  doc
    .font(options.font || 'SegoeUI-Bold')
    .fontSize(options.size || 8)
    .fillColor(options.color || BODY_COLOR);
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

function drawDynamicTextWatermark(doc, data) {
  const watermark = `${data.registrationNo} ${data.watermarkDate}`;
  const row = `${watermark}  ${watermark}  ${watermark}  ${watermark}`;
  for (let y = 35.5; y <= 414; y += 15.5) {
    drawText(doc, row, 28.5, y, {
      font: 'SegoeUI',
      size: 10,
      color: '#000000',
      opacity: 0.2
    });
  }
}

function drawWatermarks(doc, data) {
  // Chrome clips the repeating watermark layer to the printable content box.
  // This preserves the source PDF's 28.125 pt white margin on the right.
  doc.save();
  doc
    .rect(
      WATERMARK_PRINT_AREA.x,
      WATERMARK_PRINT_AREA.y,
      WATERMARK_PRINT_AREA.width,
      WATERMARK_PRINT_AREA.height
    )
    .clip();

  if (
    data.referenceTextWatermarkPath &&
    fs.existsSync(data.referenceTextWatermarkPath)
  ) {
    doc.image(data.referenceTextWatermarkPath, 28.5, 28.5, {
      width: 772,
      height: 400
    });
  } else {
    drawDynamicTextWatermark(doc, data);
  }
  doc.restore();

  // Protect the margin with an opaque strip as well as a clipping path. This
  // makes the source margin deterministic across PDF viewers and renderers.
  doc
    .save()
    .fillColor('#ffffff')
    .rect(
      WATERMARK_PROTECTION_EDGE,
      WATERMARK_PRINT_AREA.y,
      PAGE.width - WATERMARK_PROTECTION_EDGE,
      WATERMARK_PRINT_AREA.height
    )
    .fill()
    .restore();

  if (data.emblemImagePath && fs.existsSync(data.emblemImagePath)) {
    doc.save();
    doc.opacity(0.3);
    doc.image(data.emblemImagePath, 218.5, 153.5, {
      width: 150,
      height: 150
    });
    doc.restore();
  }
}

async function makeQrBuffer(data) {
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

function drawBrowserChrome(doc, data) {
  drawText(doc, data.browserPrintedAt, 24, 15.262, {
    font: 'Arial',
    size: 7.995,
    color: '#000000'
  });
  drawText(doc, data.documentTitle, 321.234, 15.262, {
    font: 'Arial',
    size: 7.995,
    color: '#000000'
  });
  drawText(doc, data.documentUrl, 24, 768.262, {
    font: 'Arial',
    size: 7.995,
    color: '#000000'
  });
  drawText(doc, data.pageNumber || '1/1', 576.867, 768.262, {
    font: 'Arial',
    size: 7.995,
    color: '#000000'
  });
}

function drawHeader(doc, data, qrBuffer) {
  if (data.emblemImagePath && fs.existsSync(data.emblemImagePath)) {
    doc.image(data.emblemImagePath, 81, 57.5, {
      width: 70,
      height: 70,
      link: 'https://services.parivahan.gov.in/checkpostv4/'
    });
  }
  doc.image(qrBuffer, 401, 41, { width: 100, height: 100 });

  drawText(doc, `Printed on : ${data.printedOn}`, 458.625, 29.946, {
    size: 7
  });
  drawText(doc, 'GOVERNMENT OF TAMIL NADU', 246.094, 75.907, {
    size: 7.5,
    color: '#000000',
    scaleX: 0.99542
  });
  doc
    .save()
    .fillColor('#000000')
    .rect(246.094, 84.5, 112.805, 0.5)
    .fill()
    .restore();
  drawText(doc, 'Department of Transport', 259.188, 86.867, {
    size: 8,
    scaleX: 0.99653
  });
  drawText(doc, 'Checkpost Tax e-Receipt', 264.32, 99.09, {
    size: 7.33,
    scaleX: 0.99059
  });
}

function drawField(doc, label, value, labelX, valueX, y) {
  String(label)
    .split('\n')
    .forEach((line, index) => {
      drawText(doc, line, labelX, y + index * 12, {
        size: 8,
        scaleX: 0.99705
      });
    });
  const renderedValue =
    value === undefined || value === null || value === '' ? ':' : `: ${value}`;
  drawText(doc, renderedValue, valueX, y, {
    size: 8,
    scaleX: 0.99705
  });
}

function drawDetails(doc, data) {
  const lx = 34.5;
  const lv = 127.078;
  const rx = 312.242;
  const rv = 404.82;

  drawField(doc, 'Registration No.', data.registrationNo, lx, lv, 168.867);
  drawField(doc, 'Receipt No.', data.receiptNo, rx, rv, 168.867);

  drawField(
    doc,
    'Payment\nInitialization Date',
    data.paymentInitializationDate,
    lx,
    lv,
    184.867
  );
  drawField(doc, 'Owner Name.', data.ownerName, rx, rv, 184.867);

  drawField(doc, 'Chassis No.', data.chassisNo, lx, lv, 212.867);
  drawField(doc, 'Tax Mode', data.taxMode, rx, rv, 212.867);

  drawField(doc, 'Vehilce Type', data.vehicleType, lx, lv, 228.867);
  drawField(doc, 'Vehicle Class', data.vehicleClass, rx, rv, 228.867);

  drawField(doc, 'Vehicle Category', data.vehicleCategory, lx, lv, 244.867);
  drawField(doc, 'Mobile No.', data.mobileNo, rx, rv, 244.867);

  drawField(doc, 'CheckPost Name', data.checkpostName, lx, lv, 260.867);
  drawField(
    doc,
    data.cap1Label || 'Gross Vehicle Wt(In.\nKg)',
    data.grossVehicleWeight,
    rx,
    rv,
    260.867
  );

  drawField(doc, data.cap2Label || 'Unladen Wt(In Kg.)', data.unladenWeight, lx, lv, 288.867);
  drawField(doc, 'Bank Ref. No.', data.bankReferenceNo, rx, rv, 288.867);

  drawField(doc, 'Payment Mode', data.paymentMode, lx, lv, 304.867);
  drawField(doc, 'Permit Number', data.permitNumber, rx, rv, 304.867);

  drawField(doc, 'Permit Validity', data.permitValidity, lx, lv, 320.867);
  drawField(doc, 'Fitness Validity', data.fitnessValidity, rx, rv, 320.867);

  drawField(
    doc,
    'Insurance Validity',
    data.insuranceValidity,
    lx,
    lv,
    336.867
  );
  drawField(doc, 'PUCC Validity', data.puccValidity, rx, rv, 336.867);

  drawField(doc, 'Service Type', data.serviceType, lx, lv, 352.867);
  drawField(doc, 'Permit Type', data.permitType, rx, rv, 352.867);

  drawField(
    doc,
    'Green Tax Validity',
    data.greenTaxValidity,
    lx,
    lv,
    368.867
  );
  drawField(
    doc,
    'Base Permit Validity',
    data.basePermitValidity,
    rx,
    rv,
    368.867
  );

  drawField(
    doc,
    'Payment\nConfirmation Date',
    data.paymentConfirmationDate,
    lx,
    lv,
    384.867
  );
}

function drawTable(doc, data) {
  const xs = [34.5, 375, 438.5, 502.5, 566];
  const ys = [416.5, 433, 454.5, 475, 495.5, 516];

  doc.save().fillColor(TABLE_BORDER);
  for (let i = 0; i < xs.length; i += 1) {
    doc.rect(xs[i], ys[0], 0.5, ys[5] - ys[0]).fill();
  }
  doc.rect(xs[0], ys[0], xs[4] - xs[0], 0.5).fill();
  doc.rect(xs[0], ys[1], xs[4] - xs[0], 1).fill();
  for (let i = 2; i < ys.length; i += 1) {
    doc.rect(xs[0], ys[i], xs[4] - xs[0], 0.5).fill();
  }
  doc.restore();

  drawText(doc, 'Tax/Fee Particular', 182.156, 421.248, { size: 5.33 });
  drawText(doc, 'Tax/Fees', 395.578, 421.248, { size: 5.33 });
  drawText(doc, 'Fine', 464.961, 421.248, { size: 5.33 });
  drawText(doc, 'Total', 527.703, 421.248, { size: 5.33 });

  const textYs = [438.367, 458.867, 479.367, 499.867];
  const numberYs = [438.248, 458.748, 479.248, 499.748];
  const particularScale = [0.99403, 0.99024, 0.98973, 0.99782];
  (data.taxItems || []).slice(0, 4).forEach((item, index) => {
    drawText(doc, item.particular, 39, textYs[index], {
      size: 8,
      color: '#000000',
      scaleX: particularScale[index]
    });
    drawText(doc, item.fees, 378.836, numberYs[index], {
      size: 5.33,
      color: '#000000'
    });
    drawText(doc, item.fine, 442.555, numberYs[index], {
      size: 5.33,
      color: '#000000'
    });
    drawText(doc, item.total, 506.273, numberYs[index], {
      size: 5.33,
      color: '#000000'
    });
  });
}

function drawFooterContent(doc, data) {
  const total = (data.taxItems || []).reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );
  drawText(
    doc,
    `Grand Total : ${total}/- ${data.amountInWords} Rupees Only`,
    34.5,
    524.486,
    { size: 6.5, color: '#000000', scaleX: 0.99725 }
  );
  drawText(doc, 'Note :', 34.5, 534.986, {
    size: 6.5,
    color: '#000000'
  });
  drawText(doc, 'Terms and Conditions:', 34.5, 545.486, {
    size: 6.5,
    color: '#000000'
  });

  const termYs = [555.486, 565.486, 574.986];
  (data.terms || []).forEach((term, index) => {
    String(term)
      .split('\n')
      .forEach((line, lineIndex) => {
        drawText(
          doc,
          `${lineIndex === 0 ? `${index + 1}. ` : ''}${line}`,
          lineIndex === 0 ? 43.805 : 50.5,
          termYs[index] + lineIndex * 10,
          { font: 'SegoeUI', size: 6.5 }
        );
      });
  });

  drawText(doc, 'Scan the QR code for genuinity of the receipt.', 34.5, 602.259, {
    font: 'Arial-Bold',
    size: 11.865,
    color: '#000000'
  });
}

// Map the standard ReceiptData shape into the field names this generator's
// drawing code expects, filling TN defaults.
function normalizeData(input) {
  const pad = (n) => String(n).padStart(2, '0');
  const stripSecs = (s) =>
    String(s || '').replace(/(\d{1,2}:\d{2}):\d{2}(\s*[AP]M)?/i, '$1$2').trim();
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const browserPrintedAt = `${pad(ist.getUTCDate())}/${pad(ist.getUTCMonth() + 1)}/${ist.getUTCFullYear()}, ${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}`;

  return {
    browserPrintedAt,
    documentTitle: 'CheckPost V4.7.3',
    documentUrl: 'https://services.parivahan.gov.in/checkpostv4/#/public/reports/CustomerReceipt',
    pageNumber: '1/1',
    printedOn: input.printedOnDate || input.printedOn || '',
    watermarkDate: stripSecs(input.paymentInitDate || input.printedOnDate || ''),
    registrationNo: input.registrationNo || '',
    receiptNo: input.receiptNo || '',
    paymentInitializationDate: input.paymentInitDate || input.paymentInitializationDate || '',
    ownerName: input.ownerName || '',
    chassisNo: input.chassisNo || '',
    taxMode: input.taxMode || '',
    vehicleType: input.vehicleType || '',
    vehicleClass: input.vehicleClass || '',
    vehicleCategory: input.vehicleCategory || '',
    mobileNo: input.mobileNo || '',
    checkpostName: input.checkpostName || '',
    // Capacity labels/values toggle for goods vehicles (via buildReceiptData).
    cap1Label: input.cap1Label || 'Gross Vehicle Wt(In.\nKg)',
    cap2Label: input.cap2Label || 'Unladen Wt(In Kg.)',
    grossVehicleWeight: input.cap1Value ?? input.grossVehicleWt ?? '',
    unladenWeight: input.cap2Value ?? input.unladenWt ?? '',
    bankReferenceNo: input.bankRefNo || '',
    paymentMode: input.paymentMode || 'ONLINE',
    permitNumber: input.permitNumber || '',
    permitValidity: input.permitValidity || '',
    fitnessValidity: input.fitnessValidity || '',
    insuranceValidity: input.insuranceValidity || '',
    puccValidity: input.puccValidity || '',
    serviceType: input.serviceType || '',
    permitType: input.permitType || '',
    greenTaxValidity: input.greenTaxValidity || '',
    basePermitValidity: input.basePermitValidity || '',
    paymentConfirmationDate: input.paymentConfirmDate || input.paymentConfirmationDate || '',
    taxItems: Array.isArray(input.taxItems) ? input.taxItems : [],
    amountInWords: input.amountInWords || '',
    terms: [
      'This is a computer generated printout and no signature is required.',
      'Should not carry unlawful/unaccompanied goods.',
      'If any false information/discrepancies are found at later, necessary action will be taken against the\nvehicle owner/driver.',
    ],
    emblemImagePath: path.join(process.cwd(), 'public', 'Images', 'tamil-nadu-emblem.png'),
    qrValue: input.qrUrl || input.receiptNo || '',
  };
}

async function generateReceipt(input) {
  const data = normalizeData(input);
  const qrBuffer = await makeQrBuffer(data);

  const doc = new PDFDocument({
    autoFirstPage: false,
    size: [PAGE.width, PAGE.height],
    margin: 0,
    compress: true,
    info: {
      Title: 'CheckPost V4.7.3',
      Author: 'Department of Transport, Government of Tamil Nadu'
    }
  });

  const chunks = [];
  const done = new Promise((resolve, reject) => {
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  registerFonts(doc);

  doc.addPage({ size: [PAGE.width, PAGE.height], margin: 0 });
  drawWatermarks(doc, data);
  drawHeader(doc, data, qrBuffer);
  drawDetails(doc, data);
  drawTable(doc, data);
  drawFooterContent(doc, data);
  drawBrowserChrome(doc, data);

  doc.end();
  return done;
}

module.exports = { generateReceipt };
