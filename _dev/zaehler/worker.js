/* CIPHRO-Zähler (Cloudflare Worker mit D1-Datenbank)
   Zählt anonym, wie oft etwas im Spiel passiert. Gespeichert wird nur eine Summe pro Tag, Ereignis, Sprache,
   Stufe und Archiv ja/nein. Keine IP-Adresse, keine Kennung, kein Cookie, kein Zeitstempel einzelner Aufrufe.

   POST /z           ← das Spiel meldet ein Ereignis (navigator.sendBeacon, Text mit JSON)
   GET  /statistik             → Tabelle der letzten 60 Tage. Der Browser fragt nach Benutzer und Passwort:
                                 Benutzername beliebig, Passwort = geheimer Schlüssel (steht so nie in der Adresse).
   GET  /statistik?format=csv  → dieselben Zahlen als CSV

   Einrichtung: siehe ANLEITUNG.md in diesem Ordner. Bindings: DB (D1), Secret STATISTIK_SCHLUESSEL. */

const EREIGNISSE = ['aufruf', 'spieler', 'start', 'geloest', 'geteilt'];
const SPRACHEN = ['de', 'en', 'fr', 'it'];
const STUFEN = ['', 'easy', 'hard', 'mirror', 'impossible'];
const HERKUNFT = ['https://ciphro.eu', 'https://www.ciphro.eu'];

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/z') return zaehlen(req, env);
    if (url.pathname === '/statistik') return statistik(req, url, env);
    return new Response('CIPHRO-Zähler\n', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }
};

// Tag in Wiener Zeit, damit ein Spieltag zu einem Kalendertag passt
const heute = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Vienna', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

async function zaehlen(req, env) {
  const origin = req.headers.get('origin') || '';
  const cors = HERKUNFT.includes(origin) ? { 'access-control-allow-origin': origin, vary: 'origin' } : {};
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors, 'access-control-allow-methods': 'POST', 'access-control-max-age': '86400' } });
  if (req.method !== 'POST') return new Response(null, { status: 405 });
  // Nur Meldungen von ciphro.eu. Wer das fälschen will, kann es (es gibt keine Anmeldung), die Zahlen sind ein Richtwert.
  if (!HERKUNFT.includes(origin)) return new Response(null, { status: 403 });
  let d;
  try {
    const text = await req.text();
    if (text.length > 200) return new Response(null, { status: 413, headers: cors });
    d = JSON.parse(text);
  } catch (e) { return new Response(null, { status: 400, headers: cors }); }
  const e = String(d && d.e), l = String(d && d.l), m = String((d && d.m) || ''), a = d && d.a ? 1 : 0;
  if (!EREIGNISSE.includes(e) || !SPRACHEN.includes(l) || !STUFEN.includes(m)) return new Response(null, { status: 400, headers: cors });
  await env.DB.prepare(
    'INSERT INTO zaehler (datum, ereignis, sprache, stufe, archiv, anzahl) VALUES (?1, ?2, ?3, ?4, ?5, 1) ' +
    'ON CONFLICT (datum, ereignis, sprache, stufe, archiv) DO UPDATE SET anzahl = anzahl + 1'
  ).bind(heute(), e, l, m, a).run();
  return new Response(null, { status: 204, headers: cors });
}

// Vergleich des Schlüssels ohne frühen Abbruch
function gleich(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}

// Passwort aus der Anmeldung des Browsers (HTTP Basic), damit der Schlüssel nicht in Adresse, Verlauf oder Protokollen steht
function passwort(req) {
  const m = /^Basic\s+([A-Za-z0-9+/=]+)$/.exec(req.headers.get('authorization') || '');
  if (!m) return '';
  try { const t = atob(m[1]); return t.slice(t.indexOf(':') + 1); } catch (e) { return ''; }
}

async function statistik(req, url, env) {
  if (!gleich(passwort(req), env.STATISTIK_SCHLUESSEL || '')) {
    return new Response('Kein Zugriff\n', { status: 401, headers: { 'www-authenticate': 'Basic realm="CIPHRO-Zaehler", charset="UTF-8"', 'cache-control': 'no-store' } });
  }
  const { results } = await env.DB.prepare(
    "SELECT datum, ereignis, sprache, stufe, archiv, anzahl FROM zaehler WHERE datum >= date('now', '-60 days') ORDER BY datum DESC"
  ).all();
  const noStore = { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' };
  if (url.searchParams.get('format') === 'csv') {
    const csv = 'datum,ereignis,sprache,stufe,archiv,anzahl\n' + results.map(r => [r.datum, r.ereignis, r.sprache, r.stufe, r.archiv, r.anzahl].join(',')).join('\n') + '\n';
    return new Response(csv, { headers: { ...noStore, 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="ciphro-zaehler.csv"' } });
  }
  // Übersicht pro Tag: Spieler (heutiges Rätsel), je Sprache, Starts und Lösungen je Stufe
  const tage = {};
  for (const r of results) {
    const t = tage[r.datum] || (tage[r.datum] = { aufruf: 0, spieler: 0, spielerArchiv: 0, geteilt: 0, sprache: {}, start: {}, geloest: {} });
    if (r.ereignis === 'spieler') {
      if (r.archiv) t.spielerArchiv += r.anzahl;
      else { t.spieler += r.anzahl; t.sprache[r.sprache] = (t.sprache[r.sprache] || 0) + r.anzahl; }
    } else if (r.ereignis === 'start' || r.ereignis === 'geloest') t[r.ereignis][r.stufe] = (t[r.ereignis][r.stufe] || 0) + r.anzahl;
    else t[r.ereignis] += r.anzahl;
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const stufen = STUFEN.filter(Boolean);
  const kopf = ['Tag', 'Aufrufe', 'Spieler', ...SPRACHEN.map(s => s.toUpperCase()), 'Archiv', ...stufen.map(s => 'Start ' + s), ...stufen.map(s => 'Gelöst ' + s), 'Geteilt'];
  const zeilen = Object.keys(tage).sort().reverse().map(datum => {
    const t = tage[datum];
    return [datum, t.aufruf, t.spieler, ...SPRACHEN.map(s => t.sprache[s] || 0), t.spielerArchiv, ...stufen.map(s => t.start[s] || 0), ...stufen.map(s => t.geloest[s] || 0), t.geteilt];
  });
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>CIPHRO · Zähler</title>
<style>body{font:14px system-ui,sans-serif;margin:16px;color:#17202e;background:#f2f4f7}table{border-collapse:collapse;background:#fff}th,td{padding:4px 8px;border:1px solid #dfe6f0;text-align:right;white-space:nowrap}th:first-child,td:first-child{text-align:left}th{background:#e8edf4;position:sticky;top:0}.wrap{overflow-x:auto}p{max-width:60em}</style></head><body>
<h1>CIPHRO · Zähler</h1>
<p>Spieler = Geräte, die an diesem Tag das heutige Rätsel begonnen haben (je Sprache getrennt gezählt; wer dieselbe Person in zwei Sprachen oder auf zwei Geräten ist, zählt doppelt). Archiv = begonnene ältere Rätsel. Aufrufe zählen jedes Öffnen der Seite. Tage in Wiener Zeit. Wer den Zähler in den Einstellungen ausschaltet oder Global Privacy Control nutzt, fehlt.</p>
<div class="wrap"><table><thead><tr>${kopf.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>
${zeilen.map(z => `<tr>${z.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('\n') || `<tr><td colspan="${kopf.length}">Noch keine Daten.</td></tr>`}
</tbody></table></div></body></html>`;
  return new Response(html, { headers: { ...noStore, 'content-type': 'text/html; charset=utf-8' } });
}
