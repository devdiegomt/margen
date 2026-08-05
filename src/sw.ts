/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope;

// ---- Precache del app shell (lo inyecta vite-plugin-pwa) ----
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// En modo injectManifest, autoUpdate hay que pedirlo a mano
self.skipWaiting();
clientsClaim();

// ---- Google Fonts: cache-first ----
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  })
);

// ---- Portadas de Open Library: cache-first, para que la biblioteca se vea offline ----
registerRoute(
  ({ url }) => url.origin === 'https://covers.openlibrary.org',
  new CacheFirst({
    cacheName: 'book-covers',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 90 }),
    ],
  })
);

// ---- Push: la cita del día ----
interface QuotePayload {
  title?: string;
  body?: string;
  bookId?: string;
}

self.addEventListener('push', event => {
  let data: QuotePayload = {};
  try {
    data = event.data ? (event.data.json() as QuotePayload) : {};
  } catch {
    data = { body: event.data?.text() };
  }

  const title = data.title ?? 'Tu subrayado de hoy';
  const body = data.body ?? 'Abre Margen para leerlo.';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      tag: 'daily-quote',      // reemplaza la anterior en vez de apilarlas
      data: { bookId: data.bookId },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const bookId = (event.notification.data as { bookId?: string } | undefined)?.bookId;
  const target = bookId ? `/#/libro/${bookId}` : '/#/';

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      // si Margen ya está abierta, la enfocamos y navegamos
      for (const client of clientList) {
        if ('focus' in client) {
          await client.focus();
          if ('navigate' in client) await client.navigate(target);
          return;
        }
      }
      await self.clients.openWindow(target);
    })()
  );
});
