// Service worker: la web se abre al instante y funciona sin conexión (los datos en vivo siguen por Firebase).
const CACHE = 'amueblar-v2';
const BASE = ['./', 'index.html', 'muebles.js', 'texturas.js', 'redondeado.js', 'ply.js', 'sincro.js', 'catalogo_ikea.js', 'catalogo_cuadros.js', 'catalogo_plantas.js', 'catalogo_textil.js', 'fotos_cuadros.js', 'fotos_alfombras.js', 'modelos.js', 'demo.json', 'manifest.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url); if (e.request.method !== 'GET') return;
  const propio = u.origin === location.origin, libreria = /cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|gstatic\.com\/firebasejs/.test(u.href);
  if (!propio && !libreria) return;
  // Primero la red (para estar siempre al día) y, si no hay conexión, la copia guardada
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); } return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
