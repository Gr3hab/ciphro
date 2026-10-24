/* Darstellung auf kleinen und großen Bildschirmen: nichts abgeschnitten, nichts überlappt, Tasten groß genug.
   Geprüft werden die Rätsel der ersten Tage und die längsten Wörter des ganzen Vorrats. */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { NF, setup, openPage, solution } = require('./browser');

let env;
test.before(async () => { env = await setup(); });
test.after(async () => { if (env) await env.close(); });

const SIZES = [[320, 568], [360, 640], [375, 667], [390, 844], [430, 932], [768, 1024], [1280, 800], [667, 375], [740, 360], [844, 390]];

// Misst alles, was auf dem Bildschirm schiefgehen kann
async function measure(page) {
  return page.evaluate(() => {
    const W = document.documentElement.clientWidth, H = window.innerHeight, out = [];
    const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
    if (document.documentElement.scrollWidth > W + 1) out.push(`Seite scrollt seitlich (${document.documentElement.scrollWidth} > ${W})`);
    document.querySelectorAll('.app *').forEach(el => {
      if (!vis(el) || el.closest('[hidden]') || el.closest('.stage')) return;
      const r = el.getBoundingClientRect();
      if (r.right > W + 1 || r.left < -1) out.push(`ragt seitlich hinaus: ${el.tagName}.${el.className} ${Math.round(r.left)}–${Math.round(r.right)}`);
      if (r.bottom > H + 1) out.push(`unten abgeschnitten: ${el.tagName}.${el.className} ${Math.round(r.bottom)} > ${H}`);
    });
    const board = document.getElementById('board');
    if (board && vis(board)) {
      const br = board.getBoundingClientRect(), words = [...board.querySelectorAll('.w')].map(w => w.getBoundingClientRect());
      words.forEach((r, i) => {
        if (r.right > br.right + 1 || r.left < br.left - 1) out.push(`Wort ${i + 1} passt nicht in eine Zeile`);
        words.forEach((q, j) => { if (j > i && r.left < q.right - 1 && q.left < r.right - 1 && r.top < q.bottom - 1 && q.top < r.bottom - 1) out.push(`Wörter ${i + 1} und ${j + 1} überlappen`); });
      });
    }
    document.querySelectorAll('#kb .k > button').forEach(b => {
      if (!vis(b)) return;
      const r = b.getBoundingClientRect();
      if (r.width < 24 || r.height < 34) out.push(`Taste ${b.textContent.trim() || b.getAttribute('aria-label')} zu klein: ${Math.round(r.width)}×${Math.round(r.height)}`);
    });
    document.querySelectorAll('.mode .n, .tool, .btn, .rulechip span').forEach(el => {
      if (!vis(el)) return;
      if (el.classList.contains('n') && el.scrollWidth > el.clientWidth + 1) out.push(`Text abgeschnitten: ${el.textContent.trim()}`);
      if ((el.classList.contains('tool') || el.classList.contains('btn')) && el.scrollWidth > el.clientWidth + 2) out.push(`Knopftext passt nicht: ${el.textContent.trim()}`);
    });
    const d = document.querySelector('dialog[open]');
    if (d) { const r = d.getBoundingClientRect(); if (r.left < 0 || r.right > W || r.top < 0 || r.bottom > H) out.push('Dialog ragt aus dem Bildschirm'); }
    return out;
  });
}

for (const lang of ['de', 'en']) {
  test(`Layout ${lang.toUpperCase()}: alle Bildschirmgrößen, Start, Spiel in allen Stufen, Ergebnis, Dialoge`, async () => {
    const problems = [];
    for (const [width, height] of SIZES) {
      const page = await openPage(env, { width, height, locale: lang === 'de' ? 'de-AT' : 'en-GB', mobile: width < 560 || height < 560 });
      const tag = `${width}×${height}`;
      const check = async what => (await measure(page)).forEach(p => problems.push(`${tag} ${what}: ${p}`));
      await check('Start');
      for (const m of ['hard', 'mirror', 'impossible', 'easy']) {
        await page.click(`#tab-${m}`);
        await page.click('#startBtn');
        await check(m);
      }
      await page.click('.c[data-w="0"][data-i="0"]');
      await page.click('#hintBtn');
      await page.click('#keyBtn');
      await page.click('.c[data-w="0"][data-i="0"]');
      await check('Easy mit Tipp');
      await page.click('#revealBtn');
      await check('Auflösen fragen');
      await page.click('#confirmNo');
      await page.click('#pauseBtn');
      await check('Pause');
      await page.click('#resumeBtn');
      for (const w of solution(4, lang, 'easy')) {
        for (const ch of w) { if (/[A-Z]/.test(ch)) await page.keyboard.press(ch); else await page.click(`#kb .k[data-k="${ch}"] button`); }
      }
      await check('Ergebnis');
      for (const dlg of ['#helpBtn', '#statsBtn', '#archiveBtn', '#settingsBtn']) {
        await page.click(dlg);
        await check(dlg);
        await page.keyboard.press('Escape');
      }
      await page.context().close();
    }
    assert.deepEqual(problems, []);
  });
}

test('Layout: sehr kleines Handy quer bittet ums Drehen und hält die Uhr an', async () => {
  const page = await openPage(env, { width: 320, height: 568, mobile: true });
  await page.click('#startBtn');
  await page.clock.runFor(3000);
  await page.setViewportSize({ width: 568, height: 320 });
  await page.waitForTimeout(100);
  assert.ok(await page.isVisible('#rotate'));
  await page.clock.runFor(20000);
  await page.setViewportSize({ width: 320, height: 568 });
  assert.ok(await page.isVisible('#pauseCard'));
  assert.equal((await page.textContent('#timerText')).trim(), '0:03');
  await page.context().close();
});

test('Layout: Kurz-Einstieg passt ohne Scrollen auf ein kleines Handy (320×568)', async () => {
  const page = await openPage(env, { width: 320, height: 568, store: null, mobile: true });
  const fits = await page.evaluate(() => { const d = document.getElementById('introDlg'); return d.scrollHeight <= d.clientHeight + 1; });
  assert.ok(fits, 'Kurz-Einstieg muss ohne Scrollen sichtbar sein');
  for (const L of 'EIS') await page.click(`#introBody [data-demo="${L}"]`);
  const fits2 = await page.evaluate(() => { const d = document.getElementById('introDlg'); return d.scrollHeight <= d.clientHeight + 1; });
  assert.ok(fits2, 'Erfolgsmeldung muss ohne Scrollen sichtbar sein');
  await page.context().close();
});

test('Layout: Anleitung passt zugeklappt ohne Scrollen auf ein kleines Handy (320×568), Deutsch und Englisch', async () => {
  for (const locale of ['de-AT', 'en-GB']) {
    const page = await openPage(env, { width: 320, height: 568, locale, mobile: true });
    await page.click('#helpBtn');
    const fits = await page.evaluate(() => { const d = document.getElementById('helpDlg'); return d.scrollHeight <= d.clientHeight + 1; });
    assert.ok(fits, locale);
    await page.context().close();
  }
});

test('Layout: die längsten Wörter des ganzen Vorrats passen auf 320 px in eine Zeile', async () => {
  // Für jede Stufe den Tag mit dem breitesten Wort suchen und dort spielen
  const worst = {};
  for (let i = 0; i < NF.plannedDays(); i++) {
    const key = NF.addDays(NF.CONFIG.launchDate, i);
    for (const lang of ['de', 'en']) {
      const d = NF.buildDay(key, lang);
      NF.MODES.forEach(m => {
        const u = Math.max(...d.puzzles[m.id].words.map(w => NF.wordUnits(w, m.id)));
        const k = m.id + lang;
        if (!worst[k] || u > worst[k].u) worst[k] = { u, n: i + 1, lang, mode: m.id };
      });
    }
  }
  const problems = [];
  for (const w of Object.values(worst)) {
    const time = NF.addDays(NF.CONFIG.launchDate, w.n - 1) + 'T10:00:00+01:00';
    const page = await openPage(env, { width: 320, height: 568, time, locale: w.lang === 'de' ? 'de-AT' : 'en-GB', mobile: true });
    await page.click(`#tab-${w.mode}`);
    await page.click('#startBtn');
    (await measure(page)).forEach(p => problems.push(`#${w.n} ${w.lang} ${w.mode} (${w.u} Kästchen): ${p}`));
    await page.context().close();
  }
  assert.deepEqual(problems, []);
});
