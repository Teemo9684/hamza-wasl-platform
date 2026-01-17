import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ParentSettings } from "@/components/parent/ParentSettings";
import { DashboardLayout } from "@/components/DashboardLayout";
import { BottomNav, parentNavItems } from "@/components/BottomNav";
import { useNotifications } from "@/contexts/NotificationContext";

const ParentSettingsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { counts, clearSection, setUserId, setChildIds } = useNotifications();

  useEffect(() => {
    fetchParentData();
  }, []);

  const fetchParentData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login/parent");
        return;
      }

      setUserId(user.id);

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
    if (sectionId === 'settings') return;
    if (sectionId === 'attendance') clearSection('attendance');
    else if (sectionId === 'homework') clearSection('homework');
    if (sectionId === 'overview') {
      navigate('/dashboard/parent');
    } else {
      navigate(`/dashboard/parent/${sectionId}`);
    }
  };

  const header = (
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
          <h1 className="text-sm md:text-lg font-bold truncate leading-tight">الإعدادات</h1>
        </div>
        <div className="w-20"></div>
      </div>
    </header>
  );

  const bottomNav = (
    <BottomNav 
      items={parentNavItems} 
      activeSection="settings"
      onNavigate={handleNavigate}
      useHashNavigation={false}
      notifications={{
        messages: counts.messages,
        attendance: counts.attendance,
        homework: counts.homework,
        documents: counts.documents,
      }}
    />
  );

  return (
    <DashboardLayout header={header} bottomNav={bottomNav}>
      <ParentSettings
        children={children}
        onChildRemoved={fetchParentData}
      />
    </DashboardLayout>
  );
};

export default ParentSettingsPage;
