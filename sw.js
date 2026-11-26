// Mon Coach – service worker : hors ligne + mise à jour automatique
var V = 'moncoach-v2';
self.addEventListener('install', function (e) { e.waitUntil(caches.open(V).then(function (c) { return c.addAll(['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-180.png', 'anton.woff']); })); self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var nav = e.request.mode === 'navigate';
  if (nav) { // réseau d'abord : la nouvelle version arrive dès qu'il y a du réseau
    e.respondWith(fetch(e.request, { cache: 'no-store' }).then(function (r) { var cp = r.clone(); caches.open(V).then(function (c) { c.put('index.html', cp); }); return r; }).catch(function () { return caches.match('index.html'); }));
    return;
  }
  e.respondWith(caches.match(e.request).then(function (hit) { var net = fetch(e.request).then(function (r) { if (r && (r.ok || r.type === 'opaque')) { var cp = r.clone(); caches.open(V).then(function (c) { c.put(e.request, cp); }); } return r; }).catch(function () { return hit; }); return hit || net; }));
});
