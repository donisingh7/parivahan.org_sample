const path = require('path');

module.exports = {
  receiptPrintingDate: '02-JUL-2026 08:23:27 AM',
  watermarkDate: '02-JUL-2026 08:19 AM',

  registrationNo: 'MH40CT6745',
  receiptNo: 'CGT2607028868427',
  paymentInitiationDate: '02-JUL-2026 08:19 AM',
  ownerName: 'M*. R**I B******E',
  chassisNo: 'MB1AA22EXRRC*****',
  taxMode: 'MONTHLY',
  vehicleType: 'GOODS VEHICLE',
  vehicleClass: 'LIGHT GOODS VEHICLE',
  mobileNo: '70384****9',
  checkpostName: 'AMBIKAPUR RTO',
  unladenWeight: 'NA',
  ladenWeight: '2625',
  bankReferenceNo: '654939265184',
  paymentMode: 'ONLINE',
  serviceType: 'NOT APPLICABILE',
  permitType: '',
  permitCategory: '',

  taxItems: [
    {
      particular: 'MV Tax( 02-JUL-2026 TO 31-JUL-2026 )',
      fees: '200',
      fine: '0',
      total: '200'
    }
  ],
  grandTotal: '200',
  amountInWords: 'TWO HUNDRED ONLY',

  emblemImagePath: path.join(__dirname, 'assets', 'chhattisgarh-seal.png'),
  rupeeGlyphPath: path.join(__dirname, 'assets', 'rupee-glyph.png'),

  // Keep this path for an exact reproduction of the supplied sample QR.
  // Set qrImagePath to null to generate a fresh QR from qrValue instead.
  qrImagePath: path.join(__dirname, 'assets', 'reference-qr.png'),
  qrValue: 'CGT2607028868427'
};
