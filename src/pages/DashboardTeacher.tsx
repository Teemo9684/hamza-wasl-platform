import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
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
import { useNewsTicker } from "@/hooks/useNewsTicker";
import { AnimatePresence } from "framer-motion";
import { AnimatedSection } from "@/components/AnimatedSection";
import { FloatingMessageBadge } from "@/components/FloatingMessageBadge";
import { BottomNav, teacherNavItems } from "@/components/BottomNav";
import { messageSchema, attendanceNotesSchema } from "@/lib/validations";
import { sendMessageNotification, sendAttendanceNotification } from "@/utils/sendPushNotification";
import { setAppBadge } from "@/utils/appBadge";
import { playNotificationSound } from "@/utils/pushNotifications";
import { realtimeManager } from "@/utils/realtimeManager";

interface StudentsByGrade {
  [gradeLevel: string]: any[];
}

const DashboardTeacher = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasNews, tickerHeight } = useNewsTicker();
  const [students, setStudents] = useState<any[]>([]);
  const [studentsByGrade, setStudentsByGrade] = useState<StudentsByGrade>({});
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherInfo, setTeacherInfo] = useState<{ name: string; subject: string }>({ name: "", subject: "" });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLanguageTeacher, setIsLanguageTeacher] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState(false);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  // Real-time subscription for messages using realtimeManager for better reconnection handling
  useEffect(() => {
    if (!currentUserId) return;

    console.log('Setting up realtime subscription for teacher messages via realtimeManager, user:', currentUserId);

    const handleMessageChange = async (payload: any) => {
      console.log('Teacher message change received:', payload);
      
      // Handle REFRESH event (when app comes back to foreground)
      if (payload.eventType === 'REFRESH') {
        console.log('Refreshing teacher messages data...');
        const { data: messagesData } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey(full_name),
            student:students(full_name)
          `)
          .eq('recipient_id', currentUserId)
          .order('created_at', { ascending: false });
        
        if (messagesData) {
          setMessages(messagesData);
          const unreadCount = messagesData.filter(m => !m.is_read).length;
          setAppBadge(unreadCount);
        }
        return;
      }

      // Handle INSERT event
      if (payload.eventType === 'INSERT') {
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

        setMessages(prev => {
          const updated = [enrichedMessage, ...prev];
          const unreadCount = updated.filter(m => !m.is_read).length;
          setAppBadge(unreadCount);
          return updated;
        });
        
        // Re-show notifications when new message arrives
        setDismissedNotifications(false);
        
        // Play notification sound
        playNotificationSound('message');
        sonnerToast.success("رسالة جديدة", {
          description: senderData?.full_name || 'رسالة جديدة من ولي أمر',
        });
      }

      // Handle UPDATE event
      if (payload.eventType === 'UPDATE') {
        const updatedMessage = payload.new as any;
        setMessages(prev => {
          const updated = prev.map(msg => 
            msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
          );
          const unreadCount = updated.filter(m => !m.is_read).length;
          setAppBadge(unreadCount);
          return updated;
        });
      }
    };

    // Use realtimeManager for better connection handling
    const cleanup = realtimeManager.subscribe(
      `teacher-messages-${currentUserId}`,
      'messages',
      handleMessageChange,
      `recipient_id=eq.${currentUserId}`
    );

    return () => {
      console.log('Cleaning up teacher realtime subscription');
      cleanup();
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

      // جلب المادة من جدول teacher_grade_levels
      const { data: teacherGradeLevels } = await supabase
        .from('teacher_grade_levels')
        .select('grade_level, subject')
        .eq('teacher_id', user.id);

      const teacherSubject = teacherGradeLevels?.[0]?.subject || user.user_metadata?.subject || "المادة غير محددة";
      
      setTeacherInfo({
        name: profileData?.full_name || "المعلم",
        subject: teacherSubject
      });

      // التحقق إذا كان أستاذ لغة (فرنسية أو إنجليزية)
      const languageSubjects = ['فرنسية', 'إنجليزية', 'انجليزية', 'الفرنسية', 'الإنجليزية', 'اللغة الفرنسية', 'اللغة الإنجليزية', 'francais', 'français', 'french', 'english', 'anglais'];
      const isLanguage = languageSubjects.some(lang => 
        teacherSubject.toLowerCase().includes(lang.toLowerCase())
      );
      setIsLanguageTeacher(isLanguage);

      console.log('Teacher subject:', teacherSubject, 'Is language teacher:', isLanguage);

      let studentsData: any[] = [];
      
      if (isLanguage) {
        // أستاذ اللغة: جلب تلاميذ السنوات 3، 4، 5 - استخدام المستويات المسندة مباشرة
        const assignedGrades = teacherGradeLevels?.map(r => r.grade_level) || [];
        console.log('Language teacher assigned grades:', assignedGrades);
        
        // جلب الطلاب من المستويات المسندة للأستاذ
        const targetGrades = assignedGrades.length > 0 ? assignedGrades : ['السنة الثالثة', 'السنة الرابعة', 'السنة الخامسة'];
        
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .or(targetGrades.map(g => `grade_level.ilike.%${g}%`).join(','))
          .order('grade_level', { ascending: true })
          .order('full_name', { ascending: true });

        if (error) throw error;
        studentsData = data || [];
        
        console.log('Language teacher students found:', studentsData.length);

        // إضافة الطلاب تلقائياً لجدول teacher_students إذا لم يكونوا موجودين
        if (studentsData.length > 0) {
          const teacherSubjectValue = teacherGradeLevels?.[0]?.subject || 'فرنسية';
          const studentLinks = studentsData.map(student => ({
            teacher_id: user.id,
            student_id: student.id,
            subject: teacherSubjectValue
          }));
          
          // استخدام upsert لتجنب التكرار
          const { error: linkError } = await supabase
            .from('teacher_students')
            .upsert(studentLinks, { 
              onConflict: 'teacher_id,student_id',
              ignoreDuplicates: true 
            });
          
          if (linkError) {
            console.log('Error linking students (may already exist):', linkError.message);
          }
        }

        // تجميع التلاميذ حسب المستوى الدراسي
        const grouped: StudentsByGrade = {};
        studentsData.forEach(student => {
          const grade = student.grade_level;
          if (!grouped[grade]) {
            grouped[grade] = [];
          }
          grouped[grade].push(student);
        });
        setStudentsByGrade(grouped);
      } else {
        // أستاذ عادي: جلب التلاميذ حسب المستويات المسندة
        const assignedGrades = teacherGradeLevels?.map(r => r.grade_level) || [];
        
        if (assignedGrades.length > 0) {
          const { data, error } = await supabase
            .from('students')
            .select('*')
            .in('grade_level', assignedGrades)
            .order('grade_level', { ascending: true })
            .order('full_name', { ascending: true });

          if (error) throw error;
          studentsData = data || [];
        }
      }

      setStudents(studentsData);

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

      // Get student info and parent ID for notification
      const student = students.find(s => s.id === studentId);
      if (student) {
        // Get parent ID from parent_students table
        const { data: parentData } = await supabase
          .from('parent_students')
          .select('parent_id')
          .eq('student_id', studentId);
        
        if (parentData && parentData.length > 0) {
          // Send notification to all parents of this student
          for (const parent of parentData) {
            await sendAttendanceNotification(
              parent.parent_id,
              student.full_name,
              status,
              notes
            );
          }
        }
      }

      toast({
        title: "تم بنجاح",
        description: "تم تسجيل الحضور وإرسال الإشعار لولي الأمر",
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

      // Send push notification to recipient
      await sendMessageNotification(
        [recipientId],
        teacherInfo.name || 'معلم',
        `رد: ${originalSubject}`
      );

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

  const unreadCount = messages.filter(m => !m.is_read).length;

  // Update app icon badge with unread count - must be before conditional return
  useEffect(() => {
    setAppBadge(unreadCount);
  }, [unreadCount]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const scrollToMessages = () => {
    const messagesSection = document.getElementById('messages');
    if (messagesSection) {
      messagesSection.scrollIntoView({ behavior: 'smooth' });
    }
    // Dismiss message notifications when clicked
    setDismissedNotifications(true);
  };

  const headerHeight = 56; // h-14 = 56px

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-clip pt-[env(safe-area-inset-top)]">
      {/* Fixed News Ticker - Always visible at top */}
      {hasNews && (
        <div className="fixed top-[env(safe-area-inset-top)] left-0 right-0 z-50">
          <NewsTicker />
        </div>
      )}
      
      {/* Fixed Header - Below News Ticker */}
      <div 
        className="fixed left-0 right-0 z-40 bg-background/98 backdrop-blur-xl border-b shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
        style={{ top: `calc(env(safe-area-inset-top) + ${hasNews ? tickerHeight : 0}px)` }}
      >
        <header>
          <div className="flex h-14 md:h-16 items-center justify-between px-3 md:px-6">
            <div className="min-w-0 flex-1">
              <h1 className="text-sm md:text-lg font-bold truncate leading-tight">لوحة تحكم المعلم</h1>
              <p className="text-[11px] md:text-xs text-muted-foreground truncate">إدارة التلاميذ والتواصل</p>
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

      {/* Spacer for fixed ticker + header */}
      <div style={{ height: (hasNews ? tickerHeight : 0) + headerHeight }} />

      <main className="flex-1 p-3 md:p-4 pb-24 w-full">
        <AnimatePresence mode="wait">
          <AnimatedSection key="teacher-dashboard">
            <div className="max-w-6xl mx-auto space-y-8 w-full">
              <section id="overview">
                <TeacherOverview
                  teacherInfo={teacherInfo}
                  studentsCount={students.length}
                  unreadMessagesCount={unreadCount}
                  students={students}
                  studentsByGrade={studentsByGrade}
                  isLanguageTeacher={isLanguageTeacher}
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

      <FloatingMessageBadge unreadCount={dismissedNotifications ? 0 : unreadCount} onClick={scrollToMessages} />
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
