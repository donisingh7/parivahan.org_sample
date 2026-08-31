const express = require('express');
const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');

const app = express();
const port = Number(process.env.PORT || 3001);
const outputPath = path.join(__dirname, 'receipts', 'preview.pdf');
let clients = [];
let regenerating = false;

app.get('/', (_request, response) => {
  response.send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Karnataka Receipt Preview</title>
    <style>
      * { box-sizing: border-box; }
      html, body { width: 100%; height: 100%; margin: 0; }
      body { display: flex; flex-direction: column; background: #202124; }
      header {
        height: 44px; padding: 0 18px; display: flex; align-items: center;
        gap: 12px; color: #fff; background: #2d2f31;
        border-bottom: 1px solid #444; font: 13px/1.2 system-ui, sans-serif;
      }
      #status { padding: 4px 10px; border-radius: 999px; background: #238636; }
      #status.busy { background: #9a6700; }
      iframe { width: 100%; flex: 1; border: 0; }
    </style>
  </head>
  <body>
    <header>
      <strong>Karnataka Checkpost Tax e-Receipt</strong>
      <span id="status">Live</span>
      <span id="message">Watching generator and sample data</span>
    </header>
    <iframe id="preview" src="/preview.pdf"></iframe>
    <script>
      const events = new EventSource('/events');
      const frame = document.getElementById('preview');
      const status = document.getElementById('status');
      const message = document.getElementById('message');
      events.onmessage = ({ data }) => {
        if (data === 'regenerating') {
          status.textContent = 'Regenerating';
          status.className = 'busy';
          message.textContent = 'A source change was detected';
        }
        if (data === 'reload') {
          status.textContent = 'Live';
          status.className = '';
          message.textContent = 'Updated at ' + new Date().toLocaleTimeString();
          frame.src = '/preview.pdf?t=' + Date.now();
        }
      };
    </script>
  </body>
</html>`);
});

app.get('/preview.pdf', (_request, response) => {
  if (!fs.existsSync(outputPath)) {
    return response.status(404).send('Preview has not been generated yet.');
  }
  response.setHeader('Content-Type', 'application/pdf');
  response.setHeader('Cache-Control', 'no-store');
  return fs.createReadStream(outputPath).pipe(response);
});

app.get('/events', (request, response) => {
  response.setHeader('Content-Type', 'text/event-stream');
  response.setHeader('Cache-Control', 'no-cache');
  response.setHeader('Connection', 'keep-alive');
  response.flushHeaders();
  clients.push(response);
  request.on('close', () => {
    clients = clients.filter((client) => client !== response);
  });
});

function broadcast(message) {
  clients.forEach((client) => client.write(`data: ${message}\n\n`));
}

async function regenerate() {
  if (regenerating) return;
  regenerating = true;
  broadcast('regenerating');
  try {
    for (const modulePath of ['./generateReceipt', './sampleData']) {
      delete require.cache[require.resolve(modulePath)];
    }
    const { generateReceipt } = require('./generateReceipt');
    const data = require('./sampleData');
    await generateReceipt(data, outputPath);
    broadcast('reload');
    console.log(`Regenerated ${new Date().toLocaleTimeString()}`);
  } catch (error) {
    console.error(error);
  } finally {
    regenerating = false;
  }
}

chokidar
  .watch(['generateReceipt.js', 'sampleData.js'], {
    cwd: __dirname,
    ignoreInitial: false
  })
  .on('add', regenerate)
  .on('change', regenerate);

app.listen(port, () => {
  console.log(`Live preview: http://localhost:${port}`);
});
