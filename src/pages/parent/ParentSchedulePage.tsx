import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ParentSchedule } from "@/components/parent/ParentSchedule";
import { DashboardLayout } from "@/components/DashboardLayout";
import { BottomNav, parentNavItems } from "@/components/BottomNav";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNotifications } from "@/contexts/NotificationContext";

const ParentSchedulePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
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

  const handleNavigate = (sectionId: string) => {
    if (sectionId === 'schedule') return;
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
          <h1 className="text-sm md:text-lg font-bold truncate leading-tight">الجدول الدراسي</h1>
        </div>
        <div className="w-20"></div>
      </div>
    </header>
  );

  const bottomNav = (
    <BottomNav 
      items={parentNavItems} 
      activeSection="schedule"
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
      {children.length > 1 && (
        <div className="mb-4">
          <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="اختر الطفل" />
            </SelectTrigger>
            <SelectContent>
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  {child.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <ParentSchedule selectedChild={selectedChild} children={children} />
    </DashboardLayout>
  );
};

export default ParentSchedulePage;
