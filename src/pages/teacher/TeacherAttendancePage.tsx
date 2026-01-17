import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TeacherAttendance } from "@/components/teacher/TeacherAttendance";
import { NewsTicker } from "@/components/NewsTicker";
import { useNewsTicker } from "@/hooks/useNewsTicker";
import { AnimatePresence } from "framer-motion";
import { AnimatedSection } from "@/components/AnimatedSection";
import { BottomNav, teacherNavItems } from "@/components/BottomNav";
import { attendanceNotesSchema } from "@/lib/validations";
import { sendAttendanceNotification } from "@/utils/sendPushNotification";
import { useNotifications } from "@/contexts/NotificationContext";

const TeacherAttendancePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasNews, tickerHeight } = useNewsTicker();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { counts, setUserId, setUserRole } = useNotifications();

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login/teacher");
        return;
      }

      // Set up notification context
      setUserId(user.id);
      setUserRole('teacher');

      const { data: teacherGradeLevels } = await supabase
        .from('teacher_grade_levels')
        .select('grade_level, subject')
        .eq('teacher_id', user.id);

      const teacherSubject = teacherGradeLevels?.[0]?.subject || user.user_metadata?.subject || "";
      
      const languageSubjects = ['فرنسية', 'إنجليزية', 'انجليزية', 'الفرنسية', 'الإنجليزية', 'اللغة الفرنسية', 'اللغة الإنجليزية', 'francais', 'français', 'french', 'english', 'anglais'];
      const isLanguage = languageSubjects.some(lang => 
        teacherSubject.toLowerCase().includes(lang.toLowerCase())
      );

      let studentsData: any[] = [];
      
      if (isLanguage) {
        const assignedGrades = teacherGradeLevels?.map(r => r.grade_level) || [];
        const targetGrades = assignedGrades.length > 0 ? assignedGrades : ['السنة الثالثة', 'السنة الرابعة', 'السنة الخامسة'];
        
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .or(targetGrades.map(g => `grade_level.ilike.%${g}%`).join(','))
          .order('grade_level', { ascending: true })
          .order('full_name', { ascending: true });

        if (error) throw error;
        studentsData = data || [];

        // Link students to teacher if not already linked
        if (studentsData.length > 0) {
          const teacherSubjectValue = teacherGradeLevels?.[0]?.subject || 'فرنسية';
          const studentLinks = studentsData.map(student => ({
            teacher_id: user.id,
            student_id: student.id,
            subject: teacherSubjectValue
          }));
          
          await supabase
            .from('teacher_students')
            .upsert(studentLinks, { 
              onConflict: 'teacher_id,student_id',
              ignoreDuplicates: true 
            });
        }
      } else {
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

  const handleRecordAttendance = async (studentId: string, status: string, notes: string) => {
    try {
      attendanceNotesSchema.parse(notes);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      
      // Use upsert to update if record exists for same student and date
      const { error } = await supabase
        .from('attendance')
        .upsert({
          student_id: studentId,
          date: today,
          status: status,
          notes: notes,
          recorded_by: user.id,
        }, {
          onConflict: 'student_id,date'
        });

      if (error) throw error;

      const student = students.find(s => s.id === studentId);
      if (student) {
        const { data: parentData } = await supabase
          .from('parent_students')
          .select('parent_id')
          .eq('student_id', studentId);
        
        if (parentData && parentData.length > 0) {
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

  const handleNavigate = (sectionId: string) => {
    if (sectionId === 'overview') {
      navigate('/dashboard/teacher');
    } else {
      navigate(`/dashboard/teacher/${sectionId}`);
    }
  };

  // No loading spinner - content renders immediately

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
              onClick={() => navigate('/dashboard/teacher')}
              className="font-cairo h-10 px-3 text-sm active:scale-95 touch-feedback"
              size="sm"
            >
              <ArrowRight className="ml-1.5 h-4 w-4" />
              رجوع
            </Button>
            <div className="min-w-0 flex-1 text-center">
              <h1 className="text-sm md:text-lg font-bold truncate leading-tight">تسجيل الحضور</h1>
            </div>
            <div className="w-20"></div>
          </div>
        </header>
      </div>

      <div style={{ height: (hasNews ? tickerHeight : 0) + headerHeight }} />

      <main className="flex-1 p-3 md:p-4 pb-24 w-full">
        <AnimatePresence mode="wait">
          <AnimatedSection key="teacher-attendance">
            <div className="max-w-6xl mx-auto w-full">
              <TeacherAttendance
                students={students}
                onRecordAttendance={handleRecordAttendance}
              />
            </div>
          </AnimatedSection>
        </AnimatePresence>
      </main>

      <BottomNav 
        items={teacherNavItems} 
        activeSection="attendance"
        onNavigate={handleNavigate}
        useHashNavigation={false}
        notifications={{
          messages: counts.messages,
        }}
      />
    </div>
  );
};

export default TeacherAttendancePage;
