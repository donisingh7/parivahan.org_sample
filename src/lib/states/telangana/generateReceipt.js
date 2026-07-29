/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Telangana single-page A4 (595x841) Checkpost Tax e-Receipt generator.
 *
 * Adapted from the supplied receipt-generator/Telangana project to the project
 * convention: returns a Buffer (no file write), uses the shared committed
 * Roboto TTFs under receipt-generator/fonts (plus the bundled sample watermark
 * font under receipt-generator/fonts-ts), draws the state seal from
 * public/Images, generates the QR from the signed verification URL, reads the
 * standard ReceiptData shape, renders the tax table as dynamic rows (any
 * zero/empty row is dropped upstream in buildReceiptData), and lets the two
 * capacity slots toggle for goods vehicles.
 *
 * Watermark font: the bundled reference-watermark.ttf only contains the sample
 * receipt's glyph subset, so for arbitrary registration numbers we default to
 * Roboto (full coverage). Set data.useReferenceWatermarkFont = true only when
 * the reg-no charset is known to be in the sample subset.
 */
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const PAGE = { width: 595, height: 841 };
const BLACK = '#000000';

const FONTS_DIR = path.join(process.cwd(), 'receipt-generator', 'fonts');
const TS_FONTS_DIR = path.join(process.cwd(), 'receipt-generator', 'fonts-ts');
const FONT_FILES = {
  roboto:       path.join(FONTS_DIR, 'Roboto-Regular.ttf'),
  robotoBold:   path.join(FONTS_DIR, 'Roboto-Bold.ttf'),
  robotoItalic: path.join(FONTS_DIR, 'Roboto-Italic.ttf'),
  watermarkReference: path.join(TS_FONTS_DIR, 'reference-watermark.ttf'),
};

function registerFonts(doc) {
  doc.registerFont('Roboto', FONT_FILES.roboto);
  doc.registerFont('Roboto-Bold', FONT_FILES.robotoBold);
  doc.registerFont('Roboto-Italic', FONT_FILES.robotoItalic);
  if (fs.existsSync(FONT_FILES.watermarkReference)) {
    try {
      doc.registerFont('Roboto-Reference-Watermark', FONT_FILES.watermarkReference);
    } catch { /* fall back to Roboto for the watermark */ }
  }
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
  doc.save().fillColor('#ffffff')
    .rect(5.518333, 5.518272, 583.963356, 758.963356).fill().restore();
}

function drawWatermarks(doc, data) {
  const stamp =
    `${data.registrationNo} / ${data.watermarkDate}, ` +
    `${data.registrationNo} / ${data.watermarkDate},`;

  const useRef = data.useReferenceWatermarkFont &&
    (() => { try { return !!doc._registeredFonts['Roboto-Reference-Watermark']; } catch { return false; } })();

  // Exact source geometry: 22 rows and a protected right boundary at 536.890 pt.
  doc.save();
  doc.rect(28.122, 12, 508.768, 430).clip();
  for (let row = 0; row < 22; row += 1) {
    drawText(doc, stamp, 28.122, 14.603 + row * 19.444444, {
      font: useRef ? 'Roboto-Reference-Watermark' : 'Roboto',
      size: 14.583,
      opacity: 0.2,
      scaleX: useRef ? 0.999019 : 0.999802
    });
  }
  doc.restore();

  if (data.sealImagePath && fs.existsSync(data.sealImagePath)) {
    doc.save();
    doc.opacity(0.6);
    doc.image(data.sealImagePath, 222.971069, 58.908508, {
      width: 147.777771, height: 147.777771
    });
    doc.restore();
  }
}

async function makeQrBuffer(data) {
  if (data.qrImagePath && fs.existsSync(data.qrImagePath)) {
    return fs.readFileSync(data.qrImagePath);
  }
  return QRCode.toBuffer(data.qrValue || data.receiptNo || ' ', {
    type: 'png',
    width: 1146,
    margin: 4,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#ffffff' }
  });
}

function drawHeader(doc, qrBuffer) {
  doc.image(qrBuffer, 459.840637, 12.617081, { width: 109.950684, height: 109.95066 });

  drawText(doc, 'GOVERNMENT OF TELANGANA', 175.532, 14.2, {
    font: 'Roboto-Bold', size: 15.3, scaleX: 0.9989
  });
  doc.save().strokeColor(BLACK).lineWidth(0.486111)
    .moveTo(175, 29.40966).lineTo(393.263885, 29.40966).stroke().restore();
  drawText(doc, 'Department of Transport', 218.762, 34.427, { size: 13.125 });
  drawText(doc, 'Checkpost Tax e-Receipt', 231.024, 51.524, { size: 10.938 });
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

  drawField(doc, 'Registration No.', data.registrationNo, lx, lvTop, 72.077, { valueBold: true });
  drawField(doc, 'Receipt No.', data.receiptNo, lx, lvTop, 90.55);
  drawField(doc, 'Payment Date', data.paymentDate, lx, 106.487, 109.022);
  drawField(doc, 'Owner Name', data.ownerName, lx, lvTop, 127.494);

  drawField(doc, 'Chassis No.', data.chassisNo, lx, lv, 153.258);
  drawField(doc, 'Tax Mode', data.taxMode, rx, rv, 153.258);
  drawField(doc, 'Vehilce Type', data.vehicleType, lx, lv, 171.73);
  drawField(doc, 'Vehicle Class', data.vehicleClass, rx, 415.735, 171.73);
  drawField(doc, 'Mobile No.', data.mobileNo, lx, 110.591, 190.202);
  drawField(doc, 'Checkpost Name', data.checkpostName, rx, 415.735, 190.202);
  // Capacity slots toggle for goods vehicles (via buildReceiptData).
  drawField(doc, data.cap1Label, data.cap1Value, lx, 110.61, 208.675);
  drawField(doc, data.cap2Label, data.cap2Value, 332.524, 415.742, 208.675);
  drawField(doc, 'Bank Ref. No.', data.bankReferenceNo, lx, lv, 227.147);
  drawField(doc, 'Payment Mode', data.paymentMode, rx, 415.735, 227.147);
  drawField(doc, 'Service Type', data.serviceType, lx, 110.591, 251.452);
  drawField(doc, 'Permit Type', data.permitType, lx, lv, 275.758);
  drawField(doc, 'Permit Category', data.permitCategory, rx, rv, 275.758);
}

const TABLE = {
  topRuleY: 299.129364,
  headerRuleY: 312.254364,
  rowH: 13.125,
  headerTextY: 300.76,
  segments: [
    [27.393333, 397.26358],
    [397.262634, 458.899597],
    [458.900543, 520.537476],
    [520.541382, 582.193909],
  ],
  particularRowX: 27.392,
  feesRowX: 397.262,
  fineRowX: 458.905,
  totalRowX: 520.54,
};

function drawTableRule(doc, y) {
  doc.save().fillColor(BLACK);
  for (const [x1, x2] of TABLE.segments) {
    doc.rect(x1, y, x2 - x1, 0.486115).fill();
  }
  doc.restore();
}

// Returns the Y of the table's bottom rule so the footer can flow beneath it.
function drawTable(doc, data) {
  const T = TABLE;
  const items = Array.isArray(data.taxItems) ? data.taxItems : [];
  const rows = Math.max(items.length, 1);

  drawTableRule(doc, T.topRuleY);
  drawTableRule(doc, T.headerRuleY);
  for (let i = 1; i <= rows; i += 1) {
    drawTableRule(doc, T.headerRuleY + i * T.rowH);
  }

  drawText(doc, 'Particular', 28.001, T.headerTextY, { font: 'Roboto-Bold', size: 9.479 });
  drawText(doc, 'Fees/Tax', 397.87, T.headerTextY, { font: 'Roboto-Bold', size: 9.479 });
  drawText(doc, 'Fine', 459.508, T.headerTextY, { font: 'Roboto-Bold', size: 9.479 });
  drawText(doc, 'Total', 520.739, T.headerTextY, { font: 'Roboto-Bold', size: 9.479 });

  items.forEach((item, i) => {
    const rowTextY = T.headerRuleY + 1.421 + i * T.rowH;
    drawText(doc, item.particular || '', T.particularRowX, rowTextY, { size: 9.479 });
    drawText(doc, String(item.fees ?? ''), T.feesRowX, rowTextY, { size: 9.479 });
    drawText(doc, String(item.fine ?? ''), T.fineRowX, rowTextY, { size: 9.479 });
    drawText(doc, String(item.total ?? ''), T.totalRowX, rowTextY, { size: 9.479 });
  });

  return T.headerRuleY + rows * T.rowH; // bottom rule Y
}

function drawFooter(doc, data, tableBottomY) {
  // Reference anchored the grand total 14.93pt below the table's bottom rule.
  const gtY = tableBottomY + 14.931;

  drawText(doc, 'Grand Total :', 27.338, gtY, { font: 'Roboto-Bold', size: 8.75 });
  if (data.rupeeGlyphPath && fs.existsSync(data.rupeeGlyphPath)) {
    doc.image(data.rupeeGlyphPath, 78.75, gtY - 0.06, { width: 7.777779, height: 8.795563 });
  }
  drawText(doc, `${data.grandTotal} ( ${data.amountInWords} ONLY/-)`, 88.105, gtY - 0.35, {
    font: 'Roboto-Bold', size: 9.479, scaleX: 0.9975
  });

  drawText(doc, 'Note : 1) This is a computer generated printout and no signature is required.', 27.667, gtY + 11.68, { font: 'Roboto-Italic', size: 9.479, scaleX: 0.9956 });
  drawText(doc, '2) Incorrect mentioning of vehicle class or seating capacity may lead to tax evasion and defaulter shall be liable for penal action', 27.499, gtY + 24.56, { font: 'Roboto-Italic', size: 9.479 });

  drawText(doc, 'You will also receive the payment confirmation message.', 27.448, gtY + 49.98, { font: 'Roboto-Italic', size: 9.479, scaleX: 1.002 });

  const qrY = gtY + 74.84;
  drawText(doc, 'Scan the QR code for genuinity of the receipt, It should land at', 27.532, qrY, { font: 'Roboto-Bold', size: 10.938, scaleX: 0.9955 });
  drawText(doc, 'https://kms.parivahan.gov.in', 333.071, qrY - 0.255, { size: 10.938 });
  doc.save().strokeColor(BLACK).lineWidth(0.486111)
    .moveTo(332.986115, qrY + 11.412).lineTo(346.111115, qrY + 11.412)
    .moveTo(348.541656, qrY + 11.412).lineTo(392.291656, qrY + 11.412)
    .moveTo(394.722229, qrY + 11.412).lineTo(442.847229, qrY + 11.412)
    .moveTo(448.680542, qrY + 11.412).lineTo(471.527771, qrY + 11.412)
    .stroke().restore();
  drawText(doc, 'site. In case the URL', 474.14, qrY + 0.2, { font: 'Roboto-Bold', size: 10.938, scaleX: 0.9952 });
  drawText(doc, 'is different, then receipt could be a fake one, please raise a complain', 27.536, qrY + 14.46, { font: 'Roboto-Bold', size: 10.938, scaleX: 0.9957 });
}

// Map the standard ReceiptData shape into this generator's field names.
function normalizeData(input) {
  const stripSecs = (s) =>
    String(s || '').replace(/(\d{1,2}:\d{2}):\d{2}(\s*[AP]M)?/i, '$1$2').trim();
  const items = (Array.isArray(input.taxItems) ? input.taxItems : []).map((it) => ({
    particular: it.particular || '',
    fees: it.fees ?? '',
    fine: it.fine ?? '',
    total: it.total ?? '',
  }));
  const grandTotal =
    input.amount != null
      ? String(input.amount)
      : String(items.reduce((s, it) => s + (Number(it.total) || 0), 0));

  return {
    // Bundled watermark font only covers the sample subset — default to Roboto
    // so arbitrary registration numbers always render fully.
    useReferenceWatermarkFont: false,
    watermarkDate: stripSecs(input.paymentInitDate || input.printedOnDate || ''),
    registrationNo: input.registrationNo || '',
    receiptNo: input.receiptNo || '',
    paymentDate: input.paymentInitDate || input.paymentDateText || '',
    ownerName: input.ownerName || '',
    chassisNo: input.chassisNo || '',
    taxMode: input.taxMode || '',
    vehicleType: input.vehicleType || '',
    vehicleClass: input.vehicleClass || '',
    mobileNo: input.mobileNo || '',
    checkpostName: input.checkpostName || '',
    cap1Label: input.cap1Label || 'Sleeper Cap.',
    cap2Label: input.cap2Label || 'Laden Weight',
    cap1Value: input.cap1Value ?? '',
    cap2Value: input.cap2Value ?? '',
    bankReferenceNo: input.bankRefNo || '',
    paymentMode: input.paymentMode || 'ONLINE',
    serviceType: input.serviceType || '',
    permitType: input.permitType || '',
    permitCategory: input.permitCategory || '',
    taxItems: items,
    grandTotal,
    amountInWords: input.amountInWords || '',
    sealImagePath: path.join(process.cwd(), 'public', 'Images', 'telangana-seal.png'),
    rupeeGlyphPath: path.join(process.cwd(), 'public', 'Images', 'rupee-glyph.png'),
    qrValue: input.qrUrl || input.receiptNo || '',
  };
}

async function generateReceipt(input) {
  const data = normalizeData(input);
  const qrBuffer = await makeQrBuffer(data);

  const doc = new PDFDocument({
    size: [PAGE.width, PAGE.height],
    margin: 0,
    autoFirstPage: true,
    compress: true,
    info: {
      Title: 'Telangana Checkpost Tax e-Receipt',
      Author: 'Department of Transport'
    }
  });

  const chunks = [];
  const done = new Promise((resolve, reject) => {
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  registerFonts(doc);
  drawPageFrame(doc);
  drawWatermarks(doc, data);
  drawHeader(doc, qrBuffer);
  drawDetails(doc, data);
  const tableBottomY = drawTable(doc, data);
  drawFooter(doc, data, tableBottomY);
  doc.end();
  return done;
}

module.exports = { generateReceipt };
