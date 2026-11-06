/* CIPHRO-Zähler (Cloudflare Worker mit D1-Datenbank)
   Zählt anonym, wie oft etwas im Spiel passiert. Gespeichert wird nur eine Summe pro Tag, Ereignis, Sprache,
   Stufe und Archiv ja/nein. Keine IP-Adresse, keine Kennung, kein Cookie, kein Zeitstempel einzelner Aufrufe.

   POST /z           ← das Spiel meldet ein Ereignis (navigator.sendBeacon, Text mit JSON)
   GET  /statistik             → Tabelle der letzten 60 Tage. Der Browser fragt nach Benutzer und Passwort:
                                 Benutzername beliebig, Passwort = geheimer Schlüssel (steht so nie in der Adresse).
   GET  /statistik?format=csv  → dieselben Zahlen als CSV

   Einrichtung: siehe ANLEITUNG.md in diesem Ordner. Bindings: DB (D1), EINGANG_LIMIT,
   ADMIN_LIMIT und Secret STATISTIK_SCHLUESSEL. */

const EREIGNISSE = ['aufruf', 'spieler', 'start', 'geloest', 'geteilt'];
const SPRACHEN = ['de', 'en', 'fr', 'it'];
const STUFEN = ['', 'easy', 'hard', 'mirror', 'impossible'];
const HERKUNFT = ['https://ciphro.eu', 'https://www.ciphro.eu'];
const MAX_BYTES = 160;
const SECURITY = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' };

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    try {
      if (url.pathname === '/z') return await zaehlen(req, env);
      if (url.pathname === '/statistik') return await statistik(req, url, env);
      return new Response('Nicht gefunden\n', { status: 404, headers: SECURITY });
    } catch (error) {
      // Bewusst kein Request-Logging: Aufrufdaten und IP-Adressen sollen nicht gespeichert werden.
      return new Response('Zähler vorübergehend nicht erreichbar\n', { status: 503, headers: SECURITY });
    }
  }
};

// Tag in Wiener Zeit, damit ein Spieltag zu einem Kalendertag passt
const heute = () => {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Vienna', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
};

// Angreifer können Content-Length weglassen. Deshalb den Body auch ohne Header hart begrenzen.
async function kleinerText(req) {
  const n = Number(req.headers.get('content-length'));
  if (req.headers.has('content-length') && (!Number.isFinite(n) || n > MAX_BYTES)) return null;
  if (!req.body) return '';
  const reader = req.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

async function zaehlen(req, env) {
  const origin = req.headers.get('origin') || '';
  const cors = HERKUNFT.includes(origin) ? { 'access-control-allow-origin': origin, vary: 'origin' } : {};
  if (req.method === 'OPTIONS') return new Response(null, { status: HERKUNFT.includes(origin) ? 204 : 403, headers: { ...SECURITY, ...cors, 'access-control-allow-methods': 'POST', 'access-control-max-age': '86400' } });
  if (req.method !== 'POST') return new Response(null, { status: 405, headers: SECURITY });
  // Nur Meldungen von ciphro.eu. Wer das fälschen will, kann es (es gibt keine Anmeldung), die Zahlen sind ein Richtwert.
  if (!HERKUNFT.includes(origin) || req.headers.get('sec-fetch-site') === 'cross-site') return new Response(null, { status: 403, headers: SECURITY });
  if (!/^text\/plain(?:\s*;|$)/i.test(req.headers.get('content-type') || '')) return new Response(null, { status: 415, headers: SECURITY });
  let d;
  try {
    const text = await kleinerText(req);
    if (text === null) return new Response(null, { status: 413, headers: { ...SECURITY, ...cors } });
    d = JSON.parse(text);
  } catch (e) { return new Response(null, { status: 400, headers: { ...SECURITY, ...cors } }); }
  if (!d || typeof d !== 'object' || Array.isArray(d) || Object.keys(d).some(k => !['e', 'l', 'm', 'a'].includes(k))) return new Response(null, { status: 400, headers: SECURITY });
  const { e, l, m = '', a = 0 } = d;
  if (!EREIGNISSE.includes(e) || !SPRACHEN.includes(l) || !STUFEN.includes(m) || ![0, 1].includes(a) ||
      (['start', 'geloest'].includes(e) ? !m : !!m)) return new Response(null, { status: 400, headers: SECURITY });
  // Nur ungefähre globale Volumenbremse pro Cloudflare-Standort, ohne IP, Kennung oder Cookie.
  // Sie schützt vor Spitzenlast; absichtlich gefälschte Einzelmeldungen sind nicht verifizierbar.
  if (!env.EINGANG_LIMIT || !(await env.EINGANG_LIMIT.limit({ key: 'eingang' })).success)
    return new Response(null, { status: env.EINGANG_LIMIT ? 429 : 503, headers: { ...SECURITY, ...cors } });
  if (!env.DB) return new Response(null, { status: 503, headers: { ...SECURITY, ...cors } });
  await env.DB.prepare(
    'INSERT INTO zaehler (datum, ereignis, sprache, stufe, archiv, anzahl) VALUES (?1, ?2, ?3, ?4, ?5, 1) ' +
    'ON CONFLICT (datum, ereignis, sprache, stufe, archiv) DO UPDATE SET anzahl = anzahl + 1'
  ).bind(heute(), e, l, m, a).run();
  return new Response(null, { status: 204, headers: { ...SECURITY, ...cors } });
}

// Fester Hash + vollständiger Vergleich: keine Längen-/Präfixlecks bei Passwortversuchen.
async function gleich(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || b.length < 24) return false;
  const [x1, x2] = await Promise.all([a, b].map(s => crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))));
  const p = new Uint8Array(x1), q = new Uint8Array(x2);
  let x = 0;
  for (let i = 0; i < p.length; i++) x |= p[i] ^ q[i];
  return x === 0;
}

// Passwort aus der Anmeldung des Browsers (HTTP Basic), damit der Schlüssel nicht in Adresse, Verlauf oder Protokollen steht
function passwort(req) {
  const m = /^Basic\s+([A-Za-z0-9+/=]+)$/.exec(req.headers.get('authorization') || '');
  if (!m) return '';
  try { const t = atob(m[1]); const i = t.indexOf(':'); return i >= 0 ? t.slice(i + 1) : ''; } catch (e) { return ''; }
}

async function statistik(req, url, env) {
  if (req.method !== 'GET') return new Response(null, { status: 405, headers: SECURITY });
  if (!env.ADMIN_LIMIT || !(await env.ADMIN_LIMIT.limit({ key: 'statistik' })).success)
    return new Response(null, { status: env.ADMIN_LIMIT ? 429 : 503, headers: SECURITY });
  if (!env.DB || !env.STATISTIK_SCHLUESSEL || env.STATISTIK_SCHLUESSEL.length < 24)
    return new Response(null, { status: 503, headers: SECURITY });
  if (!await gleich(passwort(req), env.STATISTIK_SCHLUESSEL)) {
    return new Response('Kein Zugriff\n', { status: 401, headers: { ...SECURITY, 'www-authenticate': 'Basic realm="CIPHRO-Zaehler", charset="UTF-8"' } });
  }
  const { results } = await env.DB.prepare(
    "SELECT datum, ereignis, sprache, stufe, archiv, anzahl FROM zaehler WHERE datum >= date('now', '-60 days') ORDER BY datum DESC"
  ).all();
  const noStore = { ...SECURITY, 'x-robots-tag': 'noindex', 'x-frame-options': 'DENY', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'" };
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
<p>Spieler = gemeldete erste Starts des Tagesrätsels pro Sprache, keine eindeutigen Personen oder Geräte. Archiv = gemeldete erste Starts älterer Rätsel. Aufrufe = gemeldete Seitenaufrufe. Tage in Wiener Zeit. Gezählt wird nur ab erteilter Einwilligung; vorherige Ereignisse fehlen. Global Privacy Control und Do Not Track unterdrücken alle Meldungen. Die Werte sind Schätzgrößen; ohne Anmeldung lassen sich falsche Meldungen nicht vollständig verhindern.</p>
<div class="wrap"><table><thead><tr>${kopf.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>
${zeilen.map(z => `<tr>${z.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('\n') || `<tr><td colspan="${kopf.length}">Noch keine Daten.</td></tr>`}
</tbody></table></div></body></html>`;
  return new Response(html, { headers: { ...noStore, 'content-type': 'text/html; charset=utf-8' } });
}
