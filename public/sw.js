// Service Worker for LPK Source Course Indonesia PWA
const CACHE_NAME = 'lpk-sci-pwa-v4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.log('PWA Service Worker cache fallback:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests and skip API or non-http calls
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/') || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Network error occurred', { status: 408 });
        });
      })
  );
});

// Handle notification click outside the app / APK
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notifData = event.notification.data || {};
  const notifId = event.notification.tag || notifData.id || '';
  const targetUrl = notifData.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Broadcast to all active clients to turn off sound immediately
      for (const client of clientList) {
        try {
          client.postMessage({
            type: 'NOTIFICATION_OPENED',
            id: notifId,
            url: targetUrl
          });
        } catch (e) {}
      }

      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.navigate(targetUrl).catch(() => {});
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle push notifications when browser or app is closed / background
self.addEventListener('push', (event) => {
  let data = { title: 'Notifikasi LPK SCI', body: 'Ada informasi terbaru dari LPK SCI', url: '/' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }
  const options = {
    body: data.body || 'Informasi terbaru tersedia.',
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [250, 100, 250],
    tag: data.id || ('lpk-notif-' + Date.now()),
    renotify: true,
    data: {
      url: data.url || '/'
    }
  };
  event.waitUntil(self.registration.showNotification(data.title || 'LPK SCI Pati', options));
});

