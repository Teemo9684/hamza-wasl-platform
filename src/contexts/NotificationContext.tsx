import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { realtimeManager } from '@/utils/realtimeManager';
import { setAppBadge } from '@/utils/appBadge';
import { playNotificationSound } from '@/utils/pushNotifications';
import { mediumHaptic } from '@/utils/haptics';
import { toast } from 'sonner';

interface NotificationCounts {
  messages: number;
  attendance: number;
  homework: number;
}

interface NotificationContextType {
  counts: NotificationCounts;
  clearSection: (section: 'messages' | 'attendance' | 'homework') => void;
  refreshCounts: () => Promise<void>;
  userId: string | null;
  setUserId: (id: string | null) => void;
  childIds: string[];
  setChildIds: (ids: string[]) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [counts, setCounts] = useState<NotificationCounts>({
    messages: 0,
    attendance: 0,
    homework: 0,
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [childIds, setChildIds] = useState<string[]>([]);
  const [lastSeenAttendance, setLastSeenAttendance] = useState<string | null>(null);
  const [lastSeenHomework, setLastSeenHomework] = useState<string | null>(null);

  // Load last seen timestamps from localStorage
  useEffect(() => {
    if (userId) {
      const savedAttendance = localStorage.getItem(`lastSeenAttendance_${userId}`);
      const savedHomework = localStorage.getItem(`lastSeenHomework_${userId}`);
      setLastSeenAttendance(savedAttendance);
      setLastSeenHomework(savedHomework);
    }
  }, [userId]);

  const clearSection = useCallback((section: 'messages' | 'attendance' | 'homework') => {
    const now = new Date().toISOString();
    
    if (section === 'attendance' && userId) {
      localStorage.setItem(`lastSeenAttendance_${userId}`, now);
      setLastSeenAttendance(now);
    } else if (section === 'homework' && userId) {
      localStorage.setItem(`lastSeenHomework_${userId}`, now);
      setLastSeenHomework(now);
    }
    
    setCounts(prev => ({
      ...prev,
      [section]: 0,
    }));
  }, [userId]);

  const refreshCounts = useCallback(async () => {
    if (!userId) return;

    try {
      // Get unread messages count
      const { data: messagesData } = await supabase
        .from('messages')
        .select('id')
        .eq('recipient_id', userId)
        .eq('is_read', false);
      
      const unreadMessages = messagesData?.length || 0;
      
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      let newAttendance = 0;
      let homeworkCount = 0;
      
      if (childIds.length > 0) {
        // Check for new attendance today
        let attendanceQuery = supabase
          .from('attendance')
          .select('id, created_at')
          .in('student_id', childIds)
          .eq('date', today);
        
        // Only count attendance added after last seen
        if (lastSeenAttendance) {
          attendanceQuery = attendanceQuery.gt('created_at', lastSeenAttendance);
        }
        
        const { data: attendanceData } = await attendanceQuery;
        newAttendance = attendanceData?.length || 0;
        
        // Get children's grade levels for homework
        const { data: childrenData } = await supabase
          .from('students')
          .select('grade_level')
          .in('id', childIds);
        
        if (childrenData && childrenData.length > 0) {
          const gradeLevels = [...new Set(childrenData.map(c => c.grade_level))];
          
          // Get homework due in the next 7 days
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          
          let homeworkQuery = supabase
            .from('homework')
            .select('id, created_at')
            .in('grade_level', gradeLevels)
            .gte('due_date', today)
            .lte('due_date', nextWeek.toISOString().split('T')[0]);
          
          // Only count homework added after last seen
          if (lastSeenHomework) {
            homeworkQuery = homeworkQuery.gt('created_at', lastSeenHomework);
          }
          
          const { data: homeworkData } = await homeworkQuery;
          homeworkCount = homeworkData?.length || 0;
        }
      }
      
      setCounts({
        messages: unreadMessages,
        attendance: newAttendance,
        homework: homeworkCount,
      });
      
      // Update app badge with messages only
      setAppBadge(unreadMessages);
    } catch (error) {
      console.error('Error fetching notification counts:', error);
    }
  }, [userId, childIds, lastSeenAttendance, lastSeenHomework]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId) return;

    const cleanupFunctions: (() => void)[] = [];

    // Messages subscription
    const messageCleanup = realtimeManager.subscribe(
      `notification-context-messages-${userId}`,
      'messages',
      async (payload) => {
        if (payload.eventType === 'REFRESH') {
          refreshCounts();
          return;
        }

        if (payload.eventType === 'INSERT') {
          const newMessage = payload.new as any;
          
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
          
          playNotificationSound('message');
          mediumHaptic();
          toast.success('رسالة جديدة', {
            description: senderData?.full_name || 'لديك رسالة جديدة',
          });
        }

        if (payload.eventType === 'UPDATE') {
          refreshCounts();
        }
      },
      `recipient_id=eq.${userId}`
    );
    cleanupFunctions.push(messageCleanup);

    // Attendance subscription for each child
    if (childIds.length > 0) {
      childIds.forEach(childId => {
        const attendanceCleanup = realtimeManager.subscribe(
          `notification-context-attendance-${childId}`,
          'attendance',
          (payload) => {
            if (payload.eventType === 'REFRESH') {
              refreshCounts();
              return;
            }

            if (payload.eventType === 'INSERT') {
              const newAttendance = payload.new as any;
              
              setCounts(prev => ({ ...prev, attendance: prev.attendance + 1 }));
              
              playNotificationSound('attendance');
              mediumHaptic();
              toast.info('تم تسجيل الحضور', {
                description: `حالة اليوم: ${newAttendance.status}`,
              });
            }
          },
          `student_id=eq.${childId}`
        );
        cleanupFunctions.push(attendanceCleanup);
      });

      // Homework subscription
      const homeworkCleanup = realtimeManager.subscribe(
        `notification-context-homework-${userId}`,
        'homework',
        (payload) => {
          if (payload.eventType === 'REFRESH') {
            refreshCounts();
            return;
          }

          if (payload.eventType === 'INSERT') {
            const newHomework = payload.new as any;
            
            setCounts(prev => ({ ...prev, homework: prev.homework + 1 }));
            
            playNotificationSound('homework');
            mediumHaptic();
            toast.info('واجب جديد', {
              description: newHomework.title || 'تم إضافة واجب جديد',
            });
          }
        }
      );
      cleanupFunctions.push(homeworkCleanup);
    }

    // Initial fetch
    refreshCounts();

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [userId, childIds, refreshCounts]);

  return (
    <NotificationContext.Provider value={{
      counts,
      clearSection,
      refreshCounts,
      userId,
      setUserId,
      childIds,
      setChildIds,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
