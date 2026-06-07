/* FLOW Service Worker
 * -------------------
 * Handles `push` events from the browser Push Service and `notificationclick` to
 * open / focus the FLOW app and navigate to the relevant order detail page.
 *
 * The actual push messages are produced by the in-app `Notification` API for
 * now (see utils/notifications.tsx). To switch to real server-driven Web Push
 * with VAPID, see the comments in src/utils/serviceWorker.ts and the
 * "PUSH_NOTIFICATIONS_SETUP" section of the README.
 *
 * TODO: real Web Push (VAPID)
 *   1. npx web-push generate-vapid-keys
 *   2. Replace this file's push handler to call self.registration.showNotification(...)
 *      using payload from event.data.json()
 *   3. Subscribe via registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidPublicKey })
 *   4. POST the subscription to your backend
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = { title: 'FLOW', body: 'Neue Benachrichtigung', url: '/' };
  try {
    if (event.data) {
      const data = event.data.json();
      payload = { ...payload, ...data };
    }
  } catch (e) {
    // ignore parse errors, use fallback
  }
  const options = {
    body: payload.body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: { url: payload.url || '/' },
    tag: payload.tag || 'flow-push',
  };
  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            try {
              client.navigate(targetUrl);
            } catch (e) {
              // ignore - same-origin only
            }
          }
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    }),
  );
});
