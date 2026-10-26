/* Tests für Fakten, Fahrplan und Verschlüsselung (ohne Browser). Aufruf: npm test (im Ordner _dev) */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { ROOT, loadNF, rawFacts, loadBase, latestLiveKey, loadFromSources } = require('./helpers');

const NF = loadNF();
const F = rawFacts();
const SNAP = JSON.parse(fs.readFileSync(path.join(__dirname, 'veroeffentlicht-1-16.json'), 'utf8'));
const MODES = Array.from(NF.MODES, m => m.id);
// Ergebnisse aus kern.js stammen aus einer eigenen JavaScript-Umgebung: für Vergleiche in normale Werte umwandeln
const plain = x => JSON.parse(JSON.stringify(x));
const check = today => plain(NF.checkFacts(today));

test('Faktenliste lädt und hat feste, fortlaufende IDs', () => {
  assert.ok(Array.isArray(F) && F.length >= 64, 'NUMIGMA_FACTS fehlt oder ist zu kurz');
  const ids = F.map(f => f.id);
  assert.equal(new Set(ids).size, ids.length, 'doppelte IDs');
  ids.forEach(id => assert.match(id, /^n\d{3,}$/));
  // Neue Fakten werden hinten angehängt und bekommen die nächste Nummer. Die Reihenfolge in der Liste darf ab #17 abweichen.
  const nums = ids.map(id => +id.slice(1)).sort((a, b) => a - b);
  nums.forEach((n, i) => assert.equal(n, i + 1, `ID-Lücke bei n${String(i + 1).padStart(3, '0')}`));
});

test('Jeder Fakt hat beide Sprachen, ein gültiges Thema und erfüllt die Satzregeln', () => {
  const problems = check().filter(p => p.level === 'fehler');
  assert.deepEqual(problems, [], problems.map(p => `${p.id}: ${p.msg}`).join('\n'));
});

test('Quellen haben Name und https-Adresse', () => {
  F.forEach(f => (f.quellen || []).forEach(q => {
    assert.equal(typeof q.name, 'string', `${f.id}: Quelle ohne Name`);
    assert.match(q.url, /^https:\/\/\S+$/, `${f.id}: Quelle ohne https-Adresse`);
  }));
});

test('Veröffentlichte Rätsel #1–#16 sind unverändert (Deutsch und Englisch)', () => {
  for (const lang of ['de', 'en']) {
    SNAP[lang].forEach(day => {
      const d = NF.buildDay(NF.keyOfNumber(day.n), lang);
      assert.equal(d.shift, day.shift, `${lang} #${day.n}: Verschiebung`);
      assert.deepEqual(MODES.map(m => d.puzzles[m].sig), day.sigs, `${lang} #${day.n}: Sätze oder Stufen geändert`);
    });
  }
});

test('Rätsel, die schon irgendwo auf der Welt live sind, gleichen dem letzten Stand von main', t => {
  const base = loadBase();
  if (!base) { t.skip('Kein Git-Stand zum Vergleichen gefunden'); return; }
  const until = Math.min(NF.dayIndex(latestLiveKey()), base.NF.plannedDays ? base.NF.plannedDays() - 1 : 9999);
  for (let i = 0; i <= until; i++) {
    const key = NF.addDays(NF.CONFIG.launchDate, i);
    for (const lang of ['de', 'en']) {
      let b;
      try { b = base.NF.buildDay(key, lang); } catch (e) { continue; }
      const c = NF.buildDay(key, lang);
      assert.equal(c.shift, b.shift, `${lang} #${i + 1} Verschiebung weicht von ${base.ref} ab`);
      MODES.forEach(m => assert.equal(c.puzzles[m].sig, b.puzzles[m].sig, `${lang} #${i + 1} ${m} weicht von ${base.ref} ab`));
    }
  }
});

test('Ab #17 steckt in beiden Sprachen derselbe Fakt in derselben Stufe', () => {
  for (let i = NF.CONFIG.frozenDays; i < NF.plannedDays(); i++) {
    const key = NF.addDays(NF.CONFIG.launchDate, i), de = NF.buildDay(key, 'de'), en = NF.buildDay(key, 'en');
    MODES.forEach(m => assert.equal(de.puzzles[m].fact.id, en.puzzles[m].fact.id, `#${i + 1} ${m}`));
  }
});

test('Ab #17 kein Thema doppelt am selben Tag', () => {
  const bad = check().filter(p => /mehrfach vor/.test(p.msg));
  assert.deepEqual(bad.map(p => p.msg), []);
});

test('Easy ist ab #17 der zweitkürzeste Satz, Impossible der kürzeste', () => {
  const len = f => [...NF.symStr(f.de[0])].length + [...NF.symStr(f.en[0])].length;
  for (let i = NF.CONFIG.frozenDays; i < NF.plannedDays(); i++) {
    const [easy, hard, mirror, imp] = NF.assignment(i, 'de');
    assert.ok(len(imp) <= len(easy) && len(easy) <= len(mirror) && len(mirror) <= len(hard), `#${i + 1}`);
  }
});

test('Ab #17 hat Easy in beiden Sprachen höchstens 8 Wörter, meist 5 bis 7', () => {
  const words = s => s.split(/\s+/).filter(w => NF.symStr(w)).length;
  const counts = [];
  for (let i = NF.CONFIG.frozenDays; i < NF.plannedDays(); i++) {
    const key = NF.addDays(NF.CONFIG.launchDate, i);
    for (const lang of ['de', 'en']) {
      const n = NF.buildDay(key, lang).puzzles.easy.words.length;
      assert.ok(n <= 8, `#${i + 1} ${lang.toUpperCase()}: Easy hat ${n} Wörter`);
      counts.push(n);
    }
  }
  const ideal = counts.filter(n => n >= 5 && n <= 7).length / counts.length;
  assert.ok(ideal >= 0.9, `nur ${Math.round(ideal * 100)} % der Easy-Sätze haben 5 bis 7 Wörter`);
  const bad = check().filter(p => /Easy-Satz/.test(p.msg) && p.level === 'fehler');
  assert.deepEqual(bad.map(p => p.msg), []);
});

test('Kein Wort ist breiter als ein kleines Handy (360 px)', () => {
  const bad = check().filter(p => /umbrechen/.test(p.msg));
  assert.deepEqual(bad.map(p => `${p.id}: ${p.msg}`), []);
});

test('Verschlüsselung: Easy, Hard, Mirror, Impossible und Umlaute', () => {
  assert.equal(NF.letterCode('A', 'easy', 0), 1);
  assert.equal(NF.letterCode('Z', 'hard', 0), 26);
  assert.equal(NF.letterCode('A', 'mirror', 0), 26);
  assert.equal(NF.letterCode('Z', 'mirror', 0), 1);
  assert.equal(NF.letterCode('A', 'impossible', 3), 4);
  assert.equal(NF.letterCode('Z', 'impossible', 3), 3);
  for (const m of MODES) {
    assert.equal(NF.letterCode('Ä', m, 7), 27); assert.equal(NF.letterCode('Ö', m, 7), 28);
    assert.equal(NF.letterCode('Ü', m, 7), 29); assert.equal(NF.letterCode('ß', m, 7), 30);
  }
  assert.equal(NF.symStr('Grüße, café!'), 'GRÜßECAFE');
  assert.equal(NF.symStr('ẞ'), 'ß');
  const d = NF.buildDay('2026-10-24', 'de');
  MODES.forEach(m => d.puzzles[m].words.forEach(w => {
    assert.equal(w.codes.length, [...w.plain].length);
    w.codes.forEach(c => assert.ok(c >= 1 && c <= 30));
  }));
});

test('Verschiebung bei Impossible liegt immer zwischen 3 und 23', () => {
  for (let i = 0; i < 800; i++) {
    const s = NF.buildDay(NF.addDays(NF.CONFIG.launchDate, i), 'de').shift;
    assert.ok(s >= 3 && s <= 23, `Tag ${i + 1}: ${s}`);
  }
});

test('Tageszählung ist unabhängig von Sommerzeit und Zeitzone', () => {
  assert.equal(NF.dayIndex('2026-10-21'), 0);
  assert.equal(NF.dayIndex('2026-10-25'), 4);   // Zeitumstellung in Europa
  assert.equal(NF.dayIndex('2026-11-01'), 11);  // Zeitumstellung in den USA
  assert.equal(NF.dayIndex('2027-03-28'), 158);
  assert.equal(NF.addDays('2026-10-24', 1), '2026-10-25');
  assert.equal(NF.addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(NF.keyOfNumber(4), '2026-10-24');
  // Derselbe Augenblick ergibt je nach Zeitzone einen anderen lokalen Tag, aber nie einen anderen Fahrplan pro Tag
  const at = '2026-10-24T23:30:00Z';
  const keyIn = tz => execFileSync(process.execPath, ['-e', `const d=new Date('${at}');console.log(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'))`], { env: { ...process.env, TZ: tz } }).toString().trim();
  assert.equal(keyIn('Europe/Vienna'), '2026-10-25');
  assert.equal(keyIn('America/New_York'), '2026-10-24');
  assert.equal(keyIn('Pacific/Kiritimati'), '2026-10-25');
});

test('Vorrat: reicht mindestens bis 30. November 2026, Wiederholung ist sichtbar und stabil', () => {
  const P = NF.plannedDays();
  assert.ok(NF.lastPlannedDay() >= '2026-11-30', `reicht nur bis ${NF.lastPlannedDay()}`);
  const after = NF.addDays(NF.CONFIG.launchDate, P + 2);
  const rep = NF.buildDay(after, 'de'), src = NF.buildDay(NF.addDays(NF.CONFIG.launchDate, 2), 'de');
  assert.equal(rep.repeatOf, 3);
  MODES.forEach(m => assert.equal(rep.puzzles[m].sig, src.puzzles[m].sig));
  assert.equal(NF.buildDay(NF.lastPlannedDay(), 'de').repeatOf, null);
  // Warnung, wenn der Vorrat knapp wird
  const late = NF.addDays(NF.lastPlannedDay(), -5);
  assert.ok(check(late).some(p => /reicht nur noch/.test(p.msg)));
  assert.ok(check(NF.addDays(NF.lastPlannedDay(), 1)).some(p => p.level === 'fehler' && /aufgebraucht/.test(p.msg)));
});

test('Vorrat: mindestens 60 Tage über den 30. November hinaus', { skip: process.env.NUMIGMA_SKIP_SUPPLY === '1' }, () => {
  assert.ok(NF.lastPlannedDay() >= NF.addDays('2026-11-30', 60), `reicht nur bis ${NF.lastPlannedDay()}`);
});

test('Englische Sätze enthalten keine Umlaute, deutsche keine englischen Apostrophe', () => {
  F.forEach(f => {
    assert.doesNotMatch(f.en[0], /[ÄÖÜäöüß]/, f.id);
    assert.doesNotMatch(f.de[0], /['’]/, f.id);
  });
});

test('Datei fakten.js ist sauber kodiert (UTF-8, keine unsichtbaren Zeichen)', () => {
  const src = fs.readFileSync(path.join(ROOT, 'fakten.js'));
  assert.ok(!src.includes(Buffer.from([0xEF, 0xBB, 0xBF])), 'BOM gefunden');
  const txt = src.toString('utf8');
  assert.ok(!txt.includes('�'), 'kaputtes Zeichen (�) gefunden');
  assert.doesNotMatch(txt, /[​-‍⁠­]/, 'unsichtbare Zeichen gefunden');
});

test('Nach einer Lücke angehängte Fakten verändern die Wiederholungstage nicht', () => {
  const kern = fs.readFileSync(path.join(ROOT, 'kern.js'), 'utf8');
  const mk = n => Array.from({ length: n }, (_, i) => ({ id: 'n' + String(i + 1).padStart(3, '0'), thema: 'tiere', de: ['Satz Nummer ' + (i + 1) + '.', 'Erklärung lang genug.'], en: ['Sentence ' + (i + 1) + '.', 'Explanation long enough.'], quellen: [] }))
    .map(f => ({ ...f, de: [f.de[0].replace(/\d+/, n => 'x'.repeat(+n)), f.de[1]], en: [f.en[0].replace(/\d+/, n => 'y'.repeat(+n)), f.en[1]] }));
  const load = (facts, gaps) => loadFromSources([['f.js', 'window.NUMIGMA_FACTS = ' + JSON.stringify(facts) + ';'], ['kern.js', kern.replace('repeatGaps: []', 'repeatGaps: ' + JSON.stringify(gaps))]]);
  const before = load(mk(80), []);                      // 20 Tage Vorrat
  const gapDays = [20, 21, 22].map(i => before.addDays(before.CONFIG.launchDate, i));
  const sigs = nf => gapDays.map(k => MODES.map(m => nf.buildDay(k, 'de').puzzles[m].sig).join('|'));
  const old = sigs(before);
  assert.ok(gapDays.every(k => before.buildDay(k, 'de').repeatOf));
  const after = load(mk(120), [[gapDays[0], gapDays[2]]]);   // 10 Tage nachgeliefert, Lücke eingetragen
  assert.deepEqual(sigs(after), old, 'Wiederholungstage dürfen sich nicht ändern');
  const next = after.buildDay(after.addDays(after.CONFIG.launchDate, 23), 'de');
  assert.equal(next.repeatOf, null);
  assert.equal(next.puzzles.easy.fact.id >= 'n081', true, 'erster Tag nach der Lücke bekommt neue Fakten');
  assert.equal(after.lastPlannedDay(), after.addDays(after.CONFIG.launchDate, 32));
});
