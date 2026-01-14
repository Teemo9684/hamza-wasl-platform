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
import { FloatingMessageBadge } from "@/components/FloatingMessageBadge";
import { BottomNav, parentNavItems } from "@/components/BottomNav";
import { realtimeManager } from "@/utils/realtimeManager";

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

  // Real-time subscription for messages
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`parent-messages-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${currentUserId}`
        },
        async (payload) => {
          // تم استلام رسالة جديدة - إضافتها مباشرة للقائمة
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

          setReceivedMessages(prev => [enrichedMessage, ...prev]);
          sonnerToast.success("رسالة جديدة من المعلم");
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${currentUserId}`
        },
        (payload) => {
          const updatedMessage = payload.new as any;
          setReceivedMessages(prev => prev.map(msg => 
            msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const unreadMessagesCount = receivedMessages.filter(m => !m.is_read).length;

  const scrollToMessages = () => {
    const messagesSection = document.getElementById('messages');
    if (messagesSection) {
      messagesSection.scrollIntoView({ behavior: 'smooth' });
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
        className="fixed left-0 right-0 z-40 backdrop-blur-xl bg-background/80 border-b shadow-md"
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

      <FloatingMessageBadge unreadCount={unreadMessagesCount} onClick={scrollToMessages} />
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
