const CACHE_NAME = 'aporte-anual-v5';
const ASSETS = [
  '/',
  '/login.html',
  '/index.html',
  '/estado_pagos.html',
  '/caja_informe.html',
  '/importar_excel.html',
  '/estudiantes.html',
  '/css/style.css',
  '/js/auth.js',
  '/js/login.js',
  '/js/app.js',
  '/js/estudiantes.js',
  '/js/db.js',
  '/images/logo.png',
  '/instalar/pwa.js'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS.map(url => new Request(url, { cache: 'reload' })));
    }).catch(err => console.warn('[SW] Error cacheando assets:', err))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[SW] Borrando caché viejo:', key);
          return caches.delete(key);
        }
      }));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  // Para llamadas API: network-first, con fallback a caché
  if (e.request.url.includes('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Para assets estáticos: cache-first
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});