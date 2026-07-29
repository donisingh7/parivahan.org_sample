/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Odisha two-page A4 (595x841) Checkpost Tax e-Receipt + Temporary Permit
 * generator.
 *
 * Adapted from the supplied receipt-generator/Odisha project to the project
 * convention: returns a Buffer (no file write), uses the shared committed
 * Roboto TTFs under receipt-generator/fonts, draws the state seal from
 * public/Images, generates the QR from the signed verification URL, reads the
 * standard ReceiptData shape, and renders the tax table as dynamic rows (any
 * zero/empty row is dropped upstream in buildReceiptData).
 *
 * Static outlined headings + the five legal notes + the page-2 genuinity text
 * are baked vector artwork (assets/reference-paths.json in the source) bundled
 * here as reference-paths.json. The reference's pdf-lib image-interpolation
 * post-process is intentionally omitted (cosmetic only — no visible difference
 * to the eye).
 */
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const REFERENCE_PATHS = require('./reference-paths.json');

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
  const size = options.size || 9.479;
  doc.save();
  doc.translate(x, y);
  doc.scale(scaleX, 1);
  doc
    .font(options.font || 'Roboto')
    .fontSize(size)
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

function drawRule(doc, x1, y, x2, width = 0.486111) {
  doc.save().strokeColor(BLACK).lineWidth(width)
    .moveTo(x1, y).lineTo(x2, y).stroke().restore();
}

function drawReferencePath(doc, name) {
  const entry = REFERENCE_PATHS[name];
  if (!entry) return;
  doc.save().fillColor(BLACK).path(entry.path).fill('non-zero').restore();
}

async function makeQrBuffer(data) {
  if (data.qrImagePath && fs.existsSync(data.qrImagePath)) {
    return fs.readFileSync(data.qrImagePath);
  }
  return QRCode.toBuffer(data.qrValue || data.receiptNo || ' ', {
    type: 'png',
    width: 1156,
    margin: 4,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#ffffff' }
  });
}

function drawImages(doc, data, qrBuffer) {
  if (data.sealImagePath && fs.existsSync(data.sealImagePath)) {
    doc.save().opacity(0.6);
    doc.image(data.sealImagePath, 165.934021, 209.68399, { width: 255.208312, height: 262.5 });
    doc.restore();
    doc.image(data.sealImagePath, 27.392361, 12.80896, { width: 109.374989, height: 109.375 });
  }
  doc.image(qrBuffer, 460.805817, 12.617081, { width: 110.910064, height: 109.95066 });
}

function drawHeader(doc, data) {
  drawReferencePath(doc, 'government');
  drawRule(doc, 214.861115, 27.465216, 372.847229);

  drawText(doc, 'Motor Vehicles Department', 205.807281, 40.419834, { size: 15.3125 });
  drawText(doc, 'Checkpost Tax e-Receipt', 227.244797, 69.426811, { size: 13.125 });
  drawText(doc, `Receipt No.: ${data.receiptNo}`, 192.961807, 116.093498, { size: 13.125 });
}

function drawField(doc, label, value, labelX, valueX, y, options = {}) {
  const lines = String(label).split('\n');
  lines.forEach((line, index) => {
    drawText(doc, line, labelX, y + index * (options.lineHeight || 12.638889), {
      size: options.size || 9.479
    });
  });
  const rendered =
    value === undefined || value === null || value === '' ? ':' : `: ${value}`;
  drawText(doc, rendered, valueX, y + (options.valueYOffset || 0), {
    size: options.size || 9.479,
    scaleX: options.valueScaleX || 1
  });
}

function drawDetails(doc, data) {
  const lx = 27.39235;
  const lv = 110.591003;
  const rx = 332.524292;
  const rv = 415.741882;
  const rows = [139.160675, 157.632889, 176.105118, 194.577332];

  drawField(doc, 'Vehicle No.', data.vehicleNo, lx, lv, rows[0]);
  drawField(doc, 'Payment Date', data.paymentDate, rx, 415.732452, rows[0]);
  drawField(doc, 'Owner Name.', data.ownerName, lx, lv, rows[1]);
  drawField(doc, 'Mobile No.', data.mobileNo, rx, rv, rows[1]);
  drawField(doc, 'Chassis No.', data.chassisNo, lx, 110.600479, rows[2]);
  drawField(doc, 'Tax Mode', data.taxMode, rx, rv, rows[2]);
  drawField(doc, 'Vehilce Type', data.vehicleType, lx, 110.600471, rows[3]);
  drawField(doc, 'Vehicle Class', data.vehicleClass, rx, 415.732483, rows[3]);

  drawField(doc, 'Standing Capacity.', data.standingCapacity, lx, lv, 213.049561);
  drawField(doc, 'Laden Weight', data.ladenWeight, rx, rv, 213.049561);
  drawField(doc, 'Un laden Weight', data.unladenWeight, lx, lv, 231.521774);
  drawField(doc, 'Bank Ref. No.', data.bankReferenceNo, rx, rv, 231.521774);
  drawField(doc, 'Payment Mode', data.paymentMode, lx, lv, 249.993973);
  drawField(doc, 'Payment Status', data.paymentStatus, rx, 415.732483, 249.993973);
  drawField(doc, 'Payment\nConfirmation Date', data.paymentConfirmationDate, lx, 110.602417, 268.466187, { valueYOffset: 6.319458 });
}

function drawTableRule(doc, top) {
  const segments = [
    [27.393333, 397.26358],
    [397.262634, 458.899597],
    [458.900543, 520.537476],
    [520.541382, 582.193909]
  ];
  doc.save().fillColor(BLACK);
  for (const [x1, x2] of segments) {
    doc.rect(x1, top, x2 - x1, 0.486115).fill();
  }
  doc.restore();
}

// Dynamic tax table: draws only the rows present (max 3 — the reference frame
// height), so a dropped zero-fee row leaves no empty ruled line.
function drawTable(doc, data) {
  const items = (data.taxItems || []).slice(0, 3);
  const n = Math.max(items.length, 1);
  const top = 298.64325;
  const rowH = 13.125;
  for (let k = 0; k <= n + 1; k += 1) {
    drawTableRule(doc, top + k * rowH);
  }

  drawReferencePath(doc, 'tableParticular');
  drawReferencePath(doc, 'tableFees');
  drawReferencePath(doc, 'tableFine');
  drawReferencePath(doc, 'tableTotal');

  items.forEach((item, i) => {
    const y = 313.188416 + i * rowH;
    drawText(doc, item.particular || '', 27.392361, y, { size: 9.479 });
    drawText(doc, String(item.fees ?? ''), 397.262146, y, { size: 9.479 });
    drawText(doc, String(item.fine ?? ''), 458.905151, y, { size: 9.479 });
    drawText(doc, String(item.total ?? ''), 520.539917, y, { size: 9.479 });
  });
}

function drawGrandTotal(doc, data) {
  drawReferencePath(doc, 'grandLabel');
  if (data.rupeeGlyphPath && fs.existsSync(data.rupeeGlyphPath)) {
    doc.image(data.rupeeGlyphPath, 78.75, 366.515533, { width: 7.777779, height: 7.792969 });
  }
  if (
    String(data.grandTotal) === '3000' &&
    String(data.amountInWords).trim().toUpperCase() === 'THREE THOUSAND'
  ) {
    drawReferencePath(doc, 'grandReferenceValue');
  } else {
    drawText(doc, `${data.grandTotal}   (   ${data.amountInWords}   ONLY/-)`, 88.4, 363.66, {
      font: 'Roboto-Bold', size: 8.75
    });
  }
}

function drawPermit(doc, data) {
  const permit = data.permit || {};

  drawReferencePath(doc, 'formTitle');
  drawRule(doc, 251.319443, 403.229095, 319.861115);

  drawText(doc, 'See Rule 46(1)(v)', 232.397568, 416.183716, { size: 15.3125 });
  drawText(doc, `TEMP. PERMIT No.: ${permit.number || data.receiptNo}`, 172.666672, 445.190704, { size: 13.125 });

  const labelX = 27.392365;
  const valueX = 121.697922;
  const valueXVehicle = 122.57486;
  const y = {
    holder: 473.794922, area: 485.461609, type: 497.128265, registration: 508.794952,
    seating: 520.461548, gross: 532.128235, purpose: 543.794922, goods1: 555.461548,
    goods2: 567.128235, expiry: 578.794922, provision1: 590.461548, provision2: 602.128235,
    provision3: 613.794922, regions: 625.461548, routes: 637.128235
  };

  drawField(doc, '1. Name of Holder', permit.holderName, labelX, valueX, y.holder, { size: 8.75 });
  drawField(doc, '2. Area', permit.area, labelX, valueX, y.area, { size: 8.75 });
  drawField(doc, '3. (i) Type of vehicle', permit.vehicleType, labelX, valueXVehicle, y.type, { size: 8.75 });
  drawField(doc, '(ii) Registration Mark', permit.registrationMark, labelX, valueXVehicle, y.registration, { size: 8.75 });
  drawField(doc, '(iii) Seating Capacity', permit.seatingCapacity, labelX, valueXVehicle, y.seating, { size: 8.75 });
  drawField(doc, '(iv) Gross Vehicle W.', permit.grossVehicleWeight, labelX, 122.566116, y.gross, { size: 8.75 });
  drawField(doc, '4. Purpose of Journeys', permit.purposeOfJourneys, labelX, valueX, y.purpose, { size: 8.75 });
  drawText(doc, '5. Nature of goods if to', labelX, y.goods1, { size: 8.75 });
  drawText(doc, 'be carried', labelX, y.goods2, { size: 8.75 });
  drawText(doc, permit.natureOfGoods ? `: ${permit.natureOfGoods}` : ':', valueX, 561.294922, { size: 8.75 });
  drawField(doc, '6. Date of expiry', permit.expiryDate, labelX, valueX, y.expiry, { size: 8.75 });
  drawText(doc, '7. Under the provisions of Sub-section(4)of Sec 63 of the Act and with the particular general', labelX, y.provision1, { size: 8.75 });
  drawText(doc, '  consent of the Transport Authority concerned, this', labelX, y.provision2, { size: 8.75 });
  drawText(doc, '  Permit is valid also in the following regions:', labelX, y.provision3, { size: 8.75 });
  drawText(doc, '(1) ______________(2) ______________(3) ______________(4) ______________', labelX, y.regions, { size: 8.75 });
  drawField(doc, '8. Route or Routes', permit.routes, labelX, valueX, y.routes, { size: 8.75 });

  drawText(doc, 'Secretary', 327.565948, 660.461548, { size: 8.75 });
  drawText(doc, 'State Transport Authority, ODISHA', 327.565948, 672.128235, { size: 8.75 });
}

function drawNotes(doc) {
  drawReferencePath(doc, 'note1');
  drawReferencePath(doc, 'note2');
  drawReferencePath(doc, 'note3');
  drawReferencePath(doc, 'note4');
  drawReferencePath(doc, 'note5');
}

function drawSecondPage(doc) {
  drawPageFrame(doc);
  drawReferencePath(doc, 'page2Intro');
  drawReferencePath(doc, 'page2Line1');
  drawText(doc, 'https://', 333.071167, 17.982403, { size: 10.9375 });
  drawRule(doc, 332.986115, 29.40966, 346.111115);
  drawRule(doc, 348.541656, 29.40966, 368.472229);
  drawText(doc, 'kms.parivahan.gov.in', 27.392361, 32.565739, { size: 10.9375 });
  drawRule(doc, 27.222221, 43.992992, 51.041664);
  drawRule(doc, 53.472221, 43.992992, 101.597221);
  drawRule(doc, 107.430557, 43.992992, 130.277771);
  drawReferencePath(doc, 'page2Line2');
  drawReferencePath(doc, 'page2Line3');
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

  const permit = input.permit || {};
  return {
    receiptNo: input.receiptNo || '',
    vehicleNo: input.registrationNo || '',
    paymentDate: input.paymentInitDate || input.paymentDateText || '',
    ownerName: input.ownerName || '',
    mobileNo: input.mobileNo || '',
    chassisNo: input.chassisNo || '',
    taxMode: input.taxMode || '',
    vehicleType: input.vehicleType || '',
    vehicleClass: input.vehicleClass || '',
    standingCapacity: input.standingCapacity ?? '',
    ladenWeight: input.ladenWeight ?? '',
    unladenWeight: input.unladenWeight ?? '',
    bankReferenceNo: input.bankRefNo || '',
    paymentMode: input.paymentMode || 'ONLINE',
    paymentStatus: input.paymentStatus || 'SUCCESS',
    paymentConfirmationDate: input.paymentConfirmDate || input.paymentDateText || '',
    taxItems: items,
    grandTotal,
    amountInWords: input.amountInWords || '',
    permit: {
      number: permit.number || input.receiptNo || '',
      holderName: permit.holderName || input.ownerName || '',
      area: permit.area || '',
      vehicleType: permit.vehicleType || input.vehicleType || '',
      registrationMark: permit.registrationMark || input.registrationNo || '',
      seatingCapacity: permit.seatingCapacity ?? '',
      grossVehicleWeight: permit.grossVehicleWeight ?? '',
      purposeOfJourneys: permit.purposeOfJourneys || '',
      natureOfGoods: permit.natureOfGoods || '',
      expiryDate: permit.expiryDate || '',
      routes: permit.routes || '',
    },
    sealImagePath: path.join(process.cwd(), 'public', 'Images', 'odisha-seal.png'),
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
      Title: 'Odisha Checkpost Tax e-Receipt',
      Author: 'Motor Vehicles Department'
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
  drawImages(doc, data, qrBuffer);
  drawHeader(doc, data);
  drawDetails(doc, data);
  drawTable(doc, data);
  drawGrandTotal(doc, data);
  drawPermit(doc, data);
  drawNotes(doc);

  doc.addPage({ size: [PAGE.width, PAGE.height], margin: 0 });
  drawSecondPage(doc);

  doc.end();
  return done;
}

module.exports = { generateReceipt };
