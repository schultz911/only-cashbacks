self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Basic pass-through fetch handler for PWA installation requirements
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
