/* Rendert die Vorschaubilder og-de.png, og-en.png, og-fr.png und og-it.png aus og.html und die App-Symbole aus icon.html (Playwright).
   Aufruf im Ordner _dev: node grafik/render.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const lang of ['de', 'en', 'fr', 'it']) {
    await p.goto(pathToFileURL(path.join(__dirname, 'og.html')).href + '?lang=' + lang);
    await p.evaluate(() => document.fonts.ready);
    // Slogan muss vollständig ins Bild passen
    const ok = await p.evaluate(() => [...document.querySelectorAll('.tag span')].every(s => { const r = s.getBoundingClientRect(); return r.left >= 40 && r.right <= 1160; }));
    if (!ok) throw new Error(`Slogan (${lang}) passt nicht ins Bild`);
    await p.screenshot({ path: path.join(__dirname, '..', '..', `og-${lang}.png`) });
    console.log(`og-${lang}.png geschrieben`);
  }
  if (process.argv.includes('--nur-og')) { await b.close(); return; }
  // App-Symbole (CIPHRO: „3“ über „C“)
  for (const [file, size, mask] of [['icon-512.png', 512, 0], ['icon-192.png', 192, 0], ['icon.png', 180, 0], ['icon-maskable-512.png', 512, 1]]) {
    const ip = await b.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await ip.goto(pathToFileURL(path.join(__dirname, 'icon.html')).href + `?size=${size}&mask=${mask}`);
    await ip.evaluate(() => document.fonts.ready);
    await ip.screenshot({ path: path.join(__dirname, '..', '..', file) });
    await ip.close();
    console.log(`${file} geschrieben`);
  }
  await b.close();
})();
