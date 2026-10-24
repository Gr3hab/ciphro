/* Kleiner Webserver für Tests und Redaktion. Liefert den Hauptordner aus, wie GitHub Pages es tut.
   Aufruf: node tools/server.js [--port 8080] [--open pfad]  (aus dem Ordner _dev) */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8'
};

// Wie GitHub Pages (Jekyll): Ordner und Dateien mit _ oder . am Anfang werden nicht ausgeliefert.
// Ausnahme nur für die Redaktion (allowDev), damit die Prüfseite lokal läuft.
function hidden(rel) { return rel.split('/').some(part => part.startsWith('_') || part.startsWith('.')); }

function start(opts = {}) {
  const allowDev = !!opts.allowDev;
  const server = http.createServer((req, res) => {
    let rel;
    try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, ''); }
    catch (e) { res.writeHead(400); res.end(); return; }
    if (rel === '' || rel.endsWith('/')) rel += 'index.html';
    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT) || (!allowDev && hidden(rel))) { res.writeHead(404); res.end('not found'); return; }
    fs.stat(file, (err, st) => {
      if (!err && st.isDirectory()) { res.writeHead(301, { Location: '/' + rel + '/' }); res.end(); return; }
      if (err) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(file).pipe(res);
    });
  });
  return new Promise(resolve => server.listen(opts.port || 0, '127.0.0.1', () => {
    const { port } = server.address();
    resolve({ url: `http://127.0.0.1:${port}/`, port, close: () => new Promise(r => server.close(r)) });
  }));
}

module.exports = { start, ROOT };

if (require.main === module) {
  const args = process.argv.slice(2);
  const port = +(args[args.indexOf('--port') + 1] || 0) || 8080;
  const open = args.includes('--open') ? args[args.indexOf('--open') + 1] : '';
  start({ port, allowDev: true }).then(s => console.log(`NUMIGMA läuft auf ${s.url}${open}  (Strg+C beendet)`));
}
