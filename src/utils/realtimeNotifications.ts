import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { playNotificationSound } from './pushNotifications';
import { setAppBadge, setPWABadge } from './appBadge';
import { realtimeManager } from './realtimeManager';
import { mediumHaptic, warningHaptic, notificationHaptic } from './haptics';
import { showLocalNotification, isLocalNotificationsSupported } from './localNotifications';

// App logo URL for notifications
const APP_ICON_URL = '/icon-192.png';

// Process notification queue - call edge function to send push notifications
const processNotificationQueue = async () => {
  try {
    console.log('Triggering notification queue processing...');
    const { data, error } = await supabase.functions.invoke('process-notification-queue');
    
    if (error) {
      console.error('Error processing notification queue:', error);
    } else {
      console.log('Notification queue processed:', data);
    }
  } catch (error) {
    console.error('Failed to process notification queue:', error);
  }
};

// Set up real-time listeners for notifications
export const setupRealtimeNotifications = async (userId: string, userRole: 'admin' | 'teacher' | 'parent') => {
  console.log('Setting up realtime notifications for user:', userId, 'role:', userRole);
  
  const cleanupFunctions: (() => void)[] = [];
  
  // Method 1: Direct channel subscription without filter (more reliable)
  const directMessageChannel = supabase
    .channel(`global-messages-direct-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      async (payload) => {
        console.log('Global Direct: New message received', payload);
        const newMessage = payload.new as any;
        
        // Only process if this message is for current user AND not sent by current user
        if (newMessage.recipient_id !== userId || newMessage.sender_id === userId) {
          console.log('Global: Message not for current user or sent by current user, ignoring');
          return;
        }
        
        console.log('Global: Processing message for user', userId);
        
        // Get sender info for detailed notification
        const { data: senderData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', newMessage.sender_id)
          .maybeSingle();
        
        // Get current unread count to update badge
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', userId)
          .eq('is_read', false);
        
        // Update app badge (native) and PWA badge (web)
        if (count !== null) {
          setAppBadge(count);
          setPWABadge(count); // Also update PWA badge for web browsers
        }
        
        // Play notification sound
        playNotificationSound('message');
        
        // Trigger strong haptic vibration for notifications
        await notificationHaptic();
        
        const senderName = senderData?.full_name || 'مستخدم';
        const senderDescription = userRole === 'teacher' 
          ? `رسالة من ولي الأمر: ${senderName}`
          : userRole === 'parent'
          ? `رسالة من المعلم: ${senderName}`
          : `رسالة من: ${senderName}`;
        
        // Show toast notification
        toast.success('رسالة جديدة', {
          description: senderDescription,
          duration: 5000,
        });

        // Show browser notification with detailed info
        const browserBody = newMessage.subject 
          ? `${senderDescription}\nالموضوع: ${newMessage.subject}`
          : senderDescription;
        
        // Use local notification on Android/iOS for guaranteed delivery with sound
        if (isLocalNotificationsSupported()) {
          await showLocalNotification('📩 رسالة جديدة', browserBody, { channelId: 'messages' });
        } else {
          showBrowserNotification('📩 رسالة جديدة', browserBody);
        }
      }
    )
    .subscribe((status) => {
      console.log('Global direct messages channel status:', status);
    });
  
  cleanupFunctions.push(() => {
    supabase.removeChannel(directMessageChannel);
  });

  // Listen for new announcements (for all users) using realtimeManager
  const announcementCleanup = realtimeManager.subscribe(
    `global-announcements-${userId}`,
    'news_ticker',
    async (payload) => {
      // Skip REFRESH events
      if (payload.eventType === 'REFRESH') return;
      
      console.log('Global: Announcement update received via realtimeManager:', payload);
      
      // Only handle INSERT events
      if (payload.eventType === 'INSERT') {
        const announcement = payload.new as any;
        if (announcement?.is_active) {
          // Play notification sound
          playNotificationSound('announcement');
          
          // Trigger strong haptic vibration for announcements
          await notificationHaptic();
          
          const announcementTitle = announcement.title || 'إعلان جديد';
          const announcementContent = announcement.content || '';
          
          // Show toast with full details
          const toastDescription = announcementContent 
            ? `${announcementTitle}\n${announcementContent.substring(0, 80)}${announcementContent.length > 80 ? '...' : ''}`
            : announcementTitle;
          
          toast.info('📢 إعلان جديد', {
            description: toastDescription,
            duration: 8000,
          });

          // Show browser notification with full details
          const browserBody = announcementContent 
            ? `${announcementTitle}\n${announcementContent.substring(0, 100)}${announcementContent.length > 100 ? '...' : ''}`
            : announcementTitle;
          
          // Use local notification on Android/iOS for guaranteed delivery with sound
          if (isLocalNotificationsSupported()) {
            await showLocalNotification('📢 إعلان جديد', browserBody, { channelId: 'announcements' });
          } else {
            showBrowserNotification('📢 إعلان جديد', browserBody);
          }
        }
      }
    }
  );

  // Listen for notification queue and process it (for admin only)
  if (userRole === 'admin') {
    const queueCleanup = realtimeManager.subscribe(
      `notification-queue-processor`,
      'notification_queue',
      async (payload) => {
        if (payload.eventType === 'INSERT') {
          console.log('New notification queued, processing...');
          // Small delay to batch multiple inserts
          setTimeout(() => processNotificationQueue(), 1000);
        }
      }
    );
    cleanupFunctions.push(queueCleanup);
  }

  // Return cleanup function
  return () => {
    console.log('Cleaning up global realtime subscriptions');
    cleanupFunctions.forEach(cleanup => cleanup());
    announcementCleanup();
  };
};

// Show browser notification with app icon (works in browser status bar)
const showBrowserNotification = (title: string, body: string) => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.log('Browser notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        body,
        icon: APP_ICON_URL,
        badge: APP_ICON_URL,
        tag: `hamza-wasl-${Date.now()}`,
        requireInteraction: false,
        silent: false, // Allow browser sound
      });

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      // Handle click to focus the app
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      console.log('Browser notification shown:', title);
      return true;
    } catch (error) {
      console.warn('Failed to show browser notification:', error);
      return false;
    }
  }
  
  return false;
};

// Request browser notification permission
export const requestBrowserNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.log('Browser notifications not supported');
    return false;
  }

  try {
    // Check current permission
    if (Notification.permission === 'granted') {
      console.log('Browser notification permission already granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('Browser notification permission was denied');
      return false;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    console.log('Browser notification permission:', permission);
    return permission === 'granted';
  } catch (error) {
    console.warn('Failed to request notification permission:', error);
    return false;
  }
};
