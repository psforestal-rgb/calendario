const APP_VERSION = '2026.02.28.1';
const CACHE_NAME = 'calendario-sinac-v5';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// CDN resources to pre-cache for offline use and to reduce tracking prevention warnings
const CDN_ASSETS = [
  'https://unpkg.com/@babel/standalone@7.23.5/babel.min.js',
  'https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js'
];

// CDN domains to cache (cache-first strategy)
const CDN_DOMAINS = [
  'unpkg.com',
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'esm.sh'
];

// Domains to never cache (real-time services)
const NO_CACHE_DOMAINS = [
  'googleapis.com',
  'firebase',
  'gstatic.com',
  'firebaseio.com'
];

function isCDN(url) {
  return CDN_DOMAINS.some(domain => url.includes(domain));
}

function isNoCache(url) {
  return NO_CACHE_DOMAINS.some(domain => url.includes(domain));
}

// Network fetch with timeout - falls back to cache if network is too slow
function fetchWithTimeout(request, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), timeout);
    fetch(request).then(response => {
      clearTimeout(timer);
      resolve(response);
    }).catch(err => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache local assets first
      return cache.addAll(ASSETS_TO_CACHE).then(() => {
        // Try to pre-cache CDN assets (don't fail install if CDN is unavailable)
        return Promise.allSettled(
          CDN_ASSETS.map(url =>
            fetch(url, { mode: 'cors' })
              .then(response => {
                if (response.ok) {
                  return cache.put(url, response);
                }
              })
              .catch(() => {})
          )
        );
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Respond to version checks from the app
self.addEventListener('message', event => {
  if (event.data === 'GET_VERSION') {
    event.ports[0].postMessage({ version: APP_VERSION });
  }
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Skip non-GET requests entirely (POST, PUT, etc. should go to network)
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip Firebase/Google API requests - they need real-time access
  if (isNoCache(url)) {
    return;
  }

  // Skip chrome-extension and other non-http(s) schemes
  if (!url.startsWith('http')) {
    return;
  }

  // CDN resources: cache-first strategy (serve from cache, update in background)
  if (isCDN(url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cached => {
          if (cached) {
            // Serve from cache immediately, update cache in background
            fetch(event.request, { mode: 'cors' })
              .then(response => {
                if (response && response.ok) {
                  cache.put(event.request, response);
                }
              })
              .catch(() => {});
            return cached;
          }
          // Not in cache: fetch, cache, and return
          return fetch(event.request, { mode: 'cors' }).then(response => {
            if (response && response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          }).catch(() => {
            // Return a basic offline response for CDN failures
            return new Response('', { status: 503, statusText: 'Offline' });
          });
        });
      })
    );
    return;
  }

  // Local assets: network-first strategy with 3s timeout
  event.respondWith(
    fetchWithTimeout(event.request, 3000)
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(cached => {
          // Always return a Response - never undefined
          return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
