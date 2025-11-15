import { PushNotifications } from '@capacitor/push-notifications';
import { toast } from 'sonner';

export const initializePushNotifications = async () => {
  // Request permission
  const permission = await PushNotifications.requestPermissions();
  
  if (permission.receive === 'granted') {
    // Register with Apple / Google to receive push notifications
    await PushNotifications.register();
    
    // Listen for registration success
    await PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token: ' + token.value);
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
        console.log('Push received: ' + JSON.stringify(notification));
        toast.info(notification.title || 'رسالة جديدة', {
          description: notification.body
        });
      }
    );

    // Listen for push notification actions
    await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification) => {
        console.log('Push action performed: ' + JSON.stringify(notification));
      }
    );

    return true;
  }

  return false;
};

export const sendLocalNotification = async (title: string, body: string) => {
  // Local notifications are not supported in @capacitor/push-notifications
  // You would need @capacitor/local-notifications for this functionality
  console.log('Local notification:', title, body);
  toast.info(title, { description: body });
};
