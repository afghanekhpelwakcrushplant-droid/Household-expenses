const CACHE = 'masaref-khane-v2';

const ASSETS = [
  './',
  './manifest.webmanifest',
  './icon.svg'
];

/* نصب Service Worker جدید */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* فعال شدن و حذف Cache نسخه‌های قدیمی */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/*
  برای index.html و فایل‌های HTML:
  همیشه نسخه جدید را از شبکه می‌گیرد.
*/
self.addEventListener('fetch', event => {

  const request = event.request;

  if (
    request.method !== 'GET' ||
    request.mode === 'navigate' ||
    request.destination === 'document'
  ) {

    event.respondWith(
      fetch(request, {
        cache: 'no-store'
      }).catch(() =>
        caches.match(request)
      )
    );

    return;
  }

  /*
    سایر فایل‌ها ابتدا از Cache خوانده می‌شوند.
    اگر وجود نداشته باشند، از شبکه دریافت می‌شوند.
  */

  event.respondWith(
    caches.match(request)
      .then(cached => {

        if (cached) {
          return cached;
        }

        return fetch(request)
          .then(response => {

            if (
              !response ||
              response.status !== 200 ||
              response.type === 'opaque'
            ) {
              return response;
            }

            const copy = response.clone();

            caches.open(CACHE)
              .then(cache =>
                cache.put(request, copy)
              );

            return response;

          });
      })
  );

});
