const { generateReceipt } = require('./generateReceipt');
const path = require('path');
const fs   = require('fs');

const outputDir = path.join(__dirname, 'receipts');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const sampleData = {
  registrationNo:     'HR65A9023',
  receiptNo:          'HPR2605200313530',
  paymentDate:        new Date('2026-05-20T20:20:06'),
  paymentInitDate:    '20-May-2026, 8:18:49 PM',
  ownerName:          'J*I S***H',
  chassisNo:          'MA3EJKD1S00C*****',
  taxMode:            'DAYS',
  vehicleType:        'TRANSPORT',
  vehicleClass:       'MOTOR CAB',
  vehicleCategory:    'LIGHT PASSENGER VEHICLE',
  mobileNo:           '98126****3',
  checkpostName:      'PARWANOO',
  seatingCapacity:    5,
  sleeperCap:         0,
  bankRefNo:          'CPAGSWIYN6',
  paymentMode:        'ONLINE',
  fitnessValidity:    '16-MAY-2028',
  insuranceValidity:  '11-JUL-2026',
  puccValidity:       '06-JAN-2027',
  serviceType:        'NOT APPLICABLE',
  permitType:         'TEMPORARY PERMIT',
  fuelType:           '',                          // ← HP specific
  paymentConfirmDate: '20-May-2026, 8:20:05 PM',
  emblemImagePath:    './images/HP_logo.png',
  qrUrl:              'https://himachalparivahan.gov.in/verify?receipt=HPR2605200313530',
  taxItems: [
    { particular: 'Service/User Charge ( 2026-05-20 08:18 PM To 2026-05-21 08:18 PM )', fees: 20,  fine: 0, total: 20  },
    { particular: 'Cess ( 2026-05-20 08:18 PM To 2026-05-21 08:18 PM )',                fees: 10,  fine: 0, total: 10  },
    { particular: 'Special Road Tax ( 2026-05-20 08:18 PM To 2026-05-21 08:18 PM )',    fees: 200, fine: 0, total: 200 },
  ],
  terms: [
    'This is a computer generated printout and no signature is required.',
    'Should not carry unlawful/unaccompanied goods.',
    'If any false information/discrepancies are found at later, necessary action will be taken against the vehicle owner/driver.',
  ]
};

(async () => {
  const outputPath = path.join(outputDir, 'hp_sample_receipt.pdf');
  console.log('⏳ Generating HP receipt...');
  await generateReceipt(sampleData, outputPath);
  console.log(`✅ Receipt saved to: ${outputPath}`);
})();
