/* NUMIGMA – Offline-Hilfe.
   Immer zuerst das Netz fragen (so kommen neue Rätsel und Korrekturen sofort an).
   Nur wenn keine Verbindung da ist, wird die zuletzt geladene Fassung aus dem Zwischenspeicher genommen.
   Die Rätsel werden im Browser berechnet, deshalb funktioniert auch ein neuer Tag offline. */
const CACHE = 'numigma-v12';
const CORE = [
  './', 'index.html', 'kern.js?v=9', 'fakten.js?v=9', 'manifest.webmanifest', 'en/',
  'icon.png', 'icon-192.png',
  'fonts/atkinson-hyperlegible-latin-400-normal.woff2', 'fonts/atkinson-hyperlegible-latin-700-normal.woff2',
  'fonts/martian-mono-latin-500-normal.woff2', 'fonts/martian-mono-latin-700-normal.woff2', 'fonts/martian-mono-latin-800-normal.woff2'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()).catch(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('numigma-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(networkFirst(req));
});

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res && res.ok && res.type === 'basic') {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
    }
    return res;
  } catch (err) {
    const hit = await caches.match(req) || await caches.match(req, { ignoreSearch: true })
      || (req.mode === 'navigate' ? (await caches.match('./') || await caches.match('index.html')) : undefined);
    return hit || Response.error();
  }
}
