import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TeacherSidebar } from "@/components/teacher/TeacherSidebar";
import { TeacherOverview } from "@/components/teacher/TeacherOverview";
import { TeacherStudents } from "@/components/teacher/TeacherStudents";
import { TeacherAttendance } from "@/components/teacher/TeacherAttendance";
import { TeacherMessages } from "@/components/teacher/TeacherMessages";
import { messageSchema, attendanceNotesSchema } from "@/lib/validations";

const DashboardTeacher = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherInfo, setTeacherInfo] = useState<{ name: string; subject: string }>({ name: "", subject: "" });

  useEffect(() => {
    fetchTeacherData();

    // Subscribe to new messages in real-time
    const channel = supabase
      .channel('teacher-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${supabase.auth.getUser().then(({ data }) => data.user?.id)}`
        },
        (payload) => {
          console.log('New message received:', payload);
          sonnerToast.success("رسالة جديدة من ولي أمر");
          fetchTeacherData(); // Refresh messages
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTeacherData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login/teacher");
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      setTeacherInfo({
        name: profileData?.full_name || "المعلم",
        subject: user.user_metadata?.subject || "المادة غير محددة"
      });

      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          *,
          teacher_students!inner(teacher_id)
        `)
        .eq('teacher_students.teacher_id', user.id);

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

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
      setMessages(messagesData || []);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleAddStudent = async (student: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .insert({
          full_name: student.full_name,
          national_school_id: student.national_school_id,
          grade_level: student.grade_level,
          class_section: student.class_section,
        })
        .select()
        .single();

      if (studentError) throw studentError;

      const { error: linkError } = await supabase
        .from('teacher_students')
        .insert({
          teacher_id: user.id,
          student_id: studentData.id,
        });

      if (linkError) throw linkError;

      toast({
        title: "تم بنجاح",
        description: "تمت إضافة التلميذ بنجاح",
      });

      fetchTeacherData();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم حذف التلميذ بنجاح",
      });

      fetchTeacherData();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRecordAttendance = async (studentId: string, status: string, notes: string) => {
    try {
      // Validate attendance notes
      attendanceNotesSchema.parse(notes);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('attendance')
        .insert({
          student_id: studentId,
          date: new Date().toISOString().split('T')[0],
          status: status,
          notes: notes,
          recorded_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم تسجيل الحضور بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.errors?.[0]?.message || error.message,
        variant: "destructive",
      });
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
      fetchTeacherData();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSendReply = async (
    messageId: string,
    recipientId: string,
    originalSubject: string,
    studentId: string,
    content: string
  ) => {
    try {
      // Validate reply content
      messageSchema.parse({
        subject: `رد: ${originalSubject}`,
        content: content,
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          subject: `رد: ${originalSubject}`,
          content: content,
          student_id: studentId,
        });

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إرسال الرد بنجاح",
      });

      await handleMarkAsRead(messageId);
      fetchTeacherData();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.errors?.[0]?.message || error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <TeacherSidebar unreadCount={unreadCount} />

        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-20 border-b bg-background shadow-sm">
            <div className="flex h-28 items-center justify-between px-4 md:px-6">
              <div className="flex items-center gap-2 md:gap-4 min-w-0">
                <SidebarTrigger className="shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-lg md:text-xl font-bold truncate">لوحة تحكم المعلم</h1>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">إدارة التلاميذ والتواصل</p>
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
                <TeacherOverview
                  teacherInfo={teacherInfo}
                  studentsCount={students.length}
                  unreadMessagesCount={unreadCount}
                />
              </section>

              <section id="students">
                <TeacherStudents
                  students={students}
                  onAddStudent={handleAddStudent}
                  onDeleteStudent={handleDeleteStudent}
                />
              </section>

              <section id="attendance">
                <TeacherAttendance
                  students={students}
                  onRecordAttendance={handleRecordAttendance}
                />
              </section>

              <section id="messages">
                <TeacherMessages
                  messages={messages}
                  onMarkAsRead={handleMarkAsRead}
                  onSendReply={handleSendReply}
                />
              </section>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardTeacher;
