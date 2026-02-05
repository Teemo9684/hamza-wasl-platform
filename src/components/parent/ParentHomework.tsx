import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtime } from "@/hooks/useRealtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Calendar, FileText, Loader2, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateOnly } from "@/utils/formatters";
import { useOfflineCache, isOffline } from "@/hooks/useOfflineCache";

interface Homework {
  id: string;
  title: string;
  description: string;
  grade_level: string;
  subject: string | null;
  due_date: string;
  attachment_url: string | null;
  attachments: string[] | null;
  teacher_id: string;
  created_at: string;
}

interface Student {
  id: string;
  full_name: string;
  grade_level: string;
}

export const ParentHomework = () => {
  const [homework, setHomework] = useState<Homework[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const { toast } = useToast();
  const { saveToCache, loadFromCache } = useOfflineCache<{ homework: Homework[], students: Student[] }>('parent_homework');

  const handleHomeworkChange = useCallback(() => {
    fetchStudentsAndHomework();
  }, []);

  // Real-time subscription for homework
  useRealtime({
    table: 'homework',
    onChange: handleHomeworkChange,
  });

  useEffect(() => {
    fetchStudentsAndHomework();
  }, []);

  const fetchStudentsAndHomework = async () => {
    setLoading(true);
    setIsOfflineMode(isOffline());

    // Try to load from cache first if offline
    if (isOffline()) {
      const cachedData = await loadFromCache();
      if (cachedData) {
        setHomework(cachedData.homework);
        setStudents(cachedData.students);
        setLoading(false);
        return;
      }
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get parent's students
      const { data: studentData, error: studentsError } = await supabase
        .from("parent_students")
        .select(`
          student:students (
            id,
            full_name,
            grade_level
          )
        `)
        .eq("parent_id", user.id);

      if (studentsError) throw studentsError;

      const studentsList = studentData
        ?.map((ps: any) => ps.student)
        .filter(Boolean) || [];
      
      setStudents(studentsList);

      if (studentsList.length === 0) {
        setHomework([]);
        setLoading(false);
        return;
      }

      // Get homework for students' grade levels
      const gradeLevels = [...new Set(studentsList.map((s: Student) => s.grade_level))];

      // Get teachers for the parent's students
      const { data: teachersData } = await supabase
        .from("teacher_students")
        .select("teacher_id")
        .in("student_id", studentsList.map((s: Student) => s.id));

      const teacherIds = teachersData?.map(t => t.teacher_id) || [];

      let query = supabase
        .from("homework")
        .select("*")
        .in("grade_level", gradeLevels)
        .order("due_date", { ascending: true });

      // If in preview mode (default teacher/parent), show only homework from specific teacher
      // You can identify preview mode by checking for specific IDs
      const isPreviewMode = user.id === "22222222-2222-2222-2222-222222222222"; // Default parent ID
      
      if (isPreviewMode && teacherIds.length > 0) {
        query = query.in("teacher_id", teacherIds);
      }

      const { data: homeworkData, error: homeworkError } = await query;

      if (homeworkError) throw homeworkError;

      setHomework(homeworkData || []);

      // Save to cache for offline use
      await saveToCache({
        homework: homeworkData || [],
        students: studentsList
      });
    } catch (error: any) {
      console.error("Error fetching homework:", error);
      // Try to load from cache on network error
      const cachedData = await loadFromCache();
      if (cachedData) {
        setHomework(cachedData.homework);
        setStudents(cachedData.students);
        setIsOfflineMode(true);
      } else {
        toast({
          title: "خطأ",
          description: "فشل تحميل الواجبات",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground font-cairo">
            لا يوجد أبناء مسجلون في حسابك
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {isOfflineMode && (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="p-3 flex items-center gap-2 text-muted-foreground">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-cairo">وضع عدم الاتصال - يتم عرض البيانات المحفوظة</span>
          </CardContent>
        </Card>
      )}

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-cairo">
            <BookOpen className="w-5 h-5" />
            الواجبات المنزلية
          </CardTitle>
        </CardHeader>
        <CardContent>
          {homework.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-cairo">
                لا توجد واجبات منزلية حالياً
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {homework.map((hw) => {
                const daysUntilDue = getDaysUntilDue(hw.due_date);
                const overdue = isOverdue(hw.due_date);

                return (
                  <Card
                    key={hw.id}
                    className={`border-l-4 ${
                      overdue
                        ? "border-l-destructive"
                        : daysUntilDue <= 2
                        ? "border-l-yellow-500"
                        : "border-l-primary"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg font-cairo mb-1">{hw.title}</h3>
                            {overdue && (
                              <Badge variant="destructive" className="mb-2 font-cairo">
                                متأخر
                              </Badge>
                            )}
                            {!overdue && daysUntilDue <= 2 && (
                              <Badge className="mb-2 bg-yellow-500 font-cairo">
                                قريب الموعد
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-muted-foreground font-cairo">{hw.description}</p>
                        
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span className="font-cairo">
                              التسليم: {formatDateOnly(hw.due_date)}
                            </span>
                            {!overdue && (
                              <span className="text-muted-foreground font-cairo">
                                ({daysUntilDue} {daysUntilDue === 1 ? "يوم" : "أيام"} متبقية)
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="font-cairo">
                            القسم: {hw.grade_level}
                          </Badge>
                          {hw.subject && (
                            <Badge variant="outline" className="font-cairo">
                              المادة: {hw.subject}
                            </Badge>
                          )}
                        </div>

                        {(hw.attachments && hw.attachments.length > 0) ? (
                          <div className="mt-2 space-y-1">
                            <p className="text-sm font-cairo text-muted-foreground">المرفقات ({hw.attachments.length}):</p>
                            <div className="flex flex-wrap gap-2">
                              {hw.attachments.map((url, index) => (
                                <a
                                  key={index}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-primary hover:underline font-cairo text-sm"
                                >
                                  <FileText className="w-4 h-4" />
                                  مرفق {index + 1}
                                </a>
                              ))}
                            </div>
                          </div>
                        ) : hw.attachment_url && (
                          <a
                            href={hw.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline font-cairo"
                          >
                            <FileText className="w-4 h-4" />
                            عرض المرفق
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
