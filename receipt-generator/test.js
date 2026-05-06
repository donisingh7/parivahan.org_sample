/**
 * test.js  —  Run standalone (no server needed)
 * Usage:  node test.js
 */
const { generateReceipt } = require('./generateReceipt');
const path = require('path');
const fs = require('fs');

const outputDir = path.join(__dirname, 'receipts');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const sampleBooking = {
  registrationNo: 'HR46F1003',
  receiptNo: 'RJT2604175776414',
  paymentDate: new Date('2026-04-17T14:08:00'), // ← timestamp from booking
  ownerName: 'V***Y N****L',
  chassisNo: 'MA3ZFDFSKSE1*****',
  taxMode: 'DAYS',
  vehicleType: 'CONTRACT CARRIAGE/PASSENGER VEHICLES',
  vehicleClass: 'MOTOR CAB',
  mobileNo: '90504****1',
  checkpostName: 'AAKERA MOD, ALWAR(ON BILASPUR - BHIWADI ROUTE)',
  sleeperCap: 0,
  seatingCapacity: 7,
  bankRefNo: 'LA3U9Z86ZM',
  paymentMode: 'ONLINE',
  serviceType: 'NOT APPLICABLE',
  permitType: 'NOT APPLICABLE',
  permitCategory: '',
  qrUrl: 'https://kms.parivahan.gov.in/verify?receipt=RJT2604175776414',
  taxItems: [
    {
      particular: 'MV Tax(17-Apr-2026 12:00 AM TO 17-Apr-2026 12:00 AM)',
      fees: 210,
      fine: 0,
      total: 210
    },
    {
      particular: 'Surcharge fee',
      fees: 14,
      fine: 0,
      total: 14
    }
  ]
};

(async () => {
  const outputPath = path.join(outputDir, 'sample_receipt.pdf');
  console.log('⏳ Generating receipt...');
  await generateReceipt(sampleBooking, outputPath);
  console.log(`✅ Receipt saved to: ${outputPath}`);
})();
