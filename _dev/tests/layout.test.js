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
      // Ein Wort bricht nie um: alle Kästchen und alle Ziffern eines Worts stehen auf einer Höhe
      board.querySelectorAll('.w').forEach((w, i) => ['.c', '.d'].forEach(sel => {
        const tops = [...w.querySelectorAll(sel)].map(el => el.getBoundingClientRect().top);
        if (tops.some(t => Math.abs(t - tops[0]) > 1)) out.push(`Wort ${i + 1} bricht um (${sel})`);
      }));
      words.forEach((r, i) => {
        if (r.right > br.right + 1 || r.left < br.left - 1) out.push(`Wort ${i + 1} passt nicht in eine Zeile`);
        words.forEach((q, j) => { if (j > i && r.left < q.right - 1 && q.left < r.right - 1 && r.top < q.bottom - 1 && q.top < r.bottom - 1) out.push(`Wörter ${i + 1} und ${j + 1} überlappen`); });
      });
    }
    document.querySelectorAll('#kb .k > button').forEach(b => {
      if (!vis(b)) return;
      const r = b.getBoundingClientRect();
      if (r.width < 24 || r.height < 34) out.push(`Taste ${b.textContent.trim() || b.getAttribute('aria-label')} zu klein: ${Math.round(r.width)}×${Math.round(r.height)}`);
      // Zahl auf der Taste: lesbar groß, unter dem Buchstaben, ganz auf der Taste
      const i = b.querySelector('i');
      if (i && i.textContent && vis(i)) {
        const ri = i.getBoundingClientRect(), rb = b.querySelector('b').getBoundingClientRect(), fs = parseFloat(getComputedStyle(i).fontSize);
        if (fs < 11) out.push(`Zahl auf Taste ${b.querySelector('b').textContent} zu klein: ${fs}px`);
        if (ri.top < rb.bottom - 1 || ri.left < r.left - 0.5 || ri.right > r.right + 0.5 || ri.bottom > r.bottom + 0.5) out.push(`Zahl auf Taste ${b.querySelector('b').textContent} liegt schief`);
      }
    });
    // Regelzeile: nichts darf mit „…“ abgeschnitten werden
    document.querySelectorAll('.rulechip .rt > *').forEach(el => {
      if (vis(el) && el.scrollWidth > el.clientWidth + 1) out.push(`Regel abgeschnitten: ${el.textContent.trim()}`);
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

const LOCALE = { de: 'de-AT', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' };
for (const lang of NF.CONFIG.languages) {
  test(`Layout ${lang.toUpperCase()}: alle Bildschirmgrößen, Start, Spiel in allen Stufen, Ergebnis, Dialoge`, async () => {
    const problems = [];
    for (const [width, height] of SIZES) {
      const page = await openPage(env, { width, height, locale: LOCALE[lang], mobile: width < 560 || height < 560 });
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
      await page.click('#confirmYes');
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

test('Layout: Kurz-Einstieg passt ohne Scrollen auf ein kleines Handy (320×568), in jeder Sprache', async () => {
  for (const [lang, word] of [['de', 'EIS'], ['en', 'CAT'], ['fr', 'MER'], ['it', 'SOLE']]) {
    const page = await openPage(env, { width: 320, height: 568, store: null, mobile: true, locale: LOCALE[lang] });
    const fits = await page.evaluate(() => { const d = document.getElementById('introDlg'); return d.scrollHeight <= d.clientHeight + 1; });
    assert.ok(fits, `${lang}: Kurz-Einstieg muss ohne Scrollen sichtbar sein`);
    assert.deepEqual(await measure(page), [], lang);
    for (const L of word) await page.click(`#introBody [data-demo="${L}"]`);
    const fits2 = await page.evaluate(() => { const d = document.getElementById('introDlg'); return d.scrollHeight <= d.clientHeight + 1; });
    assert.ok(fits2, `${lang}: Erfolgsmeldung muss ohne Scrollen sichtbar sein`);
    await page.context().close();
  }
});

test('Layout: Anleitung passt zugeklappt ohne Scrollen auf ein kleines Handy (320×568), in jeder Sprache', async () => {
  for (const locale of Object.values(LOCALE)) {
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
    for (const lang of NF.CONFIG.languages) {
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
    const page = await openPage(env, { width: 320, height: 568, time, locale: LOCALE[w.lang], mobile: true });
    await page.click(`#tab-${w.mode}`);
    await page.click('#startBtn');
    (await measure(page)).forEach(p => problems.push(`#${w.n} ${w.lang} ${w.mode} (${w.u} Kästchen): ${p}`));
    await page.context().close();
  }
  assert.deepEqual(problems, []);
});

test('Layout: kein Wort bricht um, auch bei krummen Breiten (Handys mit Anzeigegröße 2,6 oder 2,8)', async () => {
  // Gemeldet am 13. November 2026: #22 Hard, das längste Wort stand mit 10 Kästchen in der ersten und 1 in der zweiten Zeile.
  // Ursache war eine gerundete Breite. Viewports gibt es hier nur ganzzahlig, deshalb bekommt die Seite krumme Breiten per CSS.
  const problems = [];
  for (const mode of ['easy', 'hard', 'mirror', 'impossible']) {
    const page = await openPage(env, { width: 460, height: 780, time: '2026-11-11T12:00:00+01:00', mobile: true });
    await page.click(`#tab-${mode}`);
    await page.click('#startBtn');
    const bad = await page.evaluate(async () => {
      const app = document.querySelector('.app'), board = document.getElementById('board'), out = [];
      const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      app.style.margin = '0';
      for (let x = 3000; x <= 4400; x += 3) {
        app.style.width = (x / 10) + 'px';
        window.dispatchEvent(new Event('resize'));
        await frame();
        const br = board.getBoundingClientRect(), cell = parseFloat(getComputedStyle(board).getPropertyValue('--cell'));
        board.querySelectorAll('.w').forEach((w, i) => {
          const r = w.getBoundingClientRect();
          const tops = [...w.querySelectorAll('.c')].map(el => el.getBoundingClientRect().top);
          const widths = [...w.querySelectorAll('.c')].map(el => el.getBoundingClientRect().width);
          if (tops.some(t => Math.abs(t - tops[0]) > 1)) out.push(`${x / 10}px: Wort ${i + 1} bricht um`);
          if (widths.some(v => Math.abs(v - cell) > 0.5)) out.push(`${x / 10}px: Kästchen in Wort ${i + 1} gestaucht`);
          if (r.right > br.right + 0.5 || r.left < br.left - 0.5) out.push(`${x / 10}px: Wort ${i + 1} ragt hinaus`);
        });
      }
      return out;
    });
    bad.slice(0, 5).forEach(b => problems.push(`${mode}: ${b}`));
    await page.context().close();
  }
  assert.deepEqual(problems, []);
});

test('Layout: Karopapier geht mit ganzen Kästchen auf (gleicher Rand links und rechts), Trennstrich mittig, Buchstabentasten gleich breit', async () => {
  for (const [width, height] of [[320, 568], [360, 740], [411, 836], [844, 390], [1280, 800]]) {
    for (const lang of NF.CONFIG.languages) {
      const page = await openPage(env, { width, height, mobile: width < 800, url: (lang === 'de' ? '' : lang + '/') + '?n=4&m=impossible' });
      await page.click('#startBtn');
      await page.click('#hintBtn');
      if (await page.isVisible('#confirmYes')) await page.click('#confirmYes');
      const r = await page.evaluate(() => {
        const bd = document.querySelector('#board'), cs = getComputedStyle(bd);
        const cell = parseFloat(cs.getPropertyValue('--cell')), pad = parseFloat(cs.getPropertyValue('--pad'));
        const cols = (bd.clientWidth - 2 * pad) / cell;
        const keys = [...document.querySelectorAll('#kb .k')].filter(k => k.dataset.k.length === 1).map(k => k.getBoundingClientRect().width);
        const cut = document.querySelector('.d.cut'), prev = cut && cut.previousElementSibling;
        let mid = null;
        if (cut && prev) {
          const line = getComputedStyle(cut, '::before'), c = cut.getBoundingClientRect(), p = prev.getBoundingClientRect();
          mid = Math.abs((c.left + parseFloat(line.left) + parseFloat(line.width) / 2) - (p.right + c.left) / 2);
        }
        return { cell, pad, cols, keys: [Math.min(...keys), Math.max(...keys)], mid };
      });
      const tag = `${width}×${height} ${lang}`;
      assert.ok(Math.abs(r.cols - Math.round(r.cols)) < 0.05, `${tag}: ${r.cols} Kästchen breit, Rand ${r.pad}px`);
      assert.ok(r.pad >= 6, `${tag}: Rand ${r.pad}px`);
      assert.ok(r.keys[1] - r.keys[0] <= 1, `${tag}: Tasten ${r.keys.join('–')}px breit`);
      assert.ok(r.mid !== null && r.mid <= 1, `${tag}: Trennstrich ${r.mid}px neben der Mitte`);
      await page.context().close();
    }
  }
});
