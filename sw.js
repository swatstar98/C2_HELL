/* Service worker: la app funciona sin conexión tras la primera visita (PWA). Sube VER al publicar una versión nueva. */
const VER = 'c2hell-1.0.0';
const FILES = ['./', 'index.html', 'style.css', 'game.js', 'i18n.js', 'config.js', 'maps.js', 'maps2.js', 'manifest.webmanifest',
  'lang/es.js', 'lang/en.js', 'lang/fr.js', 'lang/de.js', 'lang/pt.js', 'assets/fonts/ntds_icons.woff2', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VER).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(hit => {
    const net = fetch(r).then(res => { if (res && res.ok) { const cp = res.clone(); caches.open(VER).then(c => c.put(r, cp)); } return res; }).catch(() => hit);
    return hit || net;
  }));
});
