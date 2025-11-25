import { PushNotifications } from '@capacitor/push-notifications';
import { Device } from '@capacitor/device';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const initializePushNotifications = async () => {
  try {
    console.log('Initializing push notifications...');
    
    // Always request permission explicitly
    const permStatus = await PushNotifications.requestPermissions();

    if (permStatus.receive !== 'granted') {
      console.warn('Push notification permission not granted');
      toast.error('الرجاء السماح بالإشعارات لتلقي التحديثات المهمة من المدرسة');
      return;
    }

    console.log('Push notification permission granted');
    
    // Register with Apple / Google to receive push via APNS/FCM
    await PushNotifications.register();

    // Set up listeners
    setupPushNotificationListeners();
    
    toast.success('تم تفعيل التنبيهات بنجاح');
    console.log('Push notifications initialized successfully');
  } catch (error) {
    console.error('Error initializing push notifications:', error);
    toast.error('حدث خطأ في تفعيل التنبيهات');
  }
};

const setupPushNotificationListeners = () => {
  // Called when registration is successful
  PushNotifications.addListener('registration', async (token) => {
    console.log('Push registration success, token: ' + token.value);
    
    // Save the token to the push_tokens table
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get device info
        const deviceInfo = await Device.getInfo();
        const deviceId = await Device.getId();
        
        // Upsert the token in the database
        const { error } = await supabase
          .from('push_tokens')
          .upsert({
            user_id: user.id,
            token: token.value,
            platform: deviceInfo.platform,
            device_name: deviceId.identifier || 'Unknown Device',
            last_used_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,token',
            ignoreDuplicates: false
          });

        if (error) {
          console.error('Error saving push token:', error);
        } else {
          console.log('Push token saved successfully');
        }
      }
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  });

  // Called when registration fails
  PushNotifications.addListener('registrationError', (error) => {
    console.error('Error on registration: ' + JSON.stringify(error));
    toast.error('فشل تسجيل الإشعارات');
  });

  // Called when a notification is received (app in foreground)
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push notification received: ', notification);
    
    toast.success(notification.title || 'إشعار جديد', {
      description: notification.body,
      duration: 5000,
    });
  });

  // Called when user taps on a notification
  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('Push notification action performed', notification);
    
    const data = notification.notification.data;
    
    // Handle navigation based on notification type
    if (data.type === 'message') {
      // Navigate to messages
      window.location.hash = '#messages';
    } else if (data.type === 'announcement') {
      // Navigate to announcements
      window.location.hash = '#announcements';
    }
  });
};

export const removePushNotificationListeners = async () => {
  await PushNotifications.removeAllListeners();
};

// Function to check if push notifications are supported
export const isPushNotificationsAvailable = () => {
  return 'PushNotifications' in window;
};

// Function to get current notification badges
export const getNotificationBadge = async () => {
  try {
    const deliveredNotifications = await PushNotifications.getDeliveredNotifications();
    return deliveredNotifications.notifications.length;
  } catch (error) {
    console.error('Error getting notification badge:', error);
    return 0;
  }
};

// Function to clear all notifications
export const clearAllNotifications = async () => {
  try {
    await PushNotifications.removeAllDeliveredNotifications();
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
};
