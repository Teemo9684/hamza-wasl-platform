import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Users, GraduationCap, UserCheck, TrendingUp, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Statistics {
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalGrades: number;
  totalAttendance: number;
  totalMessages: number;
  averageGrade: number;
  attendanceRate: number;
}

export const ReportsView = () => {
  const [statistics, setStatistics] = useState<Statistics>({
    totalStudents: 0,
    totalTeachers: 0,
    totalParents: 0,
    totalGrades: 0,
    totalAttendance: 0,
    totalMessages: 0,
    averageGrade: 0,
    attendanceRate: 0,
  });
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStatistics();
  }, [selectedPeriod]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      // Get total students
      const { count: studentsCount } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });

      // Get total teachers
      const { count: teachersCount } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "teacher");

      // Get total parents
      const { count: parentsCount } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "parent");

      // Get total grades
      const { count: gradesCount } = await supabase
        .from("grades")
        .select("*", { count: "exact", head: true });

      // Get average grade
      const { data: gradeData } = await supabase
        .from("grades")
        .select("grade_value, max_grade");

      let averageGrade = 0;
      if (gradeData && gradeData.length > 0) {
        const totalPercentage = gradeData.reduce((sum, grade) => {
          return sum + (grade.grade_value / grade.max_grade) * 100;
        }, 0);
        averageGrade = totalPercentage / gradeData.length;
      }

      // Get total attendance records
      const { count: attendanceCount } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true });

      // Get attendance rate (present vs total)
      const { data: attendanceData } = await supabase
        .from("attendance")
        .select("status");

      let attendanceRate = 0;
      if (attendanceData && attendanceData.length > 0) {
        const presentCount = attendanceData.filter(a => a.status === "حاضر").length;
        attendanceRate = (presentCount / attendanceData.length) * 100;
      }

      // Get total messages
      const { count: messagesCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true });

      setStatistics({
        totalStudents: studentsCount || 0,
        totalTeachers: teachersCount || 0,
        totalParents: parentsCount || 0,
        totalGrades: gradesCount || 0,
        totalAttendance: attendanceCount || 0,
        totalMessages: messagesCount || 0,
        averageGrade: Math.round(averageGrade),
        attendanceRate: Math.round(attendanceRate),
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل تحميل الإحصائيات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold font-cairo">التقارير والإحصائيات</h2>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[200px] font-tajawal">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week" className="font-tajawal">هذا الأسبوع</SelectItem>
            <SelectItem value="month" className="font-tajawal">هذا الشهر</SelectItem>
            <SelectItem value="year" className="font-tajawal">هذه السنة</SelectItem>
            <SelectItem value="all" className="font-tajawal">كل الفترات</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <Card className="glass-card">
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground font-tajawal">
              جاري تحميل الإحصائيات...
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Main Statistics */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo text-lg">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  التلاميذ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{statistics.totalStudents}</p>
                <p className="text-sm text-muted-foreground font-tajawal mt-2">
                  إجمالي التلاميذ المسجلين
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo text-lg">
                  <UserCheck className="w-5 h-5 text-secondary" />
                  المعلمين
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{statistics.totalTeachers}</p>
                <p className="text-sm text-muted-foreground font-tajawal mt-2">
                  إجمالي المعلمين النشطين
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo text-lg">
                  <Users className="w-5 h-5 text-accent" />
                  أولياء الأمور
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{statistics.totalParents}</p>
                <p className="text-sm text-muted-foreground font-tajawal mt-2">
                  إجمالي أولياء الأمور المسجلين
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo text-lg">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  متوسط الدرجات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{statistics.averageGrade}%</p>
                <p className="text-sm text-muted-foreground font-tajawal mt-2">
                  متوسط أداء التلاميذ
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Statistics */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo text-lg">
                  <TrendingUp className="w-5 h-5 text-secondary" />
                  معدل الحضور
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{statistics.attendanceRate}%</p>
                <p className="text-sm text-muted-foreground font-tajawal mt-2">
                  من إجمالي {statistics.totalAttendance} سجل حضور
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo text-lg">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  الدرجات المسجلة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{statistics.totalGrades}</p>
                <p className="text-sm text-muted-foreground font-tajawal mt-2">
                  إجمالي الدرجات المسجلة
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo text-lg">
                  <Calendar className="w-5 h-5 text-accent" />
                  الرسائل
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{statistics.totalMessages}</p>
                <p className="text-sm text-muted-foreground font-tajawal mt-2">
                  إجمالي الرسائل المتبادلة
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Insights */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-cairo">ملخص الأداء</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-cairo font-semibold">نسبة المعلمين لكل تلميذ</p>
                  <p className="text-sm text-muted-foreground font-tajawal">
                    معدل التغطية التعليمية
                  </p>
                </div>
                <p className="text-2xl font-bold">
                  1:{statistics.totalStudents > 0 ? Math.round(statistics.totalStudents / (statistics.totalTeachers || 1)) : 0}
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-cairo font-semibold">نسبة أولياء الأمور المسجلين</p>
                  <p className="text-sm text-muted-foreground font-tajawal">
                    من إجمالي التلاميذ
                  </p>
                </div>
                <p className="text-2xl font-bold">
                  {statistics.totalStudents > 0 ? Math.round((statistics.totalParents / statistics.totalStudents) * 100) : 0}%
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-cairo font-semibold">متوسط الدرجات لكل تلميذ</p>
                  <p className="text-sm text-muted-foreground font-tajawal">
                    إجمالي التقييمات
                  </p>
                </div>
                <p className="text-2xl font-bold">
                  {statistics.totalStudents > 0 ? (statistics.totalGrades / statistics.totalStudents).toFixed(1) : 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
