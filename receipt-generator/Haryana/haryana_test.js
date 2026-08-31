const { generateReceipt } = require('./generateReceipt');
const path = require('path');
const fs = require('fs');

const outputDir = path.join(__dirname, 'receipts');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const sampleData = {
  registrationNo: 'UP34T8867',
  receiptNo: 'HRT2505023036201',
  paymentDate: new Date('2026-04-19T05:09:53'),
  paymentInitDate: '02-May-2025, 5:37:08 PM',
  ownerName: 'A******T S***H',
  chassisNo: 'MC1E4DHA5DP0*****',
  taxMode: 'DAYS',
  vehicleType: 'TRANSPORT',
  vehicleClass: 'BUS',
  vehicleCategory: 'MEDIUM PASSENGER VEHICLE',
  mobileNo: '91708****8',
  checkpostName: '',
  seatingCapacity: 17,
  sleeperCap: 0,
  bankRefNo: '131767988',
  paymentMode: 'ONLINE',
  fitnessValidity: '',
  insuranceValidity: '',
  puccValidity: '',
  serviceType: 'AC Deluxe Service',
  permitType: 'NOT APPLICABLE',
  paymentConfirmDate: '',
  qrUrl: 'https://haryanaparivahan.gov.in/verify?receipt=HRT2505023036201',
  emblemImagePath: './images/haryana-emblem.png',  // ← uncomment when you have the image
  taxItems: [
    {
      particular: 'MV Tax ( 2025-05-02 05:28 PM To 2025-05-03 05:27 PM )',
      fees: 1500,
      fine: 0,
      total: 1500
    }
  ],
  terms: [
    'This is a computer generated printout and no signature is required.',
    'Should not carry unlawful/unaccompanied goods.',
    'If any false information/discrepancies are found at later, necessary action will be taken against the vehicle owner/driver.',
  ]
};

(async () => {
  const outputPath = path.join(outputDir, 'haryana_sample_receipt.pdf');
  console.log('⏳ Generating Haryana receipt...');
  await generateReceipt(sampleData, outputPath);
  console.log(`✅ Receipt saved to: ${outputPath}`);
})();
