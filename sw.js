const CACHE_NAME = 'journey-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.json'
];

let isDevelopment = false;
let updateCheckInterval = null;

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_MODE') {
    isDevelopment = event.data.isDevelopment;
    if (!isDevelopment && !updateCheckInterval) {
      // Start hourly update checks in production
      startUpdateCheck();
    } else if (isDevelopment && updateCheckInterval) {
      // Stop update checks in development
      clearInterval(updateCheckInterval);
      updateCheckInterval = null;
    }
  } else if (event.data && event.data.type === 'CHECK_FOR_UPDATES') {
    // Manual update check trigger
    checkForUpdates();
  } else if (event.data && event.data.type === 'SKIP_WAITING') {
    // User clicked to update
    self.skipWaiting();
  }
});

function startUpdateCheck() {
  // Check for updates every hour (3600000 ms)
  updateCheckInterval = setInterval(() => {
    checkForUpdates();
  }, 3600000);
}

async function checkForUpdates() {
  try {
    const registration = await self.registration;
    if (!registration) return;

    // Check if there's a new service worker waiting
    if (registration.waiting) {
      // Notify the client about the update
      const clients = await self.clients.matchAll({
        type: 'window'
      });
      clients.forEach(client => {
        client.postMessage({
          type: 'UPDATE_AVAILABLE'
        });
      });
    }
  } catch (error) {
    console.error('Error checking for updates:', error);
  }
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  if (!isDevelopment) {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
    );
  }
  // Don't skip waiting in production - wait for user to confirm
  if (isDevelopment) {
    self.skipWaiting();
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // In development, delete all caches immediately
          if (isDevelopment) {
            return caches.delete(cacheName);
          }
          // In production, only delete old caches
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - different strategies for dev vs prod
self.addEventListener('fetch', (event) => {
  if (isDevelopment) {
    // Development: Network first, fallback to cache
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Update cache with fresh response
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(event.request);
        })
    );
  } else {
    // Production: Cache first, fallback to network (standard offline-first)
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(event.request).then((response) => {
          // Don't cache if not successful
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Add to cache
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
    );
  }
});
