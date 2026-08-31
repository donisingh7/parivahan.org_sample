const { generateReceipt } = require('./generateReceipt');
const path = require('path');
const fs = require('fs');

const outputDir = path.join(__dirname, 'receipts');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const sampleData = {
  registrationNo: 'UK13TA1906',
  receiptNo: 'UPR2604150850236',
  paymentDate: new Date('2026-04-16T06:10:00'),
  paymentInitDate: '16-APR-2026 06:09 AM',
  ownerName: 'C****I T*******L',
  chassisNo: 'MA3BNC72SRC7*****',
  taxMode: 'DAYS',
  vehicleType: 'NOT APPLICABLE',
  vehicleClass: 'CONTRACT CARRIAGE/PASSENGER VEHICLES',
  vehicleCategory: 'MOTOR CAB',
  mobileNo: '72064****5',
  checkpostName: 'AGRA',
  seatingCapacity: 6,
  sleeperCap: 1,
  bankRefNo: '8MT6PYF3QU',
  paymentMode: 'ONLINE',
  permitNumber: '0000',
  permitValidity: '15-APR-2026',
  fitnessValidity: '01-MAY-2026',
  insuranceValidity: '02-MAY-2026',
  puccValidity: '30-APR-2026',
  serviceType: 'AIR CONDITIONED',
  permitType: 'NOT APPLICABLE',
  paymentConfirmDate: '16-APR-2026 06:10 AM',
  emblemImagePath: './images/UP_logo.png',
  qrUrl: 'https://upparivahan.gov.in/verify?receipt=UPR2604150850236',
  taxItems: [
    {
      particular: 'MV Tax(16-Apr-2026 TO 16-Apr-2026)',
      fees: 180,
      fine: 0,
      total: 180
    }
  ],
  terms: [
    'This is a computer generated printout and no signature is required.',
    'Should not carry unlawful/unaccompanied goods.',
    'If any false information/discrepancies are found at later, necessary action will be taken against the vehicle owner/driver.',
  ]
};

(async () => {
  const outputPath = path.join(outputDir, 'up_sample_receipt.pdf');
  console.log('⏳ Generating UP receipt...');
  await generateReceipt(sampleData, outputPath);
  console.log(`✅ Receipt saved to: ${outputPath}`);
})();
