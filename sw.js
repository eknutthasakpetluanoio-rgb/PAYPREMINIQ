// PAYPREMINIQ — Service Worker
// build.json is the single source of truth for the build/cache version.
// This worker never touches LocalStorage, IndexedDB, Firebase, or user data.

const CACHE_PREFIX = "paypreminiq-pwa-v20-";
const FALLBACK_CACHE = "paypreminiq-pwa-runtime";
let ACTIVE_CACHE_NAME = FALLBACK_CACHE;

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

async function readBuildName() {
  try {
    const response = await fetch("./build.json", {
      cache: "no-store",
      credentials: "same-origin"
    });
    if (!response.ok) throw new Error("build.json HTTP " + response.status);
    const info = await response.json();
    const build = String(info?.build || "").trim();
    if (!build) throw new Error("empty build");
    const safe = build.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
    return CACHE_PREFIX + (safe || "unknown");
  } catch (_) {
    return FALLBACK_CACHE;
  }
}

async function setActiveCacheName() {
  ACTIVE_CACHE_NAME = await readBuildName();
  return ACTIVE_CACHE_NAME;
}

self.addEventListener("install", event => {
  event.waitUntil(
    setActiveCacheName()
      .then(cacheName =>
        caches.open(cacheName)
          .then(cache => cache.addAll(APP_SHELL))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    setActiveCacheName()
      .then(current => caches.keys().then(keys =>
        Promise.all(
          keys
            .filter(key => key.startsWith(CACHE_PREFIX) && key !== current)
            .map(key => caches.delete(key))
        )
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigation: always revalidate against the live GitHub Pages response.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(ACTIVE_CACHE_NAME)
              .then(cache => cache.put("./index.html", copy))
              .catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // App assets: network-first so changed files are picked up without
  // clearing browser/site data.
  const isAppAsset = /\.(?:css|js|json|png|jpg|jpeg|webp|svg|ico|woff2?)$/i.test(url.pathname);

  if (isAppAsset) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            // build.json is fetched with no-store and must have one stable
            // cache key; otherwise timestamp/query variants accumulate.
            const cacheRequest = url.pathname.endsWith("/build.json")
              ? new Request(new URL("./build.json", self.location.origin), { method: "GET" })
              : request;
            caches.open(ACTIVE_CACHE_NAME)
              .then(cache => cache.put(cacheRequest, copy))
              .catch(() => {});
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then(cached => {
            if (cached) return cached;
            if (url.pathname.endsWith("/build.json")) return caches.match("./build.json");
            return caches.match("./index.html");
          })
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(cached => cached || fetch(request))
      .catch(() => caches.match("./index.html"))
  );
});
