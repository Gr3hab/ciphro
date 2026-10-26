/* NUMIGMA – Spiellogik für Spiel, Tests und Redaktion.
   Hier muss normalerweise niemand etwas ändern. Die Fakten stehen in fakten.js. */
(function () {
'use strict';

const CONFIG = {
  name: 'NUMIGMA',
  tagline: 'Crack the code. Reveal the fact.',
  languages: ['de', 'en'],
  launchDate: '2026-10-21',   // Tag von Rätsel #1
  siteUrl: '',                // leer = Adresse der Seite wird automatisch erkannt
  storageKey: 'numfact.v2',   // nicht ändern, sonst gehen Spielstände verloren
  hintsPerPuzzle: 3,
  maxCells: 18,               // so viele Kästchen passen auf kleinen Handys (360 px) in eine Zeile
  frozenDays: 16,             // #1–#16 behalten ihre ursprüngliche Zuordnung (nicht ändern)
  warnDays: 14,               // Warnung, wenn der Faktenvorrat für weniger Tage reicht
  // Nur nötig, falls der Vorrat einmal ausgegangen ist: Zeiträume, in denen Wiederholungen liefen.
  // Vor dem Anhängen neuer Fakten hier eintragen, z. B. [['2027-02-01', '2027-02-04']],
  // damit diese Tage im Archiv unverändert bleiben. Die Tests melden, wenn das vergessen wurde.
  repeatGaps: []
};

const MODES = [
  { id: 'easy', name: 'Easy' },
  { id: 'hard', name: 'Hard' },
  { id: 'mirror', name: 'Mirror' },
  { id: 'impossible', name: 'Impossible' }
];

const TOPICS = {
  tiere: { de: 'Tiere', en: 'Animals' },
  pflanzen: { de: 'Pflanzen & Essen', en: 'Plants & food' },
  weltall: { de: 'Weltall', en: 'Space' },
  wissenschaft: { de: 'Wissenschaft', en: 'Science' },
  koerper: { de: 'Menschlicher Körper', en: 'Human body' },
  geschichte: { de: 'Geschichte', en: 'History' },
  geografie: { de: 'Geografie', en: 'Geography' },
  technik: { de: 'Technik', en: 'Technology' },
  kultur: { de: 'Kultur & Sprache', en: 'Culture & language' },
  oesterreich: { de: 'Österreich', en: 'Austria' }
};

// Alphabet: A–Z plus Ä, Ö, Ü, ß mit festen Zahlen 27–30 (in jeder Stufe gleich)
const ALPHABET = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜß'];
const SPECIAL = { 'Ä': 27, 'Ö': 28, 'Ü': 29, 'ß': 30 };
const DIGRAPH = { 'Ä': 'AE', 'Ö': 'OE', 'Ü': 'UE', 'ß': 'SS' };

// Text → Symbole: Großbuchstaben A–Z, Ä, Ö, Ü, ß; Akzente weg, alles andere raus
function symStr(str) {
  let out = '';
  for (const c0 of String(str).normalize('NFC')) {
    if (c0 === 'ß' || c0 === 'ẞ') { out += 'ß'; continue; }
    const c = c0.toUpperCase();
    if (c === 'Ä' || c === 'Ö' || c === 'Ü') { out += c; continue; }
    const base = c.normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (/^[A-Z]$/.test(base)) out += base;
  }
  return out;
}

function letterCode(ch, mode, shift) {
  if (SPECIAL[ch]) return SPECIAL[ch];
  const n = ch.charCodeAt(0) - 64;
  if (mode === 'mirror') return 27 - n;
  if (mode === 'impossible') return ((n - 1 + shift) % 26) + 1;
  return n;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function todayKey(d) {
  d = d || new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function parseKey(k) { return k.split('-').map(Number); }
function dayIndex(key) {
  const [y, m, d] = parseKey(key), [a, b, c] = parseKey(CONFIG.launchDate);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(a, b - 1, c)) / 864e5);
}
function addDays(key, n) {
  const [y, m, d] = parseKey(key);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
const keyOfNumber = n => addDays(CONFIG.launchDate, n - 1);

/* ------------------------------------------------------------ Fakten */
function list() { return Array.isArray(window.NUMIGMA_FACTS) ? window.NUMIGMA_FACTS : []; }
function view(f, lang) {
  const v = f[lang === 'en' ? 'en' : 'de'] || ['', ''];
  return { id: f.id, topic: f.thema, t: v[0], m: v[1], src: f.quellen || [] };
}
// Liste in einer Sprache (auch von älteren Seitenständen genutzt)
function facts(lang) { return list().map(f => view(f, lang)); }
function byId(id) { return list().find(f => f.id === id); }
function plannedDays() { return Math.floor(list().length / 4); }
function lastPlannedDay() {
  const gaps = (CONFIG.repeatGaps || []).reduce((n, [a, b]) => n + dayIndex(b) - dayIndex(a) + 1, 0);
  return addDays(CONFIG.launchDate, plannedDays() - 1 + gaps);
}

/* ------------------------------------------------------------ Zuordnung zu Tagen und Stufen
   Tag #n nimmt die Fakten 4n-3 bis 4n der Liste.
   #1–#16: Zuordnung exakt wie bei der ersten Veröffentlichung, je Sprache (eingefroren).
   Ab #17: in beiden Sprachen gleich, nach gemeinsamer Länge (Deutsch + Englisch):
           kürzester Satz → Impossible, zweitkürzester → Easy, drittkürzester → Mirror, längster → Hard. */
const FROZEN = {
  de: [["n001","n002","n003","n004"],["n005","n006","n007","n008"],["n012","n009","n011","n010"],["n014","n013","n015","n016"],["n018","n017","n020","n019"],["n021","n023","n022","n024"],["n025","n026","n027","n028"],["n029","n032","n031","n030"],["n036","n033","n035","n034"],["n039","n038","n037","n040"],["n044","n042","n041","n043"],["n046","n045","n048","n047"],["n051","n052","n049","n050"],["n055","n053","n056","n054"],["n058","n057","n060","n059"],["n061","n063","n062","n064"]],
  en: [["n001","n002","n003","n004"],["n005","n006","n007","n008"],["n009","n011","n012","n010"],["n014","n013","n015","n016"],["n018","n017","n020","n019"],["n021","n023","n022","n024"],["n025","n026","n027","n028"],["n029","n032","n031","n030"],["n035","n033","n036","n034"],["n039","n040","n037","n038"],["n041","n042","n044","n043"],["n046","n045","n047","n048"],["n051","n052","n049","n050"],["n055","n056","n053","n054"],["n058","n057","n060","n059"],["n061","n063","n062","n064"]]
};
const sentLen = f => [...symStr(f.de[0])].length + [...symStr(f.en[0])].length;
function assignment(dayIdx, lang) {
  const L = list();
  const frozen = dayIdx < CONFIG.frozenDays && FROZEN[lang] && FROZEN[lang][dayIdx];
  if (frozen) return frozen.map(id => L.find(f => f.id === id));
  const s = L.slice(dayIdx * 4, dayIdx * 4 + 4).sort((a, b) => sentLen(a) - sentLen(b) || (a.id < b.id ? -1 : 1));
  return [s[1], s[3], s[2], s[0]];   // easy, hard, mirror, impossible
}

function makePuzzle(fact, mode, shift) {
  const words = fact.t.split(/\s+/).map(w => ({ show: w, plain: symStr(w) })).filter(w => w.plain);
  words.forEach(w => { w.codes = [...w.plain].map(ch => letterCode(ch, mode, shift)); });
  return { fact, mode, words, sig: words.map(w => w.plain).join(' ') };
}

// Ist der Vorrat aufgebraucht, wird ein früherer Tag bewusst und sichtbar wiederholt (repeatOf).
// Welcher Tag welche Fakten bekommt: Platz in der Liste = Tag minus frühere Wiederholungstage.
function sourceOf(idx) {
  const P = plannedDays();
  let before = 0;
  for (const [a, b] of CONFIG.repeatGaps || []) {
    const ia = dayIndex(a), ib = dayIndex(b);
    if (idx >= ia && idx <= ib) return { src: ia > 0 ? idx % ia : 0, repeat: true };   // damals war der Vorrat bei Tag ia zu Ende
    if (idx > ib) before += ib - ia + 1;
  }
  const slot = idx - before;
  if (slot >= P && P > 0) return { src: slot % P, repeat: true };
  return { src: slot, repeat: false };
}
function buildDay(key, lang) {
  lang = lang === 'en' ? 'en' : 'de';
  const idx = Math.max(0, dayIndex(key));
  const so = sourceOf(idx), src = so.src, repeatOf = so.repeat ? src + 1 : null;
  const picks = assignment(src, lang);
  const shift = 3 + Math.floor(mulberry32(idx * 7919 + 101)() * 21); // 3 … 23
  const puzzles = {};
  MODES.forEach((m, i) => { puzzles[m.id] = makePuzzle(view(picks[i], lang), m.id, shift); });
  return { key, lang, number: idx + 1, shift, puzzles, repeatOf };
}

// Breite eines Worts in Kästchen. Easy: eine Zahl pro Buchstaben-Kästchen. Sonst: zwei Ziffern pro Kästchen.
function wordUnits(w, mode) {
  const letters = [...w.plain].length;
  return mode === 'easy' ? letters : Math.max(Math.ceil(w.codes.join('').length / 2), letters);
}

/* ------------------------------------------------------------ Prüfungen für Redaktion und Tests */
function worstUnits(word) {
  const p = symStr(word), w = { plain: p, codes: [] };
  let worst = [...p].length;
  ['hard', 'mirror'].forEach(m => { w.codes = [...p].map(c => letterCode(c, m, 0)); worst = Math.max(worst, wordUnits(w, m)); });
  for (let s = 3; s <= 23; s++) { w.codes = [...p].map(c => letterCode(c, 'impossible', s)); worst = Math.max(worst, wordUnits(w, 'impossible')); }
  return worst;
}
function checkFacts(today) {
  const L = list(), out = [], seen = { de: new Map(), en: new Map() }, ids = new Set();
  L.forEach((f, i) => {
    const add = (level, msg) => out.push({ i, id: f && f.id, level, msg });
    if (!f || !/^n\d{3,}$/.test(f.id || '')) { add('fehler', 'ID fehlt oder hat das falsche Format (z. B. n165)'); return; }
    if (ids.has(f.id)) add('fehler', `ID ${f.id} kommt doppelt vor`);
    ids.add(f.id);
    if (!TOPICS[f.thema]) add('fehler', `Unbekanntes Thema „${f.thema}“ (erlaubt: ${Object.keys(TOPICS).join(', ')})`);
    if (!Array.isArray(f.quellen) || !f.quellen.length) add('hinweis', 'Keine Quelle angegeben');
    ['de', 'en'].forEach(lang => {
      const v = f[lang];
      if (!Array.isArray(v) || typeof v[0] !== 'string' || !v[0].trim()) { add('fehler', `${lang.toUpperCase()}: Satz fehlt`); return; }
      const bad = v[0].replace(lang === 'en' ? /[A-Za-z ]/g : /[A-Za-zÄÖÜäöüß ]/g, '').replace(/\.$/, '');
      if (bad) add('fehler', `${lang.toUpperCase()}: Zeichen, die im Code verschwinden: „${bad}“ (keine Ziffern, Kommas, Bindestriche oder Apostrophe${lang === 'en' ? ', keine Umlaute' : ''})`);
      if (!/\.$/.test(v[0])) add('hinweis', `${lang.toUpperCase()}: Satz endet nicht mit Punkt`);
      if (typeof v[1] !== 'string' || v[1].trim().length < 15) add('fehler', `${lang.toUpperCase()}: Erklärung fehlt oder ist sehr kurz`);
      const k = symStr(v[0]);
      if (seen[lang].has(k)) add('fehler', `${lang.toUpperCase()}: gleicher Satz wie ${seen[lang].get(k)}`);
      seen[lang].set(k, f.id);
      v[0].split(/\s+/).forEach(word => {
        if (!symStr(word)) return;
        const u = worstUnits(word);
        if (u > CONFIG.maxCells) add('hinweis', `${lang.toUpperCase()}: „${word.replace(/\.$/, '')}“ kann auf kleinen Handys umbrechen (${u} Kästchen, Ziel höchstens ${CONFIG.maxCells})`);
      });
    });
  });
  // Ab #17 kein Thema doppelt am selben Tag
  for (let d = CONFIG.frozenDays; d < plannedDays(); d++) {
    const four = L.slice(d * 4, d * 4 + 4), topics = four.map(f => f && f.thema);
    topics.forEach((t, j) => { if (topics.indexOf(t) !== j) out.push({ i: d * 4 + j, id: four[j].id, level: 'hinweis', msg: `#${d + 1}: Thema „${t}“ kommt an diesem Tag mehrfach vor` }); });
  }
  // Ab #17: Easy ist der Einstieg und soll kurz sein. Ziel 5 bis 7 Wörter, höchstens 8, in beiden Sprachen.
  const words = s => String(s).split(/\s+/).filter(w => symStr(w)).length;
  for (let d = CONFIG.frozenDays; d < plannedDays(); d++) {
    const e = assignment(d, 'de')[0];
    if (!e || !Array.isArray(e.de) || !Array.isArray(e.en)) continue;
    const n = Math.max(words(e.de[0]), words(e.en[0]));
    if (n > 8) out.push({ i: L.indexOf(e), id: e.id, level: 'fehler', msg: `#${d + 1}: Der Easy-Satz hat ${n} Wörter (Ziel 5 bis 7, höchstens 8). Einen Fakt dieses Tages gegen einen mit weniger Wörtern tauschen.` });
    else if (n === 8) out.push({ i: L.indexOf(e), id: e.id, level: 'hinweis', msg: `#${d + 1}: Der Easy-Satz hat 8 Wörter (Ziel 5 bis 7).` });
  }
  if (today) {
    const left = dayIndex(lastPlannedDay()) - dayIndex(today) + 1;
    if (left < CONFIG.warnDays) out.push({ i: -1, id: null, level: left < 1 ? 'fehler' : 'hinweis', msg: left < 1 ? 'Der Faktenvorrat ist aufgebraucht. Es laufen Wiederholungen.' : `Der Faktenvorrat reicht nur noch ${left} Tage (bis ${lastPlannedDay()}).` });
  }
  return out;
}

window.NF = { CONFIG, MODES, TOPICS, ALPHABET, SPECIAL, DIGRAPH, FROZEN, symStr, letterCode, mulberry32, todayKey, parseKey, dayIndex, addDays, keyOfNumber,
  list, facts, byId, plannedDays, lastPlannedDay, sourceOf, assignment, buildDay, wordUnits, checkFacts };
})();
