self.addEventListener('push', function(event) {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = {
      title: 'Amar Hishab Daily Reminder',
      body: event.data ? event.data.text() : "You haven't logged any transactions today! Tap here to quickly log an expense."
    };
  }

  const title = payload.title || 'Amar Hishab Daily Reminder';
  const options = {
    body: payload.body || "You haven't logged any transactions today! Tap here to quickly log an expense.",
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: {
      url: payload.url || '/costs?openAddModal=true',
      approveUrl: payload.approveUrl || null
    },
    actions: payload.actions || [] // supports dynamic action buttons
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // 1. Handle Background Action Button Approvals
  if (event.action === 'approve') {
    const approveUrl = event.notification.data?.approveUrl;
    if (approveUrl) {
      // Resolve against origin to get full API URL
      const fullUrl = approveUrl.startsWith('http') ? approveUrl : new URL(approveUrl, self.location.origin).href;
      
      event.waitUntil(
        fetch(fullUrl, { method: 'POST' })
          .then(function(response) {
            if (response.ok) {
              return self.registration.showNotification('Amar Hishab', {
                body: 'Transaction approved and logged successfully!',
                icon: '/icon-192.png'
              });
            } else {
              return response.json().then(function(errData) {
                return self.registration.showNotification('Amar Hishab', {
                  body: 'Failed to approve: ' + (errData.error || 'Unknown error'),
                  icon: '/icon-192.png'
                });
              });
            }
          })
          .catch(function(err) {
            console.error('Push approval error:', err);
            return self.registration.showNotification('Amar Hishab', {
              body: 'Connection error while logging transaction.',
              icon: '/icon-192.png'
            });
          })
      );
      return;
    }
  }

  // 2. Default Navigation Behavior (edit action or clicking the notification itself)
  const targetUrl = event.notification.data?.url || '/costs?openAddModal=true';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Find any active window matching the app origin
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.indexOf(self.location.origin) === 0 && 'focus' in client) {
          client.focus();
          if ('navigate' in client) {
            return client.navigate(targetUrl);
          }
        }
      }
      // If no window is open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
