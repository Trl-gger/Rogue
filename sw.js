const CACHE = 'rogue-v2'; // Bump this on every deployment

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll([
      './',
      './index.html',
      './assets/manifest.json',
      './assets/rogue_logo.png'
    ]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const isHTML = e.request.mode === 'navigate' ||
    e.request.headers.get('accept')?.includes('text/html');

  if (isHTML) {
    // Network first for HTML — always fetch fresh, fall back to cache
    e.respondWith(
      fetch(e.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return response;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Cache first for assets — fast loading
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request))
    );
  }
});