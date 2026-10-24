/* Spieltests im echten Browser (Chromium über Playwright). Aufruf: npm run test:spiel (im Ordner _dev)
   Feste Uhrzeit: Samstag, 24. Oktober 2026 (#4), Wien, sofern nicht anders angegeben. */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { NF, SEEN, setup, openPage, solution, puzzle, keyOf, store, state, timer, typeWord, issueNumber } = require('./browser');

let env;
test.before(async () => { env = await setup(); });
test.after(async () => { if (env) await env.close(); });

const K4 = '2026-10-24';
const noErrors = page => assert.deepEqual(page.errors, []);

/* ------------------------------------------------------------ Erster Besuch */
test('Erster Besuch: Kurz-Einstieg mit Übungswort, ohne das heutige Rätsel zu verraten', async () => {
  const page = await openPage(env, { store: null });
  assert.equal(await page.evaluate(() => document.getElementById('introDlg').open), true);
  assert.equal(await page.isVisible('#board'), false, 'Rätselblatt darf vor Start nicht sichtbar sein');
  // falscher Buchstabe: Hinweis, nichts eingetragen
  await page.click('#introBody [data-demo="A"]');
  assert.match(await page.textContent('#demoMsg'), /Gesucht ist die 5/);
  for (const L of 'EIS') await page.click(`#introBody [data-demo="${L}"]`);
  assert.match(await page.textContent('#introBody'), /Geknackt/);
  await page.click('#introGo');
  assert.equal(await page.evaluate(() => document.getElementById('introDlg').open), false);
  assert.equal((await store(page)).seenHelp, true);
  assert.ok(await page.isVisible('#startBtn'));
  assert.equal(await timer(page), '0:00');
  noErrors(page);
  await page.context().close();
});

test('Erster Besuch: Überspringen geht sofort, Englisch zeigt CAT', async () => {
  const page = await openPage(env, { store: null, locale: 'en-GB' });
  assert.match(await page.textContent('#introBody'), /Crack the code/);
  for (const L of 'CAT') await page.keyboard.press(L);
  assert.match(await page.textContent('#introBody'), /Cracked!/);
  await page.context().close();
  const p2 = await openPage(env, { store: null });
  await p2.click('#introBody [data-close]');
  assert.equal((await store(p2)).seenHelp, true);
  assert.equal(await p2.evaluate(() => document.getElementById('introDlg').open), false);
  await p2.context().close();
});

/* ------------------------------------------------------------ Links */
test('Links: Nummer und Stufe führen genau zum Rätsel', async () => {
  let page = await openPage(env, { url: '?n=3&m=hard' });
  assert.equal(await issueNumber(page), 3);
  assert.ok(await page.isVisible('#archiveBar'));
  assert.equal(await page.getAttribute('#tab-hard', 'aria-selected'), 'true');
  assert.match(page.url(), /\?n=3&m=hard$/, 'Archiv-Adresse bleibt beim Neuladen erhalten');
  await page.context().close();

  page = await openPage(env, { url: '?n=4&m=mirror' });
  assert.equal(await issueNumber(page), 4);
  assert.equal(await page.isVisible('#archiveBar'), false);
  assert.equal(await page.getAttribute('#tab-mirror', 'aria-selected'), 'true');
  assert.ok(page.url().endsWith('/'), 'heutiges Rätsel: Adresse wird aufgeräumt');
  await page.context().close();
});

test('Links: zukünftige Rätsel werden nicht freigeschaltet, kaputte Links landen bei heute', async () => {
  let page = await openPage(env, { url: '?n=5&m=easy' });
  assert.equal(await issueNumber(page), 4);
  assert.match(await page.textContent('#notice'), /#5 erscheint bei dir in \d\d:\d\d:\d\d/);
  await page.context().close();
  page = await openPage(env, { url: '?n=40' });
  assert.equal(await issueNumber(page), 4);
  assert.match(await page.textContent('#notice'), /#40 erscheint erst am/);
  await page.context().close();
  page = await openPage(env, { url: '?n=abc&m=zzz' });
  assert.equal(await issueNumber(page), 4);
  assert.match(await page.textContent('#notice'), /Link kennen wir nicht/);
  await page.context().close();
});

test('Links: Sprache aus dem Link gilt für den Besuch, gespeicherte Sprache bleibt', async () => {
  let page = await openPage(env, { url: '?lang=en&n=2&m=easy', store: { ...SEEN, lang: 'de' } });
  assert.equal(await page.getAttribute('html', 'lang'), 'en');
  assert.equal(await issueNumber(page), 2);
  assert.equal((await store(page)).lang, 'de');
  assert.match(page.url(), /lang=en/);
  await page.context().close();
  // Neuling über englischen Link: Englisch wird gemerkt, Adresse aufgeräumt
  page = await openPage(env, { url: '?lang=en' });
  assert.equal((await store(page)).lang, 'en');
  assert.ok(page.url().endsWith('/'));
  await page.context().close();
});

test('Links: englische Einstiegsseite en/ leitet mit Nummer und Stufe weiter', async () => {
  const page = await openPage(env, { url: 'en/?n=2&m=hard' });
  await page.waitForFunction(() => document.documentElement.lang === 'en');
  assert.equal(await issueNumber(page), 2);
  assert.equal(await page.getAttribute('#tab-hard', 'aria-selected'), 'true');
  noErrors(page);
  await page.context().close();
});

test('Links: Zeitzonen – derselbe Augenblick ist in Wien schon #5, in New York noch #4', async () => {
  const at = '2026-10-24T23:30:00Z';
  let page = await openPage(env, { time: at, timezone: 'Europe/Vienna' });
  assert.equal(await issueNumber(page), 5);
  await page.context().close();
  page = await openPage(env, { time: at, timezone: 'America/New_York', url: '?n=5&m=easy' });
  assert.equal(await issueNumber(page), 4);
  assert.match(await page.textContent('#notice'), /#5 erscheint/);
  await page.context().close();
});

/* ------------------------------------------------------------ Hilfe und Farben */
test('Farben: aufgedeckter Buchstabe bleibt gelb, auch nach Überschreiben; Schlüssel färbt das nächste Wort', async () => {
  const page = await openPage(env, { clipboard: true });
  await page.click('#tab-hard');
  await page.click('#startBtn');
  const sol = solution(4, 'de', 'hard');
  // Tipp auf Wort 1, dann den aufgedeckten Buchstaben falsch überschreiben und wieder richtig
  await page.click('#hintBtn');
  let s = await state(page, K4, 'hard');
  assert.deepEqual(s.helped, [0]);
  const hinted = s.hints['0'][0];
  await page.click(`.c[data-w="0"][data-i="${hinted}"]`);
  await page.keyboard.type(sol[0][hinted] === 'Q' ? 'X' : 'Q');
  await page.click(`.c[data-w="0"][data-i="${hinted}"]`);
  await page.keyboard.type(sol[0][hinted]);
  await page.click('.c[data-w="0"][data-i="0"]');
  await typeWord(page, sol[0]);
  s = await state(page, K4, 'hard');
  assert.equal(s.typed[0], sol[0]);
  assert.deepEqual(s.helped, [0], 'Hilfe bleibt nach Überschreiben erhalten');
  // Schlüssel: beim ersten Mal kurze Erklärung, dann gilt er für genau einen Buchstaben
  await page.click('#keyBtn');
  assert.ok(await page.isVisible('#confirm'));
  assert.match(await page.textContent('#confirmText'), /kostet 1 Tipp/);
  await page.click('#confirmYes');
  s = await state(page, K4, 'hard');
  assert.equal(s.keyOpen, true);
  assert.equal(s.hintCount, 2);
  assert.notEqual(await page.textContent('#kb .k[data-k="A"] i'), '');
  await page.keyboard.type(sol[1][0]);
  s = await state(page, K4, 'hard');
  assert.equal(s.keyOpen, false);
  assert.deepEqual(s.helped, [0, 1]);
  assert.equal(await page.textContent('#kb .k[data-k="A"] i'), '');
  await typeWord(page, sol[1].slice(1));
  for (const w of sol.slice(2)) await typeWord(page, w);
  s = await state(page, K4, 'hard');
  assert.equal(s.status, 'solved');
  const squares = '🟨🟨' + '🟩'.repeat(sol.length - 2);
  assert.ok((await page.textContent('#result')).includes(squares));
  assert.match(await page.textContent('#result'), /mit 2 Tipps/);
  assert.match(await page.textContent('#result'), /2 mit Hilfe/);
  // Zweiter Schlüssel ohne Erklärung, aber mit sichtbarem Preis
  assert.equal((await store(page)).coach.key, true);
  noErrors(page);
  await page.context().close();
});

test('Farben: Easy-Zahlen sind gratis und ändern nichts an Grün', async () => {
  const page = await openPage(env);
  await page.click('#startBtn');
  assert.equal(await page.textContent('#kb .k[data-k="H"] i'), '8', 'Zahlen bei Easy standardmäßig an');
  await page.click('#keyBtn');
  assert.equal(await page.textContent('#kb .k[data-k="H"] i'), '');
  await page.click('#keyBtn');
  for (const w of solution(4, 'de', 'easy')) await typeWord(page, w);
  const s = await state(page, K4, 'easy');
  assert.equal(s.hintCount, 0);
  assert.deepEqual(s.helped, []);
  assert.ok((await page.textContent('#result')).includes('🟩'.repeat(s.typed.length)));
  assert.match(await page.textContent('#result'), /ohne Hilfe/);
  await page.context().close();
});

test('Farben: Trennung bei Impossible ist gelb, Auflösen ist rot', async () => {
  const page = await openPage(env, { clipboard: true });
  await page.click('#tab-impossible');
  await page.click('#startBtn');
  const sol = solution(4, 'de', 'impossible');
  await typeWord(page, sol[0]);
  await page.click('.w[data-w="1"]');
  assert.equal(await page.textContent('#hintLabel'), 'Trennung');
  await page.click('#hintBtn');
  let s = await state(page, K4, 'impossible');
  assert.deepEqual(s.cuts, [1]);
  assert.deepEqual(s.helped, [1]);
  assert.ok(await page.isVisible('.w[data-w="1"] .d.cut'));
  await typeWord(page, sol[1]);
  await page.click('#revealBtn');
  await page.click('#confirmYes');
  s = await state(page, K4, 'impossible');
  assert.equal(s.status, 'revealed');
  const exp = '🟩🟨' + '🟥'.repeat(sol.length - 2);
  assert.ok((await page.textContent('#result')).includes(exp));
  await page.click('#result [data-act="share"]');
  const text = await page.evaluate(() => navigator.clipboard.readText());
  assert.equal(text.split('\n')[0], 'NUMIGMA #4 · Impossible · aufgelöst');
  assert.equal(text.split('\n')[1], exp);
  assert.match(text.split('\n')[2], /^Knackst du es\? http:\/\/127\.0\.0\.1:\d+\/\?n=4&m=impossible$/);
  await page.context().close();
});

/* ------------------------------------------------------------ Alte Spielstände */
test('Alte Spielstände (v7) bleiben erhalten und werden behutsam ergänzt', async () => {
  const k2 = keyOf(2), k3 = keyOf(3);
  const e2 = puzzle(2, 'de', 'easy'), m2 = puzzle(2, 'de', 'mirror'), h3 = puzzle(3, 'de', 'hard'), en2 = puzzle(2, 'en', 'easy');
  const old = {
    v: 2, seenHelp: true, lang: 'de', theme: 'light', haptics: false, extra: 'bleibt',
    days: {
      [k2]: {
        easy: { sig: e2.sig, typed: e2.words.map(w => w.plain), hints: { 2: [0] }, hintCount: 1, cuts: [], status: 'solved', elapsed: 123456, given: [], doneOn: k2, startedOn: k2 },
        mirror: { sig: m2.sig, typed: m2.words.map(w => w.plain), hints: {}, hintCount: 0, cuts: [], status: 'revealed', elapsed: 50000, given: [0, 1], doneOn: k2 }
      },
      [k3]: { hard: { sig: h3.sig, typed: h3.words.map((w, i) => i === 0 ? w.plain.slice(0, 2) : ''), hints: {}, hintCount: 0, cuts: [], status: 'playing', elapsed: 42000, given: [] } }
    },
    daysEn: { [k2]: { easy: { sig: en2.sig, typed: en2.words.map(w => w.plain), hints: {}, hintCount: 0, cuts: [], status: 'solved', elapsed: 61000, given: [], doneOn: k2 } } }
  };
  const page = await openPage(env, { store: old, url: '?n=2&m=easy' });
  const res = await page.textContent('#result');
  assert.match(res, /2:03/, 'alte Zeit bleibt');
  const sq = e2.words.map((w, i) => i === 2 ? '🟨' : '🟩').join('');
  assert.ok(res.includes(sq), 'Tipp aus altem Stand wird gelb');
  const s = await store(page);
  assert.equal(s.extra, 'bleibt');
  assert.equal(s.theme, 'light');
  assert.equal(s.haptics, false);
  assert.equal(s.daysEn[k2].easy.elapsed, 61000);
  assert.equal(s.days[k3].hard.elapsed, 42000);
  assert.equal(s.days[k2].mirror.status, 'revealed');
  // Angefangenes Rätsel: Uhr steht, bis man weitermacht
  await page.goto(env.srv.url + '?n=3&m=hard');
  assert.ok(await page.isVisible('#pauseCard'));
  assert.match(await page.textContent('#pauseCard'), /0:42/);
  noErrors(page);
  await page.context().close();
});

test('Kaputter Spielstand wird gesichert statt stillschweigend überschrieben', async () => {
  const ctx = await env.browser.newContext({ locale: 'de-AT', timezoneId: 'Europe/Vienna', serviceWorkers: 'block' });
  await ctx.clock.install({ time: new Date('2026-10-24T10:00:00+02:00') });
  await ctx.addInitScript(() => { if (!localStorage.getItem('numfact.test.seeded')) { localStorage.setItem('numfact.v2', '{kaputt'); localStorage.setItem('numfact.test.seeded', '1'); } });
  const page = await ctx.newPage();
  await page.goto(env.srv.url);
  assert.equal(await page.evaluate(() => localStorage.getItem('numfact.v2.backup')), '{kaputt');
  await ctx.close();
});

/* ------------------------------------------------------------ Zeit */
test('Zeit: Dialoge und Pause halten die Uhr an und verdecken den Code', async () => {
  const page = await openPage(env);
  await page.click('#startBtn');
  await page.clock.runFor(10000);
  assert.equal(await timer(page), '0:10');
  await page.click('#helpBtn');
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('#board .words')).visibility), 'hidden');
  await page.clock.runFor(30000);
  await page.keyboard.press('Escape');
  assert.equal(await timer(page), '0:10');
  await page.clock.runFor(5000);
  assert.equal(await timer(page), '0:15');
  await page.click('#pauseBtn');
  assert.ok(await page.isVisible('#pauseCard'));
  assert.equal(await page.isVisible('#board'), false);
  assert.equal(await page.isVisible('#dock'), false);
  await page.clock.runFor(60000);
  assert.equal(await timer(page), '0:15');
  // Tippen während der Pause bewirkt nichts
  await page.keyboard.type('XYZ');
  assert.equal((await state(page, K4, 'easy')).typed.join(''), '');
  await page.click('#resumeBtn');
  await page.clock.runFor(3000);
  assert.equal(await timer(page), '0:18');
  noErrors(page);
  await page.context().close();
});

test('Zeit: Tab im Hintergrund pausiert, Neuladen behält die Zeit und startet pausiert', async () => {
  const page = await openPage(env);
  await page.click('#startBtn');
  await page.clock.runFor(12000);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.clock.runFor(120000);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
  assert.ok(await page.isVisible('#pauseCard'), 'nach der Rückkehr ist der Code verdeckt');
  assert.equal(await timer(page), '0:12');
  await page.click('#resumeBtn');
  await page.clock.runFor(8000);
  await page.reload();
  await page.waitForSelector('#pauseCard:not([hidden])');
  const s = await state(page, K4, 'easy');
  assert.ok(s.elapsed >= 19000 && s.elapsed <= 21000, `gespeichert: ${s.elapsed}`);
  assert.equal(await timer(page), '0:20');
  await page.context().close();
});

test('Zeit: Stufenwechsel stoppt die alte Uhr, Rückkehr läuft weiter', async () => {
  const page = await openPage(env);
  await page.click('#startBtn');
  await page.clock.runFor(10000);
  await page.click('#tab-hard');
  await page.clock.runFor(30000);
  let s = await state(page, K4, 'easy');
  assert.ok(Math.abs(s.elapsed - 10000) < 600, `Easy: ${s.elapsed}`);
  await page.click('#tab-easy');
  assert.equal(await page.isVisible('#pauseCard'), false);
  await page.clock.runFor(5000);
  assert.equal(await timer(page), '0:15');
  await page.context().close();
});

test('Zeit: zweiter Tab übernimmt, der erste pausiert, keine doppelte Zeit', async () => {
  const a = await openPage(env);
  await a.click('#startBtn');
  await a.clock.runFor(5000);
  const b = await openPage(env, { context: a.context() });
  assert.ok(await b.isVisible('#pauseCard'), 'neuer Tab beginnt pausiert');
  await b.click('#resumeBtn');
  await a.waitForSelector('#pauseCard:not([hidden])');
  assert.match(await a.textContent('#pauseCard'), /anderen Tab/);
  await b.clock.runFor(4000);
  await b.click('#pauseBtn');
  const s = await state(b, K4, 'easy');
  assert.ok(s.elapsed >= 8500 && s.elapsed <= 9800, `gesamt: ${s.elapsed}`);
  await a.context().close();
});

test('Zeit: Ergebnis, Stufen-Reiter, Teilen und Statistik zeigen dieselbe Zeit', async () => {
  const page = await openPage(env, { clipboard: true });
  await page.click('#startBtn');
  const sol = solution(4, 'de', 'easy');
  for (const w of sol.slice(0, -1)) await typeWord(page, w);
  await page.clock.runFor(83400);
  await typeWord(page, sol[sol.length - 1]);
  const t = await timer(page);
  assert.match(t, /^1:2\d$/);
  assert.ok((await page.textContent('#result .res-time')).includes(t));
  assert.ok((await page.textContent('#tab-easy')).includes(t));
  await page.click('#result [data-act="share"]');
  const text = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(text.startsWith(`NUMIGMA #4 · Easy ⏱ ${t}\n`));
  await page.click('#statsBtn');
  assert.ok((await page.textContent('#statsBody .table')).includes(t));
  await page.context().close();
});

/* ------------------------------------------------------------ Teilen */
test('Teilen: drei Zeilen mit direktem Link, mehrere Stufen, Archiv, Englisch, nie die Lösung', async () => {
  const page = await openPage(env, { clipboard: true });
  const read = async () => { await page.click('#result [data-act="share"]'); return page.evaluate(() => navigator.clipboard.readText()); };
  await page.click('#startBtn');
  for (const w of solution(4, 'de', 'easy')) await typeWord(page, w);
  let text = await read();
  let lines = text.split('\n');
  assert.equal(lines.length, 3);
  assert.match(lines[0], /^NUMIGMA #4 · Easy ⏱ \d+:\d\d$/);
  assert.match(lines[1], /^(🟩|🟨|🟥)+$/u);
  assert.match(lines[2], /^Schlägst du meine Zeit\? http:\/\/127\.0\.0\.1:\d+\/\?n=4&m=easy$/);
  const words = Object.values(NF.MODES).flatMap(m => solution(4, 'de', m.id)).filter(w => w.length >= 4);
  const upper = ' ' + text.toUpperCase().replace(/[^A-ZÄÖÜß]+/g, ' ') + ' ';
  words.forEach(w => assert.ok(!upper.includes(` ${w} `), `Lösung im Teilen-Text: ${w}`));
  // zweite Stufe
  await page.click('#result [data-act="next"]');
  await page.click('#startBtn');
  for (const w of solution(4, 'de', 'hard')) await typeWord(page, w);
  text = await read();
  lines = text.split('\n');
  assert.equal(lines[0], 'NUMIGMA #4');
  assert.match(lines[1], /^Easy ⏱/); assert.match(lines[3], /^Hard ⏱/);
  assert.match(lines[5], /^Schlägst du meine Zeiten\? http:\/\/127\.0\.0\.1:\d+\/\?n=4$/);
  // Archiv
  await page.goto(env.srv.url + '?n=2&m=mirror');
  await page.click('#startBtn');
  for (const w of solution(2, 'de', 'mirror')) await typeWord(page, w);
  text = await read();
  assert.match(text.split('\n')[0], /^NUMIGMA #2 \(Archiv\) · Mirror ⏱/);
  assert.match(text, /\?n=2&m=mirror$/);
  await page.context().close();
  // Englisch
  const en = await openPage(env, { clipboard: true, locale: 'en-GB' });
  await en.click('#startBtn');
  for (const w of solution(4, 'en', 'easy')) await typeWord(en, w);
  await en.click('#result [data-act="share"]');
  const t2 = await en.evaluate(() => navigator.clipboard.readText());
  assert.match(t2.split('\n')[2], /^Can you beat my time\? http:\/\/127\.0\.0\.1:\d+\/en\/\?n=4&m=easy$/);
  await en.context().close();
});

test('Teilen: am Handy über das Teilen-Menü des Geräts', async () => {
  const page = await openPage(env, { mobile: true, init: () => { navigator.share = async d => { window.__shared = d; }; } });
  await page.click('#startBtn');
  for (const w of solution(4, 'de', 'easy')) await typeWord(page, w);
  await page.click('#result [data-act="share"]');
  const shared = await page.evaluate(() => window.__shared);
  assert.ok(shared && /^NUMIGMA #4 · Easy/.test(shared.text));
  await page.context().close();
});

/* ------------------------------------------------------------ Statistik und Serie */
test('Statistik: Bestzeit nur ohne Hilfe, Archiv zählt nicht für die Serie', async () => {
  const k2 = keyOf(2), k3 = keyOf(3), k4 = keyOf(4);
  const mk = (n, mode, extra) => { const p = puzzle(n, 'de', mode); return { sig: p.sig, typed: p.words.map(w => w.plain), hints: {}, hintCount: 0, cuts: [], status: 'solved', elapsed: 60000, given: [], helped: [], ...extra }; };
  const st = { ...SEEN, days: {
    [k2]: { easy: mk(2, 'easy', { doneOn: k4, startedOn: k4, elapsed: 30000 }) },               // Archiv: zählt nicht für die Serie
    [k3]: { easy: mk(3, 'easy', { doneOn: k3, startedOn: k3, elapsed: 90000 }), hard: mk(3, 'hard', { doneOn: k3, hintCount: 1, helped: [0], hints: { 0: [1] }, elapsed: 10000 }) },
    [k4]: { easy: mk(4, 'easy', { doneOn: k4, startedOn: k4, elapsed: 45000 }) }
  } };
  const page = await openPage(env, { store: st });
  await page.click('#statsBtn');
  const nums = await page.$$eval('#statsBody .stats .n', els => els.map(e => e.textContent));
  assert.deepEqual(nums, ['3', '2', '2', '4']);   // Rätseltage, Serie, beste Serie, Codes
  const table = await page.$$eval('#statsBody .table span', els => els.map(e => e.textContent));
  const row = name => table.slice(table.indexOf(name), table.indexOf(name) + 4);
  assert.deepEqual(row('Easy'), ['Easy', '3', '3', '0:30']);
  assert.deepEqual(row('Hard'), ['Hard', '1', '0', '–']);
  await page.context().close();
});

test('Serie: kurz vor Mitternacht angefangen, danach gelöst, zählt noch für den Tag', async () => {
  const page = await openPage(env, { time: '2026-10-24T23:59:40+02:00' });
  await page.click('#startBtn');
  const sol = solution(4, 'de', 'easy');
  for (const w of sol.slice(0, -1)) await typeWord(page, w);
  await page.clock.runFor(30000);
  assert.ok(await page.isVisible('#newday'), 'neuer Tag wird angekündigt');
  await typeWord(page, sol[sol.length - 1]);
  const s = await state(page, K4, 'easy');
  assert.equal(s.doneOn, '2026-10-25');
  await page.click('#statsBtn');
  const nums = await page.$$eval('#statsBody .stats .n', els => els.map(e => e.textContent));
  assert.equal(nums[1], '1');
  await page.keyboard.press('Escape');
  await page.click('#newdayBtn');
  assert.equal(await issueNumber(page), 5);
  await page.context().close();
});

/* ------------------------------------------------------------ Vorrat erschöpft */
test('Vorrat erschöpft: Wiederholung wird offen angezeigt', async () => {
  const last = NF.lastPlannedDay(), P = NF.plannedDays();
  const page = await openPage(env, { time: NF.addDays(last, 3) + 'T10:00:00+01:00' });
  assert.equal(await issueNumber(page), P + 3);
  assert.match(await page.textContent('#archiveBar'), /Wiederholung von #3/);
  await page.click('#archiveBtn');
  assert.match(await page.textContent('#archiveBody'), /Wiederholung von #2/);
  await page.context().close();
});

/* ------------------------------------------------------------ Tastatur und Korrektur */
test('Tastatur: Umlaute als ae/ue, Pfeile, Rücktaste, Enter springt weiter', async () => {
  const page = await openPage(env);
  await page.click('#startBtn');
  const sol = solution(4, 'de', 'easy');               // EIN ZUCKERWÜRFEL …
  await typeWord(page, sol[0]);
  await page.keyboard.type('ZUCKERWUERFEL');
  let s = await state(page, K4, 'easy');
  assert.equal(s.typed[1], 'ZUCKERWÜRFEL');
  // falsches Wort: rot und gestrichelt, dann einzelnes Kästchen korrigieren
  await page.keyboard.type('NEUTRONENSTERX');
  assert.ok(await page.isVisible('.w[data-w="2"].bad'));
  assert.ok(await page.isVisible('#coach'), 'Hilfe zum Korrigieren erscheint einmal');
  await page.keyboard.press('Backspace');
  await page.keyboard.type('N');
  s = await state(page, K4, 'easy');
  assert.equal(s.typed[2], 'NEUTRONENSTERN');
  await page.keyboard.type('WIEG');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.type('X');
  s = await state(page, K4, 'easy');
  assert.equal(s.typed[3], 'WIXG');
  await page.keyboard.press('Enter');
  assert.equal(await page.getAttribute('.w[data-w="4"]', 'aria-current'), 'true');
  await page.context().close();
});

test('Antippen: Kästchen wählen, nächstes leeres Kästchen, Tipp-Buchstaben werden übersprungen', async () => {
  const page = await openPage(env);
  await page.click('#startBtn');
  const sol = solution(4, 'de', 'easy');
  await page.click('.c[data-w="1"][data-i="1"]');
  await page.click('#hintBtn');                      // deckt Kästchen 1 von Wort 2 auf
  await page.click('.c[data-w="1"][data-i="0"]');
  await page.click(`#kb .k[data-k="${sol[1][0]}"] button`);
  await page.click(`#kb .k[data-k="${sol[1][2]}"] button`);   // springt über das aufgedeckte Kästchen
  const s = await state(page, K4, 'easy');
  assert.equal(s.typed[1].slice(0, 3), sol[1].slice(0, 3));
  await page.context().close();
});

/* ------------------------------------------------------------ Barrierefreiheit */
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
async function axe(page, label) {
  await page.addScriptTag({ content: AXE });
  const r = await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ['violations'] })).violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, t: v.nodes[0] && v.nodes[0].target.join(' ') })));
  const bad = r.filter(v => v.impact === 'serious' || v.impact === 'critical');
  assert.deepEqual(bad, [], `${label}: ${JSON.stringify(bad)}`);
}
test('Barrierefreiheit: keine schweren Mängel (axe) in den wichtigsten Ansichten, hell und dunkel', async () => {
  for (const scheme of ['light', 'dark']) {
    const page = await openPage(env, { scheme });
    await axe(page, scheme + ' Start');
    await page.click('#startBtn');
    await axe(page, scheme + ' Spiel');
    await page.click('#helpBtn');
    await page.click('#helpBody summary');
    await axe(page, scheme + ' Anleitung');
    await page.keyboard.press('Escape');
    for (const w of solution(4, 'de', 'easy')) await typeWord(page, w);
    await axe(page, scheme + ' Ergebnis');
    await page.click('#statsBtn');
    await axe(page, scheme + ' Statistik');
    await page.keyboard.press('Escape');
    await page.click('#archiveBtn');
    await axe(page, scheme + ' Archiv');
    await page.context().close();
  }
  const intro = await openPage(env, { store: null });
  await axe(intro, 'Kurz-Einstieg');
  await intro.context().close();
});

test('Barrierefreiheit: echte Buttons, Ansagen für Screenreader, Reiter mit Pfeiltasten', async () => {
  const page = await openPage(env);
  await page.click('#startBtn');
  assert.equal(await page.$$eval('#kb .k', ks => ks.every(k => k.querySelector('button'))), true);
  assert.equal(await page.$$eval('#board .w', ws => ws.every(w => w.tagName === 'BUTTON')), true);
  assert.match(await page.getAttribute('.w[data-w="0"]', 'aria-label'), /Wort 1 von 7, 3 Buchstaben, Code 5, 9, 14/);
  await typeWord(page, solution(4, 'de', 'easy')[0]);
  await page.waitForFunction(() => /Wort 1 richtig/.test(document.getElementById('live').textContent));
  await page.focus('#tab-easy');
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.getAttribute('#tab-hard', 'aria-selected'), 'true');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'tab-hard');
  await page.context().close();
});

/* ------------------------------------------------------------ Offline */
test('Offline: Nach dem ersten Besuch lädt das Spiel auch ohne Verbindung', async () => {
  const page = await openPage(env, { sw: true });
  await page.evaluate(async () => { await navigator.serviceWorker.register('sw.js'); await navigator.serviceWorker.ready; });
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  await page.context().setOffline(true);
  await page.reload();
  await page.waitForFunction(() => document.querySelector('#issue') && /#4/.test(document.querySelector('#issue').textContent));
  assert.ok(await page.isVisible('#startBtn'));
  await page.context().setOffline(false);
  await page.context().close();
});
