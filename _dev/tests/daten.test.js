/* Tests für Fakten, Fahrplan und Verschlüsselung (ohne Browser). Aufruf: npm test (im Ordner _dev) */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { ROOT, loadNF, rawFacts, rawParked, loadBase, latestLiveKey, loadFromSources } = require('./helpers');

const NF = loadNF();
const F = rawFacts();
const PARKED = rawParked();
const SNAP = JSON.parse(fs.readFileSync(path.join(__dirname, 'veroeffentlicht-1-16.json'), 'utf8'));
const MODES = Array.from(NF.MODES, m => m.id);
// Ergebnisse aus kern.js stammen aus einer eigenen JavaScript-Umgebung: für Vergleiche in normale Werte umwandeln
const plain = x => JSON.parse(JSON.stringify(x));
const check = today => plain(NF.checkFacts(today));
// Ab #9 stehen Umlaute als AE, OE, UE, SS in den Kästchen. So sieht ein älterer Code-Stand nach der Umstellung aus:
const az = sig => sig.replace(/[ÄÖÜß]/g, c => NF.DIGRAPH[c]);
const AZ_FROM = NF.dayIndex(NF.CONFIG.lettersFrom) + 1;   // Rätselnummer, ab der nur A–Z gilt (#9)

test('Faktenliste lädt und hat feste, fortlaufende IDs', () => {
  assert.ok(Array.isArray(F) && F.length >= 64, 'NUMIGMA_FACTS fehlt oder ist zu kurz');
  // Eingeplante und geparkte Fakten zusammen: keine ID doppelt, keine verloren
  const ids = [...F, ...PARKED].map(f => f.id);
  assert.equal(new Set(ids).size, ids.length, 'doppelte IDs');
  ids.forEach(id => assert.match(id, /^n\d{3,}$/));
  // Neue Fakten werden hinten angehängt und bekommen die nächste Nummer. Die Reihenfolge in der Liste darf ab #9 abweichen.
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

test('Veröffentlichte Rätsel #1–#8 behalten Sätze, Stufen und Verschiebung (Umlaute seit 28.10.2026 als AE, OE, UE, SS)', () => {
  // Am 28.10.2026 bekamen #9–#16 neue Fakten ohne Umlaute (vorher eingefroren, aber noch nicht erschienen),
  // und in #1–#8 stehen Ä, Ö, Ü, ß seitdem wie im Kreuzworträtsel als AE, OE, UE, SS: nur noch A–Z im ganzen Spiel.
  assert.equal(AZ_FROM, 9, 'Umstellung auf A–Z gilt ab #9 (29. Oktober 2026)');
  assert.equal(NF.CONFIG.frozenDays, 8);
  for (const lang of ['de', 'en']) {
    SNAP[lang].filter(day => day.n < AZ_FROM).forEach(day => {
      const d = NF.buildDay(NF.keyOfNumber(day.n), lang);
      assert.equal(d.shift, day.shift, `${lang} #${day.n}: Verschiebung`);
      assert.deepEqual(MODES.map(m => d.puzzles[m].sig), day.sigs.map(az), `${lang} #${day.n}: Sätze oder Stufen geändert`);
    });
  }
});

test('Nur A–Z an allen Tagen, Zahlen 1 bis 26 in jeder Stufe; ab #9 deutsche Sätze ganz ohne Ä, Ö, Ü, ß', () => {
  for (let i = 0; i < NF.plannedDays(); i++) {
    for (const lang of ['de', 'en']) {
      const d = NF.buildDay(NF.addDays(NF.CONFIG.launchDate, i), lang);
      assert.equal(d.az, true, `#${i + 1}`);
      MODES.forEach(m => {
        if (i + 1 >= AZ_FROM) assert.doesNotMatch(d.puzzles[m].fact.t, /[ÄÖÜäöüßẞ]/, `${lang} #${i + 1} ${m}: ${d.puzzles[m].fact.t}`);
        d.puzzles[m].words.forEach(w => {
          assert.match(w.plain, /^[A-Z]+$/, `${lang} #${i + 1} ${m}: ${w.plain}`);
          w.codes.forEach(c => assert.ok(c >= 1 && c <= 26, `${lang} #${i + 1} ${m}: Zahl ${c}`));
        });
      });
    }
  }
  // Mirror ohne Ausnahme A = 26 … Z = 1
  const mir = NF.buildDay(NF.keyOfNumber(9), 'de').puzzles.mirror.words[0];
  assert.deepEqual(Array.from(mir.codes), [...mir.plain].map(c => 27 - (c.charCodeAt(0) - 64)));
  // Umlaute in #1–#8 stehen wie im Kreuzworträtsel da
  assert.equal(NF.plainOf('Grüße'), 'GRUESSE');
  assert.equal(NF.buildDay(NF.keyOfNumber(8), 'de').puzzles.easy.words[0].plain, 'FUSSSPUREN');
  assert.equal(NF.buildDay(NF.keyOfNumber(8), 'de').puzzles.mirror.words[0].plain, 'KAENGURUS');
  assert.deepEqual([...NF.ALPHABET].join(''), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
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
      // Einmalige, gewollte Ausnahme: Umstellung am 28.10.2026, ab #9 neue Fakten ohne Umlaute.
      // #9 war da nur in Zeitzonen ab UTC+11 schon zu sehen. Vergleichsstände von danach (mit az) werden voll geprüft.
      if (c.az && b.az === undefined) continue;
      MODES.forEach(m => assert.equal(c.puzzles[m].sig, b.puzzles[m].sig, `${lang} #${i + 1} ${m} weicht von ${base.ref} ab`));
    }
  }
});

test('Ab #9 steckt in beiden Sprachen derselbe Fakt in derselben Stufe', () => {
  for (let i = NF.CONFIG.frozenDays; i < NF.plannedDays(); i++) {
    const key = NF.addDays(NF.CONFIG.launchDate, i), de = NF.buildDay(key, 'de'), en = NF.buildDay(key, 'en');
    MODES.forEach(m => assert.equal(de.puzzles[m].fact.id, en.puzzles[m].fact.id, `#${i + 1} ${m}`));
  }
});

test('Ab #9 kein Thema doppelt am selben Tag', () => {
  const bad = check().filter(p => /mehrfach vor/.test(p.msg));
  assert.deepEqual(bad.map(p => p.msg), []);
});

test('Easy ist ab #9 der zweitkürzeste Satz, Impossible der kürzeste', () => {
  const len = f => [...NF.symStr(f.de[0])].length + [...NF.symStr(f.en[0])].length;
  for (let i = NF.CONFIG.frozenDays; i < NF.plannedDays(); i++) {
    const [easy, hard, mirror, imp] = NF.assignment(i, 'de');
    assert.ok(len(imp) <= len(easy) && len(easy) <= len(mirror) && len(mirror) <= len(hard), `#${i + 1}`);
  }
});

test('Ab #9 hat Easy in beiden Sprachen höchstens 8 Wörter, meist 5 bis 7', () => {
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
  assert.equal(NF.symStr('Grüße, café!'), 'GRÜßECAFE');
  assert.equal(NF.symStr('ẞ'), 'ß');
  const d = NF.buildDay('2026-10-24', 'de');
  MODES.forEach(m => d.puzzles[m].words.forEach(w => {
    assert.equal(w.codes.length, [...w.plain].length);
    w.codes.forEach(c => assert.ok(c >= 1 && c <= 26));
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
  // Wiederholung: dieselben Sätze in denselben Stufen, geschrieben nach der Regel ihres Tages (ab #9 nur A–Z)
  MODES.forEach(m => assert.equal(rep.puzzles[m].sig, az(src.puzzles[m].sig)));
  assert.equal(NF.buildDay(NF.lastPlannedDay(), 'de').repeatOf, null);
  // Warnung, wenn der Vorrat knapp wird
  const late = NF.addDays(NF.lastPlannedDay(), -5);
  assert.ok(check(late).some(p => /reicht nur noch/.test(p.msg)));
  assert.ok(check(NF.addDays(NF.lastPlannedDay(), 1)).some(p => p.level === 'fehler' && /aufgebraucht/.test(p.msg)));
});

// Seit dem 28.10.2026 nur Sätze ohne Umlaute: Der Vorrat reicht bis 14. Dezember. Umformulierte Fakten aus
// _dev/redaktion/geparkt-umlaute.js füllen ihn wieder auf; danach die Grenze wieder anheben.
test('Vorrat: mindestens zwei Wochen über den 30. November hinaus', { skip: process.env.NUMIGMA_SKIP_SUPPLY === '1' }, () => {
  assert.ok(NF.lastPlannedDay() >= NF.addDays('2026-11-30', 14), `reicht nur bis ${NF.lastPlannedDay()}`);
});

test('Geparkte Fakten: nur solche mit Umlaut im deutschen Satz, vollständig, mit Quelle, nicht eingeplant', () => {
  const planned = new Set(F.map(f => f.id));
  PARKED.forEach(f => {
    assert.ok(!planned.has(f.id), `${f.id} ist geparkt und eingeplant`);
    assert.match(f.de[0], /[ÄÖÜäöüßẞ]/, `${f.id} hat keinen Umlaut, gehört in fakten.js`);
    assert.ok(NF.TOPICS[f.thema], `${f.id}: Thema`);
    assert.ok(Array.isArray(f.en) && f.en[0] && f.en[1] && f.de[1], `${f.id}: Text fehlt`);
    assert.ok(Array.isArray(f.quellen) && f.quellen.length, `${f.id}: Quelle fehlt`);
  });
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
