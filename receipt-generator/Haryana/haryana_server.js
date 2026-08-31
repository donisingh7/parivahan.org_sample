const express = require('express');
const path = require('path');
const fs = require('fs');
const { generateReceipt } = require('./generateReceipt');

const app = express();
app.use(express.json());

const receiptsDir = path.join(__dirname, 'receipts');
if (!fs.existsSync(receiptsDir)) fs.mkdirSync(receiptsDir);

/**
 * POST /booking/confirm
 */
app.post('/booking/confirm', async (req, res) => {
  try {
    const bookingData = req.body;

    if (!bookingData.registrationNo || !bookingData.receiptNo) {
      return res.status(400).json({ error: 'registrationNo and receiptNo are required' });
    }

    bookingData.paymentDate = new Date();

    const filename = `receipt_${bookingData.receiptNo}_${Date.now()}.pdf`;
    const outputPath = path.join(receiptsDir, filename);

    await generateReceipt(bookingData, outputPath);

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
 */
app.get('/receipts/download/:filename', (req, res) => {
  const safeName = path.basename(req.params.filename);
  const filePath = path.join(receiptsDir, safeName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Receipt not found' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
  fs.createReadStream(filePath).pipe(res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Haryana receipt server running at http://localhost:${PORT}`);
});
