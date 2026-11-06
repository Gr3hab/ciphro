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

// Nachbildung von D1: merkt sich nur Summen, so wie die Tabelle zaehler
function fakeDB() {
  const rows = new Map();
  return {
    rows,
    prepare(sql) {
      const all = async () => ({ results: [...rows].map(([k, n]) => { const [datum, ereignis, sprache, stufe, archiv] = k.split('|'); return { datum, ereignis, sprache, stufe, archiv: +archiv, anzahl: n }; }) });
      return {
        bind: (...v) => ({ run: async () => { assert.match(sql, /^INSERT INTO zaehler/); const k = v.join('|'); rows.set(k, (rows.get(k) || 0) + 1); }, all }),
        all
      };
    }
  };
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

test('Spiel: meldet nur mit Zustimmung, nur auf ciphro.eu und nie bei Global Privacy Control', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');
  assert.match(html, /const ZAEHLER = 'https:\/\/zaehler\.ciphro\.eu\/z';/);
  assert.match(html, /if \(store\.count !== true \|\| !countPossible\(\)\) return;/);
  assert.match(html, /const countPossible = \(\) => \{ try \{ return \/\(\^\|\\\.\)ciphro\\\.eu\$\/\.test\(location\.hostname\) && !gpcOn\(\)/);
  ['aufruf', 'spieler', 'start', 'geloest', 'geteilt'].forEach(e => assert.match(html, new RegExp(`countEvent\\('${e}'`)));
});
