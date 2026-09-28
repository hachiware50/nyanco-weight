const CACHE_NAME = 'nyanco-pwa-v2';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // 1件失敗してもインストール全体を止めない(全滅を防ぐ)
    await Promise.all(ASSETS.map(async url => {
      try{ await cache.add(new Request(url, { cache: 'reload' })); }
      catch(err){ console.warn('[sw] cache add skipped:', url, err); }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== location.origin) return;
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if(cached) return cached;
    try{
      const res = await fetch(req);
      if(res && res.ok && res.type === 'basic'){
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    }catch(err){
      const fallback = await caches.match('./index.html');
      if(fallback) return fallback;
      throw err;
    }
  })());
});
