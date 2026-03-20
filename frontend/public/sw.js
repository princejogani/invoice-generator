self.addEventListener('install', (e) => {
    // Service worker installed
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    // Service worker activated
});

self.addEventListener('fetch', (e) => {
    // Passive pass-through for now, just to satisfy PWA requirements
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
