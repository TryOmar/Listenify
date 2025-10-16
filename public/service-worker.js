// Listenify Service Worker
// Basic service worker for PWA functionality

const CACHE_NAME = 'listenify-v2';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/microphone.svg',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg'
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Use addAll with error handling
        return cache.addAll(urlsToCache).catch((error) => {
          console.log('Some resources failed to cache:', error);
          // Cache what we can, ignore failures
          return Promise.allSettled(
            urlsToCache.map(url => 
              cache.add(url).catch(err => {
                console.log(`Failed to cache ${url}:`, err);
                return null;
              })
            )
          );
        });
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        // For failed requests, don't cache them
        return fetch(event.request).catch((error) => {
          console.log('Fetch failed for:', event.request.url, error);
          // Return a basic response for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/') || new Response('Offline', { status: 200 });
          }
          throw error;
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
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
    })
  );
});
