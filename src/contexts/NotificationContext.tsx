import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { realtimeManager } from '@/utils/realtimeManager';
import { setAppBadge } from '@/utils/appBadge';
import { playNotificationSound } from '@/utils/pushNotifications';
import { mediumHaptic } from '@/utils/haptics';
import { IntelligentNotificationBanner, NotificationData } from '@/components/IntelligentNotificationBanner';

interface NotificationCounts {
  messages: number;
  attendance: number;
  homework: number;
  documents: number;
}

type UserRole = 'parent' | 'teacher' | 'admin';

interface NotificationContextType {
  counts: NotificationCounts;
  clearSection: (section: 'messages' | 'attendance' | 'homework' | 'documents') => void;
  refreshCounts: () => Promise<void>;
  userId: string | null;
  setUserId: (id: string | null) => void;
  childIds: string[];
  setChildIds: (ids: string[]) => void;
  userRole: UserRole | null;
  setUserRole: (role: UserRole | null) => void;
  showNotification: (notification: Omit<NotificationData, 'id' | 'timestamp'>) => void;
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
    documents: 0,
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [childIds, setChildIds] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [lastSeenAttendance, setLastSeenAttendance] = useState<string | null>(null);
  const [lastSeenHomework, setLastSeenHomework] = useState<string | null>(null);
  const [lastSeenDocuments, setLastSeenDocuments] = useState<string | null>(null);
  const [currentNotification, setCurrentNotification] = useState<NotificationData | null>(null);

  const showNotification = useCallback((notification: Omit<NotificationData, 'id' | 'timestamp'>) => {
    const fullNotification: NotificationData = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setCurrentNotification(fullNotification);
    playNotificationSound(notification.type);
    mediumHaptic();
  }, []);

  const dismissNotification = useCallback(() => {
    setCurrentNotification(null);
  }, []);

  // Load last seen timestamps from localStorage
  useEffect(() => {
    if (userId) {
      const savedAttendance = localStorage.getItem(`lastSeenAttendance_${userId}`);
      const savedHomework = localStorage.getItem(`lastSeenHomework_${userId}`);
      const savedDocuments = localStorage.getItem(`lastSeenDocuments_${userId}`);
      setLastSeenAttendance(savedAttendance);
      setLastSeenHomework(savedHomework);
      setLastSeenDocuments(savedDocuments);
    }
  }, [userId]);

  const clearSection = useCallback((section: 'messages' | 'attendance' | 'homework' | 'documents') => {
    const now = new Date().toISOString();
    
    if (section === 'attendance' && userId) {
      localStorage.setItem(`lastSeenAttendance_${userId}`, now);
      setLastSeenAttendance(now);
    } else if (section === 'homework' && userId) {
      localStorage.setItem(`lastSeenHomework_${userId}`, now);
      setLastSeenHomework(now);
    } else if (section === 'documents' && userId) {
      localStorage.setItem(`lastSeenDocuments_${userId}`, now);
      setLastSeenDocuments(now);
    }
    
    setCounts(prev => ({
      ...prev,
      [section]: 0,
    }));
  }, [userId]);

  const refreshCounts = useCallback(async () => {
    if (!userId) return;

    try {
      // Get unread messages count (works for both parent and teacher)
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
      let documentsCount = 0;
      
      // Parent-specific counts (attendance, homework, and documents for their children)
      if (userRole === 'parent' && childIds.length > 0) {
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

        // Get document requests with status updates after last seen
        let documentsQuery = supabase
          .from('document_requests')
          .select('id, updated_at')
          .eq('parent_id', userId)
          .neq('status', 'pending');
        
        if (lastSeenDocuments) {
          documentsQuery = documentsQuery.gt('updated_at', lastSeenDocuments);
        }
        
        const { data: documentsData } = await documentsQuery;
        documentsCount = documentsData?.length || 0;
      }
      
      setCounts({
        messages: unreadMessages,
        attendance: newAttendance,
        homework: homeworkCount,
        documents: documentsCount,
      });
      
      // Update app badge with messages only
      setAppBadge(unreadMessages);
    } catch (error) {
      console.error('Error fetching notification counts:', error);
    }
  }, [userId, userRole, childIds, lastSeenAttendance, lastSeenHomework, lastSeenDocuments]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId || !userRole) return;

    const cleanupFunctions: (() => void)[] = [];

    // Messages subscription (for both parent and teacher)
    // Use two subscription methods for better reliability
    
    // Method 1: Direct channel subscription without filter (more reliable for new messages)
    const directChannel = supabase
      .channel(`messages-direct-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          console.log('Direct channel: New message received', payload);
          const newMessage = payload.new as any;
          
          // Only process if this message is for current user
          if (newMessage.recipient_id !== userId) {
            console.log('Message not for current user, ignoring');
            return;
          }
          
          const { data: senderData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', newMessage.sender_id)
            .maybeSingle();
          
          setCounts(prev => {
            const newCount = prev.messages + 1;
            setAppBadge(newCount);
            return { ...prev, messages: newCount };
          });
          
          const senderName = senderData?.full_name || 'مستخدم';
          const senderDescription = userRole === 'teacher' 
            ? `رسالة من ولي الأمر: ${senderName}`
            : `رسالة من: ${senderName}`;
          
          showNotification({
            type: 'message',
            title: 'رسالة جديدة',
            description: senderDescription,
            details: {
              teacherName: userRole === 'parent' ? senderName : undefined,
              subject: newMessage.subject,
            },
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const updatedMessage = payload.new as any;
          if (updatedMessage.recipient_id === userId) {
            refreshCounts();
          }
        }
      )
      .subscribe((status) => {
        console.log('Direct messages channel status:', status);
      });
    
    cleanupFunctions.push(() => {
      supabase.removeChannel(directChannel);
    });

    // Method 2: RealtimeManager subscription with filter (backup)
    const messageCleanup = realtimeManager.subscribe(
      `notification-context-messages-${userId}`,
      'messages',
      async (payload) => {
        if (payload.eventType === 'REFRESH') {
          refreshCounts();
          return;
        }
        // INSERT and UPDATE are handled by direct channel above
      },
      `recipient_id=eq.${userId}`
    );
    cleanupFunctions.push(messageCleanup);

    // Parent-specific subscriptions (attendance and homework)
    if (userRole === 'parent' && childIds.length > 0) {
      // Attendance subscription for each child
      childIds.forEach(childId => {
        const attendanceCleanup = realtimeManager.subscribe(
          `notification-context-attendance-${childId}`,
          'attendance',
          async (payload) => {
            if (payload.eventType === 'REFRESH') {
              refreshCounts();
              return;
            }

            // Handle both INSERT and UPDATE (upsert triggers UPDATE for existing records)
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const newAttendance = payload.new as any;
              
              // Only notify if this is today's attendance
              const today = new Date().toISOString().split('T')[0];
              if (newAttendance.date === today) {
                // Fetch student name
                const { data: studentData } = await supabase
                  .from('students')
                  .select('full_name')
                  .eq('id', newAttendance.student_id)
                  .maybeSingle();
                
                // Fetch teacher name
                let teacherName = 'المعلم';
                if (newAttendance.recorded_by) {
                  const { data: teacherData } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', newAttendance.recorded_by)
                    .maybeSingle();
                  teacherName = teacherData?.full_name || 'المعلم';
                }
                
                const studentName = studentData?.full_name || 'الطالب';
                
                setCounts(prev => ({ ...prev, attendance: prev.attendance + 1 }));
                
                showNotification({
                  type: 'attendance',
                  title: 'تسجيل الحضور',
                  description: `تم تسجيل حالة ${studentName} اليوم`,
                  details: {
                    studentName,
                    teacherName,
                    status: newAttendance.status,
                  },
                });
              }
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
        async (payload) => {
          if (payload.eventType === 'REFRESH') {
            refreshCounts();
            return;
          }

          if (payload.eventType === 'INSERT') {
            const newHomework = payload.new as any;
            
            // Fetch teacher name
            let teacherName = 'المعلم';
            if (newHomework.teacher_id) {
              const { data: teacherData } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', newHomework.teacher_id)
                .maybeSingle();
              teacherName = teacherData?.full_name || 'المعلم';
            }
            
            setCounts(prev => ({ ...prev, homework: prev.homework + 1 }));
            
            showNotification({
              type: 'homework',
              title: 'واجب جديد',
              description: newHomework.title || 'تم إضافة واجب جديد',
              details: {
                teacherName,
                subject: newHomework.subject,
              },
            });
          }
        }
      );
      cleanupFunctions.push(homeworkCleanup);

      // Document requests subscription for parent
      const documentsCleanup = realtimeManager.subscribe(
        `notification-context-documents-${userId}`,
        'document_requests',
        async (payload) => {
          if (payload.eventType === 'REFRESH') {
            refreshCounts();
            return;
          }

          if (payload.eventType === 'UPDATE') {
            const updatedRequest = payload.new as any;
            
            // Only notify if status changed (not pending anymore)
            if (updatedRequest.status !== 'pending') {
              // Get student name
              const { data: studentData } = await supabase
                .from('students')
                .select('full_name')
                .eq('id', updatedRequest.student_id)
                .maybeSingle();
              
              const studentName = studentData?.full_name || 'الطالب';
              const statusText = updatedRequest.status === 'ready' 
                ? 'جاهزة للاستلام' 
                : updatedRequest.status === 'rejected' 
                  ? 'مرفوضة' 
                  : 'قيد المعالجة';
              
              setCounts(prev => ({ ...prev, documents: prev.documents + 1 }));
              
              showNotification({
                type: 'document',
                title: 'تحديث طلب الوثيقة',
                description: `طلب وثيقة ${studentName} أصبح ${statusText}`,
                details: {
                  studentName,
                  status: updatedRequest.status,
                },
              });
            }
          }
        },
        `parent_id=eq.${userId}`
      );
      cleanupFunctions.push(documentsCleanup);
    }

    // Initial fetch
    refreshCounts();

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [userId, userRole, childIds, refreshCounts]);

  return (
    <NotificationContext.Provider value={{
      counts,
      clearSection,
      refreshCounts,
      userId,
      setUserId,
      childIds,
      setChildIds,
      userRole,
      setUserRole,
      showNotification,
    }}>
      {children}
      <IntelligentNotificationBanner
        notification={currentNotification}
        onDismiss={dismissNotification}
      />
    </NotificationContext.Provider>
  );
};
