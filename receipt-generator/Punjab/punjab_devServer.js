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
      <title>Punjab Receipt - Live Preview</title>
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
        🟢 Punjab Receipt Live Preview
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
    registrationNo:     'HR37D8046',
    receiptNo:          'PBR2604180123062',
    paymentDate:        new Date('2026-04-18T13:20:34'),
    paymentInitDate:    '18-Apr-2026, 1:19:40 PM',
    ownerName:          'P*****M P*******G I********S',
    chassisNo:          'MB1AA22E8FRB*****',
    taxMode:            'QUARTERLY',
    vehicleType:        'TRANSPORT',
    vehicleClass:       'GOODS CARRIER',
    vehicleCategory:    'LIGHT GOODS VEHICLE',
    mobileNo:           '98960****5',
    checkpostName:      'KHARAR',
    grossVehicleWt:     2500,
    unladenWt:          0,
    bankRefNo:          'CPAGPOWDI9',
    paymentMode:        'ONLINE',
    permitValidity:     '',
    serviceType:        'NOT APPLICABLE',
    permitType:         'NOT APPLICABLE',
    paymentConfirmDate: '18-Apr-2026, 1:20:34 PM',
    emblemImagePath:    './images/Punjab_logo.png',
    qrUrl:              'https://punjabparivahan.gov.in/verify?receipt=PBR2604180123062',
    taxItems: [
      { particular: 'MV Tax ( 2026-04-18 01:19 PM To 2026-06-30 11:59 PM )',              fees: 1750, fine: 0, total: 1750 },
      { particular: 'Service/User Charge ( 2026-04-18 01:19 PM To 2026-06-30 11:59 PM )', fees: 30,   fine: 0, total: 30   },
      { particular: 'Cess ( 2026-04-18 01:19 PM To 2026-06-30 11:59 PM )',                fees: 175,  fine: 0, total: 175  },
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
  console.log(`\n🚀 Punjab Receipt Live preview → http://localhost:${PORT}\n`);
});
