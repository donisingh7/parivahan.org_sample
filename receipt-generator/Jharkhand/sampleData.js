const path = require('path');

module.exports = {
  documentTitle: 'Online Tax Payment Portal',
  documentUrl:
    'https://parivahan.somee.com/pages/JH_Report?ID=NDAxNj...',
  browserPrintedAt: '04/07/26, 11:04',
  printedOn: '04-JUL-2026 11:04 AM',
  watermarkDate: '04-JUL-2026 11:03 AM',

  registrationNo: 'MP53ZC4003',
  receiptNo: 'JHR2607049720585',
  ownerName: 'V***D K***T',
  chassisNo: 'MAT555013P8K',
  taxMode: 'DAYS',
  vehicleType: 'TRANSPORT',
  vehicleClass: 'LIGHT GOODS VEHICLE',
  vehicleCategory: 'GOODS CARRIER',
  mobileNo: '9000000000',
  checkpostName: 'BOKARO',
  seatingCapacity: '7490',
  sleeperCapacity: '',
  bankReferenceNo: '3KG9W322PT',
  paymentMode: 'ONLINE',
  fitnessValidity: '25-FEB-2028',
  insuranceValidity: '19-FEB-2027',
  puccValidity: '04-AUG-2026',
  serviceType: '',
  permitType: 'TRANSPORT',
  paymentConfirmationDate: '04-JUL-2026 11:04 AM',

  taxItems: [
    {
      particular: 'MV Tax(05-Jul-2026 TO 11-Jul-2026)',
      fees: 750,
      fine: 0,
      total: 750
    }
  ],

  amountInWords: 'SEVEN HUNDRED AND FIFTY',
  terms: [
    'This is a computer generated printout and no signature\nis required.',
    'Should not carry unlawful/unaccompanied goods.',
    'If any false information/discrepancies are found at later,\nnecessary action will be taken against the vehicle owner/\ndriver.'
  ],

  emblemImagePath: path.join(__dirname, 'assets', 'jharkhand-seal.png'),
  rupeeGlyphPath: path.join(__dirname, 'assets', 'rupee-glyph.png'),
  qrImagePath: path.join(__dirname, 'assets', 'reference-qr.png'),
  qrValue: 'JHR2607049720585'
};
