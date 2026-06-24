/* Paper Trader dashboard — minimal, robust service worker.
 *
 * Strategy:
 *   - SHELL (html, manifest, icons, Chart.js CDN): cache-first, refreshed in the
 *     background so the app opens instantly and survives offline.
 *   - DATA (*.json, *.csv): network-first, falling back to the last cached copy,
 *     so the numbers are always as fresh as the network allows but still render
 *     offline. Read-only: the SW never writes anything anywhere.
 * If anything here throws, the page still works — registration failure in the
 * page is caught and ignored.
 */
"use strict";

const VERSION = "pt-dash-v2";
const SHELL_CACHE = VERSION + "-shell";
const DATA_CACHE = VERSION + "-data";

// Relative to the SW scope (paper-trader/), so it works under the Pages subpath.
const SHELL_ASSETS = [
  "./dashboard.html",
  "./strategy.html",
  "./app.js",
  "./style.css",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon.svg",
  "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((c) => c.addAll(SHELL_ASSETS))
      .catch(() => {})          // a CDN hiccup must not break install
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

function isData(url) {
  return /\.(json|csv)(\?|$)/.test(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // DATA: network-first, fall back to cache.
  if (isData(url)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(DATA_CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // SHELL: cache-first, update in the background.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
