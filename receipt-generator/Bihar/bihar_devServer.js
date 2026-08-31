const express  = require('express');
const chokidar = require('chokidar');
const path     = require('path');
const fs       = require('fs');

const app  = express();
const PORT = 3001;
let clients = [];

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bihar Receipt - Live Preview</title>
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
        🟢 Bihar Receipt Live Preview
        <span id="status">● Live</span>
        <span id="msg">Watching for changes...</span>
      </div>
      <iframe id="pdfFrame" src="/preview.pdf"></iframe>
      <script>
        const evtSource = new EventSource('/reload-events');
        const status = document.getElementById('status');
        const msg    = document.getElementById('msg');
        const frame  = document.getElementById('pdfFrame');
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

function broadcast(msg) { clients.forEach(c => c.write(`data: ${msg}\n\n`)); }

function regenerate() {
  broadcast('regenerating');
  Object.keys(require.cache).forEach(key => {
    if (key.includes('generateReceipt')) delete require.cache[key];
  });

  const { generateReceipt } = require('./generateReceipt');
  const outputPath = path.join(__dirname, 'receipts', 'preview.pdf');

  const testData = {
    registrationNo:         'PB10KH3474',
    receiptNo:              'BRR2604040625863',
    paymentDate:            new Date('2026-04-04T20:15:35'),
    paymentInitDate:        '04-Apr-2026, 8:12:18 PM',
    ownerName:              'D****R S***H',
    chassisNo:              'MA1RV2TUKS6L*****',
    taxMode:                'DAYS',
    vehicleType:            'TRANSPORT',
    vehicleClass:           'GOODS CARRIER',
    vehicleCategory:        'LIGHT GOODS VEHICLE',
    mobileNo:               '70090****0',
    checkpostName:          'NOT APPLICABLE',
    grossVehicleWt:         2825,
    unladenWt:              0,
    bankRefNo:              'IK0DPUPMS6',
    paymentMode:            'ONLINE',
    fitnessValidity:        '06-DEC-2027',
    insuranceValidity:      '28-NOV-2026',
    puccValidity:           '06-DEC-2026',
    serviceType:            'NOT APPLICABLE',
    permitType:             'NOT APPLICABLE',
    grossCombinationWeight: 0,
    paymentConfirmDate:     '04-Apr-2026, 8:15:35 PM',
    emblemImagePath:        './images/Bihar_logo.png',
    qrUrl:                  'https://biharparivahan.gov.in/verify?receipt=BRR2604040625863',
    taxItems: [
      { particular: 'MV Tax ( 2026-04-04 To 2026-05-02 )', fees: 1700, fine: 0, total: 1700 },
    ],
    terms: [
      'This is a computer generated printout and no signature is required.',
      'Should not carry unlawful/unaccompanied goods.',
      'If any false information/discrepancies are found at later, necessary action will be taken against the vehicle owner/driver.',
    ]
  };

  generateReceipt(testData, outputPath)
    .then(() => { console.log('✅ PDF regenerated at', new Date().toLocaleTimeString()); broadcast('reload'); })
    .catch(err  => { console.error('❌ Error:', err.message); });
}

const receiptsDir = path.join(__dirname, 'receipts');
if (!fs.existsSync(receiptsDir)) fs.mkdirSync(receiptsDir);

const watcher = chokidar.watch('./generateReceipt.js', { ignoreInitial: false });
watcher.on('change', () => { console.log('📝 Change detected...'); regenerate(); });
watcher.on('add', regenerate);

app.listen(PORT, () => {
  console.log(`\n🚀 Bihar Receipt Live preview → http://localhost:${PORT}\n`);
});
