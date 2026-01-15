import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { ParentOverview } from "@/components/parent/ParentOverview";
import { ParentAttendance } from "@/components/parent/ParentAttendance";
import { ParentMessages } from "@/components/parent/ParentMessages";
import { ParentHomework } from "@/components/parent/ParentHomework";
import { ParentSchedule } from "@/components/parent/ParentSchedule";
import { ParentDocumentRequests } from "@/components/parent/ParentDocumentRequests";
import { ParentSettings } from "@/components/parent/ParentSettings";
import { NewsTicker } from "@/components/NewsTicker";
import { useNewsTicker } from "@/hooks/useNewsTicker";
import { DateTimeBar } from "@/components/DateTimeBar";
import { AnimatePresence } from "framer-motion";
import { AnimatedSection } from "@/components/AnimatedSection";
import { FloatingNotificationBadge, NotificationType } from "@/components/FloatingNotificationBadge";
import { BottomNav, parentNavItems } from "@/components/BottomNav";
import { realtimeManager } from "@/utils/realtimeManager";
import { setAppBadge } from "@/utils/appBadge";
import { playNotificationSound } from "@/utils/pushNotifications";

const DashboardParent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasNews, tickerHeight } = useNewsTicker();
  const [children, setChildren] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [parentName, setParentName] = useState<string>("");
  const [receivedMessages, setReceivedMessages] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchParentData();
  }, []);

  // Real-time subscription for messages using realtimeManager for better reconnection handling
  useEffect(() => {
    if (!currentUserId) return;

    console.log('Setting up realtime subscription for messages via realtimeManager, user:', currentUserId);

    const handleMessageChange = async (payload: any) => {
      console.log('Message change received:', payload);
      
      // Handle REFRESH event (when app comes back to foreground)
      if (payload.eventType === 'REFRESH') {
        console.log('Refreshing messages data...');
        // Re-fetch all messages
        const { data: messagesData } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey(full_name),
            student:students(full_name)
          `)
          .eq('recipient_id', currentUserId)
          .order('created_at', { ascending: false });
        
        if (messagesData) {
          setReceivedMessages(messagesData);
          const unreadCount = messagesData.filter(m => !m.is_read).length;
          setAppBadge(unreadCount);
        }
        return;
      }

      // Handle INSERT event
      if (payload.eventType === 'INSERT') {
        const newMessage = payload.new as any;
        
        // جلب بيانات المرسل والطالب
        const { data: senderData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', newMessage.sender_id)
          .single();
        
        let studentData = null;
        if (newMessage.student_id) {
          const { data } = await supabase
            .from('students')
            .select('full_name')
            .eq('id', newMessage.student_id)
            .single();
          studentData = data;
        }

        const enrichedMessage = {
          ...newMessage,
          sender: senderData,
          student: studentData
        };

        setReceivedMessages(prev => {
          const updated = [enrichedMessage, ...prev];
          const unreadCount = updated.filter(m => !m.is_read).length;
          setAppBadge(unreadCount);
          return updated;
        });
        
        // Play notification sound
        playNotificationSound('message');
        sonnerToast.success("رسالة جديدة", {
          description: senderData?.full_name || 'رسالة جديدة من المعلم',
        });
      }

      // Handle UPDATE event
      if (payload.eventType === 'UPDATE') {
        const updatedMessage = payload.new as any;
        setReceivedMessages(prev => {
          const updated = prev.map(msg => 
            msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
          );
          const unreadCount = updated.filter(m => !m.is_read).length;
          setAppBadge(unreadCount);
          return updated;
        });
      }
    };

    // Use realtimeManager for better connection handling
    const cleanup = realtimeManager.subscribe(
      `parent-messages-${currentUserId}`,
      'messages',
      handleMessageChange,
      `recipient_id=eq.${currentUserId}`
    );

    return () => {
      console.log('Cleaning up realtime subscription');
      cleanup();
    };
  }, [currentUserId]);

  // Real-time subscription for attendance updates
  useEffect(() => {
    if (!selectedChild) return;

    const attendanceChannel = supabase
      .channel(`attendance-updates-${selectedChild}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance',
          filter: `student_id=eq.${selectedChild}`
        },
        (payload) => {
          const newAttendance = payload.new as any;
          setAttendance(prev => [newAttendance, ...prev]);
          sonnerToast.info('تم تسجيل الحضور', {
            description: `حالة اليوم: ${newAttendance.status}`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'attendance',
          filter: `student_id=eq.${selectedChild}`
        },
        (payload) => {
          const updatedAttendance = payload.new as any;
          setAttendance(prev => prev.map(a => 
            a.id === updatedAttendance.id ? updatedAttendance : a
          ));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'attendance',
          filter: `student_id=eq.${selectedChild}`
        },
        (payload) => {
          const deletedAttendance = payload.old as any;
          setAttendance(prev => prev.filter(a => a.id !== deletedAttendance.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(attendanceChannel);
    };
  }, [selectedChild]);

  useEffect(() => {
    if (selectedChild) {
      fetchChildDetails(selectedChild);
    }
  }, [selectedChild]);

  const fetchParentData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login/parent");
        return;
      }

      setCurrentUserId(user.id);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      setParentName(profileData?.full_name || "ولي الأمر");

      const { data: childrenData, error: childrenError } = await supabase
        .from('students')
        .select(`
          *,
          parent_students!inner(parent_id)
        `)
        .eq('parent_students.parent_id', user.id);

      if (childrenError) throw childrenError;
      setChildren(childrenData || []);

      if (childrenData && childrenData.length > 0) {
        setSelectedChild(childrenData[0].id);
      }

      const { data: teachersData, error: teachersError } = await supabase
        .from('teacher_students')
        .select(`
          teacher_id,
          subject,
          profiles!teacher_students_teacher_id_fkey(id, full_name)
        `)
        .in('student_id', childrenData?.map(c => c.id) || []);

      if (teachersError) throw teachersError;
      setTeachers(teachersData || []);

      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(full_name),
          student:students(full_name)
        `)
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;
      setReceivedMessages(messagesData || []);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchChildDetails = async (childId: string) => {
    try {
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', childId)
        .order('date', { ascending: false });

      if (attendanceError) throw attendanceError;
      setAttendance(attendanceData || []);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const calculateAttendanceRate = (childId: string) => {
    const childAttendance = attendance.filter(a => a.student_id === childId);
    if (childAttendance.length === 0) return 0;

    const presentCount = childAttendance.filter(a => a.status === 'حاضر').length;
    return Number(((presentCount / childAttendance.length) * 100).toFixed(1));
  };

  const unreadMessagesCount = receivedMessages.filter(m => !m.is_read).length;
  const [pendingDocuments, setPendingDocuments] = useState(0);

  // Update app icon badge with unread count
  useEffect(() => {
    setAppBadge(unreadMessagesCount);
  }, [unreadMessagesCount]);

  // Fetch pending document updates
  useEffect(() => {
    if (!currentUserId) return;

    const fetchPendingDocs = async () => {
      // Get document requests that have been updated (not pending anymore)
      const { data } = await supabase
        .from('document_requests')
        .select('id, status')
        .eq('parent_id', currentUserId)
        .neq('status', 'pending');
      
      // Count documents that are ready or approved (notifications for parent)
      const count = data?.filter(d => d.status === 'ready' || d.status === 'approved').length || 0;
      setPendingDocuments(count);
    };

    fetchPendingDocs();

    // Subscribe to document request updates
    const channel = supabase
      .channel(`parent-document-updates-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'document_requests',
          filter: `parent_id=eq.${currentUserId}`
        },
        (payload) => {
          const updated = payload.new as any;
          if (updated.status !== 'pending') {
            playNotificationSound('document');
            sonnerToast.info('تحديث طلب وثيقة', {
              description: `تم تحديث حالة الطلب إلى: ${updated.status === 'ready' ? 'جاهزة للاستلام' : updated.status === 'approved' ? 'تمت الموافقة' : updated.status}`,
            });
            fetchPendingDocs();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const scrollToMessages = () => {
    const messagesSection = document.getElementById('messages');
    if (messagesSection) {
      messagesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToDocuments = () => {
    const documentsSection = document.getElementById('documents');
    if (documentsSection) {
      documentsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const headerHeight = 56; // h-14 = 56px

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-clip pt-[env(safe-area-inset-top)]">
      {/* Fixed News Ticker - Always visible at top */}
      {hasNews && (
        <div className="fixed top-[env(safe-area-inset-top)] left-0 right-0 z-50">
          <NewsTicker />
        </div>
      )}
      
      {/* Fixed Header - Below News Ticker */}
      <div 
        className="fixed left-0 right-0 z-40 bg-background/98 backdrop-blur-xl border-b shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
        style={{ top: `calc(env(safe-area-inset-top) + ${hasNews ? tickerHeight : 0}px)` }}
      >
        <header>
          <div className="flex h-14 md:h-16 items-center justify-between px-3 md:px-6">
            <div className="min-w-0 flex-1">
              <h1 className="text-sm md:text-lg font-bold truncate leading-tight">مرحباً، {parentName}</h1>
              <p className="text-[11px] md:text-xs text-muted-foreground truncate">لوحة تحكم ولي الأمر</p>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="font-cairo h-10 px-3 text-sm active:scale-95 touch-feedback"
              size="sm"
            >
              <LogOut className="ml-1.5 h-4 w-4" />
              <span className="hidden sm:inline">تسجيل الخروج</span>
              <span className="sm:hidden">خروج</span>
            </Button>
          </div>
        </header>
      </div>

      {/* Spacer for fixed ticker + header */}
      <div style={{ height: (hasNews ? tickerHeight : 0) + headerHeight }} />

      <main className="flex-1 p-3 md:p-4 pb-24 w-full">
        <AnimatePresence mode="wait">
          <AnimatedSection key="parent-dashboard">
            <div className="max-w-6xl mx-auto space-y-8 w-full">
              <section id="overview">
                <ParentOverview
                  children={children}
                  selectedChild={selectedChild}
                  onSelectChild={setSelectedChild}
                  attendance={attendance}
                  calculateAttendanceRate={calculateAttendanceRate}
                  onChildAdded={fetchParentData}
                />
              </section>

              <section id="attendance">
                <ParentAttendance attendance={attendance} selectedChild={selectedChild} />
              </section>

              <section id="homework">
                <ParentHomework />
              </section>

              <section id="schedule">
                <ParentSchedule selectedChild={selectedChild} children={children} />
              </section>

              <section id="messages">
                <ParentMessages
                  teachers={teachers}
                  receivedMessages={receivedMessages}
                  children={children}
                  onMessageSent={fetchParentData}
                />
              </section>

              <section id="documents">
                <ParentDocumentRequests
                  selectedChild={selectedChild}
                  children={children}
                />
              </section>

              <section id="settings">
                <ParentSettings
                  children={children}
                  onChildRemoved={fetchParentData}
                />
              </section>
            </div>
          </AnimatedSection>
        </AnimatePresence>
      </main>

      <FloatingNotificationBadge 
        notifications={[
          { type: 'message' as NotificationType, count: unreadMessagesCount, onClick: scrollToMessages },
          { type: 'document' as NotificationType, count: pendingDocuments, onClick: scrollToDocuments },
        ]}
      />
      <BottomNav 
        items={parentNavItems} 
        notifications={{
          messages: unreadMessagesCount,
        }}
      />
    </div>
  );
};

export default DashboardParent;
