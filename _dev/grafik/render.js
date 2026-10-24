/* Rendert og.png aus og.html (Playwright). Aufruf im Ordner _dev: node grafik/render.js */
'use strict';
const path = require('path');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await p.goto('file://' + path.join(__dirname, 'og.html'));
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: path.join(__dirname, '..', '..', 'og.png') });
  await b.close();
  console.log('og.png geschrieben');
})();
