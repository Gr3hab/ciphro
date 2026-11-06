/* Tests für den anonymen Zähler (_dev/zaehler/worker.js) ohne Cloudflare: D1 wird nachgebildet. Aufruf: npm test */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'zaehler');
const load = () => import('data:text/javascript,' + encodeURIComponent(fs.readFileSync(path.join(DIR, 'worker.js'), 'utf8')));

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
  const w = (await load()).default, env = { DB: fakeDB(), STATISTIK_SCHLUESSEL: 'geheim-123' };
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
  assert.equal((await w.fetch(post('{kaputt'), env)).status, 400);
  assert.equal((await w.fetch(post('x'.repeat(500)), env)).status, 413);
  assert.equal((await w.fetch(new Request('https://zaehler.ciphro.eu/z'), env)).status, 405);
  // gespeichert: nur Tag, Ereignis, Sprache, Stufe, Archiv und die Anzahl (keine IP, keine Kennung)
  const keys = [...env.DB.rows.keys()].map(k => k.split('|').slice(1).join('|'));
  assert.deepEqual(keys.sort(), ['aufruf|de||0', 'geloest|it|hard|0', 'start|fr|easy|0']);
  assert.equal([...env.DB.rows.values()].reduce((a, b) => a + b, 0), 4);
  [...env.DB.rows.keys()].forEach(k => assert.match(k.split('|')[0], /^\d{4}-\d\d-\d\d$/));
});

test('Zähler: Statistik nur mit dem geheimen Schlüssel', async () => {
  const w = (await load()).default, env = { DB: fakeDB(), STATISTIK_SCHLUESSEL: 'geheim-123' };
  await w.fetch(post({ e: 'spieler', l: 'de', m: '' }), env);
  assert.equal((await w.fetch(new Request('https://zaehler.ciphro.eu/statistik'), env)).status, 403);
  assert.equal((await w.fetch(new Request('https://zaehler.ciphro.eu/statistik?schluessel=falsch-12'), env)).status, 403);
  assert.equal((await w.fetch(new Request('https://zaehler.ciphro.eu/statistik?schluessel='), { DB: env.DB })).status, 403, 'ohne eingerichteten Schlüssel nie offen');
  const ok = await w.fetch(new Request('https://zaehler.ciphro.eu/statistik?schluessel=geheim-123'), env);
  assert.equal(ok.status, 200);
  assert.match(await ok.text(), /<td>1<\/td>/);
  const csv = await w.fetch(new Request('https://zaehler.ciphro.eu/statistik?schluessel=geheim-123&format=csv'), env);
  assert.match(await csv.text(), /^datum,ereignis,sprache,stufe,archiv,anzahl\n\d{4}-\d\d-\d\d,spieler,de,,0,1\n$/);
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

test('Spiel: meldet nur auf ciphro.eu, nie lokal, und respektiert Schalter und Global Privacy Control', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');
  assert.match(html, /const ZAEHLER = 'https:\/\/zaehler\.ciphro\.eu\/z';/);
  assert.match(html, /if \(!\/\(\^\|\\\.\)ciphro\\\.eu\$\/\.test\(location\.hostname\) \|\| store\.count === false \|\| gpcOn\(\)/);
  ['aufruf', 'spieler', 'start', 'geloest', 'geteilt'].forEach(e => assert.match(html, new RegExp(`countEvent\\('${e}'`)));
});
