const path = require('path');
const data = require('./sampleData');
const { generateReceipt } = require('./generateReceipt');

const outputPath = path.join(__dirname, 'receipts', 'preview.pdf');

generateReceipt(data, outputPath)
  .then(() => {
    console.log(`Generated: ${outputPath}`);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
