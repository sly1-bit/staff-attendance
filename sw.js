const CACHE_NAME = 'attendance-kiosk-v1';
const PRECACHE_URLS = ['./', './index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Cache-first for the page itself and for the face-recognition library/model
// files pulled from CDNs, so after the first successful load nothing needs
// re-downloading — including after the device goes offline.
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  const isThisSite = url.startsWith(self.location.origin);
  const isModelOrLib = url.includes('cdn.jsdelivr.net') || url.includes('cdnjs.cloudflare.com');

  if (!isThisSite && !isModelOrLib) return; // let unrelated requests pass through normally

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      try {
        const response = await fetch(event.request);
        if (response && response.ok) {
          cache.put(event.request, response.clone());
        }
        return response;
      } catch (err) {
        if (cached) return cached;
        throw err;
      }
    })
  );
});
