/* Bildschirmfotos und Messwerte für _dev/nachweise/nachher (Vergleich mit vorher).
   Aufruf im Ordner _dev: node tools/nachweise.js */
'use strict';
const fs = require('fs');
const path = require('path');
const { setup, openPage, solution, NF } = require('../tests/browser');

const OUT = path.join(__dirname, '..', 'nachweise', 'nachher');
fs.mkdirSync(OUT, { recursive: true });
const R = {};

(async () => {
  const env = await setup();
  const shots = [[390, 844, 'light', 'de', '390-de-hell'], [390, 844, 'dark', 'en', '390-en-dunkel'], [320, 568, 'light', 'de', '320-de-hell']];
  for (const [width, height, scheme, lang, name] of shots) {
    const ctx = await env.browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, colorScheme: scheme, locale: lang === 'de' ? 'de-AT' : 'en-GB', timezoneId: 'Europe/Vienna', serviceWorkers: 'block', hasTouch: true, isMobile: true });
    await ctx.clock.install({ time: new Date('2026-10-24T15:00:00+02:00') });
    const page = await ctx.newPage();
    await page.goto(env.srv.url);
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(OUT, `${name}-1-erster-besuch.png`) });
    R[`${name} Kurz-Einstieg passt ohne Scrollen`] = await page.evaluate(() => { const d = document.getElementById('introDlg'); return d.scrollHeight <= d.clientHeight + 1; });
    const word = lang === 'de' ? 'EIS' : 'CAT';
    for (const L of word) await page.click(`#introBody [data-demo="${L}"]`);
    await page.screenshot({ path: path.join(OUT, `${name}-1b-erster-besuch-geknackt.png`) });
    await page.click('#introGo');
    await page.screenshot({ path: path.join(OUT, `${name}-2-start.png`) });
    await page.click('#startBtn');
    await page.waitForTimeout(100);
    if (width === 320) R['320 px: Tastenbreite px'] = await page.evaluate(() => Math.round(document.querySelector('.k[data-k="Q"] button').getBoundingClientRect().width * 10) / 10);
    await page.screenshot({ path: path.join(OUT, `${name}-3-spiel.png`) });
    await page.click('#statsBtn');
    await page.waitForTimeout(100);
    R[`${name} Code bei offenem Dialog sichtbar`] = await page.evaluate(() => getComputedStyle(document.querySelector('#board .words')).visibility !== 'hidden');
    await page.screenshot({ path: path.join(OUT, `${name}-4-dialog-uhr-pausiert-code-verdeckt.png`) });
    await page.keyboard.press('Escape');
    await page.click('#pauseBtn');
    await page.screenshot({ path: path.join(OUT, `${name}-5-pause.png`) });
    await page.click('#resumeBtn');
    await page.click('#helpBtn');
    R[`${name} Anleitung Höhe px (zugeklappt)`] = await page.evaluate(() => Math.round(document.querySelector('#helpDlg').scrollHeight));
    await page.screenshot({ path: path.join(OUT, `${name}-6-anleitung.png`) });
    await page.keyboard.press('Escape');
    for (const w of solution(4, lang, 'easy')) for (const ch of w) { if (/[A-Z]/.test(ch)) await page.keyboard.press(ch); else await page.click(`#kb .k[data-k="${ch}"] button`); }
    await page.waitForTimeout(300);
    await page.evaluate(() => { document.getElementById('stage').scrollTop = 1e6; });
    await page.screenshot({ path: path.join(OUT, `${name}-7-ergebnis.png`) });
    await ctx.close();
  }
  // Querformat
  {
    const page = await openPage(env, { width: 844, height: 390, mobile: true });
    await page.click('#startBtn');
    await page.screenshot({ path: path.join(OUT, '844x390-de-hell-querformat.png') });
    await page.context().close();
  }
  // Hilfe-Farben: dasselbe Vorgehen wie vorher (Schlüssel bei Wort 1, Tipp bei Wort 2 überschrieben)
  {
    const page = await openPage(env, { clipboard: true });
    await page.click('#tab-hard'); await page.click('#startBtn');
    const hw = solution(4, 'de', 'hard');
    await page.click('#keyBtn'); await page.click('#confirmYes');
    for (const w of [hw[0]]) for (const L of w) await page.click(`#kb .k[data-k="${L}"] button`);
    await page.click('#board .w[data-w="1"] .c[data-i="0"]'); await page.click('#hintBtn');
    await page.click('#board .w[data-w="1"] .c[data-i="0"]'); await page.click('#kb .k[data-k="Q"] button');
    for (let wi = 1; wi < hw.length; wi++) {
      await page.click(`#board .w[data-w="${wi}"] .c[data-i="0"]`);
      for (const L of hw[wi]) await page.click(`#kb .k[data-k="${L}"] button`);
    }
    await page.click('#result [data-act=share]');
    R['Hilfe-Farben: Teilen-Text nach Schlüssel (Wort 1) und überschriebenem Tipp (Wort 2)'] = (await page.evaluate(() => navigator.clipboard.readText())).replace(/http:\/\/127\.0\.0\.1:\d+\//, 'https://gr3hab.github.io/numfact/');
    await page.context().close();
  }
  // Prüfseite: wie GitHub Pages ausgeliefert?
  {
    const page = await (await env.browser.newContext()).newPage();
    const r = await page.goto(env.srv.url + 'pruefen.html');
    R['pruefen.html HTTP-Status (Hauptordner)'] = r.status();
    const r2 = await page.goto(env.srv.url + '_dev/tools/pruefen.html');
    R['_dev/tools/pruefen.html HTTP-Status'] = r2.status();
    await page.context().close();
  }
  await env.close();
  // Zuordnung DE/EN und Buchstaben pro Stufe über den ganzen Vorrat
  const P = NF.plannedDays(); let mism = 0; const days = []; const letters = { easy: 0, hard: 0, mirror: 0, impossible: 0 };
  for (let d = 0; d < P; d++) {
    const k = NF.addDays(NF.CONFIG.launchDate, d), D = NF.buildDay(k, 'de'), E = NF.buildDay(k, 'en');
    if (NF.MODES.some(m => D.puzzles[m.id].fact.id !== E.puzzles[m.id].fact.id)) { mism++; days.push(d + 1); }
    NF.MODES.forEach(m => { letters[m.id] += D.puzzles[m.id].words.reduce((n, w) => n + [...w.plain].length, 0); });
  }
  R[`Zuordnung DE/EN und Buchstaben (${P} Tage)`] = { mism, days, avgLetters: Object.fromEntries(Object.entries(letters).map(([k, v]) => [k, Math.round(v / P)])) };
  fs.writeFileSync(path.join(OUT, 'messwerte.json'), JSON.stringify(R, null, 1));
  console.log(JSON.stringify(R, null, 1));
})();
