// Service Worker — Cache First for HTML (instant load), Network First for API
var CACHE_VERSION = 'financier-v46';

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

var PRECACHE_URLS = [
    './',
    './index.html',
    './manifest.json',
    './logo.svg',
];

self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Pre-cache core files on install → instant load from first open
self.addEventListener('install', function(event) {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_VERSION).then(function(cache) {
            return cache.addAll(PRECACHE_URLS);
        }).catch(function() {})
    );
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
        }).then(function() {
            // Tell all open tabs to reload so they get the new version immediately
            return self.clients.matchAll({ type: 'window', includeUncontrolled: false });
        }).then(function(clients) {
            clients.forEach(function(c) { c.postMessage({ type: 'SW_UPDATED' }); });
        })
    );
});

self.addEventListener('fetch', function(event) {
    var url;
    try { url = new URL(event.request.url); } catch(e) { return; }

    // Never cache API calls — pass straight to network
    var isAPI = API_DOMAINS.some(function(d) { return url.hostname.includes(d); });
    if (isAPI) return;

    // HTML / navigation — Cache First + update in background (stale-while-revalidate)
    // Serves instantly from cache, fetches fresh version silently for next open
    if (event.request.mode === 'navigate' ||
        url.pathname.endsWith('.html') ||
        url.pathname.endsWith('/')) {
        event.respondWith(
            caches.open(CACHE_VERSION).then(function(cache) {
                return cache.match(event.request).then(function(cached) {
                    // Fetch fresh version in background regardless
                    var networkFetch = fetch(event.request).then(function(response) {
                        if (response.ok) cache.put(event.request, response.clone());
                        return response;
                    }).catch(function() { return null; });

                    // Serve cache instantly if available, otherwise wait for network
                    return cached || networkFetch;
                });
            })
        );
        return;
    }

    // Static local assets — Cache First
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

    // Everything else — network only
});
