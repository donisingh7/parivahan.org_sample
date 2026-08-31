const { generateReceipt } = require('./generateReceipt');
const path = require('path');
const fs   = require('fs');

const outputDir = path.join(__dirname, 'receipts');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const sampleData = {
  registrationNo:     'HR37D8046',
  receiptNo:          'PBR2604180123062',
  paymentDate:        new Date('2026-04-18T13:20:34'),
  paymentInitDate:    '18-Apr-2026, 1:19:40 PM',
  ownerName:          'P*****M P*******G I********S',
  chassisNo:          'MB1AA22E8FRB*****',
  taxMode:            'QUARTERLY',
  vehicleType:        'TRANSPORT',
  vehicleClass:       'GOODS CARRIER',
  vehicleCategory:    'LIGHT GOODS VEHICLE',
  mobileNo:           '98960****5',
  checkpostName:      'KHARAR',
  grossVehicleWt:     2500,   // ← Punjab specific
  unladenWt:          0,      // ← Punjab specific
  bankRefNo:          'CPAGPOWDI9',
  paymentMode:        'ONLINE',
  permitValidity:     '',
  serviceType:        'NOT APPLICABLE',
  permitType:         'NOT APPLICABLE',
  paymentConfirmDate: '18-Apr-2026, 1:20:34 PM',
  emblemImagePath:    './images/Punjab_logo.png',
  qrUrl:              'https://punjabparivahan.gov.in/verify?receipt=PBR2604180123062',
  taxItems: [
    { particular: 'MV Tax ( 2026-04-18 01:19 PM To 2026-06-30 11:59 PM )',           fees: 1750, fine: 0, total: 1750 },
    { particular: 'Service/User Charge ( 2026-04-18 01:19 PM To 2026-06-30 11:59 PM )', fees: 30, fine: 0, total: 30 },
    { particular: 'Cess ( 2026-04-18 01:19 PM To 2026-06-30 11:59 PM )',              fees: 175, fine: 0, total: 175 },
  ],
  terms: [
    'This is a computer generated printout and no signature is required.',
    'Should not carry unlawful/unaccompanied goods.',
    'If any false information/discrepancies are found at later, necessary action will be taken against the vehicle owner/driver.',
  ]
};

(async () => {
  const outputPath = path.join(outputDir, 'punjab_sample_receipt.pdf');
  console.log('⏳ Generating Punjab receipt...');
  await generateReceipt(sampleData, outputPath);
  console.log(`✅ Receipt saved to: ${outputPath}`);
})();
