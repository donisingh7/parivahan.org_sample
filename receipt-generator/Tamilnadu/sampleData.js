const path = require('path');

module.exports = {
  browserPrintedAt: '13/07/2026, 09:02',
  documentTitle: 'CheckPost V4.7.3',
  documentUrl:
    'https://services.parivahan.gov.in/checkpostv4/#/public/reports/CustomerReceipt',
  pageNumber: '1/1',
  printedOn: '13-JUL-2026 09:02:05 AM',
  watermarkDate: '13-Jul-2026 09:00 AM',

  registrationNo: 'KA22AA8133',
  receiptNo: 'TNR2607130547584',
  paymentInitializationDate: '13-Jul-2026, 9:00:59 AM',
  ownerName: 'R****H B*******J K***R',
  chassisNo: 'MAT785007R7J*****',
  taxMode: 'WEEKLY',
  vehicleType: 'TRANSPORT',
  vehicleClass: 'GOODS CARRIER',
  vehicleCategory: 'MEDIUM GOODS VEHICLE',
  mobileNo: '99011****4',
  checkpostName: 'THIRUCHITRAMBALAM',
  grossVehicleWeight: '11990',
  unladenWeight: '0',
  bankReferenceNo: 'CHX6046256',
  paymentMode: 'ONLINE',
  permitNumber: 'KA2025-GP-1583B',
  permitValidity: '',
  fitnessValidity: '16-DEC-2026',
  insuranceValidity: '21-APR-2027',
  puccValidity: '23-APR-2027',
  serviceType: 'NOT APPLICABLE',
  permitType: 'GOODS PERMIT',
  greenTaxValidity: '',
  basePermitValidity: '25-FEB-2030',
  paymentConfirmationDate: '13-Jul-2026, 9:02:05 AM',

  taxItems: [
    {
      particular: 'Permit Fee ( 2026-07-13 To 2026-07-19 )',
      fees: 150,
      fine: 0,
      total: 150
    },
    {
      particular: 'MV Tax ( 2026-07-13 To 2026-07-19 )',
      fees: 240,
      fine: 0,
      total: 240
    },
    {
      particular: 'Welfare Tax ( 2026-07-13 To 2026-07-19 )',
      fees: 3,
      fine: 0,
      total: 3
    },
    {
      particular: 'Service/User Charge ( 2026-07-13 To 2026-07-19 )',
      fees: 60,
      fine: 0,
      total: 60
    }
  ],
  amountInWords: 'Four Hundred Fifty Three',
  terms: [
    'This is a computer generated printout and no signature is required.',
    'Should not carry unlawful/unaccompanied goods.',
    'If any false information/discrepancies are found at later, necessary action will be taken against the\nvehicle owner/driver.'
  ],

  emblemImagePath: path.join(__dirname, 'assets', 'tamil-nadu-emblem.png'),
  referenceTextWatermarkPath: path.join(
    __dirname,
    'assets',
    'reference-text-watermark.png'
  ),
  qrImagePath: path.join(__dirname, 'assets', 'reference-qr.png'),
  qrValue: 'TNR2607130547584'
};
