/* Gemeinsame Hilfen für die Tests. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');

// kern.js und Fakten wie im Browser laden, aber ohne Browser
function loadFromSources(sources) {
  const win = {};
  const ctx = vm.createContext({ window: win, console });
  win.window = win;
  for (const [name, code] of sources) vm.runInContext(code, ctx, { filename: name });
  return win.NF;
}
function loadNF() {
  return loadFromSources([
    ['fakten.js', fs.readFileSync(path.join(ROOT, 'fakten.js'), 'utf8')],
    ['kern.js', fs.readFileSync(path.join(ROOT, 'kern.js'), 'utf8')]
  ]);
}
// Geparkte Fakten (deutscher Satz mit Umlaut, seit #9 nicht eingeplant). Das Spiel lädt sie nicht.
function rawParked() {
  const file = path.join(ROOT, '_dev', 'redaktion', 'geparkt-umlaute.js');
  if (!fs.existsSync(file)) return [];
  const win = {};
  vm.runInContext(fs.readFileSync(file, 'utf8'), vm.createContext({ window: win }), { filename: 'geparkt-umlaute.js' });
  return win.NUMIGMA_GEPARKT || [];
}
function rawFacts() {
  const win = {};
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'fakten.js'), 'utf8'), vm.createContext({ window: win }), { filename: 'fakten.js' });
  return win.NUMIGMA_FACTS;
}

// Stand eines anderen Git-Stands (z. B. main) laden, um veröffentlichte Rätsel zu vergleichen
function gitShow(ref, file) {
  try { return execFileSync('git', ['show', `${ref}:${file}`], { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8'); }
  catch (e) { return null; }
}
function loadBase() {
  const refs = [process.env.NUMIGMA_BASE_REF, 'origin/main', 'main'].filter(Boolean);
  for (const ref of refs) {
    const kern = gitShow(ref, 'kern.js');
    if (!kern) continue;
    const parts = [];
    const de = gitShow(ref, 'fakten.js'); if (de) parts.push(['base/fakten.js', de]);
    const en = gitShow(ref, 'facts-en.js'); if (en) parts.push(['base/facts-en.js', en]);
    parts.push(['base/kern.js', kern]);
    try { const NF = loadFromSources(parts); if (NF) return { ref, NF }; } catch (e) { /* nächster Versuch */ }
  }
  return null;
}

// Tag, der irgendwo auf der Welt schon begonnen hat (UTC+14)
function latestLiveKey(now = Date.now()) { return new Date(now + 14 * 3600e3).toISOString().slice(0, 10); }

module.exports = { ROOT, loadNF, rawFacts, rawParked, loadBase, latestLiveKey, loadFromSources };
