const express = require('express');
const chokidar = require('chokidar');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
let clients = [];  // SSE clients for live reload

// ─── Serve the PDF viewer page ───────────────────────────────
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>PDF Live Preview</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #1e1e1e; display: flex; flex-direction: column; height: 100vh; }
        #topbar {
          background: #2d2d2d;
          color: #fff;
          padding: 10px 20px;
          font-family: monospace;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 2px solid #444;
        }
        #status {
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 12px;
          background: #4caf50;
          color: white;
        }
        #status.regenerating { background: #ff9800; }
        iframe {
          flex: 1;
          width: 100%;
          border: none;
        }
      </style>
    </head>
    <body>
      <div id="topbar">
        🔴 PDF Live Preview
        <span id="status">● Live</span>
        <span id="msg">Watching for changes...</span>
      </div>
      <iframe id="pdfFrame" src="/preview.pdf"></iframe>

      <script>
        // Listen for server-sent events (file change signals)
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
            // Reload the iframe with cache-busting
            frame.src = '/preview.pdf?t=' + Date.now();
          }
        };
      </script>
    </body>
    </html>
  `);
});

// ─── Serve the latest generated PDF ──────────────────────────
app.get('/preview.pdf', (req, res) => {
  const pdfPath = path.join(__dirname, 'receipts', 'preview.pdf');
  if (!fs.existsSync(pdfPath)) {
    return res.status(404).send('PDF not generated yet');
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Cache-Control', 'no-store');
  fs.createReadStream(pdfPath).pipe(res);
});

// ─── SSE endpoint (pushes reload signal to browser) ──────────
app.get('/reload-events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  clients.push(res);
  req.on('close', () => {
    clients = clients.filter(c => c !== res);
  });
});

function broadcast(msg) {
  clients.forEach(c => c.write(`data: ${msg}\n\n`));
}

// ─── Regenerate PDF whenever generateReceipt.js changes ──────
function regenerate() {
  broadcast('regenerating');
  // Clear require cache so updated file is picked up
  Object.keys(require.cache).forEach(key => {
    if (key.includes('generateReceipt')) delete require.cache[key];
  });

  const { generateReceipt } = require('./generateReceipt');
  const outputPath = path.join(__dirname, 'receipts', 'preview.pdf');

  // ⬇️ PUT YOUR TEST DATA HERE — edit this freely
  const testData = {
    registrationNo: 'HR46F1003',
    receiptNo: 'RJT2604175776414',
    paymentDate: new Date(),
    ownerName: 'V***Y N****L',
    chassisNo: 'MA3ZFDFSKSE1*****',
    taxMode: 'DAYS',
    vehicleType: 'CONTRACT CARRIAGE/PASSENGER VEHICLES',
    vehicleClass: 'MOTOR CAB',
    mobileNo: '90504****1',
    checkpostName: 'AAKERA MOD, ALWAR',
    sleeperCap: 0,
    seatingCapacity: 7,
    bankRefNo: 'LA3U9Z86ZM',
    paymentMode: 'ONLINE',
    serviceType: 'NOT APPLICABLE',
    permitType: 'NOT APPLICABLE',
    taxItems: [
      { particular: 'MV Tax(17-Apr-2026)', fees: 210, fine: 0, total: 210 },
      { particular: 'Surcharge fee',       fees: 14,  fine: 0, total: 14  },
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

// ─── Watch generateReceipt.js for changes ────────────────────
const watcher = chokidar.watch('./generateReceipt.js', { ignoreInitial: false });
watcher.on('change', () => {
  console.log('📝 Change detected — regenerating...');
  regenerate();
});
watcher.on('add', regenerate); // also run on startup

// ─── Start server ─────────────────────────────────────────────
const receiptsDir = path.join(__dirname, 'receipts');
if (!fs.existsSync(receiptsDir)) fs.mkdirSync(receiptsDir);

app.listen(PORT, () => {
  console.log(`\n🚀 Live preview running!`);
  console.log(`   Open → http://localhost:${PORT}\n`);
});