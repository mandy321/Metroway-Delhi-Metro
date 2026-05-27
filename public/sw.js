const CACHE_NAME = "metroway-static-v1";
const MAP_CACHE_NAME = "metroway-map-tiles-v1";

// Simple installer, cache is populated dynamically to support both development (Vite) and production builds
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== MAP_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // 1. Aggressive Caching for OpenStreetMap & CartoDB Map Tiles
  // Leaflet loads map tiles from domains like basemaps.cartocdn.com or tile.openstreetmap.org
  if (url.hostname.includes("basemaps.cartocdn.com") || url.hostname.includes("openstreetmap.org")) {
    event.respondWith(
      caches.open(MAP_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            // Return cached tile, but refresh in the background (stale-while-revalidate)
            fetch(event.request)
              .then((networkResponse) => {
                if (networkResponse.status === 200) {
                  cache.put(event.request, networkResponse);
                }
              })
              .catch(() => {
                // Fail silently if offline
              });
            return cachedResponse;
          }

          // If not in cache, fetch it from network, cache it, and return
          return fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => {
              // Return an empty transparent response if offline and not in cache
              return new Response("");
            });
        });
      })
    );
    return;
  }

  // 2. Stale-While-Revalidate for local assets (HTML, CSS, JS, manifest)
  // This ensures fast loading while updating files in background
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Fetch from network in the background and update cache
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
              }
            })
            .catch(() => {
              // Fail silently if offline
            });
          return cachedResponse;
        }

        // Fetch from network if not cached
        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => {
            // Fallback to offline index.html for page navigation if available
            if (event.request.headers.get("accept")?.includes("text/html")) {
              return caches.match(self.registration.scope || "/");
            }
          });
      })
    );
  }
});
