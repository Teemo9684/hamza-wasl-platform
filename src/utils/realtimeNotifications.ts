import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { playNotificationSound } from './pushNotifications';
import { setAppBadge } from './appBadge';

// App logo URL for notifications
const APP_ICON_URL = '/icon-192.png';

// Set up real-time listeners for notifications
export const setupRealtimeNotifications = async (userId: string, userRole: 'admin' | 'teacher' | 'parent') => {
  console.log('Setting up realtime notifications for user:', userId, 'role:', userRole);
  
  // Listen for new messages
  const messagesChannel = supabase
    .channel(`global-messages-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${userId}`
      },
      async (payload) => {
        console.log('Global: New message received via realtime:', payload);
        
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
        
        // Play notification sound
        playNotificationSound('message');
        
        // Show notification
        toast.success('رسالة جديدة', {
          description: 'لديك رسالة جديدة',
          duration: 5000,
        });

        // Show browser notification if supported
        showBrowserNotification('رسالة جديدة', 'لديك رسالة جديدة');
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${userId}`
      },
      async (payload) => {
        console.log('Global: Message updated via realtime:', payload);
        
        // Update badge when message is marked as read
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', userId)
          .eq('is_read', false);
        
        if (count !== null) {
          setAppBadge(count);
        }
      }
    )
    .subscribe((status) => {
      console.log('Global messages subscription status:', status);
    });

  // Listen for new announcements (for all users)
  const announcementsChannel = supabase
    .channel('global-announcements')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'news_ticker'
      },
      (payload) => {
        console.log('Global: New announcement received:', payload);
        
        const announcement = payload.new as any;
        if (announcement.is_active) {
          // Play notification sound
          playNotificationSound('default');
          
          toast.info('إعلان جديد', {
            description: announcement.title,
            duration: 5000,
          });

          // Show browser notification if supported
          showBrowserNotification('إعلان جديد', announcement.title);
        }
      }
    )
    .subscribe((status) => {
      console.log('Global announcements subscription status:', status);
    });

  // Return cleanup function
  return () => {
    console.log('Cleaning up global realtime subscriptions');
    supabase.removeChannel(messagesChannel);
    supabase.removeChannel(announcementsChannel);
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
