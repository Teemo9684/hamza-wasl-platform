import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { ParentOverview } from "@/components/parent/ParentOverview";
import { NewsTicker } from "@/components/NewsTicker";
import { useNewsTicker } from "@/hooks/useNewsTicker";
import { AnimatePresence } from "framer-motion";
import { AnimatedSection } from "@/components/AnimatedSection";
import { BottomNav, parentNavItems } from "@/components/BottomNav";
import { setAppBadge } from "@/utils/appBadge";
import { realtimeManager } from "@/utils/realtimeManager";
import { playNotificationSound } from "@/utils/pushNotifications";
import { mediumHaptic } from "@/utils/haptics";

const ParentOverviewPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasNews, tickerHeight } = useNewsTicker();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [parentName, setParentName] = useState<string>("");
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [pendingHomeworkCount, setPendingHomeworkCount] = useState(0);
  const [newAttendanceCount, setNewAttendanceCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Child IDs for subscriptions
  const childIds = useMemo(() => children.map(c => c.id), [children]);

  useEffect(() => {
    fetchParentData();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchChildDetails(selectedChild);
    }
  }, [selectedChild]);

  // Real-time subscription for messages
  useEffect(() => {
    if (!currentUserId) return;

    const handleMessageChange = async (payload: any) => {
      if (payload.eventType === 'REFRESH') {
        const { data: messagesData } = await supabase
          .from('messages')
          .select('id, is_read')
          .eq('recipient_id', currentUserId)
          .eq('is_read', false);
        
        const unreadCount = messagesData?.length || 0;
        setUnreadMessagesCount(unreadCount);
        setAppBadge(unreadCount);
        return;
      }

      if (payload.eventType === 'INSERT') {
        const newMessage = payload.new as any;
        
        const { data: senderData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', newMessage.sender_id)
          .single();

        setUnreadMessagesCount(prev => {
          const newCount = prev + 1;
          setAppBadge(newCount);
          return newCount;
        });
        
        // Play sound + vibration
        playNotificationSound('message');
        mediumHaptic();
        
        sonnerToast.success("رسالة جديدة", {
          description: senderData?.full_name || 'رسالة جديدة من المعلم',
        });
      }

      if (payload.eventType === 'UPDATE') {
        // Refetch unread count on update
        const { data: messagesData } = await supabase
          .from('messages')
          .select('id, is_read')
          .eq('recipient_id', currentUserId)
          .eq('is_read', false);
        
        const unreadCount = messagesData?.length || 0;
        setUnreadMessagesCount(unreadCount);
        setAppBadge(unreadCount);
      }
    };

    const cleanup = realtimeManager.subscribe(
      `parent-overview-messages-${currentUserId}`,
      'messages',
      handleMessageChange,
      `recipient_id=eq.${currentUserId}`
    );

    return () => cleanup();
  }, [currentUserId]);

  // Real-time subscription for attendance
  useEffect(() => {
    if (!selectedChild) return;

    const handleAttendanceChange = async (payload: any) => {
      if (payload.eventType === 'REFRESH') {
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('*')
          .eq('student_id', selectedChild)
          .order('date', { ascending: false });
        
        if (attendanceData) {
          setAttendance(attendanceData);
        }
        return;
      }

      if (payload.eventType === 'INSERT') {
        const newAttendance = payload.new as any;
        setAttendance(prev => [newAttendance, ...prev]);
        
        // Increment new attendance count
        setNewAttendanceCount(prev => prev + 1);
        
        // Play sound + vibration
        playNotificationSound('attendance');
        mediumHaptic();
        
        sonnerToast.info('تم تسجيل الحضور', {
          description: `حالة اليوم: ${newAttendance.status}`,
        });
      }

      if (payload.eventType === 'UPDATE') {
        const updatedAttendance = payload.new as any;
        setAttendance(prev => prev.map(a => 
          a.id === updatedAttendance.id ? updatedAttendance : a
        ));
      }

      if (payload.eventType === 'DELETE') {
        const deletedAttendance = payload.old as any;
        setAttendance(prev => prev.filter(a => a.id !== deletedAttendance.id));
      }
    };

    const cleanup = realtimeManager.subscribe(
      `parent-overview-attendance-${selectedChild}`,
      'attendance',
      handleAttendanceChange,
      `student_id=eq.${selectedChild}`
    );

    return () => cleanup();
  }, [selectedChild]);

  // Real-time subscription for homework
  useEffect(() => {
    if (children.length === 0) return;

    const handleHomeworkChange = async (payload: any) => {
      if (payload.eventType === 'REFRESH') {
        await fetchHomeworkCount();
        return;
      }

      if (payload.eventType === 'INSERT') {
        const newHomework = payload.new as any;
        
        // Check if homework is for one of the children's grade levels
        const childGrades = children.map(c => c.grade_level);
        if (childGrades.includes(newHomework.grade_level)) {
          setPendingHomeworkCount(prev => prev + 1);
          
          // Play sound + vibration
          playNotificationSound('homework');
          mediumHaptic();
          
          sonnerToast.info('واجب جديد', {
            description: newHomework.title || 'تم إضافة واجب جديد',
          });
        }
      }
    };

    const cleanup = realtimeManager.subscribe(
      `parent-overview-homework-${currentUserId}`,
      'homework',
      handleHomeworkChange
    );

    return () => cleanup();
  }, [children, currentUserId]);

  const fetchHomeworkCount = async () => {
    if (children.length === 0) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const childGrades = [...new Set(children.map(c => c.grade_level))];
      
      const { data: homeworkData } = await supabase
        .from('homework')
        .select('id')
        .in('grade_level', childGrades)
        .gte('due_date', today)
        .lte('due_date', nextWeek.toISOString().split('T')[0]);
      
      setPendingHomeworkCount(homeworkData?.length || 0);
    } catch (error) {
      console.error('Error fetching homework count:', error);
    }
  };

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

      // Get unread messages count
      const { data: messagesData } = await supabase
        .from('messages')
        .select('id, is_read')
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      const unreadCount = messagesData?.length || 0;
      setUnreadMessagesCount(unreadCount);
      setAppBadge(unreadCount);
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

  // Fetch homework count when children are loaded
  useEffect(() => {
    if (children.length > 0) {
      fetchHomeworkCount();
    }
  }, [children]);

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

  const handleNavigate = (sectionId: string) => {
    // Clear badge when navigating to section
    if (sectionId === 'attendance') {
      setNewAttendanceCount(0);
    } else if (sectionId === 'homework') {
      setPendingHomeworkCount(0);
    }
    
    if (sectionId === 'overview') {
      return;
    }
    navigate(`/dashboard/parent/${sectionId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const headerHeight = 56;

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-clip pt-[env(safe-area-inset-top)]">
      {hasNews && (
        <div className="fixed top-[env(safe-area-inset-top)] left-0 right-0 z-50">
          <NewsTicker />
        </div>
      )}
      
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

      <div style={{ height: (hasNews ? tickerHeight : 0) + headerHeight }} />

      <main className="flex-1 p-3 md:p-4 pb-24 w-full">
        <AnimatePresence mode="wait">
          <AnimatedSection key="parent-overview">
            <div className="max-w-6xl mx-auto w-full">
              <ParentOverview
                children={children}
                selectedChild={selectedChild}
                onSelectChild={setSelectedChild}
                attendance={attendance}
                calculateAttendanceRate={calculateAttendanceRate}
                onChildAdded={fetchParentData}
              />
            </div>
          </AnimatedSection>
        </AnimatePresence>
      </main>

      <BottomNav 
        items={parentNavItems} 
        activeSection="overview"
        onNavigate={handleNavigate}
        useHashNavigation={false}
        notifications={{
          messages: unreadMessagesCount,
          attendance: newAttendanceCount,
          homework: pendingHomeworkCount,
        }}
      />
    </div>
  );
};

export default ParentOverviewPage;
