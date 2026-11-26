// Mon Coach – service worker : hors ligne + mise à jour automatique (v3 : cache sûr et propre)
var V = 'moncoach-v3';
var FILES = ['index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-180.png', 'anton.woff'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(V).then(function (c) { return c.addAll(FILES); })); self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); })); })
  .then(function () { return caches.open(V).then(function (c) { return c.keys().then(function (rs) { return Promise.all(rs.filter(function (r) { return new URL(r.url).search; }).map(function (r) { return c.delete(r); })); }); }); })
  .then(function () { return self.clients.claim(); })); });
function goodApp(t) { return t.indexOf("APPVER = '") > -1 && /<\/html>\s*$/.test(t); }
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var u = new URL(e.request.url), root = new URL(self.registration.scope).pathname;
  if (u.origin !== location.origin) return;
  if (u.search || e.request.cache === 'no-store') return; // vérifications de mise à jour : jamais en cache
  if (e.request.mode === 'navigate') {
    if (u.pathname !== root && u.pathname !== root + 'index.html') return;
    e.respondWith(fetch(e.request, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) return caches.match('index.html').then(function (h) { return h || r; });
      return r.clone().text().then(function (t) { if (goodApp(t)) { var cp = new Response(t, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }); caches.open(V).then(function (c) { c.put('index.html', cp); }); return r; } return caches.match('index.html').then(function (h) { return h || r; }); });
    }).catch(function () { return caches.match('index.html'); }));
    return;
  }
  var name = u.pathname.slice(root.length);
  if (FILES.indexOf(name) < 0) return;
  e.respondWith(caches.match(name).then(function (hit) { var net = fetch(e.request).then(function (r) { if (r && r.ok) { var cp = r.clone(); caches.open(V).then(function (c) { c.put(name, cp); }); } return r; }).catch(function () { return hit; }); return hit || net; }));
});
