  const PDFDocument = require('pdfkit');
  const QRCode      = require('qrcode');
  const moment      = require('moment');
  const fs          = require('fs');
  const path        = require('path');
  const sharp       = require('sharp');

  // ── Image loader (blurred, for watermark) ──────────────────────────────────
  async function loadBlurredImage(imagePath) {
    try {
      if (!fs.existsSync(imagePath)) return null;
      return await sharp(imagePath).png().toBuffer();
    } catch { return null; }
  }

  // ── Number → words (UPPERCASE, Indian system) ──────────────────────────────
  function numberToWords(num) {
    const ones = ['','ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE',
      'TEN','ELEVEN','TWELVE','THIRTEEN','FOURTEEN','FIFTEEN','SIXTEEN',
      'SEVENTEEN','EIGHTEEN','NINETEEN'];
    const tens = ['','','TWENTY','THIRTY','FORTY','FIFTY','SIXTY','SEVENTY','EIGHTY','NINETY'];
    if (num === 0) return 'ZERO';
    function convert(n) {
      if (n < 20)     return ones[n];
      if (n < 100)    return tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '');
      if (n < 1000)   return ones[Math.floor(n/100)] + ' HUNDRED' + (n%100 ? ' AND '+convert(n%100) : '');
      if (n < 100000) return convert(Math.floor(n/1000)) + ' THOUSAND' + (n%1000 ? ' '+convert(n%1000) : '');
      return convert(Math.floor(n/100000)) + ' LAKH' + (n%100000 ? ' '+convert(n%100000) : '');
    }
    return convert(num);
  }

  // ── QR code → buffer ───────────────────────────────────────────────────────
  async function generateQRCode(text) {
    const dataUrl = await QRCode.toDataURL(text, {
      width: 138, margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    });
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    return Buffer.from(base64, 'base64');
  }

  // ── Text watermark (tiled, same as Haryana) ────────────────────────────────
  function drawTextWatermark(doc, watermarkText, pageWidth) {
    doc.save();
    doc.opacity(0.5);
    doc.fontSize(15.5).fillColor('#aaaaaa').font('Helvetica');
    const tileStep = 20;
    const startY   = 25;
    const endY     = 650;
    const startX   = 25;  for (let row = 0; ; row++) {
      const rowY = startY + row * tileStep;
      if (rowY > endY) break;
      const lineText = `${watermarkText}  `.repeat(2);
      doc.text(lineText, startX, rowY, { width: pageWidth, lineBreak: false });
    }
    doc.restore();
  }

  // ── Image watermark (same position as Haryana) ─────────────────────────────
  async function drawImageWatermark(doc, imagePath, pageWidth, pageHeight) {
    const wmBuffer = await loadBlurredImage(imagePath);
    if (!wmBuffer) return;
    const wmWidth  = 260;
    const wmHeight = 260;
    const wmX      = ((pageWidth - wmWidth) / 2) + 120;
    const wmY      = (pageHeight - wmHeight) / 2 - 80;
    doc.save();
    doc.opacity(0.42);
    doc.image(wmBuffer, wmX, wmY, { width: wmWidth, height: wmHeight });
    doc.restore();
  }

  // ── Main receipt generator ─────────────────────────────────────────────────
  async function generateReceipt(data, outputPath) {
    const now           = moment(data.paymentDate || new Date());
    const printedOn     = now.format('DD-MMM-YYYY hh:mm:ss A').toUpperCase();
    const registrationNo = data.registrationNo || 'XX00X0000';
    const watermarkText = `${registrationNo} ${now.format('DD-MMM-YYYY hh:mm A')}`;

    const grandTotal      = (data.taxItems || []).reduce((sum, item) => sum + (item.total || 0), 0);
    const grandTotalWords = numberToWords(grandTotal);

    const qrUrl    = data.qrUrl || `https://upparivahan.gov.in/verify?receipt=${data.receiptNo}`;
    const qrBuffer = await generateQRCode(qrUrl);

    const logoPath = data.emblemImagePath || './images/UP_logo.png';

    // ── PDF setup ──
    const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false });
    doc.registerFont('Roboto',      './fonts/Roboto-Regular.ttf');
    doc.registerFont('Roboto-Bold', './fonts/Roboto-Bold.ttf');

    const pageWidth    = 595.28;
    const pageHeight   = 841.89;
    const margin       = 30;
    const contentWidth = pageWidth - margin * 2;

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // ==========================================================
    // PAGE 1
    // ==========================================================
    doc.addPage();

    // Watermarks first (behind everything)
    await drawImageWatermark(doc, logoPath, pageWidth, pageHeight);
    drawTextWatermark(doc, watermarkText, pageWidth);

    // ── Printed on (top right) ─────────────────────────────────
    let y = margin ;
    doc.fontSize(11).font('Helvetica').fillColor('#000000');
    doc.text(`Printed on : ${printedOn}`, margin, y, { width: contentWidth, align: 'right' });

    y += 10;

    // ── Logo (left) — same position as Haryana ─────────────────
    const emblemX = margin + 5;
    const emblemY = y;

    if (fs.existsSync(logoPath)) {
      const logoX = emblemX +5;   // same as Haryana
      const logoY = emblemY + 20;   // same as Haryana
      const logoW = 100;             // same as Haryana
      const logoH = 100;            // same as Haryana
      doc.rect(logoX - 5, logoY - 5, logoW + 10, logoH + 10).fill('#ffffff');
      doc.image(logoPath, logoX, logoY, { width: logoW, height: logoH });
    } else {
      doc.save();
      doc.circle(emblemX + 35, emblemY + 35, 35).fillAndStroke('#f5f5f5', '#cccccc');
      doc.fontSize(6).fillColor('#999999').font('Helvetica-Bold');
      doc.text('GOVT. OF\nUTTAR PRADESH', emblemX + 5, emblemY + 28, { width: 60, align: 'center' });
      doc.restore();
    }

    // ── Title block (center) — same position as Haryana ────────
    const titleX     = margin + 55;
    const titleWidth = contentWidth - 160;

    doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000');
    doc.text('GOVERNMENT OF UTTAR PRADESH', titleX, y + 55, { width: titleWidth, align: 'center', underline: true });

    doc.fontSize(11).font('Helvetica');
    doc.text('Department of Transport', titleX, y + 73, { width: titleWidth, align: 'center' });

    doc.fontSize(10).font('Helvetica');
    doc.text('Checkpost Tax e-Receipt', titleX, y + 88, { width: titleWidth, align: 'center' });

    // ── QR code (right) — same size as Haryana (138x138) ───────
    doc.rect(pageWidth - margin - 152, y+20, 108, 108).fill('#ffffff');
    doc.image(qrBuffer, pageWidth - margin - 152, y+20, { width: 108, height: 108 });

    y += 88 + 95;  // same gap as Haryana before fields

    // ── Field drawing helper ────────────────────────────────────
    const labelWidth    = 95;
    const colonWidth    = 8;
    const fieldFontSize = 13.5;   // same as Haryana
    const col1X         = margin;
    const col2X         = pageWidth / 2 -5;
    const maxValueWidth = 155;

    function drawField(label, value, x, yPos) {
      doc.fontSize(fieldFontSize).font('Helvetica').fillColor('#000000');
      doc.text(label, x, yPos, { lineBreak: true, width: labelWidth });
      doc.text(':', x + labelWidth, yPos, { lineBreak: false, width: colonWidth });
      doc.text(value || '-', x + labelWidth + colonWidth, yPos, { lineBreak: true, width: maxValueWidth });
    }

    const fh  = 28;        // standard line height (same as Haryana)
    const fh2 = fh * 1.5;
    const fh3 = fh * 2;

    // ── UP Fields ──────────────────────────────────────────────
    // Row 1
    drawField('Registration\nNo.',             data.registrationNo    || '-', col1X, y);
    drawField('Receipt No.',                   data.receiptNo         || '-', col2X, y);
    y += fh * 1.6;

    // Row 2
    drawField('Payment\nInitialization\nDate', data.paymentInitDate   || '-', col1X, y);
    drawField('Owner Name',                    data.ownerName         || '-', col2X, y);
    y += fh3;

    // Row 3
    drawField('Chassis No.',                   data.chassisNo         || '-', col1X, y);
    drawField('Tax Mode',                      data.taxMode           || '-', col2X, y);
    y += fh;

    // Row 4
    drawField('Vehilce Type',                  data.vehicleType       || '-', col1X, y);
    drawField('Vehicle Class',                 data.vehicleClass      || '-', col2X, y);
    y += fh2-8;

    // Row 5
    drawField('Vehicle\nCategory',             data.vehicleCategory   || '-', col1X, y);
    drawField('Mobile No.',                    data.mobileNo          || '-', col2X, y);
    y += fh3-10;

    // Row 6
    drawField('Checkpost\nName',               data.checkpostName     || '-', col1X, y);
    drawField('Seating\nCapacity',             String(data.seatingCapacity ?? ''), col2X, y);
    y += fh2;

    // Row 7
    drawField('Sleeper Cap.',                  String(data.sleeperCap ?? 0), col1X, y);
    drawField('Bank Ref. No.',                 data.bankRefNo         || '-', col2X, y);
    y += fh;

    // Row 8
    drawField('Payment\nMode',                 data.paymentMode       || 'ONLINE', col1X, y);
    drawField('Permit\nNumber',                data.permitNumber      || '0000',   col2X, y);  // UP specific
    y += fh2;

    // Row 9
    drawField('Permit\nValidity',              data.permitValidity    || '-', col1X, y);
    drawField('Fitness\nValidity',             data.fitnessValidity   || '-', col2X, y);
    y += fh2;

    // Row 10
    drawField('Insurance\nValidity',           data.insuranceValidity || '-', col1X, y);
    drawField('PUCC Validity',                 data.puccValidity      || '-', col2X, y);
    y += fh2;

    // Row 11
    drawField('Service Type',                  data.serviceType       || '-', col1X, y);
    drawField('Permit Type',                   data.permitType        || 'NOT APPLICABLE', col2X, y);
    y += fh;

    // Row 12
    drawField('Payment\nConfirmation\nDate',   data.paymentConfirmDate || '-', col1X, y);
    y += fh3 + 16;

    // ── Tax table (same style as Haryana) ──────────────────────
    const col = {
      particular: margin,
      fees:  360,
      fine:  440,
      total: 510,
    };

    const tableStartY  = y;
    const headerHeight = 30;   // same as Haryana
    const rowHeight    = 35;   // same as Haryana
    const borderColor  = '#87CEEB';

    doc.rect(margin - 2, y, contentWidth + 4, headerHeight).lineWidth(0.8).stroke(borderColor);

    doc.fontSize(11.5).font('Helvetica-Bold').fillColor('#000000');
    doc.text('Tax/Fee Particular', col.particular + 4, y + 9, { width: col.fees - col.particular - 10 });
    doc.text('Tax/Fees',           col.fees,            y + 9, { width: 60 });
    doc.text('Fine',               col.fine,            y + 9, { width: 40 });
    doc.text('Total',              col.total,           y + 9, { width: 50 });
    y += headerHeight;

    doc.moveTo(margin - 2, y).lineTo(pageWidth - margin + 2, y).lineWidth(0.5).stroke(borderColor);

    doc.font('Helvetica-Bold').fontSize(11.5).fillColor('#000000');
    for (const item of (data.taxItems || [])) {
      doc.text(String(item.particular), col.particular + 4, y + 10, { width: col.fees - col.particular - 10 });
      doc.text(String(item.fees  ?? 0), col.fees,            y + 10, { width: 60 });
      doc.text(String(item.fine  ?? 0), col.fine,            y + 10, { width: 40 });
      doc.text(String(item.total ?? 0), col.total,           y + 10, { width: 50 });
      y += rowHeight;
    }

    doc.rect(margin - 2, tableStartY, contentWidth + 4, y - tableStartY).lineWidth(0.8).stroke(borderColor);
    doc.moveTo(col.fees  - 5, tableStartY).lineTo(col.fees  - 5, y).lineWidth(0.5).stroke(borderColor);
    doc.moveTo(col.fine  - 5, tableStartY).lineTo(col.fine  - 5, y).lineWidth(0.5).stroke(borderColor);
    doc.moveTo(col.total - 5, tableStartY).lineTo(col.total - 5, y).lineWidth(0.5).stroke(borderColor);

    // ==========================================================
    // PAGE 2  (Grand Total + Notes — as per UP PDF)
    // ==========================================================
    doc.addPage();

    let y2 = margin + 10;

    // Grand Total at top of page 2 (UP style)
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000');
    doc.text(`Grand Total : Rs. ${grandTotal}/- ${grandTotalWords} Rupees Only`, margin, y2);
    y2 += 25;

    doc.moveTo(margin, y2).lineTo(pageWidth - margin, y2).lineWidth(0.5).stroke('#000000');
    y2 += 15;

    // Note
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000');
    doc.text('Note:', margin, y2);
    y2 += 16;

    // Terms and Conditions
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000');
    doc.text('Terms and Conditions:', margin, y2);
    y2 += 16;

    const terms = data.terms || [
      'This is a computer generated printout and no signature is required.',
      'Should not carry unlawful/unaccompanied goods.',
      'If any false information/discrepancies are found at later, necessary action will be taken against the vehicle owner/driver.',
    ];

    terms.forEach((term, i) => {
      doc.fontSize(12).font('Helvetica').fillColor('#000000');
      doc.text(`${i + 1}. ${term}`, margin, y2, { width: contentWidth });
      y2 += 22;
    });

    y2 += 20;

    // QR scan note
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#000000');
    doc.text('Scan the QR code for genuinity of the receipt.', margin, y2, { width: contentWidth });

    // ── Finalize ───────────────────────────────────────────────
    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(outputPath));
      stream.on('error',  reject);
    });
  }

  module.exports = { generateReceipt };