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

test('Erster Besuch über einen geteilten Link (WhatsApp): sagt, was das ist, bietet Easy an, erklärt das Tippen einmal', async () => {
  const page = await openPage(env, { store: null, url: '?n=4&m=hard', mobile: true, width: 360, height: 640 });
  const intro = await page.textContent('#introBody');
  assert.match(intro, /Das tägliche Zahlenrätsel/);
  assert.match(intro, /Kostenlos, ohne Anmeldung, ohne Werbung/);
  await page.click('#introBody [data-close]');            // Überspringen steht unten im Kurz-Einstieg
  assert.equal(await page.getAttribute('#tab-hard', 'aria-selected'), 'true');
  assert.match(await page.textContent('#startCard'), /Auf der Tastatur stehen hier keine Zahlen/);
  assert.ok(await page.isVisible('#toEasy'), 'Wer neu ist und bei Hard landet, bekommt Easy angeboten');
  await page.click('#toEasy');
  assert.equal(await page.getAttribute('#tab-easy', 'aria-selected'), 'true');
  assert.equal(await page.isVisible('#toEasy'), false);
  await page.click('#startBtn');
  assert.ok(await page.isVisible('#coach'), 'Allererstes Rätsel: kurzer Hinweis, wo man tippt');
  assert.match(await page.textContent('#coachText'), /Schreib mit der Tastatur unten/);
  // Tasten: Zahl gut lesbar unter dem Buchstaben, nicht winzig in der Ecke
  const k = await page.evaluate(() => {
    const b = document.querySelector('#kb .k[data-k="H"] b').getBoundingClientRect(), i = document.querySelector('#kb .k[data-k="H"] i');
    return { below: i.getBoundingClientRect().top >= b.bottom - 1, size: parseFloat(getComputedStyle(i).fontSize), text: i.textContent };
  });
  assert.equal(k.text, '8');
  assert.ok(k.below, 'Zahl steht unter dem Buchstaben');
  assert.ok(k.size >= 11, `Zahl auf der Taste ist ${k.size}px groß`);
  // Erstes Wort richtig: Hinweis verschwindet von selbst
  await typeWord(page, solution(4, 'de', 'easy')[0]);
  assert.equal(await page.isVisible('#coach'), false);
  // Zahlen versehentlich ausgeblendet: kurze Erklärung, wie sie zurückkommen
  await page.click('#keyBtn');
  assert.match(await page.textContent('#toast'), /Zahlen ausgeblendet/);
  await page.click('#keyBtn');
  assert.match(await page.textContent('#toast'), /wieder da/);
  // Wer schon gespielt hat, bekommt weder das Easy-Angebot noch den Hinweis noch einmal
  await page.click('#tab-mirror');
  assert.equal(await page.isVisible('#toEasy'), false);
  await page.click('#startBtn');
  assert.equal(await page.isVisible('#coach'), false);
  noErrors(page);
  await page.context().close();
});

test('Erster Besuch mit Link auf ein älteres Rätsel: der Knopf nennt genau dieses Rätsel', async () => {
  const page = await openPage(env, { store: null, url: '?n=3&m=easy' });
  for (const L of 'EIS') await page.click(`#introBody [data-demo="${L}"]`);
  assert.equal((await page.textContent('#introGo')).trim(), 'Zum Rätsel #3');
  await page.click('#introGo');
  assert.equal(await issueNumber(page), 3);
  assert.equal(await page.getAttribute('#tab-easy', 'aria-selected'), 'true');
  await page.context().close();
});

test('Linkvorschau: Deutsch sagt klar, was das ist und dass es kostenlos ist; jede Sprache mit eigenem Text und Bild', () => {
  const root = path.join(__dirname, '..', '..');
  const meta = (f, prop) => {
    const m = fs.readFileSync(path.join(root, f), 'utf8').match(new RegExp(`<meta (?:property|name)="${prop}" content="([^"]*)"`));
    return m ? m[1] : '';
  };
  assert.match(meta('index.html', 'og:title'), /^NUMIGMA · Das tägliche Zahlenrätsel$/);
  assert.match(meta('index.html', 'og:description'), /Jede Zahl ist ein Buchstabe.*Kostenlos, ohne Anmeldung, ohne Werbung\.$/);
  assert.doesNotMatch(meta('index.html', 'og:description'), /\b(four|each|daily)\b/i, 'keine englischen Sätze in der deutschen Vorschau');
  assert.equal(meta('index.html', 'og:locale'), 'de_AT');
  assert.match(meta('en/index.html', 'og:description'), /each number is a letter.*Free, no sign-up, no ads\.$/);
  assert.equal(meta('en/index.html', 'og:locale'), 'en_GB');
  // Jede Sprache hat ihr eigenes Bild (deutscher bzw. englischer Slogan), beide 1200×630 und tatsächlich vorhanden
  const base = 'https://gr3hab.github.io/numfact/';
  assert.equal(meta('index.html', 'og:image'), base + 'og-de.png?v=2');   // ?v= erhöhen, wenn sich das Bild ändert
  assert.equal(meta('en/index.html', 'og:image'), base + 'og-en.png');
  assert.equal(meta('index.html', 'og:image:alt'), 'NUMIGMA: Knacke den Code. Entdecke den Fakt.');
  assert.equal(meta('en/index.html', 'og:image:alt'), 'NUMIGMA: Crack the code. Reveal the fact.');
  for (const f of ['og-de.png', 'og-en.png']) {
    const png = fs.readFileSync(path.join(root, f));
    assert.equal(png.toString('latin1', 1, 4), 'PNG', f);
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [1200, 630], f);
    for (const file of ['index.html', 'en/index.html']) {
      assert.equal(meta(file, 'og:image:width'), '1200'); assert.equal(meta(file, 'og:image:height'), '630');
    }
  }
  assert.notDeepEqual(fs.readFileSync(path.join(root, 'og-de.png')), fs.readFileSync(path.join(root, 'og-en.png')));
});

test('Regelzeile: zwei kurze Zeilen statt abgeschnittenem Text, der Screenreader hört die ganze Regel', async () => {
  const norm = x => x.replace(/\u00a0/g, ' ').trim();
  const rule = async p => [norm(await p.textContent('#ruleShort b')), (await p.$('#ruleShort small')) ? norm(await p.textContent('#ruleShort small')) : null];
  let page = await openPage(env);
  assert.equal(await page.$('#progress'), null, 'Fortschritt steht nur noch auf der Stufe');
  assert.deepEqual(await rule(page), ['A = 1 … Z = 26', null]);
  await page.click('#tab-hard');
  assert.deepEqual(await rule(page), ['A = 1 … Z = 26', 'ohne Trennung']);
  assert.equal(norm(await page.getAttribute('#ruleBtn', 'aria-label')), 'Regel anzeigen: A = 1 … Z = 26, ohne Trennung');
  await page.click('#tab-mirror');
  assert.deepEqual(await rule(page), ['A = 26 … Z = 1', 'rückwärts, ohne Trennung']);
  await page.click('#tab-impossible');
  assert.deepEqual(await rule(page), ['A = ? … Z = ?', 'geheim, ohne Trennung']);
  await page.click('#startBtn');
  await page.click('#revealBtn');
  await page.click('#confirmYes');
  const sh = NF.buildDay(keyOf(4), 'de').shift;
  assert.deepEqual(await rule(page), [`A = ${sh + 1} … Z = ${sh}`, `um ${sh} verschoben`]);
  await page.context().close();
  page = await openPage(env, { locale: 'en-GB' });
  await page.click('#tab-mirror');
  assert.deepEqual(await rule(page), ['A = 26 … Z = 1', 'backwards, no separators']);
  await page.click('#tab-impossible');
  assert.deepEqual(await rule(page), ['A = ? … Z = ?', 'secret, no separators']);
  await page.context().close();
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
  // Im Spiel bleibt das Ergebnis vollständig (oben), geteilt wird eine aufgelöste Stufe aber nicht
  await page.click('#result [data-act="share"]');
  const text = await page.evaluate(() => navigator.clipboard.readText());
  assert.deepEqual(text.split('\n').slice(0, 2), ['NUMIGMA #4', 'Heute nicht geknackt 😅']);
  assert.ok(!text.includes(exp) && !/[🟩🟨🟥]/u.test(text));
  assert.match(text.split('\n')[2], /^Schaffst du's\? http:\/\/127\.0\.0\.1:\d+\/\?n=4$/);
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
test('Teilen: nur gelöste Stufen, drei Zeilen bei einer, eine Zeile je Stufe bei mehreren, Archiv, Englisch, nie die Lösung', async () => {
  const page = await openPage(env, { clipboard: true });
  const read = async () => { await page.click('#result [data-act="share"]'); return page.evaluate(() => navigator.clipboard.readText()); };
  const noSolution = (text, n) => {
    const words = Object.values(NF.MODES).flatMap(m => solution(n, 'de', m.id)).filter(w => w.length >= 4);
    const upper = ' ' + text.toUpperCase().replace(/[^A-ZÄÖÜß]+/g, ' ') + ' ';
    words.forEach(w => assert.ok(!upper.includes(` ${w} `), `Lösung im Teilen-Text: ${w}`));
  };
  await page.click('#startBtn');
  for (const w of solution(4, 'de', 'easy')) await typeWord(page, w);
  let text = await read();
  let lines = text.split('\n');
  assert.equal(lines.length, 3);
  assert.match(lines[0], /^NUMIGMA #4 · Easy ⏱ \d+:\d\d$/);
  assert.match(lines[1], /^(🟩|🟨|🟥)+$/u);
  assert.match(lines[2], /^Schlägst du meine Zeit\? http:\/\/127\.0\.0\.1:\d+\/\?n=4&m=easy$/);
  noSolution(text, 4);
  // zweite Stufe gelöst: eine Zeile je Stufe mit Zeit und Kästchen
  await page.click('#result [data-act="next"]');
  await page.click('#startBtn');
  for (const w of solution(4, 'de', 'hard')) await typeWord(page, w);
  text = await read();
  lines = text.split('\n');
  assert.equal(lines.length, 4, text);
  assert.equal(lines[0], 'NUMIGMA #4');
  assert.match(lines[1], /^Easy ⏱ \d+:\d\d (🟩|🟨|🟥)+$/u);
  assert.match(lines[2], /^Hard ⏱ \d+:\d\d (🟩|🟨|🟥)+$/u);
  assert.match(lines[3], /^Schlägst du meine Zeiten\? http:\/\/127\.0\.0\.1:\d+\/\?n=4$/);
  const twoSolved = text;
  // dritte Stufe aufgelöst: taucht im geteilten Text gar nicht auf, das Ergebnis im Spiel zeigt sie aber
  await page.click('#result [data-act="next"]');
  await page.click('#startBtn');
  await page.click('#revealBtn');
  await page.click('#confirmYes');
  assert.ok(await page.isVisible('#result'));
  text = await read();
  assert.equal(text, twoSolved, 'aufgelöste Stufe darf nicht geteilt werden');
  assert.ok(!/Mirror|aufgelöst|🟥🟥🟥/.test(text));
  noSolution(text, 4);
  // Archiv, eine Stufe
  await page.goto(env.srv.url + '?n=2&m=mirror');
  await page.click('#startBtn');
  for (const w of solution(2, 'de', 'mirror')) await typeWord(page, w);
  text = await read();
  assert.match(text.split('\n')[0], /^NUMIGMA #2 \(Archiv\) · Mirror ⏱/);
  assert.match(text, /\?n=2&m=mirror$/);
  await page.context().close();
  // nichts gelöst: kurze Herausforderung ohne Kästchen; danach eine gelöste Stufe neben einer aufgelösten: drei Zeilen
  const p2 = await openPage(env, { clipboard: true });
  await p2.click('#startBtn');
  await p2.click('#revealBtn');
  await p2.click('#confirmYes');
  await p2.click('#result [data-act="share"]');
  text = await p2.evaluate(() => navigator.clipboard.readText());
  lines = text.split('\n');
  assert.equal(lines.length, 3, text);
  assert.equal(lines[0], 'NUMIGMA #4');
  assert.equal(lines[1], 'Heute nicht geknackt 😅');
  assert.match(lines[2], /^Schaffst du's\? http:\/\/127\.0\.0\.1:\d+\/\?n=4$/);
  assert.ok(!/[🟩🟨🟥]/u.test(text));
  noSolution(text, 4);
  await p2.click('#result [data-act="next"]');
  await p2.click('#startBtn');
  for (const w of solution(4, 'de', 'hard')) await typeWord(p2, w);
  await p2.click('#result [data-act="share"]');
  text = await p2.evaluate(() => navigator.clipboard.readText());
  lines = text.split('\n');
  assert.equal(lines.length, 3, text);
  assert.match(lines[0], /^NUMIGMA #4 · Hard ⏱ \d+:\d\d$/);
  assert.match(lines[2], /\?n=4&m=hard$/);
  await p2.context().close();
  // Englisch: eine Stufe und nichts gelöst
  const en = await openPage(env, { clipboard: true, locale: 'en-GB' });
  await en.click('#startBtn');
  for (const w of solution(4, 'en', 'easy')) await typeWord(en, w);
  await en.click('#result [data-act="share"]');
  const t2 = await en.evaluate(() => navigator.clipboard.readText());
  assert.match(t2.split('\n')[2], /^Can you beat my time\? http:\/\/127\.0\.0\.1:\d+\/en\/\?n=4&m=easy$/);
  await en.context().close();
  const en2 = await openPage(env, { clipboard: true, locale: 'en-GB' });
  await en2.click('#startBtn');
  await en2.click('#revealBtn');
  await en2.click('#confirmYes');
  await en2.click('#result [data-act="share"]');
  const t3 = (await en2.evaluate(() => navigator.clipboard.readText())).split('\n');
  assert.deepEqual(t3.slice(0, 2), ['NUMIGMA #4', 'Not cracked today 😅']);
  assert.match(t3[2], /^Can you crack it\? http:\/\/127\.0\.0\.1:\d+\/en\/\?n=4$/);
  await en2.context().close();
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

test('Neuer Tag: Wer die Seite vom Vortag wieder öffnet, landet beim neuen Rätsel, außer mitten im Spiel', async () => {
  const back = p => p.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange'));
  });
  // Easy gestern gelöst, Seite über Nacht offen gelassen
  let page = await openPage(env, { time: '2026-10-24T23:50:00+02:00' });
  await page.click('#startBtn');
  for (const w of solution(4, 'de', 'easy')) await typeWord(page, w);
  await page.clock.runFor(11 * 60 * 1000);
  await back(page);
  assert.equal(await issueNumber(page), 5, 'neues Rätsel ohne Suchen');
  assert.match(await page.textContent('#toast'), /Neuer Tag, neues Rätsel: #5/);
  assert.equal(await page.isVisible('#newday'), false);
  assert.equal(await page.isVisible('#archiveBar'), false);
  noErrors(page);
  await page.context().close();
  // Mitten im Rätsel: nichts wird weggezogen, der Hinweis bleibt
  page = await openPage(env, { time: '2026-10-24T23:50:00+02:00' });
  await page.click('#startBtn');
  await typeWord(page, solution(4, 'de', 'easy')[0]);
  await page.clock.runFor(11 * 60 * 1000);
  await back(page);
  assert.equal(await issueNumber(page), 4);
  assert.ok(await page.isVisible('#newday'));
  await page.context().close();
  // Archiv: Knopf sagt deutlich, wohin er führt
  page = await openPage(env, { url: '?n=2' });
  assert.equal((await page.textContent('#backToday')).trim(), 'Zum heutigen Rätsel');
  await page.click('#backToday');
  assert.equal(await issueNumber(page), 4);
  await page.context().close();
});

test('Gelöste Wörter zeigen nur noch das Wort, die Zahlen darüber verschwinden', async () => {
  const page = await openPage(env);
  await page.click('#tab-hard');
  await page.click('#startBtn');
  const sol = solution(4, 'de', 'hard');
  await typeWord(page, sol[0]);
  const look = await page.evaluate(() => {
    const vis = sel => getComputedStyle(document.querySelector(sel)).visibility;
    const w = document.querySelector('.w[data-w="0"]'), lr = w.querySelector('.lr').getBoundingClientRect(), r = w.getBoundingClientRect();
    return { solved: vis('.w[data-w="0"] .dr'), open: vis('.w[data-w="1"] .dr'), centred: Math.abs((lr.top + lr.bottom) / 2 - (r.top + r.bottom) / 2) < 2 };
  });
  assert.deepEqual(look, { solved: 'hidden', open: 'visible', centred: true });
  // Auflösen: auch aufgelöste Wörter ohne Zahlen
  await page.click('#revealBtn');
  await page.click('#confirmYes');
  assert.equal(await page.evaluate(() => [...document.querySelectorAll('.w .dr')].every(d => getComputedStyle(d).visibility === 'hidden')), true);
  noErrors(page);
  await page.context().close();
});

test('Gelöste Rätsel öffnen sich ohne Zahlen-Animation, nur frisch gelöste Wörter blenden sanft über', async () => {
  const page = await openPage(env, { motion: true });
  await page.click('#startBtn');
  const sol = solution(4, 'de', 'easy');
  await typeWord(page, sol[0]);
  const fresh = await page.evaluate(() => getComputedStyle(document.querySelector('.w[data-w="0"] .dr')).transitionDuration);
  assert.notEqual(fresh.replace(/0s,?\s*/g, ''), '', 'beim frischen Lösen gibt es einen Übergang');
  for (const w of sol.slice(1)) await typeWord(page, w);
  await page.click('#tab-hard');
  await page.click('#tab-easy');
  const reopened = await page.evaluate(() => [...document.querySelectorAll('.w .dr')].map(d => { const c = getComputedStyle(d); return c.visibility + '/' + c.opacity + '/' + c.transitionDuration; }));
  assert.ok(reopened.every(x => x === 'hidden/0/0s'), reopened.join(' '));
  noErrors(page);
  await page.context().close();
});

test('Schnell tippen: nach einem vollen, falschen Wort geht es im nächsten weiter; Antippen und Überschreiben bleibt', async () => {
  let page = await openPage(env);
  await page.click('#startBtn');
  const typed = async () => (await state(page, K4, 'easy')).typed;
  await page.keyboard.type('EIX');                       // EIN mit Tippfehler: Wort voll und rot
  assert.ok(await page.isVisible('.w[data-w="0"].bad'));
  await page.keyboard.type('ZU');                        // wer weitertippt, meint das nächste Wort
  assert.deepEqual((await typed()).slice(0, 2), ['EIX', 'ZU']);
  assert.ok(await page.isVisible('#coach'), 'Hinweis zum Korrigieren erscheint');
  await page.click('.c[data-w="0"][data-i="2"]');        // Kästchen antippen und überschreiben
  await page.keyboard.type('N');
  assert.equal((await typed())[0], 'EIN');
  assert.equal(await page.isVisible('#coach'), false, 'Hinweis verschwindet, wenn das Wort stimmt');
  assert.equal(await page.getAttribute('.w[data-w="1"]', 'aria-current'), 'true', 'weiter im angefangenen Wort');
  await page.keyboard.type('CKERWUERFEL');
  assert.equal((await typed())[1], 'ZUCKERWÜRFEL');
  // Antippen des letzten Kästchens eines vollen, falschen Worts: Überschreiben, nicht springen
  await page.keyboard.type('NEUTRONENSTERX');
  await page.click('.c[data-w="2"][data-i="13"]');
  await page.keyboard.type('Q');
  assert.equal((await typed())[2], 'NEUTRONENSTERQ');
  assert.equal(await page.getAttribute('.w[data-w="2"]', 'aria-current'), 'true');
  await page.context().close();
  // „ss“ am Wortende wird weiterhin zu ß (#20, Impossible: HIEß)
  page = await openPage(env, { time: '2026-11-09T10:00:00+01:00' });
  await page.click('#tab-impossible');
  await page.click('#startBtn');
  await page.click('.c[data-w="3"][data-i="0"]');
  await page.keyboard.type('HIESS');
  const s = await state(page, '2026-11-09', 'impossible');
  assert.equal(s.typed[3], 'HIEß');
  assert.ok(await page.isVisible('.w[data-w="3"].ok'));
  await page.context().close();
});

test('Archivleiste ist kurz und der Knopf passt daneben; das Ergebnis sagt, dass Archivrätsel nicht für die Serie zählen', async () => {
  let page = await openPage(env, { url: '?n=2&m=easy', width: 412, height: 800 });
  assert.equal((await page.textContent('#archiveText')).trim(), 'Archiv: #2 vom Do., 22. Okt.');
  const h = await page.evaluate(() => Math.round(document.getElementById('archiveBar').getBoundingClientRect().height));
  assert.ok(h <= 52, `Archivleiste ${h} px hoch`);
  await page.click('#startBtn');
  for (const w of solution(2, 'de', 'easy')) await typeWord(page, w);
  assert.match(await page.textContent('#result'), /Archivrätsel zählen nicht für die Serie\./);
  assert.doesNotMatch(await page.textContent('#result'), /Deine Serie/);
  await page.context().close();
  // Rätsel von heute: Serie statt Archiv-Hinweis; Englisch
  page = await openPage(env);
  await page.click('#startBtn');
  for (const w of solution(4, 'de', 'easy')) await typeWord(page, w);
  assert.match(await page.textContent('#result'), /Deine Serie: 1 Tag/);
  assert.doesNotMatch(await page.textContent('#result'), /Archivrätsel/);
  await page.context().close();
  page = await openPage(env, { url: '?n=2&m=easy', locale: 'en-GB' });
  await page.click('#startBtn');
  for (const w of solution(2, 'en', 'easy')) await typeWord(page, w);
  assert.match(await page.textContent('#result'), /Archive puzzles do not count towards your streak\./);
  await page.context().close();
});

test('Einstellungen erklären „System“, Impossible ermuntert zum Ausprobieren', async () => {
  let page = await openPage(env);
  await page.click('#settingsBtn');
  assert.match(await page.textContent('#settingsBody'), /System: hell oder dunkel, je nachdem, wie dein Handy oder Computer eingestellt ist/);
  await page.keyboard.press('Escape');
  await page.click('#tab-impossible');
  assert.match(await page.textContent('#startCard'), /Probier ruhig Buchstaben in den Kästchen aus/);
  await page.context().close();
  page = await openPage(env, { locale: 'en-GB' });
  await page.click('#settingsBtn');
  assert.match(await page.textContent('#settingsBody'), /System: light or dark, matching the setting on your phone or computer/);
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

test('iPhone: unsichtbare Haptik-Schalter liegen über den Tasten und leiten jedes Antippen weiter', async () => {
  // Nur auf iPhones liegt über jeder Taste ein unsichtbarer Schalter (Safari gibt nur dort Haptik).
  // Hier wird ein iPhone nachgestellt (Kennung, Touch, Handy-Ansicht), der Browser bleibt Chromium.
  const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
  const page = await openPage(env, { mobile: true, ua, clipboard: true });
  await page.tap('#startBtn');
  const info = await page.evaluate(() => {
    const k = document.querySelector('#kb .k[data-k="A"]'), r = k.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { switches: document.querySelectorAll('#kb .hsw').length, keys: document.querySelectorAll('#kb .k').length,
      topIsSwitch: !!top && top.classList.contains('hsw'), ariaHidden: top && top.getAttribute('aria-hidden'), tab: top && top.tabIndex };
  });
  assert.equal(info.switches, info.keys, 'jede Taste hat einen Schalter');
  assert.ok(info.topIsSwitch, 'der Finger trifft den Schalter, nicht die Taste darunter');
  assert.equal(info.ariaHidden, 'true');
  assert.equal(info.tab, -1);
  // Ganzes Easy-Rätsel nur durch Antippen lösen, mit einem Vertipper und der Rücktaste dazwischen
  const sol = solution(4, 'de', 'easy');
  const wrong = sol[0][0] === 'Q' ? 'X' : 'Q';
  await page.tap(`#kb .k[data-k="${wrong}"]`);
  await page.tap('#kb .k[data-k="back"]');
  for (const w of sol) for (const ch of w) await page.tap(`#kb .k[data-k="${ch}"]`);
  assert.equal((await state(page, K4, 'easy')).status, 'solved');
  assert.ok(await page.isVisible('#result'));
  // Teilen ist grün: Antippen über die Schalter zählt nicht als Hilfe
  await page.tap('#result [data-act="share"]');
  const text = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
  if (text) assert.ok(!/🟨|🟥/.test(text.split('\n')[1]), text);
  noErrors(page);
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
