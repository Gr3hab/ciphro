/* NUMIGMA – Spiellogik für Spiel und Prüfseite.
   Hier muss normalerweise niemand etwas ändern. Fakten stehen in fakten.js (Deutsch) und facts-en.js (Englisch). */
(function () {
'use strict';

const CONFIG = {
  name: 'NUMIGMA',            // Name auch in index.html (<title>, Vorschau-Tags), manifest.webmanifest und og.png
  tagline: 'Crack the code. Reveal the fact.',
  languages: ['de', 'en'],
  launchDate: '2026-10-21',   // Tag von Rätsel Nr. 1
  siteUrl: '',                // leer = Adresse der Seite wird automatisch erkannt
  storageKey: 'numfact.v2',
  hintsPerPuzzle: 3,
  maxCells: 18                // so viele Kästchen passen auf kleinen Handys (360 px) in eine Zeile
};

const MODES = [
  { id: 'easy', name: 'Easy' },
  { id: 'hard', name: 'Hard' },
  { id: 'mirror', name: 'Mirror' },
  { id: 'impossible', name: 'Impossible' }
];

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

function facts(lang) {
  const F = lang === 'en' ? window.FACTS_EN : window.FAKTEN;
  return Array.isArray(F) ? F : [];
}

// Reihenfolge: Runde 0 ist die Liste selbst (Fahrplan), danach gemischte Wiederholungen
const seqCaches = { de: [], en: [] };
function sequence(round, lang) {
  const F = facts(lang), n = F.length, seqCache = seqCaches[lang === 'en' ? 'en' : 'de'];
  if (!seqCache[0]) seqCache[0] = F.map((_, i) => i);
  for (let k = seqCache.length; k <= round; k++) {
    const rnd = mulberry32(0x4E554D46 + k * 977);
    const a = F.map((_, i) => i);
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    const late = new Set(seqCache[k - 1].slice(Math.floor(n / 2)));
    seqCache[k] = a.filter(i => !late.has(i)).concat(a.filter(i => late.has(i)));
  }
  return seqCache[round];
}

function makePuzzle(fact, mode, shift) {
  const words = fact.t.split(/\s+/).map(w => ({ show: w, plain: symStr(w) })).filter(w => w.plain);
  words.forEach(w => { w.codes = [...w.plain].map(ch => letterCode(ch, mode, shift)); });
  return { fact, mode, words, sig: words.map(w => w.plain).join(' ') };
}

function buildDay(key, lang) {
  lang = lang === 'en' ? 'en' : 'de';
  const F = facts(lang);
  const idx = Math.max(0, dayIndex(key));
  const n = F.length, picks = [];
  for (let k = idx * 4; picks.length < Math.min(4, n) && k < idx * 4 + 64; k++) {
    const f = sequence(Math.floor(k / n), lang)[k % n];
    if (!picks.includes(f)) picks.push(f);
  }
  picks.sort((a, b) => [...symStr(F[b].t)].length - [...symStr(F[a].t)].length);
  const shift = 3 + Math.floor(mulberry32(idx * 7919 + 101)() * 21); // 3 … 23
  const puzzles = {};
  MODES.forEach((m, i) => { puzzles[m.id] = makePuzzle(F[picks[i % picks.length]], m.id, shift); });
  return { key, lang, number: idx + 1, shift, puzzles };
}

// Breite eines Worts in Kästchen. Easy: eine Zahl pro Buchstaben-Kästchen.
// Sonst: zwei Ziffern pro Kästchen über den Buchstaben.
function wordUnits(w, mode) {
  const letters = [...w.plain].length;
  return mode === 'easy' ? letters : Math.max(Math.ceil(w.codes.join('').length / 2), letters);
}

function lastPlannedDay(lang) { return addDays(CONFIG.launchDate, Math.ceil(facts(lang).length / 4) - 1); }

// Prüft eine Fakten-Liste. Liefert Probleme pro Fakt.
function checkFacts(lang) {
  lang = lang === 'en' ? 'en' : 'de';
  const F = facts(lang), out = [], seen = new Map();
  F.forEach((f, i) => {
    const add = (level, msg) => out.push({ i, level, msg });
    if (!f || typeof f.t !== 'string' || !f.t.trim()) { add('fehler', 'Satz fehlt'); return; }
    const bad = f.t.replace(lang === 'en' ? /[A-Za-z ]/g : /[A-Za-zÄÖÜäöüß ]/g, '').replace(/\.$/, '');
    if (bad) add('fehler', `Zeichen, die im Code verschwinden: „${bad}“ (keine Ziffern, Kommas, Bindestriche oder Apostrophe${lang === 'en' ? ', keine Umlaute' : ''})`);
    if (!/\.$/.test(f.t)) add('hinweis', 'Satz endet nicht mit Punkt');
    if (!f.m || f.m.trim().length < 15) add('fehler', 'Erklärung fehlt oder ist sehr kurz');
    const k = symStr(f.t);
    if (seen.has(k)) add('fehler', `Doppelt (gleich wie Fakt ${seen.get(k) + 1})`);
    seen.set(k, i);
    f.t.split(/\s+/).forEach(word => {
      const p = symStr(word);
      if (!p) return;
      const w = { plain: p, codes: [] };
      let worst = [...p].length;
      ['hard', 'mirror'].forEach(m => { w.codes = [...p].map(c => letterCode(c, m, 0)); worst = Math.max(worst, wordUnits(w, m)); });
      for (let s = 3; s <= 23; s++) { w.codes = [...p].map(c => letterCode(c, 'impossible', s)); worst = Math.max(worst, wordUnits(w, 'impossible')); }
      if (worst > CONFIG.maxCells) add('hinweis', `„${word.replace(/\.$/, '')}“ ist sehr lang und kann auf kleinen Handys umbrechen (${worst} Kästchen, Ziel höchstens ${CONFIG.maxCells})`);
    });
  });
  if (lang === 'en' && F.length < facts('de').length) out.push({ i: F.length, level: 'hinweis', msg: `Die englische Liste hat ${facts('de').length - F.length} Fakten weniger als die deutsche. Ab hier gibt es auf Englisch Wiederholungen.` });
  return out;
}

window.NF = { CONFIG, MODES, ALPHABET, SPECIAL, DIGRAPH, symStr, letterCode, mulberry32, todayKey, parseKey, dayIndex, addDays, facts, buildDay, wordUnits, lastPlannedDay, checkFacts };
})();
