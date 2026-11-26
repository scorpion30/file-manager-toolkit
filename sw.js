/* Offline support. Keeps the pages, styles, scripts and the PDF / OCR libraries a visitor has
 * used, so the tools open and work without internet the next time.
 * - Pages: network first (always the newest page when online), the kept copy when offline.
 * - Everything else (versioned assets, CDN libraries, fonts, OCR language files): the kept copy
 *   first, fetched and kept on first use.
 * Only GET requests are handled; the feedback / usage beacons go straight to the network. */
const CACHE = 'fmt-v1';
const CDN = /^https:\/\/(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|tessdata\.projectnaptha\.com|unpkg\.com)\//;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    throw err;
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')) e.respondWith(networkFirst(req));
    else if (url.pathname.includes('/assets/')) e.respondWith(url.search ? cacheFirst(req) : networkFirst(req));
    return;
  }
  if (CDN.test(req.url)) e.respondWith(cacheFirst(req));
});
