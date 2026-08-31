const express = require('express');
const path = require('path');
const fs = require('fs');
const { generateReceipt } = require('./generateReceipt');

const app = express();
app.use(express.json());

// Ensure receipts output folder exists
const receiptsDir = path.join(__dirname, 'receipts');
if (!fs.existsSync(receiptsDir)) fs.mkdirSync(receiptsDir);

/**
 * POST /booking/confirm
 * 
 * Body (example):
 * {
 *   "registrationNo": "HR46F1003",
 *   "receiptNo": "RJT2604175776414",
 *   "ownerName": "V***Y N****L",
 *   "chassisNo": "MA3ZFDFSKSE1*****",
 *   "taxMode": "DAYS",
 *   "vehicleType": "CONTRACT CARRIAGE/PASSENGER VEHICLES",
 *   "vehicleClass": "MOTOR CAB",
 *   "mobileNo": "90504****1",
 *   "checkpostName": "AAKERA MOD, ALWAR(ON BILASPUR - BHIWADI ROUTE)",
 *   "sleeperCap": 0,
 *   "seatingCapacity": 7,
 *   "bankRefNo": "LA3U9Z86ZM",
 *   "paymentMode": "ONLINE",
 *   "serviceType": "NOT APPLICABLE",
 *   "permitType": "NOT APPLICABLE",
 *   "permitCategory": "",
 *   "taxItems": [
 *     { "particular": "MV Tax(17-Apr-2026 12:00 AM TO 17-Apr-2026 12:00 AM)", "fees": 210, "fine": 0, "total": 210 },
 *     { "particular": "Surcharge fee", "fees": 14, "fine": 0, "total": 14 }
 *   ]
 * }
 */
app.post('/booking/confirm', async (req, res) => {
  try {
    const bookingData = req.body;

    // Validate minimum required fields
    if (!bookingData.registrationNo || !bookingData.receiptNo) {
      return res.status(400).json({ error: 'registrationNo and receiptNo are required' });
    }

    // Add server-side timestamp (this is the authoritative time)
    bookingData.paymentDate = new Date();

    // Generate unique filename
    const filename = `receipt_${bookingData.receiptNo}_${Date.now()}.pdf`;
    const outputPath = path.join(receiptsDir, filename);

    await generateReceipt(bookingData, outputPath);

    // Return download URL
    return res.status(200).json({
      success: true,
      message: 'Booking confirmed. Receipt generated.',
      receiptNo: bookingData.receiptNo,
      downloadUrl: `/receipts/download/${filename}`,
      generatedAt: bookingData.paymentDate.toISOString()
    });

  } catch (err) {
    console.error('Receipt generation error:', err);
    return res.status(500).json({ error: 'Failed to generate receipt', details: err.message });
  }
});

/**
 * GET /receipts/download/:filename
 * Downloads the generated receipt PDF
 */
app.get('/receipts/download/:filename', (req, res) => {
  const { filename } = req.params;

  // Security: prevent path traversal
  const safeName = path.basename(filename);
  const filePath = path.join(receiptsDir, safeName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Receipt not found' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
  fs.createReadStream(filePath).pipe(res);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Receipt server running at http://localhost:${PORT}`);
  console.log(`   POST /booking/confirm   → generate receipt`);
  console.log(`   GET  /receipts/download/:file → download receipt`);
});
