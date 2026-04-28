const CACHE_NAME = 'crypter-v1';
const APP_SHELL_CACHE = 'crypter-shell-v1';
const CONTENT_CACHE = 'crypter-content-v1';

// App shell resources to pre-cache on install
const APP_SHELL = [
    '/',
    '/dashboard',
    '/favicon.svg',
    '/apple-touch-icon.png',
    '/manifest.json',
];

// Install event — pre-cache app shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

// Activate event — clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== APP_SHELL_CACHE && key !== CONTENT_CACHE)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// Fetch event — apply caching strategies
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip external requests
    if (url.origin !== location.origin) return;

    // Skip API routes that may contain sensitive authenticated data
    if (url.pathname.startsWith('/api/') && url.pathname.includes('/user')) return;

    // Lesson content pages — Stale While Revalidate
    if (url.pathname.startsWith('/courses/')) {
        event.respondWith(staleWhileRevalidate(event.request, CONTENT_CACHE));
        return;
    }

    // Static assets — Cache First
    if (url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|gif|ico|woff2?|webp|avif)$/)) {
        event.respondWith(cacheFirst(event.request, APP_SHELL_CACHE));
        return;
    }

    // API/dynamic pages — Network First
    event.respondWith(networkFirst(event.request, CONTENT_CACHE));
});

/**
 * Cache First strategy — serve from cache, fall back to network.
 * Best for static assets that rarely change.
 */
async function cacheFirst(request, cacheName) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        return new Response('Offline', { status: 503 });
    }
}

/**
 * Network First strategy — try network, fall back to cache.
 * Best for dynamic content that should be fresh when possible.
 */
async function networkFirst(request, cacheName) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        return cached || offlineFallback();
    }
}

/**
 * Stale While Revalidate strategy — serve cached version immediately,
 * then update cache in background. Best for content that should load
 * fast but stay reasonably fresh.
 */
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    const fetchPromise = fetch(request)
        .then((response) => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => cached);

    return cached || fetchPromise;
}

/**
 * Offline fallback page — shown when no cached version is available
 * and the network is unreachable.
 */
function offlineFallback() {
    return new Response(
        `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Offline — Crypter</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: #09090b;
            color: #fafafa;
        }
        .container {
            text-align: center;
            padding: 2rem;
            max-width: 420px;
        }
        .icon { font-size: 3rem; margin-bottom: 1rem; }
        h1 { font-size: 1.5rem; margin-bottom: 0.75rem; font-weight: 600; }
        p { color: #a1a1aa; line-height: 1.6; margin-bottom: 1.5rem; }
        button {
            background: #fafafa;
            color: #09090b;
            border: none;
            padding: 0.625rem 1.5rem;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: opacity 0.2s;
        }
        button:hover { opacity: 0.9; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">📡</div>
        <h1>You're Offline</h1>
        <p>Please check your internet connection and try again. Previously viewed lessons may still be available.</p>
        <button onclick="location.reload()">Try Again</button>
    </div>
</body>
</html>`,
        {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            status: 503,
        }
    );
}
