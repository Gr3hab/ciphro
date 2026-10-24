/* Rendert die Vorschaubilder og-de.png und og-en.png aus og.html (Playwright). Aufruf im Ordner _dev: node grafik/render.js
   og.png (englisch) bleibt für Links, die vor der Aufteilung geteilt wurden, unverändert liegen. */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const lang of ['de', 'en']) {
    await p.goto(pathToFileURL(path.join(__dirname, 'og.html')).href + '?lang=' + lang);
    await p.evaluate(() => document.fonts.ready);
    // Slogan muss vollständig ins Bild passen
    const ok = await p.evaluate(() => [...document.querySelectorAll('.tag span')].every(s => { const r = s.getBoundingClientRect(); return r.left >= 40 && r.right <= 1160; }));
    if (!ok) throw new Error(`Slogan (${lang}) passt nicht ins Bild`);
    await p.screenshot({ path: path.join(__dirname, '..', '..', `og-${lang}.png`) });
    console.log(`og-${lang}.png geschrieben`);
  }
  await b.close();
})();
