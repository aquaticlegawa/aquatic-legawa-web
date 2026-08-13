/* Service worker — menyimpan "app shell" sebagai cadangan offline, TAPI selalu
   mengutamakan versi terbaru dari internet dulu (network-first). Ini penting: kalau
   cache diprioritaskan (cache-first), pembaruan tampilan tidak akan pernah terlihat
   sampai cache lama dibersihkan manual — itu yang sempat terjadi sebelumnya. */

const CACHE_NAME = 'aquatic-legawa-shell-v3';
const SHELL_FILES = [
  './',
  './index.html',
  './css/style.css',
  './css/tailwind.min.css',
  './js/supabase-client.js',
  './js/auth.js',
  './js/app.js',
  './manifest.json',
  './assets/logo-icon.png',
  './assets/logo-horizontal-dark.png',
  './assets/logo-horizontal-white.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Jangan sentuh panggilan API Supabase sama sekali — data harus selalu live.
  if (url.hostname.includes('supabase.co')) return;
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        const copy = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
