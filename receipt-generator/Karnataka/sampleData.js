const path = require('path');

module.exports = {
  useReferenceQr: true,

  receiptPrintingDate: '19-May-2026 18:43:31',
  receiptNo: 'KAT2605193431487',
  vehicleNo: 'HR38AG5491',
  paymentDate: '19-MAY-2026 06:42 PM',
  ownerName: 'U**Y V**R',
  mobileNo: '99999****9',
  chassisNo: 'MA1RD2LYKR6A*****',
  taxMode: 'WEEKLY',
  vehicleType: 'GOODS VEHICLE',
  vehicleClass: 'LIGHT GOODS VEHICLE',
  permitType: 'NOT APPLICABLE',
  floorArea: 'NA',
  ladenWeight: '2825 KG .',
  unladenWeight: '1650',
  permitValidity: '10-Jul-2026',
  fitnessValidity: '13-Aug-2026',
  insuranceValidity: '22-Jul-2026',
  taxValidity: '15-Jul-2026',
  checkpostName: 'ALAND',
  bankReferenceNo: '5336275987089',
  paymentMode: 'ONLINE',
  paymentStatus: 'SUCCESS',

  taxItems: [
    {
      particular: 'MV Tax( 19-MAY-2026 06:05 PM TO 25-MAY-2026 06:42 PM )',
      fees: '100',
      fine: '0',
      total: '100'
    },
    { particular: 'Cess', fees: '10', fine: '0', total: '10' },
    { particular: 'Infra Cess', fees: '1', fine: '0', total: '1' }
  ],
  grandTotal: '111',
  amountInWords: 'ONE HUNDRED ELEVEN',

  logoImagePath: path.join(__dirname, 'assets', 'karnataka-logo.png'),
  watermarkImagePath: path.join(
    __dirname,
    'assets',
    'karnataka-watermark.png'
  ),
  rupeeGlyphPath: path.join(__dirname, 'assets', 'rupee-glyph.png'),

  // Used only when useReferenceQr is false.
  qrValue: 'KAT2605193431487'
};
