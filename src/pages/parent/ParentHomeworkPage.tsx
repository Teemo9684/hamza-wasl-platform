import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ParentHomework } from "@/components/parent/ParentHomework";
import { NewsTicker } from "@/components/NewsTicker";
import { useNewsTicker } from "@/hooks/useNewsTicker";
import { BottomNav, parentNavItems } from "@/components/BottomNav";
import { useNotifications } from "@/contexts/NotificationContext";
import ContentTransition from "@/components/ContentTransition";

const ParentHomeworkPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasNews, tickerHeight } = useNewsTicker();
  const [loading, setLoading] = useState(true);
  
  const { counts, clearSection, setUserId, setChildIds, setUserRole } = useNotifications();

  // Clear homework badge when entering this page
  useEffect(() => {
    clearSection('homework');
  }, [clearSection]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login/parent");
        return;
      }
      
      setUserId(user.id);
      
      // Fetch children to set in context
      const { data: childrenData } = await supabase
        .from('students')
        .select(`id, parent_students!inner(parent_id)`)
        .eq('parent_students.parent_id', user.id);
      
      if (childrenData && childrenData.length > 0) {
        setChildIds(childrenData.map(c => c.id));
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

  const handleNavigate = (sectionId: string) => {
    if (sectionId === 'homework') {
      return; // Already here
    }
    if (sectionId === 'attendance') {
      clearSection('attendance');
    }
    if (sectionId === 'overview') {
      navigate('/dashboard/parent');
    } else {
      navigate(`/dashboard/parent/${sectionId}`);
    }
  };

  // No loading spinner - content will render when ready

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
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard/parent')}
              className="font-cairo h-10 px-3 text-sm active:scale-95 touch-feedback"
              size="sm"
            >
              <ArrowRight className="ml-1.5 h-4 w-4" />
              رجوع
            </Button>
            <div className="min-w-0 flex-1 text-center">
              <h1 className="text-sm md:text-lg font-bold truncate leading-tight">الواجبات المنزلية</h1>
            </div>
            <div className="w-20"></div>
          </div>
        </header>
      </div>

      <div style={{ height: (hasNews ? tickerHeight : 0) + headerHeight }} />

      <main className="flex-1 p-3 md:p-4 pb-24 w-full">
        <ContentTransition>
          <div className="max-w-6xl mx-auto w-full">
            <ParentHomework />
          </div>
        </ContentTransition>
      </main>

      <BottomNav 
        items={parentNavItems} 
        activeSection="homework"
        onNavigate={handleNavigate}
        useHashNavigation={false}
        notifications={{
          messages: counts.messages,
          attendance: counts.attendance,
          homework: counts.homework,
          documents: counts.documents,
        }}
      />
    </div>
  );
};

export default ParentHomeworkPage;
