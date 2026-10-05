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
    '/logo.png',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    // Only cache GET requests
    if (e.request.method !== 'GET') return;
    
    // Don't cache API calls if we want fresh data, but fallback if offline
    if (e.request.url.includes('/api/')) {
        e.respondWith(
            fetch(e.request).catch(() => caches.match(e.request))
        );
        return;
    }

    // Cache-first strategy for static assets
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request).then(fetchRes => {
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(e.request, fetchRes.clone());
                    return fetchRes;
                });
            });
        })
    );
});
