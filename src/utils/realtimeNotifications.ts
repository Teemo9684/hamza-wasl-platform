import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { playNotificationSound } from './pushNotifications';
import { sendBackgroundNotification } from './backgroundNotifications';

// App logo URL for notifications
const APP_ICON_URL = '/icon-192.png';

// Set up real-time listeners for notifications
export const setupRealtimeNotifications = async (userId: string, userRole: 'admin' | 'teacher' | 'parent') => {
  // Listen for new messages
  const messagesChannel = supabase
    .channel('user-notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${userId}`
      },
      () => {
        // تم استلام رسالة جديدة
        
        // Play notification sound
        playNotificationSound();
        
        // Show notification
        toast.success('رسالة جديدة', {
          description: 'لديك رسالة جديدة',
          duration: 5000,
        });

        // Show browser/background notification
        sendBackgroundNotification('رسالة جديدة', 'لديك رسالة جديدة', { type: 'message' });
      }
    )
    .subscribe();

  // Listen for new announcements (for all users)
  const announcementsChannel = supabase
    .channel('announcements-notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'news_ticker'
      },
      (payload) => {
        // تم استلام إعلان جديد
        
        const announcement = payload.new as any;
        if (announcement.is_active) {
          // Play notification sound
          playNotificationSound();
          
          toast.info('إعلان جديد', {
            description: announcement.title,
            duration: 5000,
          });

          // Show browser/background notification
          sendBackgroundNotification('إعلان جديد', announcement.title, { type: 'announcement' });
        }
      }
    )
    .subscribe();

  // Return cleanup function
  return () => {
    supabase.removeChannel(messagesChannel);
    supabase.removeChannel(announcementsChannel);
  };
};

// Show browser notification with app icon
const showBrowserNotification = (title: string, body: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: APP_ICON_URL,
      badge: APP_ICON_URL,
      tag: 'hamza-wasl-notification',
      requireInteraction: false,
    });
  }
};

// Request browser notification permission
export const requestBrowserNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};
