import { Capacitor } from '@capacitor/core';

// Dynamically import LocalNotifications to avoid issues on web
let LocalNotifications: any = null;

const loadLocalNotifications = async () => {
  if (LocalNotifications) return LocalNotifications;
  
  if (Capacitor.isNativePlatform()) {
    try {
      const module = await import('@capacitor/local-notifications');
      LocalNotifications = module.LocalNotifications;
      return LocalNotifications;
    } catch (error) {
      console.warn('LocalNotifications plugin not available:', error);
      return null;
    }
  }
  return null;
};

/**
 * Initialize local notifications and request permissions
 */
export const initializeLocalNotifications = async (): Promise<boolean> => {
  try {
    const notifications = await loadLocalNotifications();
    if (!notifications) return false;
    
    let permStatus = await notifications.checkPermissions();
    
    if (permStatus.display === 'prompt' || permStatus.display === 'prompt-with-rationale') {
      permStatus = await notifications.requestPermissions();
    }
    
    if (permStatus.display !== 'granted') {
      console.warn('Local notification permission not granted');
      return false;
    }
    
    console.log('Local notifications initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing local notifications:', error);
    return false;
  }
};

/**
 * Show a local notification with sound and vibration
 */
export const showLocalNotification = async (
  title: string,
  body: string,
  options?: {
    id?: number;
    sound?: string;
    channelId?: string;
  }
): Promise<boolean> => {
  try {
    const notifications = await loadLocalNotifications();
    if (!notifications) {
      console.log('Local notifications not available, falling back to web notification');
      return false;
    }
    
    const notificationId = options?.id || Math.floor(Math.random() * 100000);
    
    await notifications.schedule({
      notifications: [
        {
          id: notificationId,
          title,
          body,
          sound: options?.sound || 'default',
          channelId: options?.channelId || 'messages',
          smallIcon: 'ic_notification',
          largeIcon: 'ic_launcher',
          iconColor: '#4F46E5',
          schedule: { at: new Date(Date.now() + 100) }, // Show almost immediately
          extra: {
            timestamp: Date.now()
          }
        }
      ]
    });
    
    console.log('Local notification scheduled:', { id: notificationId, title, body });
    return true;
  } catch (error) {
    console.error('Error showing local notification:', error);
    return false;
  }
};

/**
 * Create notification channels for Android
 */
export const createNotificationChannels = async (): Promise<void> => {
  try {
    const notifications = await loadLocalNotifications();
    if (!notifications) return;
    
    // Only create channels on Android
    if (Capacitor.getPlatform() !== 'android') return;
    
    await notifications.createChannel({
      id: 'messages',
      name: 'الرسائل',
      description: 'إشعارات الرسائل الجديدة',
      importance: 5, // Max importance
      visibility: 1, // Public
      sound: 'notification.wav',
      vibration: true,
      lights: true,
      lightColor: '#4F46E5'
    });
    
    await notifications.createChannel({
      id: 'announcements',
      name: 'الإعلانات',
      description: 'إشعارات الإعلانات الجديدة',
      importance: 5,
      visibility: 1,
      sound: 'announcement.wav',
      vibration: true,
      lights: true,
      lightColor: '#F59E0B'
    });
    
    await notifications.createChannel({
      id: 'attendance',
      name: 'الحضور',
      description: 'إشعارات الحضور والغياب',
      importance: 4,
      visibility: 1,
      sound: 'notification.wav',
      vibration: true,
      lights: true,
      lightColor: '#10B981'
    });
    
    await notifications.createChannel({
      id: 'homework',
      name: 'الواجبات',
      description: 'إشعارات الواجبات المنزلية',
      importance: 4,
      visibility: 1,
      sound: 'notification.wav',
      vibration: true,
      lights: true,
      lightColor: '#8B5CF6'
    });
    
    console.log('Notification channels created');
  } catch (error) {
    console.error('Error creating notification channels:', error);
  }
};

/**
 * Check if local notifications are supported
 */
export const isLocalNotificationsSupported = (): boolean => {
  return Capacitor.isNativePlatform();
};
