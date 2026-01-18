import { supabase } from '@/integrations/supabase/client';
import { setAppBadge } from './appBadge';
import { playNotificationSound, NotificationType } from './pushNotifications';
import { mediumHaptic, warningHaptic, successHaptic } from './haptics';
import { toast } from 'sonner';

// App logo URL for notifications
const APP_ICON_URL = '/icon-192.png';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  showToast?: boolean;
  showBrowserNotification?: boolean;
  updateBadge?: boolean;
  hapticType?: 'medium' | 'success' | 'warning';
}

export interface UnreadCounts {
  messages: number;
  attendance: number;
  homework: number;
  documents: number;
  total: number;
}

// Request browser notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if ('Notification' in window) {
    try {
      const permission = await Notification.requestPermission();
      console.log('[NotificationService] Notification permission:', permission);
      return permission === 'granted';
    } catch (error) {
      console.warn('[NotificationService] Failed to request permission:', error);
      return false;
    }
  }
  return false;
};

// Show browser notification with app icon (works on web browsers)
export const showBrowserNotification = (title: string, body: string, tag?: string): boolean => {
  // Check if we're in a browser environment that supports notifications
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.log('[NotificationService] Browser notifications not supported');
    return false;
  }

  // Check permission status
  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        body,
        icon: APP_ICON_URL,
        badge: APP_ICON_URL,
        tag: tag || `hamza-wasl-${Date.now()}`,
        requireInteraction: false,
        silent: false, // Allow browser to play default sound
      });

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      // Handle click to focus the app
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      console.log('[NotificationService] Browser notification shown:', title);
      return true;
    } catch (error) {
      console.warn('[NotificationService] Failed to show browser notification:', error);
      return false;
    }
  } else if (Notification.permission === 'default') {
    // Request permission if not yet decided
    requestNotificationPermission();
  }

  console.log('[NotificationService] Browser notifications not permitted, permission:', Notification.permission);
  return false;
};

// Set PWA app badge (works on supported browsers)
export const setPWABadge = async (count: number): Promise<boolean> => {
  try {
    if ('setAppBadge' in navigator) {
      if (count > 0) {
        await (navigator as any).setAppBadge(count);
        console.log('[NotificationService] PWA badge set to:', count);
      } else {
        await (navigator as any).clearAppBadge();
        console.log('[NotificationService] PWA badge cleared');
      }
      return true;
    }
  } catch (error) {
    console.warn('[NotificationService] Failed to set PWA badge:', error);
  }
  return false;
};

// Trigger a notification with all effects (sound, vibration, toast, browser notification)
export const triggerNotification = (payload: NotificationPayload): void => {
  console.log('[NotificationService] Triggering notification:', payload);

  // Play sound (works on both native and web)
  playNotificationSound(payload.type);

  // Trigger haptic feedback (native only, will be ignored on web)
  switch (payload.hapticType || 'medium') {
    case 'success':
      successHaptic();
      break;
    case 'warning':
      warningHaptic();
      break;
    default:
      mediumHaptic();
  }

  // Show toast notification (in-app)
  if (payload.showToast !== false) {
    const toastMethod = payload.type === 'announcement' ? toast.info : toast.success;
    toastMethod(payload.title, {
      description: payload.body,
      duration: 5000,
    });
  }

  // Show browser notification (for web - shows in browser status bar)
  if (payload.showBrowserNotification !== false) {
    showBrowserNotification(payload.title, payload.body, payload.type);
  }
};

// Fetch unread counts for a user
export const fetchUnreadCounts = async (
  userId: string, 
  userRole: 'parent' | 'teacher' | 'admin',
  childIds: string[] = []
): Promise<UnreadCounts> => {
  const counts: UnreadCounts = {
    messages: 0,
    attendance: 0,
    homework: 0,
    documents: 0,
    total: 0,
  };

  try {
    // Get unread messages
    const { count: messageCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);
    
    counts.messages = messageCount || 0;

    // Parent-specific counts
    if (userRole === 'parent' && childIds.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's attendance count
      const { count: attendanceCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .in('student_id', childIds)
        .eq('date', today);
      
      counts.attendance = attendanceCount || 0;

      // Get children's grade levels for homework
      const { data: childrenData } = await supabase
        .from('students')
        .select('grade_level')
        .in('id', childIds);
      
      if (childrenData && childrenData.length > 0) {
        const gradeLevels = [...new Set(childrenData.map(c => c.grade_level))];
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        const { count: homeworkCount } = await supabase
          .from('homework')
          .select('*', { count: 'exact', head: true })
          .in('grade_level', gradeLevels)
          .gte('due_date', today)
          .lte('due_date', nextWeek.toISOString().split('T')[0]);
        
        counts.homework = homeworkCount || 0;
      }

      // Get pending document requests
      const { count: documentsCount } = await supabase
        .from('document_requests')
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', userId)
        .neq('status', 'pending')
        .neq('status', 'done');
      
      counts.documents = documentsCount || 0;
    }

    // Calculate total
    counts.total = counts.messages + counts.attendance + counts.homework + counts.documents;

    // Update app badge (native) and PWA badge (web) with messages count
    setAppBadge(counts.messages);
    setPWABadge(counts.messages);

    console.log('[NotificationService] Fetched unread counts:', counts);
    return counts;
  } catch (error) {
    console.error('[NotificationService] Error fetching unread counts:', error);
    return counts;
  }
};

// Get sender info for message notification
export const getSenderInfo = async (senderId: string): Promise<string> => {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', senderId)
      .maybeSingle();
    
    return data?.full_name || 'مستخدم';
  } catch (error) {
    console.error('[NotificationService] Error getting sender info:', error);
    return 'مستخدم';
  }
};

// Get student info for attendance notification
export const getStudentInfo = async (studentId: string): Promise<{ name: string; gradeLevel: string } | null> => {
  try {
    const { data } = await supabase
      .from('students')
      .select('full_name, grade_level')
      .eq('id', studentId)
      .maybeSingle();
    
    return data ? { name: data.full_name, gradeLevel: data.grade_level } : null;
  } catch (error) {
    console.error('[NotificationService] Error getting student info:', error);
    return null;
  }
};

// Map Arabic status to emoji
export const getStatusEmoji = (status: string): string => {
  const statusMap: Record<string, string> = {
    'حاضر': '✅',
    'غائب': '❌',
    'متأخر': '⏰',
    'غائب بعذر': '📝',
    'معذور': '📝',
    'present': '✅',
    'absent': '❌',
    'late': '⏰',
    'excused': '📝',
  };
  return statusMap[status] || '📋';
};

// Format notification message based on role
export const formatSenderMessage = (senderName: string, userRole: 'parent' | 'teacher' | 'admin'): string => {
  switch (userRole) {
    case 'teacher':
      return `رسالة من ولي الأمر: ${senderName}`;
    case 'parent':
      return `رسالة من المعلم: ${senderName}`;
    default:
      return `رسالة من: ${senderName}`;
  }
};
