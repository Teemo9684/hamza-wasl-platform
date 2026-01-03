import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { TeacherOverview } from "@/components/teacher/TeacherOverview";
import { TeacherAttendance } from "@/components/teacher/TeacherAttendance";
import { TeacherMessages } from "@/components/teacher/TeacherMessages";
import { TeacherGroupMessaging } from "@/components/teacher/TeacherGroupMessaging";
import { TeacherHomework } from "@/components/teacher/TeacherHomework";
import { NewsTicker } from "@/components/NewsTicker";
import { AnimatePresence } from "framer-motion";
import { AnimatedSection } from "@/components/AnimatedSection";
import { FloatingMessageBadge } from "@/components/FloatingMessageBadge";
import { BottomNav, teacherNavItems } from "@/components/BottomNav";
import { messageSchema, attendanceNotesSchema } from "@/lib/validations";

const DashboardTeacher = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherInfo, setTeacherInfo] = useState<{ name: string; subject: string }>({ name: "", subject: "" });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  // Real-time subscription for messages
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`teacher-messages-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${currentUserId}`
        },
        async (payload) => {
          // تم استلام رسالة جديدة - إضافتها مباشرة للقائمة
          const newMessage = payload.new as any;
          
          // جلب بيانات المرسل والطالب
          const { data: senderData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', newMessage.sender_id)
            .single();
          
          let studentData = null;
          if (newMessage.student_id) {
            const { data } = await supabase
              .from('students')
              .select('full_name')
              .eq('id', newMessage.student_id)
              .single();
            studentData = data;
          }

          const enrichedMessage = {
            ...newMessage,
            sender: senderData,
            student: studentData
          };

          setMessages(prev => [enrichedMessage, ...prev]);
          sonnerToast.success("رسالة جديدة من ولي أمر");
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${currentUserId}`
        },
        (payload) => {
          const updatedMessage = payload.new as any;
          setMessages(prev => prev.map(msg => 
            msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const fetchTeacherData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login/teacher");
        return;
      }

      setCurrentUserId(user.id);

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
        .select('*')
        .in('grade_level', 
          (await supabase
            .from('teacher_grade_levels')
            .select('grade_level')
            .eq('teacher_id', user.id)
          ).data?.map(r => r.grade_level) || []
        );

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

      // Check if teacher is assigned to this grade level
      const { data: assignedGrades } = await supabase
        .from('teacher_grade_levels')
        .select('grade_level')
        .eq('teacher_id', user.id);

      const teacherGrades = assignedGrades?.map(g => g.grade_level) || [];
      
      if (!teacherGrades.includes(student.grade_level)) {
        toast({
          title: "خطأ",
          description: "لا يمكنك إضافة تلميذ لمستوى غير مسند إليك",
          variant: "destructive",
        });
        return;
      }

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

  const handleSendMessageToParent = async (parentId: string, studentId: string) => {
    // This function will open the messages section and pre-select the parent and student
    // For now, we'll navigate to the messages section
    const messagesSection = document.getElementById('messages');
    if (messagesSection) {
      messagesSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    toast({
      title: "التواصل مع ولي الأمر",
      description: "انتقل إلى قسم الرسائل لإرسال رسالة لولي الأمر",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const unreadCount = messages.filter(m => !m.is_read).length;

  const scrollToMessages = () => {
    const messagesSection = document.getElementById('messages');
    if (messagesSection) {
      messagesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col w-full">
      <div className="sticky top-0 z-30 backdrop-blur-lg bg-background/70 border-b shadow-lg">
        <NewsTicker />
        <header>
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <div className="min-w-0">
              <h1 className="text-base md:text-lg font-bold truncate">لوحة تحكم المعلم</h1>
              <p className="text-xs text-muted-foreground truncate hidden sm:block">إدارة التلاميذ والتواصل</p>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="font-cairo"
            >
              <LogOut className="ml-2 h-4 w-4" />
              تسجيل الخروج
            </Button>
          </div>
        </header>
      </div>

      <main className="flex-1 overflow-y-auto p-4 pb-20 w-full">
        <AnimatePresence mode="wait">
          <AnimatedSection key="teacher-dashboard">
            <div className="max-w-6xl mx-auto space-y-8 w-full">
              <section id="overview">
                <TeacherOverview
                  teacherInfo={teacherInfo}
                  studentsCount={students.length}
                  unreadMessagesCount={unreadCount}
                  students={students}
                  onSendMessage={handleSendMessageToParent}
                />
              </section>

              <section id="attendance">
                <TeacherAttendance
                  students={students}
                  onRecordAttendance={handleRecordAttendance}
                />
              </section>

              <section id="homework">
                <TeacherHomework />
              </section>

              <section id="messages">
                <TeacherMessages
                  messages={messages}
                  onMarkAsRead={handleMarkAsRead}
                  onSendReply={handleSendReply}
                />
              </section>

              <section id="groupMessages">
                <TeacherGroupMessaging />
              </section>
            </div>
          </AnimatedSection>
        </AnimatePresence>
      </main>

      <FloatingMessageBadge unreadCount={unreadCount} onClick={scrollToMessages} />
      <BottomNav 
        items={teacherNavItems} 
        notifications={{
          messages: unreadCount,
        }}
      />
    </div>
  );
};

export default DashboardTeacher;
