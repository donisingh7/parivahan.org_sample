/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Karnataka single-page Letter (612x792) Checkpost Tax e-Receipt generator.
 *
 * Adapted from the supplied receipt-generator/Karnataka project to the project
 * convention: returns a Buffer (no file write), uses the shared committed
 * Roboto TTFs under receipt-generator/fonts (Roboto-Black is aliased to Bold —
 * we don't bundle a 900 weight), draws the logo + watermark from public/Images,
 * mints a live QR from the signed verification URL, reads the standard
 * ReceiptData shape, and renders the tax table as dynamic rows (any zero/empty
 * row is dropped upstream in buildReceiptData).
 */
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const PAGE = { width: 612, height: 792 };
const BLACK = '#000000';
const GRID = '#eeeeee';

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
  // No 900-weight in the bundled set — alias Black to Bold (near-identical).
  doc.registerFont('Roboto-Black', FONT_FILES.robotoBold);
}

function drawText(doc, value, x, y, options = {}) {
  const scaleX = options.scaleX || 1;
  doc.save();
  doc.translate(x, y);
  doc.scale(scaleX, 1);
  doc
    .font(options.font || 'Roboto')
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
  drawText(doc, label, labelX, y, { size: 9.75, font: options.labelFont || 'Roboto' });
  const rendered =
    value === undefined || value === null || value === '' ? ':' : `: ${value}`;
  drawText(doc, rendered, valueX, y, {
    size: 9.75,
    font: options.valueBold ? 'Roboto-Bold' : 'Roboto',
    scaleX: options.valueScaleX || 1
  });
}

async function makeQrBuffer(data) {
  return QRCode.toBuffer(data.qrValue || data.receiptNo || ' ', {
    type: 'png',
    width: 840,
    margin: 4,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#ffffff' }
  });
}

function drawImages(doc, data, qrBuffer) {
  if (data.logoImagePath && fs.existsSync(data.logoImagePath)) {
    doc.image(data.logoImagePath, 28.5, 39, { width: 96.75, height: 97.5 });
  }
  if (data.watermarkImagePath && fs.existsSync(data.watermarkImagePath)) {
    doc.save().opacity(0.5);
    doc.image(data.watermarkImagePath, 216, 163.5, { width: 225, height: 225 });
    doc.restore();
  }
  doc.image(qrBuffer, 474, 13.5, { width: 105, height: 105 });
}

function drawHeader(doc, data) {
  drawText(doc, 'Receipt Printing date', 28.5, 14.150393, { size: 9 });
  drawText(doc, data.receiptPrintingDate, 28.5, 26.900394, { size: 9 });

  drawText(doc, 'GOVERNMENT OF KARNATAKA', 198.140625, 14.475591, { size: 13.5, font: 'Roboto-Bold' });
  doc.save().fillColor(BLACK).rect(198.140625, 27.75, 191.671875, 0.75).fill().restore();
  drawText(doc, 'Department of Transport', 224.542969, 33.97559, { size: 13.5, font: 'Roboto-Bold' });
  drawText(doc, 'Checkpost Tax e-Receipt', 232.523438, 52.617191, { size: 12, font: 'Roboto-Bold' });

  doc.save().strokeColor(BLACK).lineWidth(0.75).rect(196.125, 81.375, 207, 19.5).stroke().restore();
  drawText(doc, `Receipt No.: ${data.receiptNo}`, 197.824219, 82.725594, { size: 13.5, font: 'Roboto-Bold' });
}

function drawDetails(doc, data) {
  const lx = 28.5;
  const lv = 114.105469;
  const rx = 370.933594;
  const rv = 456.539063;
  const rows = [147.70459, 172.45459, 197.95459, 222.70459, 248.20459, 272.95459, 298.45459, 323.95459, 348.70459, 374.20459];

  drawField(doc, 'Vehicle No.', data.vehicleNo, lx, lv, rows[0], { valueBold: true });
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

// Dynamic tax table (max 3 rows — the reference frame). A dropped zero-fee row
// leaves no empty ruled box.
function drawTable(doc, data) {
  drawBlackTableRule(doc, 399, false);
  drawBlackTableRule(doc, 414, false);

  drawText(doc, 'Particular', 28.5, 399.70459, { size: 9.75, font: 'Roboto-Bold' });
  drawText(doc, 'Fees/Tax', 390.128906, 399.70459, { size: 9.75, font: 'Roboto-Bold' });
  drawText(doc, 'Fine', 457.921875, 399.70459, { size: 9.75, font: 'Roboto-Bold' });
  drawText(doc, 'Total', 525.714844, 399.70459, { size: 9.75, font: 'Roboto-Bold' });

  const items = (data.taxItems || []).slice(0, 3);
  const rowTops = [414.75, 434.25, 453.75];
  const textY = [417.70459, 437.20459, 456.70459];
  items.forEach((item, index) => {
    drawRowBorder(doc, rowTops[index]);
    const y = textY[index];
    drawText(doc, item.particular || '', 29.25, y, { size: 9.75 });
    drawText(doc, String(item.fees ?? ''), index === 2 ? 390.972656 : 390.878906, y, { size: 9.75 });
    drawText(doc, String(item.fine ?? ''), 458.671875, y, { size: 9.75 });
    drawText(doc, String(item.total ?? ''), index === 2 ? 526.558594 : 526.464844, y, { size: 9.75 });
  });
}

function drawFooter(doc, data) {
  drawText(doc, 'Grand Total : ', 28.5, 481.400391, { size: 9, font: 'Roboto-Bold' });
  if (data.rupeeGlyphPath && fs.existsSync(data.rupeeGlyphPath)) {
    doc.image(data.rupeeGlyphPath, 81.75, 483.75, { width: 7.5, height: 7.5 });
  }
  drawText(doc, data.grandTotal, 91.464844, 481.400391, { size: 9, font: 'Roboto-Bold' });
  drawText(doc, `/- ( ${data.amountInWords} ONLY)`, 106.957031, 481.400391, { size: 9 });

  drawText(doc, 'Note : 1) This is a computer generated printout and no signature is required.', 28.5, 494.150391, { size: 9, font: 'Roboto-Italic' });
  drawText(doc, '2) Incorrect mentioning of vehicle class or seating capacity may lead to tax evasion and defaulter shall be liable for penal action.', 28.5, 506.900391, { size: 9, font: 'Roboto-Italic' });
  drawText(doc, 'You will also receive the payment confirmation message.', 28.5, 519.650391, { size: 9, font: 'Roboto-Italic' });

  drawText(doc, 'Scan the QR code for genuinity of the receipt, It should land at ', 28.5, 576.008789, { size: 10.5, font: 'Roboto-Black' });
  drawText(doc, 'https://kms.parivahan.gov.in', 325.628906, 576.008789, { size: 10.5 });
  drawText(doc, ' site. In case', 458.90625, 576.008789, { size: 10.5, font: 'Roboto-Black' });
  drawText(doc, 'the URL is different, then receipt could be a fake one, please raise a complain', 28.5, 591.008789, { size: 10.5, font: 'Roboto-Black' });
}

// Map the standard ReceiptData shape into this generator's field names.
function normalizeData(input) {
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
    receiptPrintingDate: input.printedOnDate || input.paymentDateText || '',
    receiptNo: input.receiptNo || '',
    vehicleNo: input.registrationNo || '',
    paymentDate: input.paymentInitDate || input.paymentDateText || '',
    ownerName: input.ownerName || '',
    mobileNo: input.mobileNo || '',
    chassisNo: input.chassisNo || '',
    taxMode: input.taxMode || '',
    vehicleType: input.vehicleType || '',
    vehicleClass: input.vehicleClass || '',
    permitType: input.permitType || 'NOT APPLICABLE',
    floorArea: input.floorArea || 'NA',
    ladenWeight: input.ladenWeight ?? '',
    unladenWeight: input.unladenWeight ?? '',
    permitValidity: input.permitValidity || '',
    fitnessValidity: input.fitnessValidity || '',
    insuranceValidity: input.insuranceValidity || '',
    taxValidity: input.taxValidity || '',
    checkpostName: input.checkpostName || '',
    bankReferenceNo: input.bankRefNo || '',
    paymentMode: input.paymentMode || 'ONLINE',
    paymentStatus: input.paymentStatus || 'SUCCESS',
    taxItems: items,
    grandTotal,
    amountInWords: input.amountInWords || '',
    logoImagePath: path.join(process.cwd(), 'public', 'Images', 'karnataka-logo.png'),
    watermarkImagePath: path.join(process.cwd(), 'public', 'Images', 'karnataka-watermark.png'),
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
      Title: 'Online Tax Payment Portal',
      Author: 'Government of Karnataka'
    }
  });

  const chunks = [];
  const done = new Promise((resolve, reject) => {
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  registerFonts(doc);
  drawImages(doc, data, qrBuffer);
  drawHeader(doc, data);
  drawDetails(doc, data);
  drawTable(doc, data);
  drawFooter(doc, data);
  doc.end();
  return done;
}

module.exports = { generateReceipt };
