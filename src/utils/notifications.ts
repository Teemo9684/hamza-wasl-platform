import { PushNotifications } from '@capacitor/push-notifications';
import { toast } from 'sonner';

export const initializePushNotifications = async () => {
  // Request permission
  const permission = await PushNotifications.requestPermissions();
  
  if (permission.receive === 'granted') {
    // Register with Apple / Google to receive push notifications
    await PushNotifications.register();
    
    // Listen for registration success
    await PushNotifications.addListener('registration', () => {
      // تم تسجيل الإشعارات بنجاح
      // يمكنك حفظ هذا الـ token في قاعدة البيانات لإرسال إشعارات مخصصة
    });

    // Listen for registration errors
    await PushNotifications.addListener('registrationError', (error) => {
      console.error('Error on registration: ' + JSON.stringify(error));
      toast.error('فشل تسجيل الإشعارات');
    });

    // Listen for push notifications received
    await PushNotifications.addListener(
      'pushNotificationReceived',
      (notification) => {
        // تم استلام إشعار جديد
        toast.info(notification.title || 'رسالة جديدة', {
          description: notification.body
        });
      }
    );

    // Listen for push notification actions
    await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      () => {
        // تم تنفيذ إجراء الإشعار
      }
    );

    return true;
  }

  return false;
};

export const sendLocalNotification = async (title: string, body: string) => {
  // Local notifications are not supported in @capacitor/push-notifications
  // You would need @capacitor/local-notifications for this functionality
  toast.info(title, { description: body });
};
