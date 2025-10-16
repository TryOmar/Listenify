// Listenify Service Worker - Edge Compatible
// Minimal service worker for PWA functionality

const CACHE_NAME = 'listenify-v3';

// Install event - minimal caching
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - minimal implementation
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // For navigation requests, always go to network
  if (event.request.mode === 'navigate') {
    return;
  }

  // For other requests, try cache first, then network
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      
      return fetch(event.request).catch(() => {
        // If fetch fails, return a basic response
        return new Response('Offline', { 
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      });
    })
  );
});
