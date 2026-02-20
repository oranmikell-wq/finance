// Service Worker — Network First for HTML, Cache First for static assets
var CACHE_VERSION = 'financier-v4';

// Listen for skip waiting message
self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('install', function(event) {
    // Activate immediately, don't wait
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    // Clean old caches
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(name) {
                    return name !== CACHE_VERSION;
                }).map(function(name) {
                    console.log('Deleting old cache:', name);
                    return caches.delete(name);
                })
            );
        }).then(function() {
            // Take control of all pages immediately
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function(event) {
    var url = new URL(event.request.url);

    // For HTML pages (navigation requests) — ALWAYS network first
    if (event.request.mode === 'navigate' ||
        url.pathname.endsWith('.html') ||
        url.pathname.endsWith('/')) {
        event.respondWith(
            fetch(event.request).then(function(response) {
                // Cache the fresh response
                var clone = response.clone();
                caches.open(CACHE_VERSION).then(function(cache) {
                    cache.put(event.request, clone);
                });
                return response;
            }).catch(function() {
                // Offline fallback to cache
                return caches.match(event.request);
            })
        );
        return;
    }

    // For fonts and external resources — cache first
    if (url.origin !== location.origin) {
        event.respondWith(
            caches.match(event.request).then(function(cached) {
                return cached || fetch(event.request).then(function(response) {
                    var clone = response.clone();
                    caches.open(CACHE_VERSION).then(function(cache) {
                        cache.put(event.request, clone);
                    });
                    return response;
                });
            })
        );
        return;
    }

    // For other local assets (logo, manifest) — network first with cache fallback
    event.respondWith(
        fetch(event.request).then(function(response) {
            var clone = response.clone();
            caches.open(CACHE_VERSION).then(function(cache) {
                cache.put(event.request, clone);
            });
            return response;
        }).catch(function() {
            return caches.match(event.request);
        })
    );
});
