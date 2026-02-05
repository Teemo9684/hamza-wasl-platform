import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ParentAttendance } from "@/components/parent/ParentAttendance";
import { useParentDashboard } from "@/components/ParentDashboardLayout";
import { realtimeManager } from "@/utils/realtimeManager";
import { playNotificationSound } from "@/utils/pushNotifications";
import { mediumHaptic } from "@/utils/haptics";
import { toast as sonnerToast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNotifications } from "@/contexts/NotificationContext";
import { useOfflineCache, isOffline } from "@/hooks/useOfflineCache";
import { Card, CardContent } from "@/components/ui/card";
import { WifiOff } from "lucide-react";

export const ParentAttendanceContent = () => {
  const { toast } = useToast();
  const { children, selectedChild, setSelectedChild } = useParentDashboard();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  
  const { clearSection } = useNotifications();
  const { saveToCache, loadFromCache } = useOfflineCache<any[]>(`parent_attendance_${selectedChild}`);

  useEffect(() => {
    clearSection('attendance');
  }, [clearSection]);

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

  const fetchChildDetails = async (childId: string) => {
    setIsOfflineMode(isOffline());

    // Try to load from cache first if offline
    if (isOffline()) {
      const cachedData = await loadFromCache();
      if (cachedData) {
        setAttendance(cachedData);
        return;
      }
    }

    try {
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', childId)
        .order('date', { ascending: false });

      if (attendanceError) throw attendanceError;
      setAttendance(attendanceData || []);

      // Save to cache for offline use
      if (attendanceData && attendanceData.length > 0) {
        await saveToCache(attendanceData);
      }
    } catch (error: any) {
      console.error("Error fetching attendance:", error);
      // Try to load from cache on network error
      const cachedData = await loadFromCache();
      if (cachedData) {
        setAttendance(cachedData);
        setIsOfflineMode(true);
      } else {
        toast({
          title: "خطأ",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <>
      {isOfflineMode && (
        <Card className="bg-muted/50 border-dashed mb-4">
          <CardContent className="p-3 flex items-center gap-2 text-muted-foreground">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-cairo">وضع عدم الاتصال - يتم عرض البيانات المحفوظة</span>
          </CardContent>
        </Card>
      )}
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
    </>
  );
};

export default ParentAttendanceContent;
