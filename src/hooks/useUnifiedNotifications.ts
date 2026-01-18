import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { realtimeManager } from '@/utils/realtimeManager';
import { 
  triggerNotification, 
  fetchUnreadCounts, 
  getSenderInfo,
  getStudentInfo,
  formatSenderMessage,
  getStatusEmoji,
  UnreadCounts,
  showBrowserNotification,
} from '@/utils/notificationService';
import { setAppBadge } from '@/utils/appBadge';
import type { NotificationData } from '@/components/IntelligentNotificationBanner';

export type UserRole = 'parent' | 'teacher' | 'admin';

interface UseUnifiedNotificationsOptions {
  userId: string | null;
  userRole: UserRole | null;
  childIds?: string[];
  enabled?: boolean;
}

interface UseUnifiedNotificationsReturn {
  counts: UnreadCounts;
  refreshCounts: () => Promise<void>;
  currentBanner: NotificationData | null;
  dismissBanner: () => void;
  clearSection: (section: keyof Omit<UnreadCounts, 'total'>) => void;
}

export const useUnifiedNotifications = ({
  userId,
  userRole,
  childIds = [],
  enabled = true,
}: UseUnifiedNotificationsOptions): UseUnifiedNotificationsReturn => {
  const [counts, setCounts] = useState<UnreadCounts>({
    messages: 0,
    attendance: 0,
    homework: 0,
    documents: 0,
    total: 0,
  });
  const [currentBanner, setCurrentBanner] = useState<NotificationData | null>(null);
  const lastSeenRef = useRef<Record<string, string>>({});

  // Load last seen timestamps from localStorage
  useEffect(() => {
    if (userId) {
      const savedAttendance = localStorage.getItem(`lastSeenAttendance_${userId}`);
      const savedHomework = localStorage.getItem(`lastSeenHomework_${userId}`);
      const savedDocuments = localStorage.getItem(`lastSeenDocuments_${userId}`);
      
      lastSeenRef.current = {
        attendance: savedAttendance || '',
        homework: savedHomework || '',
        documents: savedDocuments || '',
      };
    }
  }, [userId]);

  // Show banner notification
  const showBanner = useCallback((notification: Omit<NotificationData, 'id' | 'timestamp'>) => {
    const fullNotification: NotificationData = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setCurrentBanner(fullNotification);
  }, []);

  // Dismiss current banner
  const dismissBanner = useCallback(() => {
    setCurrentBanner(null);
  }, []);

  // Refresh counts from database
  const refreshCounts = useCallback(async () => {
    if (!userId || !userRole) return;
    
    const newCounts = await fetchUnreadCounts(userId, userRole, childIds);
    setCounts(newCounts);
  }, [userId, userRole, childIds]);

  // Clear section and save to localStorage
  const clearSection = useCallback((section: keyof Omit<UnreadCounts, 'total'>) => {
    if (!userId) return;
    
    const now = new Date().toISOString();
    
    switch (section) {
      case 'attendance':
        localStorage.setItem(`lastSeenAttendance_${userId}`, now);
        lastSeenRef.current.attendance = now;
        break;
      case 'homework':
        localStorage.setItem(`lastSeenHomework_${userId}`, now);
        lastSeenRef.current.homework = now;
        break;
      case 'documents':
        localStorage.setItem(`lastSeenDocuments_${userId}`, now);
        lastSeenRef.current.documents = now;
        break;
    }
    
    setCounts(prev => ({
      ...prev,
      [section]: 0,
      total: prev.total - prev[section],
    }));
  }, [userId]);

  // Handle new message
  const handleNewMessage = useCallback(async (payload: any) => {
    if (!userId || !userRole) return;
    
    const newMessage = payload.new;
    // Only process if this message is for current user AND not sent by current user
    if (newMessage.recipient_id !== userId || newMessage.sender_id === userId) return;

    console.log('[UnifiedNotifications] New message received:', newMessage);

    // Get sender info
    const senderName = await getSenderInfo(newMessage.sender_id);
    const description = formatSenderMessage(senderName, userRole);

    // Update counts
    setCounts(prev => {
      const newMessageCount = prev.messages + 1;
      setAppBadge(newMessageCount);
      return {
        ...prev,
        messages: newMessageCount,
        total: prev.total + 1,
      };
    });

    // Trigger notification effects
    triggerNotification({
      type: 'message',
      title: 'رسالة جديدة',
      body: description,
      hapticType: 'medium',
    });

    // Show in-app banner
    showBanner({
      type: 'message',
      title: 'رسالة جديدة',
      description,
      details: {
        teacherName: userRole === 'parent' ? senderName : undefined,
        subject: newMessage.subject,
      },
    });
  }, [userId, userRole, showBanner]);

  // Handle new/updated attendance
  const handleAttendance = useCallback(async (payload: any) => {
    if (!userRole || userRole !== 'parent') return;
    
    const attendance = payload.new;
    const today = new Date().toISOString().split('T')[0];
    
    if (attendance.date !== today) return;

    console.log('[UnifiedNotifications] Attendance update received:', attendance);

    // Get student and teacher info
    const studentInfo = await getStudentInfo(attendance.student_id);
    const teacherName = attendance.recorded_by 
      ? await getSenderInfo(attendance.recorded_by) 
      : 'المعلم';

    const studentName = studentInfo?.name || 'الطالب';
    const statusEmoji = getStatusEmoji(attendance.status);

    // Update counts
    setCounts(prev => ({
      ...prev,
      attendance: prev.attendance + 1,
      total: prev.total + 1,
    }));

    // Trigger notification
    triggerNotification({
      type: 'attendance',
      title: 'تسجيل الحضور',
      body: `${studentName}: ${attendance.status} ${statusEmoji}`,
      hapticType: attendance.status === 'حاضر' ? 'success' : 'warning',
    });

    // Show banner
    showBanner({
      type: 'attendance',
      title: 'تسجيل الحضور',
      description: `تم تسجيل حالة ${studentName} اليوم`,
      details: {
        studentName,
        teacherName,
        status: attendance.status,
      },
    });
  }, [userRole, showBanner]);

  // Handle new homework
  const handleNewHomework = useCallback(async (payload: any) => {
    if (!userRole || userRole !== 'parent') return;
    
    const homework = payload.new;

    console.log('[UnifiedNotifications] New homework received:', homework);

    // Get teacher name
    const teacherName = homework.teacher_id 
      ? await getSenderInfo(homework.teacher_id) 
      : 'المعلم';

    // Update counts
    setCounts(prev => ({
      ...prev,
      homework: prev.homework + 1,
      total: prev.total + 1,
    }));

    // Trigger notification
    triggerNotification({
      type: 'homework',
      title: 'واجب جديد',
      body: homework.title || 'تم إضافة واجب جديد',
      hapticType: 'medium',
    });

    // Show banner
    showBanner({
      type: 'homework',
      title: 'واجب جديد',
      description: homework.title || 'تم إضافة واجب جديد',
      details: {
        teacherName,
        subject: homework.subject,
      },
    });
  }, [userRole, showBanner]);

  // Handle document status update
  const handleDocumentUpdate = useCallback(async (payload: any) => {
    if (!userId) return;
    
    const document = payload.new;
    if (document.parent_id !== userId || document.status === 'pending') return;

    console.log('[UnifiedNotifications] Document update received:', document);

    // Get student name
    const studentInfo = await getStudentInfo(document.student_id);
    const studentName = studentInfo?.name || 'الطالب';

    const statusText = document.status === 'ready' 
      ? 'جاهزة للاستلام' 
      : document.status === 'rejected' 
      ? 'مرفوضة' 
      : document.status;

    // Update counts
    setCounts(prev => ({
      ...prev,
      documents: prev.documents + 1,
      total: prev.total + 1,
    }));

    // Trigger notification
    triggerNotification({
      type: 'document',
      title: 'تحديث طلب وثيقة',
      body: `${document.document_type} - ${statusText}`,
      hapticType: document.status === 'ready' ? 'success' : 'warning',
    });

    // Show banner
    showBanner({
      type: 'document',
      title: 'تحديث طلب وثيقة',
      description: `${document.document_type} للطالب ${studentName}`,
      details: {
        studentName,
        status: statusText,
      },
    });
  }, [userId, showBanner]);

  // Handle announcement
  const handleAnnouncement = useCallback((payload: any) => {
    if (payload.eventType !== 'INSERT') return;
    
    const announcement = payload.new;
    if (!announcement?.is_active) return;

    console.log('[UnifiedNotifications] New announcement:', announcement);

    const title = announcement.title || 'إعلان جديد';
    const content = announcement.content || '';

    // Trigger notification
    triggerNotification({
      type: 'announcement',
      title: '📢 إعلان جديد',
      body: content ? `${title}\n${content.substring(0, 80)}...` : title,
      hapticType: 'warning',
    });

    // Show banner
    showBanner({
      type: 'announcement',
      title: '📢 إعلان جديد',
      description: title,
      details: {
        subject: content.substring(0, 100),
      },
    });
  }, [showBanner]);

  // Setup realtime subscriptions
  useEffect(() => {
    if (!userId || !userRole || !enabled) return;

    console.log('[UnifiedNotifications] Setting up subscriptions for:', userId, userRole);
    
    const cleanupFunctions: (() => void)[] = [];

    // Direct message channel (more reliable)
    const directChannel = supabase
      .channel(`unified-messages-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        handleNewMessage
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        () => refreshCounts()
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages' },
        () => {
          console.log('[UnifiedNotifications] Message deleted, refreshing counts');
          refreshCounts();
        }
      )
      .subscribe((status) => {
        console.log('[UnifiedNotifications] Messages channel status:', status);
      });
    
    cleanupFunctions.push(() => supabase.removeChannel(directChannel));

    // Announcements subscription
    const announcementCleanup = realtimeManager.subscribe(
      `unified-announcements-${userId}`,
      'news_ticker',
      handleAnnouncement
    );
    cleanupFunctions.push(announcementCleanup);

    // Parent-specific subscriptions
    if (userRole === 'parent' && childIds.length > 0) {
      // Attendance for each child
      childIds.forEach(childId => {
        const attendanceCleanup = realtimeManager.subscribe(
          `unified-attendance-${childId}`,
          'attendance',
          (payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              handleAttendance(payload);
            } else if (payload.eventType === 'REFRESH') {
              refreshCounts();
            }
          },
          `student_id=eq.${childId}`
        );
        cleanupFunctions.push(attendanceCleanup);
      });

      // Homework subscription
      const homeworkCleanup = realtimeManager.subscribe(
        `unified-homework-${userId}`,
        'homework',
        (payload) => {
          if (payload.eventType === 'INSERT') {
            handleNewHomework(payload);
          } else if (payload.eventType === 'REFRESH') {
            refreshCounts();
          }
        }
      );
      cleanupFunctions.push(homeworkCleanup);

      // Documents subscription
      const documentsCleanup = realtimeManager.subscribe(
        `unified-documents-${userId}`,
        'document_requests',
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            handleDocumentUpdate(payload);
          } else if (payload.eventType === 'REFRESH') {
            refreshCounts();
          }
        },
        `parent_id=eq.${userId}`
      );
      cleanupFunctions.push(documentsCleanup);
    }

    // Initial fetch
    refreshCounts();

    return () => {
      console.log('[UnifiedNotifications] Cleaning up subscriptions');
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [
    userId, 
    userRole, 
    childIds.join(','), 
    enabled, 
    handleNewMessage, 
    handleAttendance, 
    handleNewHomework, 
    handleDocumentUpdate, 
    handleAnnouncement,
    refreshCounts
  ]);

  return {
    counts,
    refreshCounts,
    currentBanner,
    dismissBanner,
    clearSection,
  };
};
