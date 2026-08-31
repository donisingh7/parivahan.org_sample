const { generateReceipt } = require('./generateReceipt');
const path = require('path');
const fs   = require('fs');

const outputDir = path.join(__dirname, 'receipts');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const sampleData = {
  registrationNo:     'HR38AL2988',
  receiptNo:          'UKR2604120904654',
  paymentDate:        new Date('2026-04-12T08:56:21'),
  paymentInitDate:    '12-Apr-2026, 8:53:06 AM',
  ownerName:          'V***D K***R',
  chassisNo:          'MA1UV2CSXS6K*****',
  taxMode:            'WEEKLY',
  vehicleType:        'TRANSPORT',
  vehicleClass:       'GOODS CARRIER',
  vehicleCategory:    'LIGHT GOODS VEHICLE',
  mobileNo:           '72108****0',
  checkpostName:      'ASHARODI',
  grossVehicleWt:     2999,
  unladenWt:          0,
  bankRefNo:          'IK0DPZCWY4',
  paymentMode:        'ONLINE',
  permitNumber:       '00',
  permitValidity:     '',
  fitnessValidity:    '06-JAN-2028',
  puccValidity:       '13-JAN-2027',
  serviceType:        'NOT APPLICABLE',
  permitType:         'NOT APPLICABLE',
  paymentConfirmDate: '12-Apr-2026, 8:54:16 AM',
  emblemImagePath:    './images/UK_logo.png',
  qrUrl:              'https://uttarakhandparivahan.gov.in/verify?receipt=UKR2604120904654',
  taxItems: [
    { particular: 'MV Tax ( 2026-04-12 To 2026-04-17 )',           fees: 200, fine: 0, total: 200 },
    { particular: 'Service/User Charge ( 2026-04-12 To 2026-04-17 )', fees: 50, fine: 0, total: 50  },
    { particular: 'Cess ( 2026-04-12 To 2026-04-17 )',              fees: 40,  fine: 0, total: 40  },
  ],
  terms: [
    'This is a computer generated printout and no signature is required.',
    'Should not carry unlawful/unaccompanied goods.',
    'If any false information/discrepancies are found at later, necessary action will be taken against the vehicle owner/driver.',
  ]
};

(async () => {
  const outputPath = path.join(outputDir, 'uk_sample_receipt.pdf');
  console.log('⏳ Generating Uttarakhand receipt...');
  await generateReceipt(sampleData, outputPath);
  console.log(`✅ Receipt saved to: ${outputPath}`);
})();
