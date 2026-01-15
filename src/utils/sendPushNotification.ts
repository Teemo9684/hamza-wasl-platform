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

/**
 * Send push notification for new homework
 */
export const sendHomeworkNotification = async (
  gradeLevel: string,
  homeworkTitle: string,
  subject?: string | null,
  dueDate?: string
): Promise<void> => {
  try {
    const bodyParts = [homeworkTitle];
    if (subject) bodyParts.push(`المادة: ${subject}`);
    if (dueDate) {
      const formattedDate = new Date(dueDate).toLocaleDateString('ar-u-nu-latn');
      bodyParts.push(`التسليم: ${formattedDate}`);
    }

    await sendPushNotification({
      grade_level: gradeLevel,
      title: '📚 واجب منزلي جديد',
      body: bodyParts.join(' | '),
      data: {
        type: 'homework',
      },
    });
  } catch (error) {
    console.error('Failed to send homework notification:', error);
  }
};

/**
 * Send push notification for announcements (bulk to users)
 */
export const sendAnnouncementNotification = async (
  userIds: string[],
  subject: string,
  content: string
): Promise<void> => {
  if (userIds.length === 0) return;

  try {
    // Truncate content if too long
    const truncatedContent = content.length > 100 
      ? content.substring(0, 100) + '...' 
      : content;

    await sendPushNotification({
      user_ids: userIds,
      title: `📢 ${subject}`,
      body: truncatedContent,
      data: {
        type: 'announcement',
      },
    });
  } catch (error) {
    console.error('Failed to send announcement notification:', error);
  }
};

/**
 * Send push notification for news ticker items (to all users)
 */
export const sendNewsTickerNotification = async (
  title: string,
  content: string
): Promise<void> => {
  try {
    // Truncate content if too long
    const truncatedContent = content.length > 100 
      ? content.substring(0, 100) + '...' 
      : content;

    // Send to all users by not specifying user_ids or grade_level
    // The edge function will need to handle this case
    await sendPushNotification({
      user_ids: [], // Empty array will trigger "send to all" in edge function
      title: `📣 ${title}`,
      body: truncatedContent,
      data: {
        type: 'news',
      },
    });
  } catch (error) {
    console.error('Failed to send news ticker notification:', error);
  }
};

/**
 * Send push notification for document request status update
 */
export const sendDocumentStatusNotification = async (
  userId: string,
  documentType: string,
  status: string
): Promise<void> => {
  try {
    const statusMessages: Record<string, string> = {
      'جاري المعالجة': 'طلبك قيد المعالجة',
      'جاهز': 'وثيقتك جاهزة للاستلام',
      'مرفوض': 'تم رفض طلبك',
    };

    const body = statusMessages[status] || `حالة الطلب: ${status}`;

    await sendPushNotification({
      user_ids: [userId],
      title: `📄 تحديث طلب ${documentType}`,
      body,
      data: {
        type: 'document',
      },
    });
  } catch (error) {
    console.error('Failed to send document status notification:', error);
  }
};

/**
 * Send push notification for attendance update
 */
export const sendAttendanceNotification = async (
  parentId: string,
  studentName: string,
  status: string,
  notes?: string
): Promise<void> => {
  try {
    const statusMessages: Record<string, { emoji: string; text: string }> = {
      'حاضر': { emoji: '✅', text: 'حاضر' },
      'present': { emoji: '✅', text: 'حاضر' },
      'غائب': { emoji: '❌', text: 'غائب' },
      'absent': { emoji: '❌', text: 'غائب' },
      'متأخر': { emoji: '⏰', text: 'متأخر' },
      'late': { emoji: '⏰', text: 'متأخر' },
      'معذور': { emoji: '📝', text: 'غياب بعذر' },
      'excused': { emoji: '📝', text: 'غياب بعذر' },
    };

    const statusInfo = statusMessages[status] || { emoji: '📋', text: status };
    let body = `${studentName}: ${statusInfo.text}`;
    if (notes) {
      body += ` - ${notes}`;
    }

    await sendPushNotification({
      user_ids: [parentId],
      title: `${statusInfo.emoji} تسجيل حضور`,
      body,
      data: {
        type: 'attendance',
      },
    });
  } catch (error) {
    console.error('Failed to send attendance notification:', error);
  }
};
