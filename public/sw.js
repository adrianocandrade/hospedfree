const CACHE_PREFIX = 'meulinkbio-public-assets';
const CACHE_VERSION = 'v1';
const CACHE_NAME = `${CACHE_PREFIX}-${CACHE_VERSION}`;

const publicAssetPath = /\/(?:build|images|favicon)\//;
const cacheableDestinations = new Set(['font', 'image', 'script', 'style']);

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map(key => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    !cacheableDestinations.has(request.destination) ||
    !publicAssetPath.test(url.pathname)
  ) {
    return;
  }

  event.respondWith(cacheFirstPublicAsset(request));
});

async function cacheFirstPublicAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  const cacheControl = response.headers.get('Cache-Control') || '';

  if (
    response.ok &&
    response.type === 'basic' &&
    !/\b(?:private|no-store)\b/i.test(cacheControl)
  ) {
    await cache.put(request, response.clone());
  }

  return response;
}
