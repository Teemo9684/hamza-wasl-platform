import { useState, useEffect, createContext, useContext } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NewsTicker } from "@/components/NewsTicker";
import { useNewsTicker } from "@/hooks/useNewsTicker";
import { BottomNav, teacherNavItems } from "@/components/BottomNav";
import { useNotifications } from "@/contexts/NotificationContext";

// Context to share data between layout and pages
interface TeacherDashboardContextType {
  teacherName: string;
  loading: boolean;
}

const TeacherDashboardContext = createContext<TeacherDashboardContextType | null>(null);

export const useTeacherDashboard = () => {
  const context = useContext(TeacherDashboardContext);
  if (!context) {
    throw new Error("useTeacherDashboard must be used within TeacherDashboardLayout");
  }
  return context;
};

export const TeacherDashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasNews, tickerHeight } = useNewsTicker();
  const headerHeight = 56;
  
  const [loading, setLoading] = useState(true);
  const [teacherName, setTeacherName] = useState<string>("");
  
  const { counts, clearSection, setUserId, setUserRole } = useNotifications();

  // Determine active section from current path
  const getActiveSection = () => {
    const path = location.pathname;
    if (path.includes('/attendance')) return 'attendance';
    if (path.includes('/homework')) return 'homework';
    if (path.includes('/messages')) return 'messages';
    if (path.includes('/groupMessages')) return 'groupMessages';
    return 'overview';
  };

  const fetchTeacherData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login/teacher");
        return;
      }

      setUserId(user.id);
      setUserRole('teacher');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      setTeacherName(profileData?.full_name || "المعلم");
    } catch (error: any) {
      console.error("Error fetching teacher data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleNavigate = (sectionId: string) => {
    if (sectionId === 'messages') {
      clearSection('messages');
    }
    
    if (sectionId === 'overview') {
      navigate('/dashboard/teacher');
    } else {
      navigate(`/dashboard/teacher/${sectionId}`);
    }
  };

  const contextValue: TeacherDashboardContextType = {
    teacherName,
    loading,
  };

  return (
    <TeacherDashboardContext.Provider value={contextValue}>
      <div className="min-h-screen flex flex-col w-full overflow-x-clip pt-[env(safe-area-inset-top)]">
        {/* شريط الأخبار الثابت */}
        {hasNews && (
          <div className="fixed top-[env(safe-area-inset-top)] left-0 right-0 z-50">
            <NewsTicker />
          </div>
        )}
        
        {/* الهيدر الثابت */}
        <div 
          className="fixed left-0 right-0 z-40 bg-background/98 backdrop-blur-xl border-b shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
          style={{ top: `calc(env(safe-area-inset-top) + ${hasNews ? tickerHeight : 0}px)` }}
        >
          <header>
            <div className="flex h-14 md:h-16 items-center justify-between px-3 md:px-6">
              <div className="min-w-0 flex-1">
                <h1 className="text-sm md:text-lg font-bold truncate leading-tight">مرحباً، {teacherName}</h1>
                <p className="text-[11px] md:text-xs text-muted-foreground truncate">لوحة تحكم المعلم</p>
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

        {/* المسافة العلوية */}
        <div style={{ height: (hasNews ? tickerHeight : 0) + headerHeight }} />

        {/* المحتوى الرئيسي */}
        <main className="flex-1 p-3 md:p-4 pb-24 w-full">
          <div className="max-w-6xl mx-auto w-full">
            <Outlet />
          </div>
        </main>

        {/* شريط التنقل السفلي */}
        <BottomNav 
          items={teacherNavItems} 
          activeSection={getActiveSection()}
          onNavigate={handleNavigate}
          useHashNavigation={false}
          notifications={{
            messages: counts.messages,
          }}
        />
      </div>
    </TeacherDashboardContext.Provider>
  );
};
