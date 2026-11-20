/* Retorno · service worker: la app abre sin conexión. Sube VERSION al publicar cambios.
   Las búsquedas a TIMOCOM (servidor puente) nunca se guardan en cache. */
const VERSION = 'retorno-v0.1.0';
const FILES = ['./', 'index.html', 'css/styles.css', 'js/config.js', 'js/geo.js', 'js/ranking.js', 'js/sources/mock.js',
  'js/sources/timocom.js', 'js/store.js', 'js/native.js', 'js/app.js', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return; // solo los archivos de la app
  e.respondWith(
    fetch(e.request).then(r => {
      const copy = r.clone();
      caches.open(VERSION).then(c => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});
