// PAYPREMINIQ — Service Worker
// Cache strategy: Network-first for same-origin app files, cache fallback for offline.
// IMPORTANT: This service worker never touches LocalStorage, IndexedDB, Firebase, or user data.
const CACHE_NAME = "paypreminiq-pwa-v20-2026.08.23-cache-fix-03";

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./sw.js",
  "./build.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never intercept third-party Firebase/CDN requests.
  if (url.origin !== self.location.origin) return;

  // HTML/navigation: always try the live GitHub Pages response first.
  // This prevents stale index.html from masking a newly deployed version.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put("./index.html", copy))
              .catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // App assets: network-first so CSS/JS changes appear without manually
  // clearing browser/app data. Fall back to the current cache when offline.
  const isAppAsset = /\.(?:css|js|json|png|jpg|jpeg|webp|svg|ico|woff2?)$/i.test(url.pathname);

  if (isAppAsset) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, copy))
              .catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match("./index.html")))
    );
    return;
  }

  // Other same-origin GET requests: cache-first with network fallback.
  event.respondWith(
    caches.match(request)
      .then(cached => cached || fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, copy))
            .catch(() => {});
        }
        return response;
      }))
      .catch(() => caches.match("./index.html"))
  );
});
