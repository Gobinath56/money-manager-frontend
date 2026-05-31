/* ============================================================
   CoinWise Service Worker
   Strategy:
     - Static assets  → Cache First (app shell)
     - API calls      → Network Only  (never cache JWT data)
     - Navigation     → Network First with offline fallback
   ============================================================ */

const CACHE_NAME = "coinwise-v1";
const OFFLINE_URL = "/offline.html";

// App shell — files that make the UI work offline
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/logo192.png",
  "/logo512.png",
  "/offline.html",
];

// ── Install: precache app shell ──────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old caches ────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch: routing strategy ──────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Never cache API calls — JWT data must always be fresh
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request));
    return;
  }

  // 2. Never cache chrome-extension or non-http requests
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // 3. HTML navigation — Network First with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Update cache with fresh copy
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches
            .match("/index.html")
            .then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // 4. Static assets (JS, CSS, images) — Cache First
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }

  // 5. Everything else — Network First
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
