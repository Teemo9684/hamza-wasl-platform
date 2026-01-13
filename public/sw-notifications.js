// Service Worker for background notifications
// This allows notifications to be received even when the app is closed

const APP_ICON = '/icon-192.png';
const NOTIFICATION_TAG = 'hamza-wasl-notification';

// Listen for push events from the server
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  let notificationData = {
    title: 'إشعار جديد',
    body: 'لديك تحديث جديد',
    icon: APP_ICON,
    badge: APP_ICON,
    tag: NOTIFICATION_TAG,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: {}
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        data: data.data || {}
      };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      vibrate: notificationData.vibrate,
      data: notificationData.data
    })
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = '/';

  // Navigate based on notification type
  if (data.type === 'message') {
    targetUrl = '/dashboard/parent#messages';
  } else if (data.type === 'announcement') {
    targetUrl = '/dashboard/parent#overview';
  } else if (data.type === 'homework') {
    targetUrl = '/dashboard/parent#homework';
  } else if (data.type === 'attendance') {
    targetUrl = '/dashboard/parent#attendance';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event);
});

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);
  
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkForNewNotifications());
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);
  
  if (event.tag === 'check-updates') {
    event.waitUntil(checkForNewNotifications());
  }
});

// Check for new notifications in the background
async function checkForNewNotifications() {
  try {
    // Get stored auth token from IndexedDB
    const token = await getStoredToken();
    if (!token) return;

    // Check for unread messages
    const response = await fetch('https://caeltaubipulyrdyqsjn.supabase.co/rest/v1/messages?is_read=eq.false&select=id,subject,content,created_at', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhZWx0YXViaXB1bHlyZHlxc2puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNjE1NDcsImV4cCI6MjA3ODYzNzU0N30.CMsGMTwTnBJgg_-PloUuqnpfPCNJJZ6MEFAczahTZBI',
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const messages = await response.json();
      if (messages.length > 0) {
        await self.registration.showNotification('رسائل جديدة', {
          body: `لديك ${messages.length} رسائل غير مقروءة`,
          icon: APP_ICON,
          badge: APP_ICON,
          tag: NOTIFICATION_TAG,
          data: { type: 'message' }
        });
      }
    }
  } catch (error) {
    console.error('[SW] Error checking notifications:', error);
  }
}

// Get stored token from IndexedDB
async function getStoredToken() {
  return new Promise((resolve) => {
    const request = indexedDB.open('supabase-auth', 1);
    
    request.onerror = () => resolve(null);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      try {
        const transaction = db.transaction(['auth'], 'readonly');
        const store = transaction.objectStore('auth');
        const getRequest = store.get('session');
        
        getRequest.onsuccess = () => {
          const session = getRequest.result;
          resolve(session?.access_token || null);
        };
        
        getRequest.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('auth')) {
        db.createObjectStore('auth');
      }
    };
  });
}

// Message handler for communication with the main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(event.data.title, {
      body: event.data.body,
      icon: APP_ICON,
      badge: APP_ICON,
      tag: NOTIFICATION_TAG,
      data: event.data.data
    });
  }
  
  if (event.data.type === 'STORE_TOKEN') {
    storeToken(event.data.token);
  }
});

// Store token in IndexedDB for background sync
async function storeToken(token) {
  return new Promise((resolve) => {
    const request = indexedDB.open('supabase-auth', 1);
    
    request.onerror = () => resolve(false);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      try {
        const transaction = db.transaction(['auth'], 'readwrite');
        const store = transaction.objectStore('auth');
        store.put({ access_token: token }, 'session');
        resolve(true);
      } catch (e) {
        resolve(false);
      }
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('auth')) {
        db.createObjectStore('auth');
      }
    };
  });
}

console.log('[SW] Notification Service Worker loaded');
