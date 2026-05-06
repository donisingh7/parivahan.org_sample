/**
 * CLI wrapper — called by the Next.js API route via child_process.
 * Usage: node receipt-runner.js <dataJsonPath> <outputPdfPath>
 */
const fs   = require('fs');
const path = require('path');

const [dataPath, outputPath] = process.argv.slice(2);

if (!dataPath || !outputPath) {
  console.error('Usage: node receipt-runner.js <dataJsonPath> <outputPdfPath>');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Revive paymentDate back to a Date object (JSON serialises it as a string)
if (data.paymentDate) data.paymentDate = new Date(data.paymentDate);

const { generateReceipt } = require(path.join(__dirname, 'generateReceipt.js'));

generateReceipt(data, outputPath)
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('receipt-runner error:', err);
    process.exit(1);
  });
