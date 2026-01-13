import { supabase } from '@/integrations/supabase/client';

// Register the notification service worker
export const registerNotificationServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return null;
  }

  try {
    // Register the custom notification service worker
    const registration = await navigator.serviceWorker.register('/sw-notifications.js', {
      scope: '/'
    });
    
    console.log('Notification SW registered:', registration);
    
    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    
    return registration;
  } catch (error) {
    console.error('Failed to register notification SW:', error);
    return null;
  }
};

// Store the auth token in the service worker for background sync
export const storeTokenInServiceWorker = async (token: string) => {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    return;
  }

  navigator.serviceWorker.controller.postMessage({
    type: 'STORE_TOKEN',
    token
  });
};

// Send notification via service worker (works even when app is in background)
export const sendBackgroundNotification = async (title: string, body: string, data?: any) => {
  if (!('serviceWorker' in navigator)) {
    // Fallback to regular notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon-192.png' });
    }
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      title,
      body,
      data
    });
  } else {
    // Use the registration to show notification
    await registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'hamza-wasl-notification',
      data
    });
  }
};

// Request permission and register for background sync
export const enableBackgroundSync = async () => {
  if (!('serviceWorker' in navigator) || !('sync' in window)) {
    console.log('Background sync not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Register for periodic background sync if supported
    if ('periodicSync' in registration) {
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync' as PermissionName
      });
      
      if (status.state === 'granted') {
        await (registration as any).periodicSync.register('check-updates', {
          minInterval: 15 * 60 * 1000 // 15 minutes
        });
        console.log('Periodic background sync registered');
      }
    }
    
    // Register for one-time sync
    await (registration as any).sync?.register('check-notifications');
    
    return true;
  } catch (error) {
    console.error('Failed to enable background sync:', error);
    return false;
  }
};

// Setup session persistence with service worker
export const setupSessionPersistence = async () => {
  // Listen for auth state changes and store token
  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.access_token) {
      storeTokenInServiceWorker(session.access_token);
    }
  });

  // Store initial token if exists
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    storeTokenInServiceWorker(session.access_token);
  }
};

// Initialize all background notification features
export const initializeBackgroundNotifications = async () => {
  // Register service worker
  const registration = await registerNotificationServiceWorker();
  
  if (!registration) {
    console.log('Could not register notification service worker');
    return false;
  }

  // Request notification permission
  if ('Notification' in window && Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return false;
    }
  }

  // Setup session persistence
  await setupSessionPersistence();
  
  // Enable background sync
  await enableBackgroundSync();
  
  console.log('Background notifications initialized');
  return true;
};
