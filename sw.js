/* Service worker de Recomp 45.
   - Al instalarse guarda la app y sus iconos: funciona sin conexión desde la primera vez.
   - La app: primero la red (para ver siempre lo último); sin conexión, la copia guardada.
   - Librerías y fuentes de CDN (direcciones con versión fija): primero la caché. */
const CACHE = 'recomp-v-1.8.0', LIBS = 'recomp-libs';
const CORE = ['./', './index.html', './fb.js', './firebase-config.js', './manifest.webmanifest', './version.json',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];
const FBJ = 'https://www.gstatic.com/firebasejs/10.12.2/';
const CDN = [FBJ + 'firebase-app.js', FBJ + 'firebase-auth.js', FBJ + 'firebase-firestore.js'];
const CDN_HOSTS = ['www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'cdnjs.cloudflare.com'];

self.addEventListener('install', e => e.waitUntil((async () => {
  const c = await caches.open(CACHE);
  await Promise.allSettled(CORE.map(u => c.add(new Request(u, { cache: 'reload' }))));
})()));
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith('recomp-') && k !== CACHE && k !== LIBS) await caches.delete(k);
  await self.clients.claim();
  caches.open(LIBS).then(l => Promise.allSettled(CDN.map(async u => { if (!(await l.match(u))) await l.add(u); })));
})()));
self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (CDN_HOSTS.includes(url.hostname)) {
    e.respondWith((async () => {
      const l = await caches.open(LIBS), hit = await l.match(req);
      if (hit) return hit;
      try { const r = await fetch(req); if (r.ok || r.type === 'opaque') l.put(req, r.clone()); return r; } catch { return Response.error(); }
    })());
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try { const r = await fetch(req, { cache: 'no-cache' }); if (r.ok) c.put(req, r.clone()); return r; }
    catch { return (await c.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? (await c.match('./index.html')) || (await c.match('./')) : Response.error()); }
  })());
});
