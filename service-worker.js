
const CACHE_NAME = 'martabak-ku-v16';

const APP_FILES = [
  './',
  './index.html',
  './install.html',
  './style.css',
  './app.js',
  './beranda.js',
  './penjualan.js',
  './keuangan.js',
  './laporan.js',
  './pengaturan.js',
  './manifest.json',
  './version.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(APP_FILES)
    )
  );
  // Tidak memanggil skipWaiting di sini.
  // Worker menunggu persetujuan pengguna.
});

self.addEventListener('activate', event => {
  event.waitUntil(
    self.clients.claim().then(() => {
      return caches.keys().then(keys => {
        return Promise.all(
          keys
            .filter(key =>
              key.startsWith('martabak-ku-') &&
              key !== CACHE_NAME
            )
            .map(key => caches.delete(key))
        );
      });
    })
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith('/version.json')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(event.request);

      if (cached) return cached;

      try {
        const response = await fetch(event.request);

        if (response.ok) {
          await cache.put(event.request, response.clone());
        }

        return response;
      } catch (error) {
        return new Response(
          'Kamu sedang offline dan file belum tersedia.',
          {
            status: 503,
            headers: {
              'Content-Type': 'text/plain; charset=utf-8'
            }
          }
        );
      }
    })
  );
});

