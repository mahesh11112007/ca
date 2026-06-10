// Service Worker for Web Push Notifications

self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const payload = event.data.json();
      const options = {
        body: payload.body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        vibrate: [100, 50, 100],
        data: {
          url: payload.url || '/'
        }
      };

      event.waitUntil(
        self.registration.showNotification(payload.title || 'CA Ledger', options)
      );
    } catch (e) {
      const options = {
        body: event.data.text(),
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        vibrate: [100, 50, 100]
      };
      event.waitUntil(
        self.registration.showNotification('CA Ledger', options)
      );
    }
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  
  let targetUrl = '/';
  if (event.notification.data && event.notification.data.url) {
    targetUrl = event.notification.data.url;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
