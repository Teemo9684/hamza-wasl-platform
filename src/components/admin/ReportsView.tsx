import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMultiRealtime } from "@/hooks/useRealtime";
import { 
  BarChart3, 
  Users, 
  GraduationCap, 
  UserCheck, 
  TrendingUp, 
  Calendar,
  MessageSquare,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  Award,
  Activity
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Statistics {
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalGrades: number;
  totalAttendance: number;
  totalMessages: number;
  averageGrade: number;
  attendanceRate: number;
  totalHomework: number;
  totalDocumentRequests: number;
  pendingApprovals: number;
  studentsPerGrade: { grade: string; count: number }[];
  attendanceByStatus: { status: string; count: number }[];
  recentActivity: { date: string; messages: number; attendance: number; grades: number }[];
  topPerformingGrades: { grade: string; average: number }[];
  parentEngagement: number;
  teacherStudentRatio: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#22c55e', '#f59e0b', '#ef4444'];

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
    totalHomework: 0,
    totalDocumentRequests: 0,
    pendingApprovals: 0,
    studentsPerGrade: [],
    attendanceByStatus: [],
    recentActivity: [],
    topPerformingGrades: [],
    parentEngagement: 0,
    teacherStudentRatio: "0:0",
  });
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  const handleDataChange = useCallback(() => {
    fetchStatistics();
  }, [selectedPeriod]);

  // Real-time subscription for all relevant tables
  useMultiRealtime(
    [
      { table: 'students' },
      { table: 'profiles' },
      { table: 'attendance' },
      { table: 'grades' },
      { table: 'messages' },
      { table: 'homework' },
      { table: 'document_requests' },
    ],
    handleDataChange,
    true
  );

  useEffect(() => {
    fetchStatistics();
  }, [selectedPeriod]);

  const getDateFilter = () => {
    const now = new Date();
    switch (selectedPeriod) {
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return weekAgo.toISOString();
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return monthAgo.toISOString();
      case "year":
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        return yearAgo.toISOString();
      default:
        return null;
    }
  };

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const dateFilter = getDateFilter();

      // Get total students
      const { count: studentsCount } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });

      // Get students per grade
      const { data: studentsData } = await supabase
        .from("students")
        .select("grade_level");

      const gradeGroups: { [key: string]: number } = {};
      studentsData?.forEach(student => {
        gradeGroups[student.grade_level] = (gradeGroups[student.grade_level] || 0) + 1;
      });
      const studentsPerGrade = Object.entries(gradeGroups).map(([grade, count]) => ({
        grade,
        count
      })).sort((a, b) => a.grade.localeCompare(b.grade));

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

      // Get parent-student links for engagement calculation
      const { count: linkedParents } = await supabase
        .from("parent_students")
        .select("parent_id", { count: "exact", head: true });

      // Get total grades
      let gradesQuery = supabase.from("grades").select("grade_value, max_grade, student_id");
      if (dateFilter) {
        gradesQuery = gradesQuery.gte("created_at", dateFilter);
      }
      const { data: gradeData, count: gradesCount } = await gradesQuery;

      let averageGrade = 0;
      if (gradeData && gradeData.length > 0) {
        const totalPercentage = gradeData.reduce((sum, grade) => {
          return sum + (grade.grade_value / grade.max_grade) * 100;
        }, 0);
        averageGrade = totalPercentage / gradeData.length;
      }

      // Calculate top performing grades by getting student info
      const studentGrades: { [studentId: string]: { total: number; count: number } } = {};
      gradeData?.forEach(grade => {
        if (!studentGrades[grade.student_id]) {
          studentGrades[grade.student_id] = { total: 0, count: 0 };
        }
        studentGrades[grade.student_id].total += (grade.grade_value / grade.max_grade) * 100;
        studentGrades[grade.student_id].count++;
      });

      // Get attendance data
      let attendanceQuery = supabase.from("attendance").select("status");
      if (dateFilter) {
        attendanceQuery = attendanceQuery.gte("date", dateFilter.split('T')[0]);
      }
      const { data: attendanceData, count: attendanceCount } = await attendanceQuery;

      let attendanceRate = 0;
      const attendanceGroups: { [key: string]: number } = {};
      if (attendanceData && attendanceData.length > 0) {
        attendanceData.forEach(a => {
          attendanceGroups[a.status] = (attendanceGroups[a.status] || 0) + 1;
        });
        const presentCount = attendanceData.filter(a => a.status === "حاضر").length;
        attendanceRate = (presentCount / attendanceData.length) * 100;
      }
      const attendanceByStatus = Object.entries(attendanceGroups).map(([status, count]) => ({
        status,
        count
      }));

      // Get total messages
      let messagesQuery = supabase.from("messages").select("*", { count: "exact", head: true });
      if (dateFilter) {
        messagesQuery = messagesQuery.gte("created_at", dateFilter);
      }
      const { count: messagesCount } = await messagesQuery;

      // Get total homework
      let homeworkQuery = supabase.from("homework").select("*", { count: "exact", head: true });
      if (dateFilter) {
        homeworkQuery = homeworkQuery.gte("created_at", dateFilter);
      }
      const { count: homeworkCount } = await homeworkQuery;

      // Get document requests
      let docQuery = supabase.from("document_requests").select("*", { count: "exact", head: true });
      if (dateFilter) {
        docQuery = docQuery.gte("created_at", dateFilter);
      }
      const { count: docCount } = await docQuery;

      // Get pending approvals
      const { count: pendingCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_approved", false);

      // Calculate teacher-student ratio
      const ratio = teachersCount && studentsCount 
        ? `1:${Math.round((studentsCount || 0) / (teachersCount || 1))}`
        : "0:0";

      // Calculate parent engagement
      const parentEngagement = studentsCount && linkedParents
        ? Math.round((linkedParents / studentsCount) * 100)
        : 0;

      setStatistics({
        totalStudents: studentsCount || 0,
        totalTeachers: teachersCount || 0,
        totalParents: parentsCount || 0,
        totalGrades: gradesCount || gradeData?.length || 0,
        totalAttendance: attendanceCount || attendanceData?.length || 0,
        totalMessages: messagesCount || 0,
        averageGrade: Math.round(averageGrade),
        attendanceRate: Math.round(attendanceRate),
        totalHomework: homeworkCount || 0,
        totalDocumentRequests: docCount || 0,
        pendingApprovals: pendingCount || 0,
        studentsPerGrade,
        attendanceByStatus,
        recentActivity: [],
        topPerformingGrades: [],
        parentEngagement,
        teacherStudentRatio: ratio,
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

  const chartConfig = {
    count: {
      label: "العدد",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-cairo">التقارير والإحصائيات</h2>
          <p className="text-muted-foreground font-cairo mt-1">نظرة شاملة على أداء المدرسة</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px] font-cairo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week" className="font-cairo">هذا الأسبوع</SelectItem>
            <SelectItem value="month" className="font-cairo">هذا الشهر</SelectItem>
            <SelectItem value="year" className="font-cairo">هذه السنة</SelectItem>
            <SelectItem value="all" className="font-cairo">كل الفترات</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="overview" className="font-cairo">نظرة عامة</TabsTrigger>
            <TabsTrigger value="students" className="font-cairo">التلاميذ</TabsTrigger>
            <TabsTrigger value="engagement" className="font-cairo">التفاعل</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="glass-card hover-lift">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 font-cairo text-sm text-muted-foreground">
                    <GraduationCap className="w-4 h-4" />
                    التلاميذ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{statistics.totalStudents}</p>
                </CardContent>
              </Card>

              <Card className="glass-card hover-lift">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 font-cairo text-sm text-muted-foreground">
                    <UserCheck className="w-4 h-4" />
                    الأساتذة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{statistics.totalTeachers}</p>
                </CardContent>
              </Card>

              <Card className="glass-card hover-lift">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 font-cairo text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    الأولياء
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{statistics.totalParents}</p>
                </CardContent>
              </Card>

              <Card className="glass-card hover-lift">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 font-cairo text-sm text-muted-foreground">
                    <Activity className="w-4 h-4" />
                    نسبة أستاذ/تلميذ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{statistics.teacherStudentRatio}</p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-cairo">
                    <Award className="w-5 h-5 text-yellow-500" />
                    متوسط الدرجات
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-bold">{statistics.averageGrade}%</span>
                    <Badge variant={statistics.averageGrade >= 70 ? "default" : statistics.averageGrade >= 50 ? "secondary" : "destructive"}>
                      {statistics.averageGrade >= 70 ? "ممتاز" : statistics.averageGrade >= 50 ? "متوسط" : "يحتاج تحسين"}
                    </Badge>
                  </div>
                  <Progress value={statistics.averageGrade} className="h-2" />
                  <p className="text-sm text-muted-foreground font-cairo">
                    من إجمالي {statistics.totalGrades} درجة مسجلة
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-cairo">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    معدل الحضور
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-bold">{statistics.attendanceRate}%</span>
                    <Badge variant={statistics.attendanceRate >= 80 ? "default" : statistics.attendanceRate >= 60 ? "secondary" : "destructive"}>
                      {statistics.attendanceRate >= 80 ? "ممتاز" : statistics.attendanceRate >= 60 ? "متوسط" : "منخفض"}
                    </Badge>
                  </div>
                  <Progress value={statistics.attendanceRate} className="h-2" />
                  <p className="text-sm text-muted-foreground font-cairo">
                    من إجمالي {statistics.totalAttendance} سجل حضور
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-cairo">
                    <Users className="w-5 h-5 text-blue-500" />
                    تفاعل الأولياء
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-bold">{statistics.parentEngagement}%</span>
                    <Badge variant={statistics.parentEngagement >= 50 ? "default" : "secondary"}>
                      {statistics.parentEngagement >= 50 ? "جيد" : "يحتاج تحسين"}
                    </Badge>
                  </div>
                  <Progress value={statistics.parentEngagement} className="h-2" />
                  <p className="text-sm text-muted-foreground font-cairo">
                    نسبة الأولياء المرتبطين بالتلاميذ
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Activity Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <MessageSquare className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{statistics.totalMessages}</p>
                      <p className="text-sm text-muted-foreground font-cairo">رسالة</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-secondary/10">
                      <BookOpen className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{statistics.totalHomework}</p>
                      <p className="text-sm text-muted-foreground font-cairo">واجب منزلي</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-accent/10">
                      <FileText className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{statistics.totalDocumentRequests}</p>
                      <p className="text-sm text-muted-foreground font-cairo">طلب وثيقة</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-yellow-500/10">
                      <Clock className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{statistics.pendingApprovals}</p>
                      <p className="text-sm text-muted-foreground font-cairo">طلب انتظار</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            {/* Students per Grade Chart */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-cairo">توزيع التلاميذ حسب المستوى</CardTitle>
              </CardHeader>
              <CardContent>
                {statistics.studentsPerGrade.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statistics.studentsPerGrade} layout="vertical">
                        <XAxis type="number" />
                        <YAxis dataKey="grade" type="category" width={100} tick={{ fontSize: 12 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground font-cairo">
                    لا توجد بيانات
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Grade Level Summary */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {statistics.studentsPerGrade.map((grade, index) => (
                <Card key={grade.grade} className="glass-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-cairo font-semibold">{grade.grade}</p>
                        <p className="text-3xl font-bold">{grade.count}</p>
                        <p className="text-sm text-muted-foreground font-cairo">تلميذ</p>
                      </div>
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${COLORS[index % COLORS.length]}20` }}
                      >
                        <GraduationCap 
                          className="w-8 h-8" 
                          style={{ color: COLORS[index % COLORS.length] }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6">
            {/* Attendance Distribution */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="font-cairo">توزيع الحضور</CardTitle>
                </CardHeader>
                <CardContent>
                  {statistics.attendanceByStatus.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statistics.attendanceByStatus}
                            dataKey="count"
                            nameKey="status"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ status, count }) => `${status}: ${count}`}
                          >
                            {statistics.attendanceByStatus.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground font-cairo">
                      لا توجد بيانات حضور
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="font-cairo">ملخص الحضور</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {statistics.attendanceByStatus.map((item, index) => (
                    <div key={item.status} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-cairo">{item.status}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold">{item.count}</span>
                        <span className="text-sm text-muted-foreground">
                          ({statistics.totalAttendance > 0 
                            ? Math.round((item.count / statistics.totalAttendance) * 100) 
                            : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                  {statistics.attendanceByStatus.length === 0 && (
                    <div className="text-center text-muted-foreground font-cairo py-8">
                      لا توجد بيانات حضور
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Communication Stats */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-cairo">إحصائيات التواصل</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{statistics.totalMessages}</p>
                    <p className="text-sm text-muted-foreground font-cairo">رسالة متبادلة</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Users className="w-8 h-8 mx-auto mb-2 text-secondary" />
                    <p className="text-2xl font-bold">{statistics.totalParents}</p>
                    <p className="text-sm text-muted-foreground font-cairo">ولي أمر مسجل</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-accent" />
                    <p className="text-2xl font-bold">{statistics.totalDocumentRequests}</p>
                    <p className="text-sm text-muted-foreground font-cairo">طلب وثائق</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold">{statistics.parentEngagement}%</p>
                    <p className="text-sm text-muted-foreground font-cairo">نسبة المشاركة</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
