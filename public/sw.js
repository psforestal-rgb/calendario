const APP_VERSION = '2026.03.01.1';
const CACHE_NAME = 'calendario-sinac-v6';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Domains to never cache (real-time services)
const NO_CACHE_DOMAINS = [
  'googleapis.com',
  'firebase',
  'gstatic.com',
  'firebaseio.com'
];

function isNoCache(url) {
  return NO_CACHE_DOMAINS.some(domain => url.includes(domain));
}

// Network fetch with timeout
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
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
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

self.addEventListener('message', event => {
  if (event.data === 'GET_VERSION') {
    event.ports[0].postMessage({ version: APP_VERSION });
  }
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  if (event.request.method !== 'GET') return;
  if (isNoCache(url)) return;
  if (!url.startsWith('http')) return;

  // Hashed assets (Vite output): cache-first (immutable content)
  if (url.includes('/assets/') && url.match(/\.[a-f0-9]{8}\./)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            if (response && response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }

  // Local assets: network-first with 3s timeout
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
          return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
