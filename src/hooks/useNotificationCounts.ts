import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { realtimeManager } from '@/utils/realtimeManager';
import { setAppBadge } from '@/utils/appBadge';
import { playNotificationSound } from '@/utils/pushNotifications';
import { mediumHaptic, successHaptic } from '@/utils/haptics';
import { toast } from 'sonner';
import { showLocalNotification, isLocalNotificationsSupported } from '@/utils/localNotifications';

export interface NotificationCounts {
  messages: number;
  attendance: number;
  homework: number;
}

interface UseNotificationCountsOptions {
  userId: string | null;
  userRole: 'parent' | 'teacher';
  childIds?: string[];
}

export const useNotificationCounts = ({ userId, userRole, childIds = [] }: UseNotificationCountsOptions) => {
  const [counts, setCounts] = useState<NotificationCounts>({
    messages: 0,
    attendance: 0,
    homework: 0,
  });
  const [todayAttendanceRecorded, setTodayAttendanceRecorded] = useState<Set<string>>(new Set());

  // Trigger notification with sound + haptic + local notification
  const triggerNotification = useCallback(async (type: 'message' | 'attendance' | 'homework' | 'announcement', title: string, description: string) => {
    // Play sound
    playNotificationSound(type);
    
    // Trigger haptic vibration
    mediumHaptic();
    
    // Show toast
    toast.success(title, { description });
    
    // Show local notification on native platforms for guaranteed delivery
    if (isLocalNotificationsSupported()) {
      const channelMap: Record<string, string> = {
        message: 'messages',
        attendance: 'attendance',
        homework: 'homework',
        announcement: 'announcements'
      };
      await showLocalNotification(title, description, { channelId: channelMap[type] });
    }
  }, []);

  // Fetch initial counts
  const fetchCounts = useCallback(async () => {
    if (!userId) return;

    try {
      // Get unread messages count
      const { data: messagesData } = await supabase
        .from('messages')
        .select('id, is_read')
        .eq('recipient_id', userId)
        .eq('is_read', false);
      
      const unreadMessages = messagesData?.length || 0;
      
      // Get today's date for attendance check
      const today = new Date().toISOString().split('T')[0];
      
      let newAttendance = 0;
      let homeworkCount = 0;
      
      if (userRole === 'parent' && childIds.length > 0) {
        // Check for new attendance today for parent's children
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('id, student_id')
          .in('student_id', childIds)
          .eq('date', today);
        
        // Track which children have attendance recorded today
        const recordedChildren = new Set(attendanceData?.map(a => a.student_id) || []);
        setTodayAttendanceRecorded(recordedChildren);
        
        // Get homework count for children's grade levels
        const { data: childrenData } = await supabase
          .from('students')
          .select('grade_level')
          .in('id', childIds);
        
        if (childrenData && childrenData.length > 0) {
          const gradeLevels = [...new Set(childrenData.map(c => c.grade_level))];
          
          // Get homework that's due in the next 7 days
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          
          const { data: homeworkData } = await supabase
            .from('homework')
            .select('id')
            .in('grade_level', gradeLevels)
            .gte('due_date', today)
            .lte('due_date', nextWeek.toISOString().split('T')[0]);
          
          homeworkCount = homeworkData?.length || 0;
        }
      }
      
      setCounts({
        messages: unreadMessages,
        attendance: newAttendance,
        homework: homeworkCount,
      });
      
      // Update app badge with total
      setAppBadge(unreadMessages);
    } catch (error) {
      console.error('Error fetching notification counts:', error);
    }
  }, [userId, userRole, childIds]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId) return;

    const cleanupFunctions: (() => void)[] = [];

    // Messages subscription
    const messageCleanup = realtimeManager.subscribe(
      `notification-counts-messages-${userId}`,
      'messages',
      async (payload) => {
        if (payload.eventType === 'REFRESH') {
          fetchCounts();
          return;
        }

        if (payload.eventType === 'INSERT') {
          const newMessage = payload.new as any;
          
          // Get sender info
          const { data: senderData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', newMessage.sender_id)
            .single();
          
          setCounts(prev => {
            const newCount = prev.messages + 1;
            setAppBadge(newCount);
            return { ...prev, messages: newCount };
          });
          
          // Trigger notification with vibration
          triggerNotification(
            'message',
            'رسالة جديدة',
            senderData?.full_name || 'لديك رسالة جديدة'
          );
        }

        if (payload.eventType === 'UPDATE') {
          fetchCounts();
        }
      },
      `recipient_id=eq.${userId}`
    );
    cleanupFunctions.push(messageCleanup);

    // Attendance subscription (for parents)
    if (userRole === 'parent' && childIds.length > 0) {
      childIds.forEach(childId => {
        const attendanceCleanup = realtimeManager.subscribe(
          `notification-counts-attendance-${childId}`,
          'attendance',
          (payload) => {
            if (payload.eventType === 'REFRESH') {
              fetchCounts();
              return;
            }

            // Handle both INSERT and UPDATE (upsert triggers UPDATE for existing records)
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const newAttendance = payload.new as any;
              
              // Only notify if this is today's attendance
              const today = new Date().toISOString().split('T')[0];
              if (newAttendance.date === today) {
                // Trigger notification with vibration
                triggerNotification(
                  'attendance',
                  'تم تسجيل الحضور',
                  `حالة اليوم: ${newAttendance.status}`
                );
                
                setCounts(prev => ({ ...prev, attendance: prev.attendance + 1 }));
                setTodayAttendanceRecorded(prev => new Set([...prev, childId]));
              }
            }
          },
          `student_id=eq.${childId}`
        );
        cleanupFunctions.push(attendanceCleanup);
      });

      // Homework subscription for parent's children
      const homeworkCleanup = realtimeManager.subscribe(
        `notification-counts-homework-${userId}`,
        'homework',
        (payload) => {
          if (payload.eventType === 'REFRESH') {
            fetchCounts();
            return;
          }

          if (payload.eventType === 'INSERT') {
            const newHomework = payload.new as any;
            
            // Trigger notification with vibration
            triggerNotification(
              'homework',
              'واجب جديد',
              newHomework.title || 'تم إضافة واجب جديد'
            );
            
            setCounts(prev => ({ ...prev, homework: prev.homework + 1 }));
          }
        }
      );
      cleanupFunctions.push(homeworkCleanup);
    }

    // Initial fetch
    fetchCounts();

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [userId, userRole, childIds, fetchCounts, triggerNotification]);

  return {
    counts,
    refreshCounts: fetchCounts,
    triggerNotification,
  };
};
