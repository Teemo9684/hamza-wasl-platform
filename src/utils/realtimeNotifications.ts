import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { playNotificationSound } from './pushNotifications';
import { setAppBadge } from './appBadge';
import { realtimeManager } from './realtimeManager';
import { mediumHaptic, warningHaptic } from './haptics';

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
        
        // Only process if this message is for current user
        if (newMessage.recipient_id !== userId) {
          console.log('Global: Message not for current user, ignoring');
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
        
        // Update app badge
        if (count !== null) {
          setAppBadge(count);
        }
        
        // Play notification sound
        playNotificationSound('message');
        
        // Trigger haptic vibration
        mediumHaptic();
        
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
        showBrowserNotification('📩 رسالة جديدة', browserBody);
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
