const { generateReceipt } = require('./generateReceipt');
const path = require('path');
const fs   = require('fs');

const outputDir = path.join(__dirname, 'receipts');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const sampleData = {
  registrationNo:         'PB10KH3474',
  receiptNo:              'BRR2604040625863',
  paymentDate:            new Date('2026-04-04T20:15:35'),
  paymentInitDate:        '04-Apr-2026, 8:12:18 PM',
  ownerName:              'D****R S***H',
  chassisNo:              'MA1RV2TUKS6L*****',
  taxMode:                'DAYS',
  vehicleType:            'TRANSPORT',
  vehicleClass:           'GOODS CARRIER',
  vehicleCategory:        'LIGHT GOODS VEHICLE',
  mobileNo:               '70090****0',
  checkpostName:          'NOT APPLICABLE',
  grossVehicleWt:         2825,
  unladenWt:              0,
  bankRefNo:              'IK0DPUPMS6',
  paymentMode:            'ONLINE',
  fitnessValidity:        '06-DEC-2027',
  insuranceValidity:      '28-NOV-2026',
  puccValidity:           '06-DEC-2026',
  serviceType:            'NOT APPLICABLE',
  permitType:             'NOT APPLICABLE',
  grossCombinationWeight: 0,
  paymentConfirmDate:     '04-Apr-2026, 8:15:35 PM',
  emblemImagePath:        './images/Bihar_logo.png',
  qrUrl:                  'https://biharparivahan.gov.in/verify?receipt=BRR2604040625863',
  taxItems: [
    { particular: 'MV Tax ( 2026-04-04 To 2026-05-02 )', fees: 1700, fine: 0, total: 1700 },
  ],
  terms: [
    'This is a computer generated printout and no signature is required.',
    'Should not carry unlawful/unaccompanied goods.',
    'If any false information/discrepancies are found at later, necessary action will be taken against the vehicle owner/driver.',
  ]
};

(async () => {
  const outputPath = path.join(outputDir, 'bihar_sample_receipt.pdf');
  console.log('⏳ Generating Bihar receipt...');
  await generateReceipt(sampleData, outputPath);
  console.log(`✅ Receipt saved to: ${outputPath}`);
})();
