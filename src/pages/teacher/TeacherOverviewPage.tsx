import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TeacherOverview } from "@/components/teacher/TeacherOverview";
import { NewsTicker } from "@/components/NewsTicker";
import { useNewsTicker } from "@/hooks/useNewsTicker";
import { AnimatePresence } from "framer-motion";
import { AnimatedSection } from "@/components/AnimatedSection";
import { BottomNav, teacherNavItems } from "@/components/BottomNav";
import { useNotifications } from "@/contexts/NotificationContext";

interface StudentsByGrade {
  [gradeLevel: string]: any[];
}

const TeacherOverviewPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasNews, tickerHeight } = useNewsTicker();
  const [students, setStudents] = useState<any[]>([]);
  const [studentsByGrade, setStudentsByGrade] = useState<StudentsByGrade>({});
  const [loading, setLoading] = useState(true);
  const [teacherInfo, setTeacherInfo] = useState<{ name: string; subject: string }>({ name: "", subject: "" });
  const [isLanguageTeacher, setIsLanguageTeacher] = useState(false);
  
  const { counts, setUserId, setUserRole, clearSection } = useNotifications();

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

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const { data: teacherGradeLevels } = await supabase
        .from('teacher_grade_levels')
        .select('grade_level, subject')
        .eq('teacher_id', user.id);

      const teacherSubject = teacherGradeLevels?.[0]?.subject || user.user_metadata?.subject || "المادة غير محددة";
      
      setTeacherInfo({
        name: profileData?.full_name || "المعلم",
        subject: teacherSubject
      });

      const languageSubjects = ['فرنسية', 'إنجليزية', 'انجليزية', 'الفرنسية', 'الإنجليزية', 'اللغة الفرنسية', 'اللغة الإنجليزية', 'francais', 'français', 'french', 'english', 'anglais'];
      const isLanguage = languageSubjects.some(lang => 
        teacherSubject.toLowerCase().includes(lang.toLowerCase())
      );
      setIsLanguageTeacher(isLanguage);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleSendMessageToParent = async (parentId: string, studentId: string) => {
    navigate('/dashboard/teacher/messages');
  };

  const handleNavigate = (sectionId: string) => {
    if (sectionId === 'overview') {
      navigate('/dashboard/teacher');
    } else {
      navigate(`/dashboard/teacher/${sectionId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-[env(safe-area-inset-top)]">
        <div className="animate-pulse space-y-4 p-4">
          <div className="h-14 bg-muted/40 rounded-lg" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-muted/30 rounded-xl" />
            <div className="h-24 bg-muted/30 rounded-xl" />
            <div className="h-24 bg-muted/30 rounded-xl" />
          </div>
          <div className="h-48 bg-muted/20 rounded-xl" />
        </div>
      </div>
    );
  }

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

      <div style={{ height: (hasNews ? tickerHeight : 0) + headerHeight }} />

      <main className="flex-1 p-3 md:p-4 pb-24 w-full">
        <AnimatePresence mode="wait">
          <AnimatedSection key="teacher-overview">
            <div className="max-w-6xl mx-auto w-full">
              <TeacherOverview
                teacherInfo={teacherInfo}
                studentsCount={students.length}
                unreadMessagesCount={counts.messages}
                students={students}
                studentsByGrade={studentsByGrade}
                isLanguageTeacher={isLanguageTeacher}
                onSendMessage={handleSendMessageToParent}
              />
            </div>
          </AnimatedSection>
        </AnimatePresence>
      </main>

      <BottomNav 
        items={teacherNavItems} 
        onNavigate={handleNavigate}
        useHashNavigation={false}
        notifications={{
          messages: counts.messages,
        }}
      />
    </div>
  );
};

export default TeacherOverviewPage;
