/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Chhattisgarh single-page A4 (595x841) Checkpost Tax e-Receipt generator.
 *
 * Adapted from the supplied receipt-generator/Chhattisgarh project to the
 * project convention: returns a Buffer (no file write), uses the shared
 * committed Roboto TTFs under receipt-generator/fonts, draws the state seal
 * from public/Images, generates the QR from the signed verification URL, reads
 * the standard ReceiptData shape, renders the tax table as dynamic rows (any
 * zero/empty row is dropped upstream in buildReceiptData), and lets the two
 * capacity slots toggle for goods vehicles.
 */
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const PAGE = { width: 595, height: 841 };
const BLACK = '#000000';

const FONTS_DIR = path.join(process.cwd(), 'receipt-generator', 'fonts');
const FONT_FILES = {
  roboto:       path.join(FONTS_DIR, 'Roboto-Regular.ttf'),
  robotoBold:   path.join(FONTS_DIR, 'Roboto-Bold.ttf'),
  robotoItalic: path.join(FONTS_DIR, 'Roboto-Italic.ttf'),
};

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

  // Exact source geometry: 17 rows, x=27.392..540.507 pt.
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

  if (data.emblemImagePath && fs.existsSync(data.emblemImagePath)) {
    doc.save();
    doc.opacity(0.5);
    doc.image(data.emblemImagePath, 187.809021, 49.267273, {
      width: 203.4375,
      height: 218.75
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
    font: 'Roboto-Bold', size: 8.75, scaleX: 0.988
  });

  const printed = String(data.receiptPrintingDate || '').trim();
  const suffix = printed.endsWith(' AM') ? 'AM' : printed.endsWith(' PM') ? 'PM' : '';
  const dateTime = suffix ? printed.slice(0, -3) : printed;
  drawText(doc, dateTime, 27.804, 27.42, { font: 'Roboto-Bold', size: 8.75 });
  if (suffix) {
    drawText(doc, suffix, 27.423, 40.38, { font: 'Roboto-Bold', size: 8.75 });
  }

  drawText(doc, 'GOVERNMENT OF CHHATTISGARH', 181.357, 15.16, {
    font: 'Roboto-Bold', size: 13.125
  });
  doc.save().strokeColor(BLACK).lineWidth(0.486111)
    .moveTo(180.833328, 28.437439).lineTo(390.347229, 28.437439).stroke().restore();
  drawText(doc, 'Department of Transport', 225.922, 34.58, {
    font: 'Roboto-Bold', size: 11.8, scaleX: 0.9895
  });
  drawText(doc, 'Checkpost Tax e-Receipt', 230.901, 51.97, {
    font: 'Roboto-Bold', size: 10.6, scaleX: 1.01
  });
}

function drawField(doc, label, value, labelX, valueX, y, options = {}) {
  const lines = String(label).split('\n');
  lines.forEach((line, index) => {
    drawText(doc, line, labelX, y + index * 13.125, { size: 8.75 });
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

  drawField(doc, 'Registration No.', data.registrationNo, lx, lvTop, 71.052, { valueBold: true });
  drawField(doc, 'Receipt No.', data.receiptNo, lx, lvTop, 87.823);
  drawField(doc, 'Payment Initiation\nDate', data.paymentInitiationDate, lx, lvTop, 104.594, { valueYOffset: 6.562 });
  drawField(doc, 'Owner Name', data.ownerName, lx, lvTop, 134.489);

  drawField(doc, 'Chassis No.', data.chassisNo, lx, lv, 151.26);
  drawField(doc, 'Tax Mode', data.taxMode, rx, rv, 151.26);
  drawField(doc, 'Vehilce Type', data.vehicleType, lx, lv, 168.031);
  drawField(doc, 'Vehicle Class', data.vehicleClass, rx, 373.563, 168.031);
  drawField(doc, 'Mobile No.', data.mobileNo, lx, lv, 184.802);
  drawField(doc, 'Checkpost Name', data.checkpostName, rx, rv, 184.802);
  // Capacity slots toggle for goods vehicles (via buildReceiptData).
  drawField(doc, data.cap1Label, data.cap1Value, lx, lv, 201.573);
  drawField(doc, data.cap2Label, data.cap2Value, rx, rv, 201.573);
  drawField(doc, 'Bank Ref. No.', data.bankReferenceNo, lx, lv, 218.344);
  drawField(doc, 'Payment Mode', data.paymentMode, rx, 373.563, 218.344);

  drawField(doc, 'Service Type', data.serviceType, lx, lv, 249.698);
  drawField(doc, 'Permit Type', data.permitType, lx, lv, 273.76);
  drawField(doc, 'Permit Category', data.permitCategory, rx, rv, 273.76);
}

const TABLE = {
  left: 27.393333,
  right: 576.638611,
  topRuleY: 303.747437,
  headerRuleY: 317.358551,
  rowH: 13.611115,
  headerTextY: 305.71,
  feesHeadX: 379.459,
  fineHeadX: 445.361,
  totalHeadX: 510.914,
  feesRowX: 378.911,
  fineRowX: 444.816,
  totalRowX: 510.733,
};

// Returns the Y of the table's bottom rule so the footer can flow beneath it.
function drawTable(doc, data) {
  const T = TABLE;
  const items = Array.isArray(data.taxItems) ? data.taxItems : [];
  const rows = Math.max(items.length, 1);

  doc.save().fillColor(BLACK);
  doc.rect(T.left, T.topRuleY, T.right - T.left, 0.486114).fill();
  doc.rect(T.left, T.headerRuleY, T.right - T.left, 0.486114).fill();
  for (let i = 1; i <= rows; i += 1) {
    doc.rect(T.left, T.headerRuleY + i * T.rowH, T.right - T.left, 0.486084).fill();
  }
  doc.restore();

  drawText(doc, 'Particular', 27.94, T.headerTextY, { font: 'Roboto-Bold', size: 8.75, scaleX: 0.983 });
  drawText(doc, 'Fees/Tax', T.feesHeadX, T.headerTextY, { font: 'Roboto-Bold', size: 8.75, scaleX: 0.983 });
  drawText(doc, 'Fine', T.fineHeadX, T.headerTextY, { font: 'Roboto-Bold', size: 8.75, scaleX: 0.983 });
  drawText(doc, 'Total', T.totalHeadX, T.headerTextY, { font: 'Roboto-Bold', size: 8.75, scaleX: 0.983 });

  items.forEach((item, i) => {
    const rowTextY = T.headerRuleY + 1.853 + i * T.rowH;
    drawText(doc, item.particular || '', 27.392, rowTextY, { size: 8.75 });
    drawText(doc, String(item.fees ?? ''), T.feesRowX, rowTextY, { size: 8.75 });
    drawText(doc, String(item.fine ?? ''), T.fineRowX, rowTextY, { size: 8.75 });
    drawText(doc, String(item.total ?? ''), T.totalRowX, rowTextY, { size: 8.75 });
  });

  return T.headerRuleY + rows * T.rowH; // bottom rule Y
}

function drawFooter(doc, data, tableBottomY) {
  // Reference anchored the grand total 14.98pt below the table's bottom rule.
  const gtY = tableBottomY + 14.981;

  drawText(doc, 'Grand Total :', 27.324, gtY, { font: 'Roboto-Bold', size: 8.75, scaleX: 0.98 });
  if (data.rupeeGlyphPath && fs.existsSync(data.rupeeGlyphPath)) {
    doc.image(data.rupeeGlyphPath, 78.731407, gtY + 0.088, { width: 8.835785, height: 8.886719 });
  }
  drawText(doc, ` ${data.grandTotal}/- ( ${data.amountInWords})`, 86.795, gtY - 1.461, { size: 8.75 });

  drawText(doc, 'Note : 1) This is a computer generated printout and no signature is required.', 27.651, gtY + 11.88, { font: 'Roboto-Italic', size: 8.75 });
  drawText(doc, '2) Incorrect mentioning of vehicle class or seating capacity may lead to tax evasion and defaulter shall be liable for penal action.', 27.499, gtY + 25.005, { font: 'Roboto-Italic', size: 8.75 });

  drawText(doc, 'You will also receive the payment confirmation message.', 27.387, gtY + 56.2, { font: 'Roboto-Italic', size: 8.75 });

  const qrY = gtY + 71.56;
  drawText(doc, 'Scan the QR code for genuinity of the receipt, It should land at', 27.594, qrY, { font: 'Roboto-Bold', size: 13.125, scaleX: 0.9993 });
  drawText(doc, 'https://kms.parivahan.gov.in', 395.585, qrY + 0.094, { size: 13.125 });
  doc.save().strokeColor(BLACK).lineWidth(0.486111)
    .moveTo(395.694428, qrY + 13.427).lineTo(411.736115, qrY + 13.427)
    .moveTo(414.166656, qrY + 13.427).lineTo(466.666656, qrY + 13.427)
    .moveTo(469.097229, qrY + 13.427).lineTo(527.430542, qrY + 13.427)
    .moveTo(534.236084, qrY + 13.427).lineTo(561.458313, qrY + 13.427)
    .stroke().restore();
  drawText(doc, 'site. In case the URL is different, then receipt could be a fake one, please raise a complain.', 27.502, qrY + 19.7, { font: 'Roboto-Bold', size: 13.125 });
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
    receiptPrintingDate: input.printedOnDate || input.printedOn || '',
    watermarkDate: stripSecs(input.paymentInitDate || input.printedOnDate || ''),
    registrationNo: input.registrationNo || '',
    receiptNo: input.receiptNo || '',
    paymentInitiationDate: input.paymentInitDate || input.paymentInitializationDate || '',
    ownerName: input.ownerName || '',
    chassisNo: input.chassisNo || '',
    taxMode: input.taxMode || '',
    vehicleType: input.vehicleType || '',
    vehicleClass: input.vehicleClass || '',
    mobileNo: input.mobileNo || '',
    checkpostName: input.checkpostName || '',
    cap1Label: input.cap1Label || 'Unladen Weight',
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
    emblemImagePath: path.join(process.cwd(), 'public', 'Images', 'chhattisgarh-seal.png'),
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
      Title: 'Chhattisgarh Checkpost Tax e-Receipt',
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
  drawHeader(doc, data, qrBuffer);
  drawDetails(doc, data);
  const tableBottomY = drawTable(doc, data);
  drawFooter(doc, data, tableBottomY);
  doc.end();
  return done;
}

module.exports = { generateReceipt };
