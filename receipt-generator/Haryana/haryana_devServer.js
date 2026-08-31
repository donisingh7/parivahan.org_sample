const express = require('express');
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;
let clients = [];

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Haryana Receipt - Live Preview</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #1e1e1e; display: flex; flex-direction: column; height: 100vh; }
        #topbar {
          background: #2d2d2d; color: #fff;
          padding: 10px 20px; font-family: monospace; font-size: 13px;
          display: flex; align-items: center; gap: 12px;
          border-bottom: 2px solid #444;
        }
        #status { padding: 3px 10px; border-radius: 12px; font-size: 12px; background: #4caf50; color: white; }
        #status.regenerating { background: #ff9800; }
        iframe { flex: 1; width: 100%; border: none; }
      </style>
    </head>
    <body>
      <div id="topbar">
        🟢 Haryana Receipt Live Preview
        <span id="status">● Live</span>
        <span id="msg">Watching for changes...</span>
      </div>
      <iframe id="pdfFrame" src="/preview.pdf"></iframe>
      <script>
        const evtSource = new EventSource('/reload-events');
        const status = document.getElementById('status');
        const msg = document.getElementById('msg');
        const frame = document.getElementById('pdfFrame');

        evtSource.onmessage = (e) => {
          if (e.data === 'regenerating') {
            status.textContent = '⏳ Regenerating...';
            status.className = 'regenerating';
            msg.textContent = 'File change detected, rebuilding PDF...';
          }
          if (e.data === 'reload') {
            status.textContent = '● Live';
            status.className = '';
            msg.textContent = 'Updated at ' + new Date().toLocaleTimeString();
            frame.src = '/preview.pdf?t=' + Date.now();
          }
        };
      </script>
    </body>
    </html>
  `);
});

app.get('/preview.pdf', (req, res) => {
  const pdfPath = path.join(__dirname, 'receipts', 'preview.pdf');
  if (!fs.existsSync(pdfPath)) return res.status(404).send('PDF not generated yet');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Cache-Control', 'no-store');
  fs.createReadStream(pdfPath).pipe(res);
});

app.get('/reload-events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  clients.push(res);
  req.on('close', () => { clients = clients.filter(c => c !== res); });
});

function broadcast(msg) {
  clients.forEach(c => c.write(`data: ${msg}\n\n`));
}

function regenerate() {
  broadcast('regenerating');
  Object.keys(require.cache).forEach(key => {
    if (key.includes('generateReceipt')) delete require.cache[key];
  });

  const { generateReceipt } = require('./generateReceipt');
  const outputPath = path.join(__dirname, 'receipts', 'preview.pdf');

  // ← Edit test data here
  const testData = {
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
    emblemImagePath: './images/haryana-emblem.png',
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

  generateReceipt(testData, outputPath)
    .then(() => {
      console.log('✅ PDF regenerated at', new Date().toLocaleTimeString());
      broadcast('reload');
    })
    .catch(err => {
      console.error('❌ Error:', err.message);
    });
}

const receiptsDir = path.join(__dirname, 'receipts');
if (!fs.existsSync(receiptsDir)) fs.mkdirSync(receiptsDir);

const watcher = chokidar.watch('./generateReceipt.js', { ignoreInitial: false });
watcher.on('change', () => { console.log('📝 Change detected...'); regenerate(); });
watcher.on('add', regenerate);

app.listen(PORT, () => {
  console.log(`\n🚀 Live preview → http://localhost:${PORT}\n`);
});
