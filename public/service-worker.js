// service-worker.js

self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  // Skip waiting to ensure the new service worker activates immediately.
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  // Take control of all clients as soon as the service worker is activated.
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked.');
  event.notification.close();

  // This looks for an existing window and focuses it.
  event.waitUntil(
    self.clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true
      })
      .then(clientList => {
        // If a window is already open, focus it.
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise, open a new window.
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
  );
});
