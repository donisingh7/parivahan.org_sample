const { generateReceipt } = require('./generateReceipt');
const path = require('path');
const fs   = require('fs');

const outputDir = path.join(__dirname, 'receipts');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const sampleData = {
  registrationNo:     'TG08T6724',
  receiptNo:          'APR2603020974712',
  paymentDate:        new Date('2026-04-08T17:44:26'),
  paymentInitDate:    '02-Mar-2026, 9:36:49 PM',
  ownerName:          'VA SH',
  chassisNo:          'MA1RA2TTKR1L*****',
  taxMode:            'MONTHLY',
  vehicleType:        'TRANSPORT',
  vehicleClass:       'GOODS CARRIER',
  vehicleCategory:    'LIGHT GOODS VEHICLE',
  mobileNo:           '91662****1',
  checkpostName:      'PALAMANER',
  grossVehicleWt:     3460,
  unladenWt:          0,
  bankRefNo:          '90221535532025',
  paymentMode:        'ONLINE',
  permitValidity:     '31-MAR-2026',
  fitnessValidity:    '01-DEC-2026',
  insuranceValidity:  '15-NOV-2026',
  puccValidity:       '01-MAR-2027',
  serviceType:        'Goods Service',
  permitType:         'TEMPORARY PERMIT',
  nameOfGoods:        'OTHER',          // ← AP specific
  route:              'CHITTOR',        // ← AP specific
  paymentConfirmDate: '02-Mar-2026, 9:36:49 PM',
  emblemImagePath:    './images/AP_logo.png',
  qrUrl:              'https://apparivahan.gov.in/verify?receipt=APR2603020974712',
  taxItems: [
    { particular: 'Permit Fee ( 2026-03-03 To 2026-04-01 )',          fees: 200, fine: 0, total: 200 },
    { particular: 'MV Tax ( 2026-03-03 To 2026-04-01 )',              fees: 800, fine: 0, total: 800 },
    { particular: 'Service/User Charge ( 2026-03-03 To 2026-04-01 )', fees: 100, fine: 0, total: 100 },
    { particular: 'Tax Token Fee ( 2026-03-03 To 2026-04-01 )',       fees: 20,  fine: 0, total: 20  },
  ],
  terms: [
    'This is a computer generated printout and no signature is required.',
    'Should not carry unlawful/unaccompanied goods.',
    'If any false information/discrepancies are found at later, necessary action will be taken against the vehicle owner/driver.',
  ]
};

(async () => {
  const outputPath = path.join(outputDir, 'ap_sample_receipt.pdf');
  console.log('⏳ Generating Andhra Pradesh receipt...');
  await generateReceipt(sampleData, outputPath);
  console.log(`✅ Receipt saved to: ${outputPath}`);
})();
