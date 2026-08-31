const { generateReceipt } = require('./generateReceipt');
const path = require('path');
const fs   = require('fs');

const outputDir = path.join(__dirname, 'receipts');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const sampleData = {
  registrationNo:  'HR39F0964',
  receiptNo:       'MHT2604063522817',
  paymentDate:     new Date('2026-04-06T10:11:58'),
  paymentInitDate: '06-APR-2026 10:11 AM',
  ownerName:       'P****D K***R',
  chassisNo:       'MA1RE2LYKR6K*****',
  taxMode:         'MONTHLY',
  vehicleType:     'GOODS VEHICLE',
  vehicleClass:    'LIGHT GOODS VEHICLE',
  mobileNo:        '86848****1',
  checkpostName:   'AHMEDNAGAR',
  unladenWeight:   'NA',
  ladenWeight:     3495,
  bankRefNo:       '856185841148',
  paymentMode:     'ONLINE',
  serviceType:     'NOT APPLICABILE',
  permitType:      'TEMPORARY PERMIT',
  permitCategory:  '',
  emblemImagePath: './images/MH_logo.jpg',
  qrUrl:           'https://kms.parivahan.gov.in/verify?receipt=MHT2604063522817',
  taxItems: [
    { particular: 'MV Tax( 06-APR-2026 TO 05-MAY-2026 )', fees: 360,  fine: 0, total: 360  },
    { particular: 'Permit Fee',                            fees: 1000, fine: 0, total: 1000 },
  ],
  notes: [
    'This is a computer generated printout and no signature is required.',
    'Incorrect mentioning of vehicle class or seating capacity may lead to tax evasion and defaulter shall be liable for penal action.',
  ]
};

(async () => {
  const outputPath = path.join(outputDir, 'mh_sample_receipt.pdf');
  console.log('⏳ Generating Maharashtra receipt...');
  await generateReceipt(sampleData, outputPath);
  console.log(`✅ Receipt saved to: ${outputPath}`);
})();
