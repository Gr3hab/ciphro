/* CIPHRO-Zähler (Cloudflare Worker mit D1-Datenbank)
   Gespeichert werden nur Summen pro Tag. Keine IP-Adresse, keine Kennung, kein Cookie, kein Zeitstempel einzelner Aufrufe.

   Zwei Arten von Zahlen:
   1. Seitenaufrufe aller Besucher (ohne Einwilligung, seit 22.11.2026). Der Worker hängt als Route vor ciphro.eu/*
      und reicht jede Anfrage unverändert an GitHub Pages weiter. Öffnet ein echter Browser eine der Spielseiten
      (/, /de/, /en/, /fr/, /it/), zählt er +1 für Tag, Seite und grobe Herkunft (Reddit, Google, direkt …).
      Verwendet wird nur, was der Browser beim Abruf der Seite ohnehin mitschickt; auf dem Gerät wird nichts
      gespeichert oder ausgelesen. Suchmaschinen, Bots, Vorabladen und Linkvorschauen werden herausgefiltert.
   2. Spiel-Ereignisse, nur mit Einwilligung im Spiel (store.count):
      POST /z  ← das Spiel meldet ein Ereignis (navigator.sendBeacon, Text mit JSON)
      Ereignisse: aufruf, spieler, start, geloest, geteilt (je Sprache, Stufe, Archiv ja/nein)
      Merkmale (ab Einwilligung Version 2): tage = an wie vielen Tagen schon gespielt, serie = aktuelle Serie,
      dauer = Minuten bis zur Lösung einer Stufe. Immer nur als grobe Gruppe, nie als genauer Wert.

   GET /statistik             → Übersicht. Der Browser fragt nach Benutzer und Passwort:
                                Benutzername beliebig, Passwort = geheimer Schlüssel (steht so nie in der Adresse).
   GET /statistik?format=csv  → Spiel-Ereignisse als CSV (&tabelle=besuche oder &tabelle=merkmale für die anderen)

   Einrichtung und Deploy: siehe ANLEITUNG.md in diesem Ordner. Bindings: DB (D1), EINGANG_LIMIT,
   ADMIN_LIMIT und Secret STATISTIK_SCHLUESSEL. */

const EREIGNISSE = ['aufruf', 'spieler', 'start', 'geloest', 'geteilt'];
const MERKMALE = {
  tage: ['1', '2-3', '4-7', '8-14', '15+'],
  serie: ['0', '1', '2-3', '4-7', '8+'],
  dauer: ['<1', '1-3', '3-10', '10+']
};
const SPRACHEN = ['de', 'en', 'fr', 'it'];
const STUFEN = ['', 'easy', 'hard', 'mirror', 'impossible'];
const HERKUNFT = ['https://ciphro.eu', 'https://www.ciphro.eu'];
const MAX_BYTES = 160;
const SECURITY = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'strict-transport-security': 'max-age=31536000' };

// Seiten, deren Aufruf gezählt wird (alles andere geht ungezählt durch)
const SEITEN = { '/': 'start', '/index.html': 'start', '/de/': 'de', '/de/index.html': 'de', '/en/': 'en', '/en/index.html': 'en', '/fr/': 'fr', '/fr/index.html': 'fr', '/it/': 'it', '/it/index.html': 'it' };
const SEITEN_LISTE = ['start', 'de', 'en', 'fr', 'it'];
// Herkunft aus dem Referer-Header, nur als feste Gruppe (die genaue Adresse wird nie gespeichert). Reihenfolge zählt.
const QUELLEN = [
  ['intern', /^(www\.)?ciphro\.eu$/],
  ['ki', /(^|\.)(chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com|you\.com|phind\.com)$/],
  ['reddit', /(^|\.)(reddit\.com|redd\.it)$/],
  ['google', /(^|\.)google\.[a-z]{2,3}(\.[a-z]{2})?$/],
  ['bing', /(^|\.)bing\.com$/],
  ['duckduckgo', /(^|\.)duckduckgo\.com$/],
  ['ecosia', /(^|\.)ecosia\.org$/],
  ['instagram', /(^|\.)instagram\.com$/],
  ['tiktok', /(^|\.)tiktok\.com$/],
  ['facebook', /(^|\.)(facebook\.com|fb\.com|messenger\.com)$/],
  ['x', /(^|\.)(x\.com|twitter\.com|t\.co)$/],
  ['youtube', /(^|\.)(youtube\.com|youtu\.be)$/],
  ['linkedin', /(^|\.)(linkedin\.com|lnkd\.in)$/],
  ['amazon', /(^|\.)(amazon\.[a-z]{2,3}(\.[a-z]{2})?|amzn\.(eu|to|com))$/],
  ['altadresse', /^gr3hab\.github\.io$/]
];
const QUELLEN_LISTE = ['direkt', ...QUELLEN.map(q => q[0]), 'andere'];
// Programme statt Menschen: Suchmaschinen, Linkvorschauen, Prüfwerkzeuge, Skripte
const KEIN_MENSCH = /bot|crawl|spider|slurp|headless|lighthouse|preview|inspect|scanner|monitor|python|curl|wget|httpclient|java\/|go-http|node-fetch|axios|okhttp|facebookexternalhit|whatsapp|telegram|discord|skype|embedly|pingdom|uptime|validator/i;

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (url.hostname === 'ciphro.eu') return seite(req, url, env, ctx);
    // Passwort nie unverschlüsselt: http immer auf https umleiten, bevor die Anmeldung gefragt wird
    if (url.protocol === 'http:') return new Response(null, { status: 301, headers: { location: 'https://' + url.host + url.pathname + url.search, 'cache-control': 'no-store' } });
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

// Neue Tabellen legt der Worker beim ersten Bedarf selbst an (kein Handgriff in der D1-Konsole nötig)
const TABELLEN = [
  `CREATE TABLE IF NOT EXISTS besuche (
    datum TEXT NOT NULL CHECK (length(datum) = 10),
    seite TEXT NOT NULL CHECK (seite IN ('start', 'de', 'en', 'fr', 'it')),
    herkunft TEXT NOT NULL,
    anzahl INTEGER NOT NULL DEFAULT 0 CHECK (anzahl >= 0),
    PRIMARY KEY (datum, seite, herkunft))`,
  `CREATE TABLE IF NOT EXISTS merkmale (
    datum TEXT NOT NULL CHECK (length(datum) = 10),
    art TEXT NOT NULL CHECK (art IN ('tage', 'serie', 'dauer')),
    sprache TEXT NOT NULL CHECK (sprache IN ('de', 'en', 'fr', 'it')),
    stufe TEXT NOT NULL DEFAULT '' CHECK (stufe IN ('', 'easy', 'hard', 'mirror', 'impossible')),
    wert TEXT NOT NULL,
    anzahl INTEGER NOT NULL DEFAULT 0 CHECK (anzahl >= 0),
    PRIMARY KEY (datum, art, sprache, stufe, wert))`
];
let tabellenDa = false;
async function tabellen(env) {
  if (tabellenDa) return;
  await env.DB.batch(TABELLEN.map(sql => env.DB.prepare(sql)));
  tabellenDa = true;
}

/* ---------- 1. Seitenaufrufe aller Besucher (Route vor ciphro.eu) ---------- */

// Die Website darf davon nie abhängen: Die Anfrage geht immer unverändert an GitHub Pages,
// gezählt wird danach im Hintergrund. Wirft hier etwas, reicht Cloudflare die Anfrage trotzdem durch.
function seite(req, url, env, ctx) {
  try { ctx.passThroughOnException(); } catch (e) { /* ältere Laufzeit */ }
  const antwort = fetch(req);
  try {
    const b = besuch(req, url);
    if (b) ctx.waitUntil(antwort.then(r => (r.status === 200 || r.status === 304) ? besuchZaehlen(env, b) : null).catch(() => {}));
  } catch (e) { /* Zählen darf die Seite nie stören */ }
  return antwort;
}

// Nur echte Seitenaufrufe von Menschen: Browser navigiert zu einer Spielseite (Fetch-Metadaten), kein Vorabladen, kein Programm
function besuch(req, url) {
  if (req.method !== 'GET' || url.protocol !== 'https:') return null;
  const s = SEITEN[url.pathname];
  if (!s) return null;
  const h = req.headers;
  // Navigation. Reicht die Offline-Hilfe (Service Worker) sie weiter, meldet Chrome „empty“ statt „document“ –
  // das sind die Wiederkehrer, also beides zählen. Mode „navigate“ kann eine Seite per Skript nicht erzeugen.
  if (h.get('sec-fetch-mode') !== 'navigate' || !['document', 'empty'].includes(h.get('sec-fetch-dest'))) return null;
  if (/prefetch|prerender/i.test((h.get('sec-purpose') || '') + (h.get('purpose') || ''))) return null;
  const ua = h.get('user-agent') || '';
  if (!/^Mozilla\/5\.0 /.test(ua) || KEIN_MENSCH.test(ua)) return null;
  return { seite: s, herkunft: herkunftVon(h.get('referer')) };
}

function herkunftVon(referer) {
  if (!referer) return 'direkt';
  let host;
  try { host = new URL(referer).hostname.toLowerCase(); } catch (e) { return 'andere'; }
  const q = QUELLEN.find(([, re]) => re.test(host));
  return q ? q[0] : 'andere';
}

async function besuchZaehlen(env, b) {
  if (!env.DB || !env.EINGANG_LIMIT) return;
  if (!(await env.EINGANG_LIMIT.limit({ key: 'besuch' })).success) return;
  await tabellen(env);
  await env.DB.prepare(
    'INSERT INTO besuche (datum, seite, herkunft, anzahl) VALUES (?1, ?2, ?3, 1) ' +
    'ON CONFLICT (datum, seite, herkunft) DO UPDATE SET anzahl = anzahl + 1'
  ).bind(heute(), b.seite, b.herkunft).run();
}

/* ---------- 2. Spiel-Ereignisse mit Einwilligung ---------- */

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

// Gültige Meldung → { tabelle, werte } oder null. Strikt: nur bekannte Schlüssel und Werte, keine freien Texte.
function pruefen(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d) || Object.keys(d).some(k => !['e', 'l', 'm', 'a', 'w'].includes(k))) return null;
  const { e, l, m = '', a = 0, w } = d;
  if (!SPRACHEN.includes(l) || !STUFEN.includes(m) || ![0, 1].includes(a)) return null;
  if (EREIGNISSE.includes(e)) {
    if (w !== undefined || (['start', 'geloest'].includes(e) ? !m : !!m)) return null;
    return { tabelle: 'zaehler', werte: [e, l, m, a] };
  }
  if (Object.prototype.hasOwnProperty.call(MERKMALE, e)) {
    // Merkmale nur zum Tagesrätsel (nicht Archiv); Stufe nur bei der Lösungszeit
    if (!MERKMALE[e].includes(w) || a !== 0 || (e === 'dauer' ? !m : !!m)) return null;
    return { tabelle: 'merkmale', werte: [e, l, m, w] };
  }
  return null;
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
  const ok = pruefen(d);
  if (!ok) return new Response(null, { status: 400, headers: SECURITY });
  // Nur ungefähre globale Volumenbremse pro Cloudflare-Standort, ohne IP, Kennung oder Cookie.
  // Sie schützt vor Spitzenlast; absichtlich gefälschte Einzelmeldungen sind nicht verifizierbar.
  if (!env.EINGANG_LIMIT || !(await env.EINGANG_LIMIT.limit({ key: 'eingang' })).success)
    return new Response(null, { status: env.EINGANG_LIMIT ? 429 : 503, headers: { ...SECURITY, ...cors } });
  if (!env.DB) return new Response(null, { status: 503, headers: { ...SECURITY, ...cors } });
  if (ok.tabelle === 'zaehler') {
    await env.DB.prepare(
      'INSERT INTO zaehler (datum, ereignis, sprache, stufe, archiv, anzahl) VALUES (?1, ?2, ?3, ?4, ?5, 1) ' +
      'ON CONFLICT (datum, ereignis, sprache, stufe, archiv) DO UPDATE SET anzahl = anzahl + 1'
    ).bind(heute(), ...ok.werte).run();
  } else {
    await tabellen(env);
    await env.DB.prepare(
      'INSERT INTO merkmale (datum, art, sprache, stufe, wert, anzahl) VALUES (?1, ?2, ?3, ?4, ?5, 1) ' +
      'ON CONFLICT (datum, art, sprache, stufe, wert) DO UPDATE SET anzahl = anzahl + 1'
    ).bind(heute(), ...ok.werte).run();
  }
  return new Response(null, { status: 204, headers: { ...SECURITY, ...cors } });
}

/* ---------- Statistik (nur mit Schlüssel) ---------- */

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

const QUELLEN_NAMEN = {
  direkt: 'Direkt (Lesezeichen, App, WhatsApp, eingetippt)', intern: 'Innerhalb von ciphro.eu', ki: 'KI-Assistenten (ChatGPT, Perplexity …)',
  reddit: 'Reddit', google: 'Google', bing: 'Bing', duckduckgo: 'DuckDuckGo', ecosia: 'Ecosia', instagram: 'Instagram', tiktok: 'TikTok',
  facebook: 'Facebook', x: 'X / Twitter', youtube: 'YouTube', linkedin: 'LinkedIn', amazon: 'Amazon', altadresse: 'Alte Adresse (gr3hab.github.io)',
  andere: 'Andere Websites'
};
const SEITEN_NAMEN = { start: 'ciphro.eu/', de: '/de/', en: '/en/', fr: '/fr/', it: '/it/' };

async function statistik(req, url, env) {
  if (req.method !== 'GET') return new Response(null, { status: 405, headers: SECURITY });
  if (!env.ADMIN_LIMIT || !(await env.ADMIN_LIMIT.limit({ key: 'statistik' })).success)
    return new Response(null, { status: env.ADMIN_LIMIT ? 429 : 503, headers: SECURITY });
  if (!env.DB || !env.STATISTIK_SCHLUESSEL || env.STATISTIK_SCHLUESSEL.length < 24)
    return new Response(null, { status: 503, headers: SECURITY });
  if (!await gleich(passwort(req), env.STATISTIK_SCHLUESSEL)) {
    return new Response('Kein Zugriff\n', { status: 401, headers: { ...SECURITY, 'www-authenticate': 'Basic realm="CIPHRO-Zaehler", charset="UTF-8"' } });
  }
  await tabellen(env);
  const [z, b, m] = await Promise.all([
    "SELECT datum, ereignis, sprache, stufe, archiv, anzahl FROM zaehler WHERE datum >= date('now', '-60 days') ORDER BY datum DESC",
    "SELECT datum, seite, herkunft, anzahl FROM besuche WHERE datum >= date('now', '-60 days') ORDER BY datum DESC",
    "SELECT datum, art, sprache, stufe, wert, anzahl FROM merkmale WHERE datum >= date('now', '-60 days') ORDER BY datum DESC"
  ].map(sql => env.DB.prepare(sql).all()));
  const noStore = { ...SECURITY, 'x-robots-tag': 'noindex', 'x-frame-options': 'DENY', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'" };
  if (url.searchParams.get('format') === 'csv') {
    const t = url.searchParams.get('tabelle');
    const [name, spalten, rows] = t === 'besuche' ? ['besuche', ['datum', 'seite', 'herkunft', 'anzahl'], b.results]
      : t === 'merkmale' ? ['merkmale', ['datum', 'art', 'sprache', 'stufe', 'wert', 'anzahl'], m.results]
      : ['zaehler', ['datum', 'ereignis', 'sprache', 'stufe', 'archiv', 'anzahl'], z.results];
    const csv = spalten.join(',') + '\n' + rows.map(r => spalten.map(s => r[s]).join(',')).join('\n') + '\n';
    return new Response(csv, { headers: { ...noStore, 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="ciphro-${name}.csv"` } });
  }
  return new Response(seiteStatistik(z.results, b.results, m.results, heute()), { headers: { ...noStore, 'content-type': 'text/html; charset=utf-8' } });
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const tabelle = (kopf, zeilen) => `<div class="wrap"><table><thead><tr>${kopf.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>
${zeilen.map(z => `<tr>${z.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('\n') || `<tr><td colspan="${kopf.length}">Noch keine Daten.</td></tr>`}
</tbody></table></div>`;
const tageZurueck = (heuteStr, n) => { const d = new Date(heuteStr + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); };
const prozent = (a, b) => b ? Math.round(100 * a / b) + ' %' : '–';

function seiteStatistik(zRows, bRows, mRows, heuteStr) {
  const seit7 = tageZurueck(heuteStr, 6), seit30 = tageZurueck(heuteStr, 29);
  const stufen = STUFEN.filter(Boolean);

  // 1. Seitenaufrufe aller Besucher
  const bt = {}, quelle7 = {}, quelle30 = {};
  let besuche7 = 0;
  for (const r of bRows) {
    const t = bt[r.datum] || (bt[r.datum] = { summe: 0, seite: {}, aussen: 0 });
    t.summe += r.anzahl; t.seite[r.seite] = (t.seite[r.seite] || 0) + r.anzahl;
    if (r.herkunft !== 'intern') t.aussen += r.anzahl;
    if (r.datum >= seit7) { besuche7 += r.anzahl; quelle7[r.herkunft] = (quelle7[r.herkunft] || 0) + r.anzahl; }
    if (r.datum >= seit30) quelle30[r.herkunft] = (quelle30[r.herkunft] || 0) + r.anzahl;
  }
  const besucheZeilen = Object.keys(bt).sort().reverse().map(d => [d, bt[d].summe, bt[d].aussen, ...SEITEN_LISTE.map(s => bt[d].seite[s] || 0)]);
  const quellenZeilen = QUELLEN_LISTE.filter(q => quelle30[q]).sort((a, c) => quelle30[c] - quelle30[a]).map(q => [QUELLEN_NAMEN[q], quelle7[q] || 0, quelle30[q]]);

  // 2. Spiel-Ereignisse mit Einwilligung (wie bisher)
  const tage = {};
  let spieler7 = 0;
  for (const r of zRows) {
    const t = tage[r.datum] || (tage[r.datum] = { aufruf: 0, spieler: 0, spielerArchiv: 0, geteilt: 0, sprache: {}, start: {}, geloest: {} });
    if (r.ereignis === 'spieler') {
      if (r.archiv) t.spielerArchiv += r.anzahl;
      else { t.spieler += r.anzahl; t.sprache[r.sprache] = (t.sprache[r.sprache] || 0) + r.anzahl; if (r.datum >= seit7) spieler7 += r.anzahl; }
    } else if (r.ereignis === 'start' || r.ereignis === 'geloest') t[r.ereignis][r.stufe] = (t[r.ereignis][r.stufe] || 0) + r.anzahl;
    else t[r.ereignis] += r.anzahl;
  }
  const kopf = ['Tag', 'Aufrufe', 'Spieler', ...SPRACHEN.map(s => s.toUpperCase()), 'Archiv', ...stufen.map(s => 'Start ' + s), ...stufen.map(s => 'Gelöst ' + s), 'Geteilt'];
  const zeilen = Object.keys(tage).sort().reverse().map(datum => {
    const t = tage[datum];
    return [datum, t.aufruf, t.spieler, ...SPRACHEN.map(s => t.sprache[s] || 0), t.spielerArchiv, ...stufen.map(s => t.start[s] || 0), ...stufen.map(s => t.geloest[s] || 0), t.geteilt];
  });

  // 3. Wiederkehr und Lösungszeit (mit Einwilligung, ab Version 2)
  const mt = {}, dauer30 = {};
  let mitAngabe7 = 0, wieder7 = 0, serie7 = 0;
  for (const r of mRows) {
    if (r.art === 'dauer') {
      if (r.datum >= seit30) { const s = dauer30[r.stufe] || (dauer30[r.stufe] = {}); s[r.wert] = (s[r.wert] || 0) + r.anzahl; }
      continue;
    }
    const t = mt[r.datum] || (mt[r.datum] = { tage: {}, serie: {} });
    t[r.art][r.wert] = (t[r.art][r.wert] || 0) + r.anzahl;
    if (r.datum >= seit7 && r.art === 'tage') { mitAngabe7 += r.anzahl; if (r.wert !== '1') wieder7 += r.anzahl; }
    if (r.datum >= seit7 && r.art === 'serie' && r.wert !== '0' && r.wert !== '1') serie7 += r.anzahl;
  }
  const wiederZeilen = Object.keys(mt).sort().reverse().map(d => {
    const t = mt[d], n = MERKMALE.tage.reduce((s, w) => s + (t.tage[w] || 0), 0);
    return [d, n, ...MERKMALE.tage.map(w => t.tage[w] || 0), prozent(n - (t.tage['1'] || 0), n), ...MERKMALE.serie.map(w => t.serie[w] || 0)];
  });
  const dauerZeilen = stufen.filter(s => dauer30[s]).map(s => [s, ...MERKMALE.dauer.map(w => dauer30[s][w] || 0)]);

  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>CIPHRO · Zähler</title>
<style>body{font:14px system-ui,sans-serif;margin:16px;color:#17202e;background:#f2f4f7}h2{margin:28px 0 6px;font-size:1.15rem}table{border-collapse:collapse;background:#fff}th,td{padding:4px 8px;border:1px solid #dfe6f0;text-align:right;white-space:nowrap}th:first-child,td:first-child{text-align:left}th{background:#e8edf4;position:sticky;top:0}.wrap{overflow-x:auto}p{max-width:62em}.kurz{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0}.kurz div{background:#fff;border:1px solid #dfe6f0;border-radius:8px;padding:10px 14px;min-width:11em}.kurz b{display:block;font-size:1.6rem}.leise{color:#5b6576}</style></head><body>
<h1>CIPHRO · Zähler</h1>
<div class="kurz">
<div><b>${besuche7}</b>Seitenaufrufe, letzte 7 Tage</div>
<div><b>${spieler7}</b>Spieler mit Einwilligung, letzte 7 Tage</div>
<div><b>${prozent(wieder7, mitAngabe7)}</b>davon schon an mehreren Tagen gespielt</div>
<div><b>${prozent(serie7, mitAngabe7)}</b>mit Serie von 2 Tagen oder mehr</div>
</div>
<p class="leise">Tage in Wiener Zeit. Alles sind Tagessummen ohne IP-Adresse oder Kennung, also Richtwerte und keine eindeutigen Personen.</p>

<h2>1. Seitenaufrufe aller Besucher</h2>
<p>Gezählt ohne Einwilligung auf dem Server: Ein echter Browser öffnet ciphro.eu/ oder eine Sprachseite. Suchmaschinen, Bots, Vorabladen und Linkvorschauen sind herausgefiltert. Neuladen innerhalb von etwa 10 Minuten zählt meist nicht, mehrmals am Tag öffnen schon. „Von außen“ = nicht von einer anderen Seite auf ciphro.eu. Gezählt wird seit dem ersten Tag in der Tabelle.</p>
${tabelle(['Tag', 'Seitenaufrufe', 'von außen', ...SEITEN_LISTE.map(s => SEITEN_NAMEN[s])], besucheZeilen)}
<h2>Woher die Besucher kommen</h2>
${tabelle(['Herkunft', 'letzte 7 Tage', 'letzte 30 Tage'], quellenZeilen)}

<h2>2. Spiel (nur mit Einwilligung)</h2>
<p>Spieler = gemeldete erste Starts des Tagesrätsels pro Sprache, keine eindeutigen Personen oder Geräte. Archiv = gemeldete erste Starts älterer Rätsel. Aufrufe = gemeldete Seitenaufrufe. Gezählt wird nur ab erteilter Einwilligung; vorherige Ereignisse fehlen. Global Privacy Control und Do Not Track unterdrücken alle Meldungen. Ohne Anmeldung lassen sich falsche Meldungen nicht vollständig verhindern.</p>
${tabelle(kopf, zeilen)}

<h2>3. Wiederkommen (nur mit Einwilligung)</h2>
<p>Beim ersten Start des Tagesrätsels meldet das Spiel grob, an wie vielen Tagen diese Person schon gespielt hat (heute mitgezählt) und wie lang ihre Serie gerade ist (Tage in Folge mit gelöstem Tagesrätsel). „Wiedergekommen“ = schon an mehr als einem Tag gespielt. Wer vor dem 22.11.2026 zugestimmt hat, wird einmal neu gefragt und fehlt bis dahin hier.</p>
${tabelle(['Tag', 'Spieler mit Angabe', ...MERKMALE.tage.map(w => w + (w === '1' ? ' Tag' : ' Tage')), 'wiedergekommen', ...MERKMALE.serie.map(w => 'Serie ' + w)], wiederZeilen)}

<h2>4. Wie lange eine Stufe dauert (nur mit Einwilligung, letzte 30 Tage)</h2>
<p>Zeit vom Start bis zur Lösung, nur gelöste Tagesrätsel, in Minuten.</p>
${tabelle(['Stufe', ...MERKMALE.dauer.map(w => w + ' Min.')], dauerZeilen)}

<p class="leise">Als Tabelle für Excel: <a href="?format=csv">Spiel</a> · <a href="?format=csv&amp;tabelle=besuche">Seitenaufrufe</a> · <a href="?format=csv&amp;tabelle=merkmale">Wiederkommen und Dauer</a></p>
</body></html>`;
}
