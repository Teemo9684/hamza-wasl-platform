import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ParentOverview } from "@/components/parent/ParentOverview";
import { useParentDashboard } from "@/components/ParentDashboardLayout";
import { realtimeManager } from "@/utils/realtimeManager";
import { useNotifications } from "@/contexts/NotificationContext";
import { useNavigate } from "react-router-dom";
import { useOfflineCache, isOffline } from "@/hooks/useOfflineCache";

export const ParentOverviewContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { children, selectedChild, setSelectedChild, refreshData } = useParentDashboard();
  const [attendance, setAttendance] = useState<any[]>([]);
  
  const { clearSection } = useNotifications();
  const { saveToCache, loadFromCache } = useOfflineCache<any[]>(`parent_overview_attendance_${selectedChild}`);

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

  const fetchChildDetails = async (childId: string) => {
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
      } else {
        toast({
          title: "خطأ",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const calculateAttendanceRate = (childId: string) => {
    const childAttendance = attendance.filter(a => a.student_id === childId);
    if (childAttendance.length === 0) return 0;

    const presentCount = childAttendance.filter(a => a.status === 'حاضر').length;
    return Number(((presentCount / childAttendance.length) * 100).toFixed(1));
  };

  const handleNavigate = (sectionId: string) => {
    if (sectionId === 'attendance') {
      clearSection('attendance');
    } else if (sectionId === 'homework') {
      clearSection('homework');
    } else if (sectionId === 'documents') {
      clearSection('documents');
    }
    
    if (sectionId === 'overview') {
      return;
    }
    navigate(`/dashboard/parent/${sectionId}`);
  };

  return (
    <ParentOverview
      children={children}
      selectedChild={selectedChild}
      onSelectChild={setSelectedChild}
      attendance={attendance}
      calculateAttendanceRate={calculateAttendanceRate}
      onChildAdded={refreshData}
    />
  );
};

export default ParentOverviewContent;
