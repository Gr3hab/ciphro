/* Tests für den anonymen Zähler (_dev/zaehler/worker.js) ohne Cloudflare: D1 wird nachgebildet. Aufruf: npm test */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'zaehler');
const load = () => import('data:text/javascript,' + encodeURIComponent(fs.readFileSync(path.join(DIR, 'worker.js'), 'utf8')));
const SECRET = 'eins-zwei-drei-vier-fuenf-sechs-2026';
const limiter = (allowed = true) => ({ limit: async () => ({ success: allowed }) });
const environment = (extras = {}) => ({ DB: fakeDB(), STATISTIK_SCHLUESSEL: SECRET, EINGANG_LIMIT: limiter(), ADMIN_LIMIT: limiter(), ...extras });

// Nachbildung von D1: merkt sich nur Summen, so wie die Tabellen zaehler, besuche und merkmale
const SPALTEN = {
  zaehler: ['datum', 'ereignis', 'sprache', 'stufe', 'archiv'],
  besuche: ['datum', 'seite', 'herkunft'],
  merkmale: ['datum', 'art', 'sprache', 'stufe', 'wert']
};
function fakeDB() {
  const tables = { zaehler: new Map(), besuche: new Map(), merkmale: new Map() };
  const created = [];
  const db = {
    rows: tables.zaehler, tables, created,
    prepare(sql) {
      const tabelle = (/(?:INTO|FROM)\s+(\w+)/.exec(sql) || [])[1];
      const all = async () => {
        assert.match(sql, /^SELECT /);
        return { results: [...tables[tabelle]].map(([k, n]) => { const v = k.split('|'); const r = { anzahl: n }; SPALTEN[tabelle].forEach((c, i) => { r[c] = c === 'archiv' ? +v[i] : v[i]; }); return r; }) };
      };
      const run = async (...v) => {
        if (/^CREATE TABLE IF NOT EXISTS (\w+)/.test(sql)) { created.push(/^CREATE TABLE IF NOT EXISTS (\w+)/.exec(sql)[1]); return; }
        assert.match(sql, /^INSERT INTO (zaehler|besuche|merkmale) /);
        assert.equal(v.length, SPALTEN[tabelle].length, 'nur die vorgesehenen Spalten');
        const k = v.join('|'); tables[tabelle].set(k, (tables[tabelle].get(k) || 0) + 1);
      };
      return { bind: (...v) => ({ run: () => run(...v), all }), all, run: () => run(), sql };
    },
    async batch(statements) { for (const st of statements) await st.run(); return []; }
  };
  return db;
}
const post = (body, origin = 'https://ciphro.eu') => new Request('https://zaehler.ciphro.eu/z', { method: 'POST', headers: origin ? { origin, 'content-type': 'text/plain' } : {}, body: typeof body === 'string' ? body : JSON.stringify(body) });

test('Zähler: zählt nur gültige Meldungen von ciphro.eu und speichert nur Summen', async () => {
  const w = (await load()).default, env = environment();
  assert.equal((await w.fetch(post({ e: 'start', l: 'fr', m: 'easy', a: 0 }), env)).status, 204);
  assert.equal((await w.fetch(post({ e: 'start', l: 'fr', m: 'easy', a: 0 }), env)).status, 204);
  assert.equal((await w.fetch(post({ e: 'aufruf', l: 'de', m: '' }), env)).status, 204);
  const r = await w.fetch(post({ e: 'geloest', l: 'it', m: 'hard' }), env);
  assert.equal(r.headers.get('access-control-allow-origin'), 'https://ciphro.eu');
  // abgelehnt: fremde Herkunft, unbekanntes Ereignis, Sprache oder Stufe, kaputter oder zu langer Inhalt, GET
  assert.equal((await w.fetch(post({ e: 'start', l: 'de', m: 'easy' }, 'https://example.com'), env)).status, 403);
  assert.equal((await w.fetch(post({ e: 'start', l: 'de', m: 'easy' }, null), env)).status, 403);
  assert.equal((await w.fetch(post({ e: 'kauf', l: 'de' }), env)).status, 400);
  assert.equal((await w.fetch(post({ e: 'start', l: 'es', m: 'easy' }), env)).status, 400);
  assert.equal((await w.fetch(post({ e: 'start', l: 'de', m: 'leicht' }), env)).status, 400);
  assert.equal((await w.fetch(post({ e: 'start', l: 'de', m: '' }), env)).status, 400, 'Start verlangt Stufe');
  assert.equal((await w.fetch(post({ e: 'aufruf', l: 'de', m: 'easy' }), env)).status, 400, 'Aufruf ohne Stufe');
  assert.equal((await w.fetch(post({ e: 'aufruf', l: 'de', a: 'ja' }), env)).status, 400);
  assert.equal((await w.fetch(post({ e: 'aufruf', l: 'de', ip: '1.2.3.4' }), env)).status, 400, 'keine zusätzlichen Identifikatoren');
  assert.equal((await w.fetch(post({ e: 'aufruf', l: 'de' }, 'https://www.ciphro.eu'), env)).status, 204);
  assert.equal((await w.fetch(new Request('https://zaehler.ciphro.eu/z', { method: 'POST', headers: { origin: 'https://ciphro.eu', 'content-type': 'application/json' }, body: JSON.stringify({ e: 'aufruf', l: 'de' }) }), env)).status, 415);
  assert.equal((await w.fetch(new Request('https://zaehler.ciphro.eu/z', { method: 'POST', headers: { origin: 'https://ciphro.eu', 'content-type': 'text/plain', 'sec-fetch-site': 'cross-site' }, body: JSON.stringify({ e: 'aufruf', l: 'de' }) }), env)).status, 403);
  assert.equal((await w.fetch(post('{kaputt'), env)).status, 400);
  assert.equal((await w.fetch(post('x'.repeat(500)), env)).status, 413);
  assert.equal((await w.fetch(new Request('https://zaehler.ciphro.eu/z'), env)).status, 405);
  // gespeichert: nur Tag, Ereignis, Sprache, Stufe, Archiv und die Anzahl (keine IP, keine Kennung)
  const keys = [...env.DB.rows.keys()].map(k => k.split('|').slice(1).join('|'));
  assert.deepEqual(keys.sort(), ['aufruf|de||0', 'geloest|it|hard|0', 'start|fr|easy|0']);
  assert.equal([...env.DB.rows.values()].reduce((a, b) => a + b, 0), 5);
  [...env.DB.rows.keys()].forEach(k => assert.match(k.split('|')[0], /^\d{4}-\d\d-\d\d$/));
});

test('Zähler: Statistik nur mit dem geheimen Schlüssel, und nie in der Adresse', async () => {
  const w = (await load()).default, env = environment();
  await w.fetch(post({ e: 'spieler', l: 'de', m: '' }), env);
  const auth = pw => ({ authorization: 'Basic ' + Buffer.from('egal:' + pw).toString('base64') });
  const ohne = await w.fetch(new Request('https://zaehler.ciphro.eu/statistik'), env);
  assert.equal(ohne.status, 401);
  assert.match(ohne.headers.get('www-authenticate'), /^Basic /);
  assert.equal((await w.fetch(new Request('https://zaehler.ciphro.eu/statistik', { headers: auth('falsch-12') }), env)).status, 401);
  assert.equal((await w.fetch(new Request('https://zaehler.ciphro.eu/statistik?schluessel=' + SECRET), env)).status, 401, 'Schlüssel in der Adresse zählt nicht');
  assert.equal((await w.fetch(new Request('https://zaehler.ciphro.eu/statistik', { headers: auth('') }), environment({STATISTIK_SCHLUESSEL: undefined}))).status, 503, 'ohne eingerichteten Schlüssel gesperrt');
  assert.equal((await w.fetch(new Request('https://zaehler.ciphro.eu/statistik', { headers: auth('geheim') }), environment({STATISTIK_SCHLUESSEL: 'geheim'}))).status, 503, 'schwaches Passwort ist Konfigurationsfehler');
  const ok = await w.fetch(new Request('https://zaehler.ciphro.eu/statistik', { headers: auth(SECRET) }), env);
  assert.equal(ok.status, 200);
  assert.match(await ok.text(), /<td>1<\/td>/);
  assert.equal(ok.headers.get('cache-control'), 'no-store');
  assert.equal(ok.headers.get('x-frame-options'), 'DENY');
  assert.match(ok.headers.get('content-security-policy'), /default-src 'none'/);
  const csv = await w.fetch(new Request('https://zaehler.ciphro.eu/statistik?format=csv', { headers: auth(SECRET) }), env);
  assert.match(await csv.text(), /^datum,ereignis,sprache,stufe,archiv,anzahl\n\d{4}-\d\d-\d\d,spieler,de,,0,1\n$/);
  assert.equal((await w.fetch(new Request('https://zaehler.ciphro.eu/statistik', { method: 'POST' }), env)).status, 405);
});

test('Zähler: ohne Rate-Limits keine Erfassung; Überlast ist begrenzt', async () => {
  const w = (await load()).default, event = post({ e: 'geloest', l: 'fr', m: 'mirror' });
  const broken = environment({EINGANG_LIMIT: undefined});
  assert.equal((await w.fetch(event.clone(), broken)).status, 503);
  assert.equal(broken.DB.rows.size, 0);
  const denied = environment({EINGANG_LIMIT: limiter(false)});
  assert.equal((await w.fetch(event.clone(), denied)).status, 429);
  assert.equal(denied.DB.rows.size, 0);
  assert.equal((await w.fetch(new Request('https://zaehler.ciphro.eu/statistik'), environment({ADMIN_LIMIT: limiter(false)}))).status, 429);
  assert.equal((await w.fetch(new Request('https://zaehler.ciphro.eu/statistik'), environment({ADMIN_LIMIT: undefined}))).status, 503);
});

test('Deployment: Logs und Invocation-Logs explizit aus, zwei eigene Rate-Limits konfiguriert', () => {
  const cfg = fs.readFileSync(path.join(DIR, 'wrangler.toml'), 'utf8');
  assert.match(cfg, /\[observability\]\s*enabled = false/);
  assert.match(cfg, /\[observability\.logs\]\s*enabled = false\s*invocation_logs = false/);
  assert.match(cfg, /\[observability\.traces\]\s*enabled = false/);
  assert.match(cfg, /name = "EINGANG_LIMIT"/);
  assert.match(cfg, /name = "ADMIN_LIMIT"/);
  assert.match(cfg, /workers_dev = false/);
  assert.match(cfg, /custom_domain = true/);
  assert.match(cfg, /database_id = "a0779429-8730-45bf-be7c-364c9ad77a52"/, 'eingerichtete EU-D1-Datenbank darf bei Wartungsdeploy nicht gewechselt werden');
  assert.doesNotMatch(cfg, /HIER-DIE-ID-DER-DATENBANK-EINTRAGEN/);
  assert.ok(!fs.readFileSync(path.join(DIR, 'worker.js'), 'utf8').includes('cf-connecting-ip'));
});

test('Zähler: Tabelle und Hochzählen funktionieren in SQLite (wie D1)', t => {
  let sqlite;
  try { sqlite = require('node:sqlite'); } catch (e) { t.skip('node:sqlite fehlt in dieser Node-Version'); return; }
  const db = new sqlite.DatabaseSync(':memory:');
  db.exec(fs.readFileSync(path.join(DIR, 'schema.sql'), 'utf8'));
  const sql = /'INSERT INTO zaehler[^']*' \+\s*'[^']*'/.exec(fs.readFileSync(path.join(DIR, 'worker.js'), 'utf8'))[0]
    .split(/'\s*\+\s*'/).join('').replace(/^'|'$/g, '');
  const st = db.prepare(sql);
  st.run('2026-11-08', 'start', 'de', 'easy', 0);
  st.run('2026-11-08', 'start', 'de', 'easy', 0);
  st.run('2026-11-08', 'start', 'de', 'hard', 0);
  const rows = db.prepare('SELECT stufe, anzahl FROM zaehler ORDER BY stufe').all();
  assert.deepEqual(rows.map(r => [r.stufe, r.anzahl]), [['easy', 2], ['hard', 1]]);
});

// Route vor ciphro.eu: GitHub Pages nachgebildet, ctx sammelt die Hintergrundarbeit
const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';
const nav = (pfad, referer, extra = {}) => new Request('https://ciphro.eu' + pfad, { headers: { 'user-agent': CHROME, 'sec-fetch-mode': 'navigate', 'sec-fetch-dest': 'document', ...(referer ? { referer } : {}), ...extra } });
function origin(status = 200) {
  const calls = [];
  globalThis.fetch = async req => { calls.push(req.url); return new Response(status === 304 ? null : 'seite ' + new URL(req.url).pathname, { status, headers: { 'content-type': 'text/html', 'x-herkunft': 'github' } }); };
  return calls;
}
const kontext = () => { const jobs = []; return { jobs, waitUntil: p => jobs.push(p), passThroughOnException() {}, fertig: () => Promise.all(jobs) }; };
async function aufrufen(w, env, req, status) {
  const calls = origin(status), ctx = kontext();
  const res = await w.fetch(req, env, ctx);
  await ctx.fertig();
  return { res, calls };
}

test('Seitenaufrufe: echte Browser auf Spielseiten zählen mit grober Herkunft, alles geht unverändert an GitHub Pages', async () => {
  const w = (await load()).default, env = environment();
  const faelle = [
    [nav('/', 'https://www.reddit.com/r/puzzles/comments/abc'), 'start|reddit'],
    [nav('/en/?n=27', 'https://www.google.com/'), 'en|google'],
    [nav('/de/'), 'de|direkt'],
    [nav('/fr/', 'https://ciphro.eu/impressum.html'), 'fr|intern'],
    [nav('/it/', 'https://l.instagram.com/'), 'it|instagram'],
    [nav('/?n=24', 'https://gr3hab.github.io/numfact/'), 'start|altadresse'],
    [nav('/', 'https://chatgpt.com/'), 'start|ki'],
    [nav('/', 'https://gemini.google.com/app'), 'start|ki'],
    [nav('/', 'https://www.google.co.uk/'), 'start|google'],
    [nav('/', 'https://out.reddit.com/t3_x'), 'start|reddit'],
    [nav('/', 'https://www.tiktok.com/@ciphro.eu'), 'start|tiktok'],
    [nav('/', 'https://amzn.eu/d/0ij969YA'), 'start|amazon'],
    [nav('/', 'https://example.org/liste'), 'start|andere'],
    [nav('/', 'kein-url'), 'start|andere'],
    [nav('/de/index.html', 'https://t.co/xyz'), 'de|x']
  ];
  for (const [req, erwartet] of faelle) {
    const { res, calls } = await aufrufen(w, env, req);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('x-herkunft'), 'github', 'Antwort kommt unverändert von GitHub Pages');
    assert.equal(await res.text(), 'seite ' + new URL(req.url).pathname);
    assert.deepEqual(calls, [req.url], `${erwartet}: genau eine Weiterleitung an GitHub Pages`);
  }
  const gezaehlt = [...env.DB.tables.besuche].map(([k, n]) => [k.split('|').slice(1).join('|'), n]);
  const soll = {};
  faelle.forEach(([, e]) => { soll[e] = (soll[e] || 0) + 1; });
  assert.deepEqual(Object.fromEntries(gezaehlt), soll);
  [...env.DB.tables.besuche.keys()].forEach(k => assert.match(k.split('|')[0], /^\d{4}-\d\d-\d\d$/));
  assert.equal(env.DB.tables.zaehler.size, 0, 'Seitenaufrufe landen nicht in den Spiel-Ereignissen');
});

test('Seitenaufrufe: Bots, Vorabladen, andere Dateien und Fehlerseiten zählen nicht; die Seite läuft auch, wenn der Zähler streikt', async () => {
  const w = (await load()).default, env = environment();
  const nicht = [
    nav('/', null, { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }),
    nav('/', null, { 'user-agent': 'curl/8.6.0' }),
    nav('/', null, { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/142.0.0.0 Safari/537.36' }),
    nav('/', null, { 'user-agent': 'WhatsApp/2.23.20.0 A' }),
    nav('/', null, { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0) facebookexternalhit/1.1' }),
    nav('/', null, { 'sec-purpose': 'prefetch;prerender' }),
    nav('/', null, { 'sec-fetch-mode': 'no-cors', 'sec-fetch-dest': 'script' }),
    new Request('https://ciphro.eu/', { headers: { 'user-agent': CHROME } }),
    nav('/kern.js'), nav('/fakten.js'), nav('/cmd/.env'), nav('/datenschutz.html'), nav('/sw.js'),
    new Request('http://ciphro.eu/', { headers: { 'user-agent': CHROME, 'sec-fetch-mode': 'navigate', 'sec-fetch-dest': 'document' } }),
    new Request('https://ciphro.eu/', { method: 'POST', body: 'x', headers: { 'user-agent': CHROME, 'sec-fetch-mode': 'navigate', 'sec-fetch-dest': 'document' } })
  ];
  for (const req of nicht) {
    const { res, calls } = await aufrufen(w, env, req);
    assert.equal(res.status, 200);
    assert.equal(calls.length, 1, 'trotzdem unverändert ausgeliefert');
  }
  await aufrufen(w, env, nav('/'), 404);
  assert.equal(env.DB.tables.besuche.size, 0, 'nichts davon gezählt');
  // 304 (Browser prüft seine Kopie) zählt als Aufruf
  await aufrufen(w, env, nav('/de/'), 304);
  assert.equal(env.DB.tables.besuche.size, 1);
  // Zähler kaputt, Datenbank weg, Rate-Limit erreicht: Seite kommt trotzdem, gezählt wird nichts
  for (const kaputt of [environment({ DB: undefined }), environment({ EINGANG_LIMIT: undefined }), environment({ EINGANG_LIMIT: limiter(false) }),
    environment({ DB: { prepare() { throw new Error('D1 weg'); }, batch() { throw new Error('D1 weg'); } } })]) {
    const { res } = await aufrufen(w, kaputt, nav('/'));
    assert.equal(res.status, 200);
    if (kaputt.DB && kaputt.DB.tables) assert.equal(kaputt.DB.tables.besuche.size, 0);
  }
  // Andere Hosts als ciphro.eu bleiben beim Zähler (www wird von GitHub umgeleitet, nicht vom Worker)
  const calls = origin();
  assert.equal((await w.fetch(new Request('https://zaehler.ciphro.eu/irgendwas'), environment(), kontext())).status, 404);
  assert.deepEqual(calls, []);
});

test('Merkmale mit Einwilligung: Spieltage, Serie und Lösungszeit nur als feste Gruppen', async () => {
  const w = (await load()).default, env = environment();
  assert.equal((await w.fetch(post({ e: 'tage', l: 'de', w: '2-3' }), env)).status, 204);
  assert.equal((await w.fetch(post({ e: 'tage', l: 'de', w: '2-3', m: '', a: 0 }), env)).status, 204);
  assert.equal((await w.fetch(post({ e: 'serie', l: 'en', w: '8+' }), env)).status, 204);
  assert.equal((await w.fetch(post({ e: 'dauer', l: 'fr', m: 'hard', w: '1-3' }), env)).status, 204);
  assert.equal((await w.fetch(post({ e: 'dauer', l: 'it', m: 'easy', w: '<1' }), env)).status, 204);
  for (const falsch of [
    { e: 'tage', l: 'de', w: '5' }, { e: 'tage', l: 'de' }, { e: 'tage', l: 'de', w: '1', m: 'easy' }, { e: 'tage', l: 'de', w: '1', a: 1 },
    { e: 'serie', l: 'de', w: 'viele' }, { e: 'dauer', l: 'de', w: '1-3' }, { e: 'dauer', l: 'de', m: 'easy', w: '61' },
    { e: 'aufruf', l: 'de', w: '1' }, { e: 'start', l: 'de', m: 'easy', w: '<1' }, { e: 'tage', l: 'es', w: '1' },
    { e: 'constructor', l: 'de', w: '1' }, { e: 'tage', l: 'de', w: '1', id: 'x' }
  ]) assert.equal((await w.fetch(post(falsch), env)).status, 400, JSON.stringify(falsch));
  assert.deepEqual([...env.DB.tables.merkmale].map(([k, n]) => [k.split('|').slice(1).join('|'), n]).sort(), [
    ['dauer|fr|hard|1-3', 1], ['dauer|it|easy|<1', 1], ['serie|en||8+', 1], ['tage|de||2-3', 2]
  ]);
  assert.equal(env.DB.tables.zaehler.size, 0);
});

test('Statistik: Seitenaufrufe, Herkunft, Wiederkommen und Dauer; http leitet vor der Anmeldung auf https um', async () => {
  const w = (await load()).default, env = environment();
  for (const [req, n] of [[nav('/', 'https://www.reddit.com/'), 3], [nav('/de/'), 2], [nav('/en/', 'https://ciphro.eu/de/'), 1]])
    for (let i = 0; i < n; i++) await aufrufen(w, env, req);
  for (const d of [{ e: 'spieler', l: 'de' }, { e: 'tage', l: 'de', w: '1' }, { e: 'tage', l: 'de', w: '4-7' }, { e: 'tage', l: 'en', w: '15+' },
    { e: 'serie', l: 'de', w: '0' }, { e: 'serie', l: 'de', w: '2-3' }, { e: 'serie', l: 'en', w: '8+' }, { e: 'dauer', l: 'de', m: 'easy', w: '1-3' }])
    await w.fetch(post(d), env);
  const auth = { authorization: 'Basic ' + Buffer.from('egal:' + SECRET).toString('base64') };
  const html = await (await w.fetch(new Request('https://zaehler.ciphro.eu/statistik', { headers: auth }), env)).text();
  const zeile = name => { const m = new RegExp(`<tr><td>${name}</td>(.*?)</tr>`).exec(html); return m ? [...m[1].matchAll(/<td>(.*?)<\/td>/g)].map(x => x[1]) : null; };
  assert.match(html, /<b>6<\/b>Seitenaufrufe, letzte 7 Tage/);
  assert.match(html, /<b>67 %<\/b>davon schon an mehreren Tagen gespielt/);
  assert.match(html, /<b>67 %<\/b>mit Serie von 2 Tagen oder mehr/);
  assert.deepEqual(zeile('Reddit'), ['3', '3']);
  assert.deepEqual(zeile('Direkt \\(Lesezeichen, App, WhatsApp, eingetippt\\)'), ['2', '2']);
  assert.deepEqual(zeile('Innerhalb von ciphro.eu'), ['1', '1']);
  assert.deepEqual(zeile('easy'), ['0', '1', '0', '0']);
  const tag = /<tr><td>(\d{4}-\d\d-\d\d)<\/td><td>6<\/td><td>5<\/td><td>3<\/td><td>2<\/td><td>1<\/td><td>0<\/td><td>0<\/td><\/tr>/.exec(html);
  assert.ok(tag, 'Tageszeile Seitenaufrufe: 6 gesamt, 5 von außen, 3 Start, 2 DE, 1 EN');
  assert.match(html, /<td>3<\/td><td>1<\/td><td>0<\/td><td>1<\/td><td>0<\/td><td>1<\/td><td>67 %<\/td><td>1<\/td><td>0<\/td><td>1<\/td><td>0<\/td><td>1<\/td>/, 'Wiederkommen-Zeile');
  assert.doesNotMatch(html, /<script/i);
  const csv = async t => (await w.fetch(new Request('https://zaehler.ciphro.eu/statistik?format=csv&tabelle=' + t, { headers: auth }), env)).text();
  assert.match(await csv('besuche'), /^datum,seite,herkunft,anzahl\n\d{4}-\d\d-\d\d,start,reddit,3\n/);
  assert.match(await csv('merkmale'), /^datum,art,sprache,stufe,wert,anzahl\n/);
  // http: zuerst auf https, damit das Passwort nie unverschlüsselt geschickt wird
  for (const pfad of ['/statistik', '/statistik?format=csv', '/z']) {
    const r = await w.fetch(new Request('http://zaehler.ciphro.eu' + pfad, { headers: auth }), env);
    assert.equal(r.status, 301);
    assert.equal(r.headers.get('location'), 'https://zaehler.ciphro.eu' + pfad);
  }
  const ok = await w.fetch(new Request('https://zaehler.ciphro.eu/statistik', { headers: auth }), env);
  assert.equal(ok.headers.get('strict-transport-security'), 'max-age=31536000');
});

test('Deployment: Route vor ciphro.eu mit Hinweis auf „Fail open“; Tabellen im Worker und in schema.sql gleich', t => {
  const cfg = fs.readFileSync(path.join(DIR, 'wrangler.toml'), 'utf8');
  assert.match(cfg, /\{ pattern = "ciphro\.eu\/\*", zone_name = "ciphro\.eu" \}/);
  assert.match(cfg, /Fail open/);
  assert.match(cfg, /\{ pattern = "zaehler\.ciphro\.eu", custom_domain = true \}/);
  const worker = fs.readFileSync(path.join(DIR, 'worker.js'), 'utf8');
  const schema = fs.readFileSync(path.join(DIR, 'schema.sql'), 'utf8');
  const norm = x => x.replace(/\s+/g, ' ').trim();
  for (const name of ['besuche', 'merkmale']) {
    const ausWorker = new RegExp('`(CREATE TABLE IF NOT EXISTS ' + name + ' \\([\\s\\S]*?\\))`').exec(worker)[1];
    const ausSchema = new RegExp('(CREATE TABLE IF NOT EXISTS ' + name + ' \\([\\s\\S]*?\\));').exec(schema)[1];
    assert.equal(norm(ausWorker), norm(ausSchema), name);
  }
  assert.ok(!worker.includes('cf-connecting-ip') && !/x-forwarded-for/i.test(worker), 'keine IP-Adressen');
  let sqlite;
  try { sqlite = require('node:sqlite'); } catch (e) { t.skip('node:sqlite fehlt'); return; }
  const db = new sqlite.DatabaseSync(':memory:');
  db.exec(schema);
  const inserts = [...worker.matchAll(/'(INSERT INTO \w+[^']*)' \+\s*'([^']*)'/g)].map(m => m[1] + m[2]);
  assert.equal(inserts.length, 3);
  const st = Object.fromEntries(inserts.map(sql => [/INTO (\w+)/.exec(sql)[1], db.prepare(sql)]));
  st.besuche.run('2026-11-22', 'start', 'reddit'); st.besuche.run('2026-11-22', 'start', 'reddit');
  st.merkmale.run('2026-11-22', 'tage', 'de', '', '2-3'); st.merkmale.run('2026-11-22', 'dauer', 'de', 'hard', '1-3');
  assert.deepEqual(db.prepare('SELECT seite, herkunft, anzahl FROM besuche').all().map(r => ({ ...r })), [{ seite: 'start', herkunft: 'reddit', anzahl: 2 }]);
  assert.equal(db.prepare('SELECT count(*) AS n FROM merkmale').get().n, 2);
  assert.throws(() => st.merkmale.run('2026-11-22', 'ip', 'de', '', 'x'), /CHECK/);
});

test('Spiel: meldet nur mit Zustimmung, nur auf ciphro.eu und nie bei Global Privacy Control', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');
  assert.match(html, /const ZAEHLER = 'https:\/\/zaehler\.ciphro\.eu\/z';/);
  assert.match(html, /if \(store\.count !== true \|\| !countPossible\(\)\) return;/);
  assert.match(html, /const countPossible = \(\) => \{ try \{ return \/\(\^\|\\\.\)ciphro\\\.eu\$\/\.test\(location\.hostname\) && !gpcOn\(\)/);
  ['aufruf', 'spieler', 'start', 'geloest', 'geteilt'].forEach(e => assert.match(html, new RegExp(`countEvent\\('${e}'`)));
});
