'use strict';
/* Service worker di A margine.
   - Guscio dell'app (HTML, CSS, moduli JS, icone): prima la rete, così un file cambiato arriva subito; la copia salvata serve solo se la rete manca o è lenta.
   - Versione automatica: il nome della cache deriva dall'hash del contenuto di questo stesso file (cambia sw.js → nuova versione, vecchie cache cancellate).
   - Le richieste verso script.google.com (POST dell'API) e ogni altra origine non passano da qui, tranne i font di Google (cache per lavorare offline). */
const WAIT = 4000;
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
let versionPromise;
function version() {
  return versionPromise || (versionPromise = (async () => {
    try {
      const res = await fetch(self.location.href, {cache: 'no-store'});
      const buf = await crypto.subtle.digest('SHA-1', await res.arrayBuffer());
      return 'margine-' + [...new Uint8Array(buf)].slice(0, 6).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch { return 'margine-v1'; }
  })());
}
const FONT_CACHE = 'margine-fonts';
/* File che la pagina carica solo al bisogno (feature, fogli di stile e dati): salvati a riposo, dopo il caricamento, perché l'app funzioni offline anche per Mondo, Ascolta, Memoria ecc. */
const LAZY = ['css/f-ascolta.css', 'css/f-introduzioni.css', 'css/f-memoria.css', 'css/f-mondo.css', 'css/f-progressi.css',
  'js/features/mondo-geo.js', 'js/features/mondo-mappa.js',
  'data/books.json', 'data/measures.json', 'data/people.json', 'data/places.json'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(await version());
    await Promise.allSettled(['./', 'index.html', 'manifest.webmanifest', 'icons/icon.svg'].map(u => cache.add(new Request(u, {cache: 'reload'}))));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keep = [await version(), FONT_CACHE];
    for (const k of await caches.keys()) if (!keep.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});
/* La pagina elenca i file che ha caricato: così il guscio è completo offline fin dalla prima visita */
self.addEventListener('message', e => {
  if (!e.data || e.data.type !== 'precache' || !Array.isArray(e.data.urls)) return;
  e.waitUntil((async () => {
    const cache = await caches.open(await version());
    const lazy = LAZY.map(u => new URL(u, self.registration.scope).href);
    await Promise.allSettled([...new Set([...e.data.urls, ...lazy])].filter(u => { try { return new URL(u).origin === location.origin; } catch { return false; } }).map(u => cache.add(new Request(u, {cache: 'reload'}))));
  })());
});
function fromNetwork(req) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(Error('timeout')), WAIT);
    fetch(req, {cache: 'no-cache'}).then(res => { clearTimeout(t); resolve(res); }, err => { clearTimeout(t); reject(err); });
  });
}
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith((async () => {
      const cache = await caches.open(FONT_CACHE), hit = await cache.match(req);
      const net = fetch(req).then(res => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; }).catch(() => null);
      return hit || (await net) || Response.error();
    })());
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(await version()), key = new Request(url.origin + url.pathname + (url.pathname.endsWith('/') ? '' : ''));
    const hit = await cache.match(key, {ignoreSearch: true});
    try {
      const res = await fromNetwork(req);
      if (res.ok) { e.waitUntil(cache.put(key, res.clone())); return res; }
      return hit && res.status >= 500 ? hit : res;
    } catch (err) {
      if (hit) return hit;
      if (req.mode === 'navigate') { const idx = await cache.match(new Request(new URL('index.html', self.registration.scope).href)); if (idx) return idx; }
      throw err;
    }
  })());
});
