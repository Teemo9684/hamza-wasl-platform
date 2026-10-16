import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TeacherOverview } from "@/components/teacher/TeacherOverview";
import { useNotifications } from "@/contexts/NotificationContext";
import { useNavigate } from "react-router-dom";

interface StudentsByGrade {
  [gradeLevel: string]: any[];
}

export const TeacherOverviewContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [studentsByGrade, setStudentsByGrade] = useState<StudentsByGrade>({});
  const [loading, setLoading] = useState(true);
  const [teacherInfo, setTeacherInfo] = useState<{ name: string; subject: string }>({ name: "", subject: "" });
  const [isLanguageTeacher, setIsLanguageTeacher] = useState(false);
  
  const { counts } = useNotifications();

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

  const handleSendMessageToParent = async (parentId: string, studentId: string) => {
    navigate('/dashboard/teacher/messages');
  };

  return (
    <TeacherOverview
      teacherInfo={teacherInfo}
      studentsCount={students.length}
      unreadMessagesCount={counts.messages}
      students={students}
      studentsByGrade={studentsByGrade}
      isLanguageTeacher={isLanguageTeacher}
      onSendMessage={handleSendMessageToParent}
    />
  );
};

export default TeacherOverviewContent;
