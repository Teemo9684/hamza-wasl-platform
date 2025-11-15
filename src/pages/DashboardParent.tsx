import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ParentSidebar } from "@/components/parent/ParentSidebar";
import { ParentOverview } from "@/components/parent/ParentOverview";
import { ParentAttendance } from "@/components/parent/ParentAttendance";
import { ParentMessages } from "@/components/parent/ParentMessages";

const DashboardParent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [children, setChildren] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [parentName, setParentName] = useState<string>("");
  const [receivedMessages, setReceivedMessages] = useState<any[]>([]);

  useEffect(() => {
    fetchParentData();

    // Subscribe to new messages in real-time
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('parent-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `recipient_id=eq.${user.id}`
          },
          (payload) => {
            console.log('New message received:', payload);
            sonnerToast.success("رسالة جديدة من المعلم");
            fetchParentData(); // Refresh messages
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtimeSubscription();
  }, []);

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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <ParentSidebar
          children={children}
          selectedChild={selectedChild}
          onChildChange={(childId) => {
            setSelectedChild(childId);
            fetchChildDetails(childId);
          }}
        />

        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-20 items-center justify-between px-4 md:px-6">
              <div className="flex items-center gap-2 md:gap-4 min-w-0">
                <SidebarTrigger className="shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-lg md:text-xl font-bold truncate">مرحباً، {parentName}</h1>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">لوحة تحكم ولي الأمر</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="gap-2 shrink-0"
                size="sm"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">تسجيل الخروج</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-12">
              <section id="overview">
                <ParentOverview
                  children={children}
                  selectedChild={selectedChild}
                  attendance={attendance}
                  calculateAttendanceRate={calculateAttendanceRate}
                />
              </section>

              <section id="attendance">
                <ParentAttendance attendance={attendance} selectedChild={selectedChild} />
              </section>

              <section id="messages">
                <ParentMessages
                  teachers={teachers}
                  receivedMessages={receivedMessages}
                  children={children}
                  onMessageSent={fetchParentData}
                />
              </section>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardParent;
