/* Faktenbericht für Redaktion und GitHub (Zusammenfassung im Actions-Lauf).
   Aufruf (im Ordner _dev): node tools/bericht.js [--streng]
   --streng: Exit-Code 1 bei Fehlern oder wenn der Vorrat für weniger als 14 Tage reicht (für den wöchentlichen Lauf). */
'use strict';
const { loadNF, rawFacts, loadBase } = require('../tests/helpers');

const NF = loadNF(), F = rawFacts(), strict = process.argv.includes('--streng');
const today = NF.todayKey();
const last = NF.lastPlannedDay();
const left = NF.dayIndex(last) - NF.dayIndex(today) + 1;
const probs = NF.checkFacts(today);
const errs = probs.filter(p => p.level === 'fehler');
const hints = probs.filter(p => p.level === 'hinweis' && !/Keine Quelle/.test(p.msg));
const noSrc = F.filter(f => !Array.isArray(f.quellen) || !f.quellen.length);
const out = [];

out.push('## NUMIGMA · Faktenbericht', '');
out.push(`| | |`, `|---|---|`);
out.push(`| Fakten | ${F.length} (= ${NF.plannedDays()} Tage) |`);
out.push(`| Vorrat reicht bis | ${last} (${left > 0 ? `noch ${left} Tage` : '**aufgebraucht, es laufen Wiederholungen**'}) |`);
out.push(`| Fehler | ${errs.length} |`);
out.push(`| Hinweise | ${hints.length} |`);
out.push(`| Fakten ohne Quelle | ${noSrc.length} |`, '');

if (left < NF.CONFIG.warnDays) out.push(`> ⚠️ **Der Faktenvorrat reicht nur noch ${Math.max(0, left)} Tage.** Neue Fakten unten in fakten.js anhängen (Anleitung: _dev/redaktion/ANLEITUNG.md).`, '');
if (errs.length) { out.push('### Fehler', ''); errs.forEach(p => out.push(`- **${p.id || 'Vorrat'}**: ${p.msg}`)); out.push(''); }
if (hints.length) { out.push('### Hinweise', ''); hints.forEach(p => out.push(`- **${p.id || 'Vorrat'}**: ${p.msg}`)); out.push(''); }

// Themen insgesamt
const topics = {};
F.forEach(f => { topics[f.thema] = (topics[f.thema] || 0) + 1; });
out.push('### Themen', '', Object.entries(topics).sort((a, b) => b[1] - a[1]).map(([t, n]) => `${NF.TOPICS[t] ? NF.TOPICS[t].de : t}: ${n}`).join(' · '), '');

// Fahrplanänderungen gegenüber main: veröffentlichte Tage dürfen sich nie ändern, künftige nur bewusst
const base = loadBase();
if (base) {
  const changed = [];
  const until = Math.max(NF.plannedDays(), base.NF.plannedDays ? base.NF.plannedDays() : 0);
  for (let i = 0; i < until; i++) {
    const key = NF.addDays(NF.CONFIG.launchDate, i);
    for (const lang of ['de', 'en']) {
      let a, b;
      try { a = base.NF.buildDay(key, lang); b = NF.buildDay(key, lang); } catch (e) { continue; }
      const diff = NF.MODES.filter(m => a.puzzles[m.id].sig !== b.puzzles[m.id].sig).map(m => m.name);
      if (diff.length) changed.push(`#${i + 1} (${key}, ${lang.toUpperCase()}): ${diff.join(', ')}${key <= today ? ' **schon veröffentlicht!**' : ''}`);
    }
  }
  out.push(`### Fahrplan gegenüber ${base.ref}`, '');
  out.push(changed.length ? `${changed.length} Änderungen (künftige Tage):` : 'Keine Änderungen an den Rätseln.');
  changed.slice(0, 200).forEach(c => out.push(`- ${c}`));
  out.push('');
}

console.log(out.join('\n'));
if (strict && (errs.length || left < NF.CONFIG.warnDays)) {
  console.error(left < NF.CONFIG.warnDays ? `::warning::Faktenvorrat reicht nur noch ${Math.max(0, left)} Tage` : '::error::Fehler in fakten.js');
  process.exit(1);
}
