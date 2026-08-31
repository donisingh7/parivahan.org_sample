const path = require('path');

module.exports = {
  watermarkDate: '15-JUN-2026 10:40 AM',
  useReferenceWatermarkFont: true,

  registrationNo: 'GJ27TG6633',
  receiptNo: 'TST2606159071175',
  paymentDate: '15-JUN-2026 10:40 AM',
  ownerName: 'P*****R R*******S L*****D',
  chassisNo: 'MA1RY2JNKS5E*****',
  taxMode: 'WEEKLY',
  vehicleType: 'GOODS VEHICLE',
  vehicleClass: 'LIGHT GOODS VEHICLE',
  mobileNo: '9000000000',
  checkpostName: '',
  sleeperCapacity: '1670',
  ladenWeight: '2715  KG.',
  bankReferenceNo: 'BKQXB4B884',
  paymentMode: 'ONLINE',
  serviceType: 'NOT APPLICABLE',
  permitType: '',
  permitCategory: '',

  taxItems: [
    {
      particular: 'MV Tax(15-Jun-2026 10:40 AM TO 21-Jun-2026 10:40 AM)',
      fees: '150',
      fine: '0',
      total: '150'
    }
  ],
  grandTotal: '150',
  amountInWords: 'ONE HUNDRED AND FIFTY',

  sealImagePath: path.join(__dirname, 'assets', 'telangana-seal.png'),
  rupeeGlyphPath: path.join(__dirname, 'assets', 'rupee-glyph.png'),
  referenceWatermarkFontPath: path.join(
    __dirname,
    'assets',
    'reference-watermark.ttf'
  ),

  // The included path reproduces the supplied sample QR exactly.
  // Set qrImagePath to null to generate a fresh QR from qrValue.
  qrImagePath: path.join(__dirname, 'assets', 'reference-qr.png'),
  qrValue: 'TST2606159071175'
};
