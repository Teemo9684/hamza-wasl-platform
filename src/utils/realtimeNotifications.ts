import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { playNotificationSound } from './pushNotifications';
import { setAppBadge } from './appBadge';
import { realtimeManager } from './realtimeManager';
import { mediumHaptic, warningHaptic } from './haptics';

// App logo URL for notifications
const APP_ICON_URL = '/icon-192.png';

// Set up real-time listeners for notifications
export const setupRealtimeNotifications = async (userId: string, userRole: 'admin' | 'teacher' | 'parent') => {
  console.log('Setting up realtime notifications for user:', userId, 'role:', userRole);
  
  // Listen for new messages using realtimeManager
  const messageCleanup = realtimeManager.subscribe(
    `global-messages-${userId}`,
    'messages',
    async (payload) => {
      // Skip REFRESH events
      if (payload.eventType === 'REFRESH') return;
      
      console.log('Global: Message update received via realtimeManager:', payload);
      
      // Get current unread count to update badge
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('is_read', false);
      
      // Update app badge
      if (count !== null) {
        setAppBadge(count);
      }
      
      // Only show notification for INSERT events
      if (payload.eventType === 'INSERT') {
        // Play notification sound
        playNotificationSound('message');
        
        // Trigger haptic vibration
        mediumHaptic();
        
        // Show notification
        toast.success('رسالة جديدة', {
          description: 'لديك رسالة جديدة',
          duration: 5000,
        });

        // Show browser notification if supported
        showBrowserNotification('رسالة جديدة', 'لديك رسالة جديدة');
      }
    },
    `recipient_id=eq.${userId}`
  );

  // Listen for new announcements (for all users) using realtimeManager
  const announcementCleanup = realtimeManager.subscribe(
    `global-announcements-${userId}`,
    'news_ticker',
    (payload) => {
      // Skip REFRESH events
      if (payload.eventType === 'REFRESH') return;
      
      console.log('Global: Announcement update received via realtimeManager:', payload);
      
      // Only handle INSERT events
      if (payload.eventType === 'INSERT') {
        const announcement = payload.new as any;
        if (announcement?.is_active) {
          // Play notification sound
          playNotificationSound('announcement');
          
          // Trigger haptic vibration for announcements
          warningHaptic();
          
          toast.info('إعلان جديد', {
            description: announcement.title,
            duration: 5000,
          });

          // Show browser notification if supported
          showBrowserNotification('إعلان جديد', announcement.title);
        }
      }
    }
  );

  // Return cleanup function
  return () => {
    console.log('Cleaning up global realtime subscriptions');
    messageCleanup();
    announcementCleanup();
  };
};

// Show browser notification with app icon
const showBrowserNotification = (title: string, body: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: APP_ICON_URL,
        badge: APP_ICON_URL,
        tag: 'hamza-wasl-notification',
        requireInteraction: false,
      });
    } catch (error) {
      console.warn('Failed to show browser notification:', error);
    }
  }
};

// Request browser notification permission
export const requestBrowserNotificationPermission = async () => {
  if ('Notification' in window) {
    try {
      const permission = await Notification.requestPermission();
      console.log('Browser notification permission:', permission);
      return permission === 'granted';
    } catch (error) {
      console.warn('Failed to request notification permission:', error);
      return false;
    }
  }
  return false;
};
