import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ParentAttendance } from "@/components/parent/ParentAttendance";
import { DashboardLayout } from "@/components/DashboardLayout";
import { BottomNav, parentNavItems } from "@/components/BottomNav";
import { realtimeManager } from "@/utils/realtimeManager";
import { playNotificationSound } from "@/utils/pushNotifications";
import { mediumHaptic } from "@/utils/haptics";
import { toast as sonnerToast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNotifications } from "@/contexts/NotificationContext";

const ParentAttendancePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { counts, clearSection, setUserId, setChildIds } = useNotifications();

  useEffect(() => {
    clearSection('attendance');
  }, [clearSection]);

  useEffect(() => {
    fetchParentData();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchChildDetails(selectedChild);
    }
  }, [selectedChild]);

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
      `parent-attendance-${selectedChild}`,
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

  const handleNavigate = (sectionId: string) => {
    if (sectionId === 'attendance') return;
    if (sectionId === 'homework') clearSection('homework');
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
          <h1 className="text-sm md:text-lg font-bold truncate leading-tight">سجل الحضور</h1>
        </div>
        <div className="w-20"></div>
      </div>
    </header>
  );

  const bottomNav = (
    <BottomNav 
      items={parentNavItems} 
      activeSection="attendance"
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
      <ParentAttendance attendance={attendance} selectedChild={selectedChild} />
    </DashboardLayout>
  );
};

export default ParentAttendancePage;
