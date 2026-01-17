import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TeacherAttendance } from "@/components/teacher/TeacherAttendance";
import { attendanceNotesSchema } from "@/lib/validations";
import { sendAttendanceNotification } from "@/utils/sendPushNotification";

export const TeacherAttendanceContent = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

  return (
    <TeacherAttendance
      students={students}
      onRecordAttendance={handleRecordAttendance}
    />
  );
};

export default TeacherAttendanceContent;
