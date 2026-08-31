const path = require('path');
const data = require('./sampleData');
const { generateReceipt } = require('./generateReceipt');

generateReceipt(data, path.join(__dirname, 'receipts', 'preview.pdf'))
  .then((outputPath) => console.log(`Generated ${outputPath}`))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
