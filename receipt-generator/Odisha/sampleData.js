const path = require('path');

module.exports = {
  receiptNo: 'ORT2605276291623',
  vehicleNo: 'MP53ZC4003',
  paymentDate: '27-MAY-2026 10:55 PM',
  ownerName: 'V***D K***T',
  mobileNo: '9000000000',
  chassisNo: 'MAT555013P8K*****',
  taxMode: 'MONTHLY',
  vehicleType: 'GOODS VEHICLE',
  vehicleClass: 'LIGHT GOODS VEHICLE',
  standingCapacity: '0',
  ladenWeight: '7490  KG.',
  unladenWeight: '3355 Kg.',
  bankReferenceNo: 'MGK1B5U7Q4',
  paymentMode: 'ONLINE',
  paymentStatus: 'SUCCESS',
  paymentConfirmationDate: '27-MAY-2026 10:55 PM',

  taxItems: [
    {
      particular: 'MV Tax(28-May-2026 12:05 AM TO 24-Jun-2026 12:04 AM)',
      fees: '1500',
      fine: '0',
      total: '1500'
    },
    {
      particular: 'Application Fee',
      fees: '1000',
      fine: '0',
      total: '1000'
    },
    {
      particular: 'Permit Fee',
      fees: '500',
      fine: '0',
      total: '500'
    }
  ],
  grandTotal: '3000',
  amountInWords: 'THREE THOUSAND',

  permit: {
    number: 'ORT2605276291623',
    holderName: 'V***D K***T',
    area: '',
    vehicleType: 'GOODS VEHICLE',
    registrationMark: 'MP53ZC4003',
    seatingCapacity: '7490',
    grossVehicleWeight: '7490',
    purposeOfJourneys: 'CARRYING GOODS',
    natureOfGoods: '',
    expiryDate: '31-Jul-2026',
    routes: ''
  },

  sealImagePath: path.join(__dirname, 'assets', 'odisha-seal.png'),
  rupeeGlyphPath: path.join(__dirname, 'assets', 'rupee-glyph.png'),

  // This reproduces the sample QR exactly. Set to null for a fresh QR.
  qrImagePath: path.join(__dirname, 'assets', 'reference-qr.png'),
  qrValue: 'ORT2605276291623'
};
