// Service Worker — Network First for HTML, Cache First for static assets
// API calls bypass cache entirely
var CACHE_VERSION = 'financier-v27';

var API_DOMAINS = [
    'finnhub.io',
    'query1.finance.yahoo.com',
    'query2.finance.yahoo.com',
    'corsproxy.io',
    'api.allorigins.win',
    'thingproxy.freeboard.io',
    'stooq.com',
    'data.gov.il',
    'www.bizportal.co.il',
    'api.frankfurter.app',
    'open.er-api.com',
    'v6.exchangerate-api.com',
    'cdn.jsdelivr.net',
    'api.coingecko.com',
    'api.exchangerate.host',
    'gemelnet.cma.gov.il',
];

self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('install', function(event) {
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(name) {
                    return name !== CACHE_VERSION;
                }).map(function(name) {
                    return caches.delete(name);
                })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function(event) {
    var url;
    try { url = new URL(event.request.url); } catch(e) { return; }

    // Never cache API calls — let them go straight to network
    var isAPI = API_DOMAINS.some(function(d) { return url.hostname.includes(d); });
    if (isAPI) {
        // Pass through directly, no caching, no cloning
        return;
    }

    // For HTML/navigation — network first, cache fallback
    if (event.request.mode === 'navigate' ||
        url.pathname.endsWith('.html') ||
        url.pathname.endsWith('/')) {
        event.respondWith(
            fetch(event.request).then(function(response) {
                if (response.ok) {
                    var clone = response.clone();
                    caches.open(CACHE_VERSION).then(function(cache) {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            }).catch(function() {
                return caches.match(event.request);
            })
        );
        return;
    }

    // Static local assets — cache first
    if (url.origin === location.origin) {
        event.respondWith(
            caches.match(event.request).then(function(cached) {
                if (cached) return cached;
                return fetch(event.request).then(function(response) {
                    if (response.ok) {
                        var clone = response.clone();
                        caches.open(CACHE_VERSION).then(function(cache) {
                            cache.put(event.request, clone);
                        });
                    }
                    return response;
                });
            })
        );
        return;
    }

    // Everything else (non-API external) — network only
    // Don't cache, don't clone — avoids clone errors
});
