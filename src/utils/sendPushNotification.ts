import { supabase } from "@/integrations/supabase/client";

interface PushNotificationParams {
  user_ids?: string[];
  grade_level?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Send push notification to users via FCM
 * This calls the send-push-notification edge function
 */
export const sendPushNotification = async (params: PushNotificationParams): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: params,
    });

    if (error) {
      console.error('Error sending push notification:', error);
      return false;
    }

    console.log('Push notification sent:', data);
    return data?.success || false;
  } catch (error) {
    console.error('Failed to send push notification:', error);
    return false;
  }
};

/**
 * Send push notification for a new message
 */
export const sendMessageNotification = async (
  recipientIds: string[],
  senderName: string,
  subject: string
): Promise<void> => {
  if (recipientIds.length === 0) return;

  try {
    await sendPushNotification({
      user_ids: recipientIds,
      title: 'رسالة جديدة',
      body: `${senderName}: ${subject}`,
      data: {
        type: 'message',
      },
    });
  } catch (error) {
    // Don't throw error, just log it - notification failure shouldn't break message sending
    console.error('Failed to send message notification:', error);
  }
};

/**
 * Send push notification to a grade level
 */
export const sendGradeLevelNotification = async (
  gradeLevel: string,
  title: string,
  body: string
): Promise<void> => {
  try {
    await sendPushNotification({
      grade_level: gradeLevel,
      title,
      body,
      data: {
        type: 'announcement',
      },
    });
  } catch (error) {
    console.error('Failed to send grade level notification:', error);
  }
};
