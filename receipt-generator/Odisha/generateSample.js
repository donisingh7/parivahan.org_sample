const path = require('path');
const { generateReceipt } = require('./generateReceipt');
const sampleData = require('./sampleData');

const outputPath = path.join(__dirname, 'receipts', 'preview.pdf');

generateReceipt(sampleData, outputPath)
  .then(() => console.log(`Generated ${outputPath}`))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
