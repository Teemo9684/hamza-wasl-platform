import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ParentOverview } from "@/components/parent/ParentOverview";
import { NewsTicker } from "@/components/NewsTicker";
import { useNewsTicker } from "@/hooks/useNewsTicker";
import { AnimatePresence } from "framer-motion";
import { AnimatedSection } from "@/components/AnimatedSection";
import { BottomNav, parentNavItems } from "@/components/BottomNav";
import { useNotifications } from "@/contexts/NotificationContext";
import { realtimeManager } from "@/utils/realtimeManager";

const ParentOverviewPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasNews, tickerHeight } = useNewsTicker();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [parentName, setParentName] = useState<string>("");
  
  const { counts, clearSection, setUserId, setChildIds, setUserRole } = useNotifications();

  useEffect(() => {
    fetchParentData();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchChildDetails(selectedChild);
    }
  }, [selectedChild]);

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

  const fetchParentData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login/parent");
        return;
      }

      // Set user ID and role in notification context
      setUserId(user.id);
      setUserRole('parent');

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
      
      // Set child IDs in notification context
      if (childrenData && childrenData.length > 0) {
        setChildIds(childrenData.map(c => c.id));
        setSelectedChild(childrenData[0].id);
      }
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

  const handleNavigate = (sectionId: string) => {
    // Clear the section's badge when navigating to it
    if (sectionId === 'attendance') {
      clearSection('attendance');
    } else if (sectionId === 'homework') {
      clearSection('homework');
    } else if (sectionId === 'messages') {
      // Messages are marked as read individually, not cleared here
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
          messages: counts.messages,
          attendance: counts.attendance,
          homework: counts.homework,
        }}
      />
    </div>
  );
};

export default ParentOverviewPage;
