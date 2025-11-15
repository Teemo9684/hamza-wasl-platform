import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Users, GraduationCap, BookOpen, Award, Calendar, MessageSquare, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DashboardParent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [children, setChildren] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [grades, setGrades] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [parentName, setParentName] = useState<string>("");
  const [newMessage, setNewMessage] = useState({
    recipient_id: "",
    subject: "",
    content: "",
  });

  useEffect(() => {
    fetchParentData();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchChildDetails(selectedChild);
    }
  }, [selectedChild]);

  const fetchParentData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login/parent");
        return;
      }

      // Fetch parent profile info
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      setParentName(profileData?.full_name || "ولي الأمر");

      // Fetch children
      const { data: childrenData, error: childrenError } = await supabase
        .from('students')
        .select(`
          *,
          parent_students!inner(parent_id)
        `)
        .eq('parent_students.parent_id', user.id);

      if (childrenError) throw childrenError;
      setChildren(childrenData || []);

      if (childrenData && childrenData.length > 0) {
        setSelectedChild(childrenData[0].id);
      }

      // Fetch teachers for all children
      const { data: teachersData, error: teachersError } = await supabase
        .from('teacher_students')
        .select(`
          teacher_id,
          subject,
          profiles!teacher_students_teacher_id_fkey(id, full_name)
        `)
        .in('student_id', childrenData?.map(c => c.id) || []);

      if (teachersError) throw teachersError;
      setTeachers(teachersData || []);
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

  const fetchChildDetails = async (childId: string) => {
    try {
      // Fetch grades
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select('*')
        .eq('student_id', childId)
        .order('date', { ascending: false })
        .limit(10);

      if (gradesError) throw gradesError;
      setGrades(gradesData || []);

      // Fetch attendance
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', childId)
        .order('date', { ascending: false })
        .limit(10);

      if (attendanceError) throw attendanceError;
      setAttendance(attendanceData || []);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleSendMessage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: newMessage.recipient_id,
          student_id: selectedChild,
          subject: newMessage.subject,
          content: newMessage.content,
        });

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إرسال الرسالة بنجاح",
      });

      setNewMessage({ recipient_id: "", subject: "", content: "" });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const calculateAverage = () => {
    if (grades.length === 0) return 0;
    const sum = grades.reduce((acc, grade) => acc + (grade.grade_value / grade.max_grade) * 20, 0);
    return (sum / grades.length).toFixed(2);
  };

  const calculateAttendanceRate = () => {
    if (attendance.length === 0) return 0;
    const presentCount = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    return ((presentCount / attendance.length) * 100).toFixed(0);
  };

  const selectedChildData = children.find(c => c.id === selectedChild);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center font-cairo">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 animated-bg opacity-10" />
      
      <div className="relative z-10">
        <header className="glass-card border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold font-cairo">لوحة تحكم ولي الأمر</h1>
            </div>
            <Button onClick={handleLogout} variant="ghost" className="font-tajawal">
              <LogOut className="ml-2 h-4 w-4" />
              تسجيل الخروج
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2 font-cairo">مرحباً {parentName}</h2>
            <p className="text-muted-foreground font-tajawal">
              تابع تقدم أبنائك الدراسي من هنا
            </p>
          </div>

          {children.length > 1 && (
            <div className="mb-6">
              <Label className="font-cairo mb-2 block">اختر الابن</Label>
              <Select value={selectedChild} onValueChange={setSelectedChild}>
                <SelectTrigger className="w-full text-right">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo">
                  <Users className="w-5 h-5 text-primary" />
                  عدد الأبناء
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{children.length}</p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo">
                  <BookOpen className="w-5 h-5 text-secondary" />
                  الحضور
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{calculateAttendanceRate()}%</p>
                <p className="text-sm text-muted-foreground font-tajawal">نسبة الحضور</p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo">
                  <Award className="w-5 h-5 text-accent" />
                  المعدل
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{calculateAverage()}</p>
                <p className="text-sm text-muted-foreground font-tajawal">المعدل العام</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="info" className="space-y-6" dir="rtl">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info" className="font-cairo">
                <Users className="ml-2 h-4 w-4" />
                المعلومات
              </TabsTrigger>
              <TabsTrigger value="grades" className="font-cairo">
                <Award className="ml-2 h-4 w-4" />
                التقييمات
              </TabsTrigger>
              <TabsTrigger value="attendance" className="font-cairo">
                <Calendar className="ml-2 h-4 w-4" />
                الغيابات
              </TabsTrigger>
              <TabsTrigger value="messages" className="font-cairo">
                <MessageSquare className="ml-2 h-4 w-4" />
                المراسلة
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-6">
              {selectedChildData && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="font-cairo">معلومات التلميذ</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground font-tajawal">الاسم الكامل</p>
                      <p className="font-bold font-cairo">{selectedChildData.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-tajawal">السنة الدراسية</p>
                      <p className="font-bold font-cairo">{selectedChildData.grade_level}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-tajawal">القسم</p>
                      <p className="font-bold font-cairo">{selectedChildData.class_section}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-tajawal">الرقم الوطني المدرسي</p>
                      <p className="font-bold font-cairo">{selectedChildData.national_school_id}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="grades" className="space-y-4">
              <h3 className="text-2xl font-bold font-cairo">التقييمات الأخيرة</h3>
              {grades.map((grade) => (
                <Card key={grade.id} className="glass-card hover-lift">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold font-cairo">{grade.subject}</h4>
                        <p className="text-sm text-muted-foreground font-tajawal">
                          {grade.grade_type}
                        </p>
                        <p className="text-xs text-muted-foreground font-tajawal">
                          {new Date(grade.date).toLocaleDateString('ar-DZ')}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-primary">
                          {grade.grade_value}
                        </p>
                        <p className="text-sm text-muted-foreground">/ {grade.max_grade}</p>
                      </div>
                    </div>
                    {grade.notes && (
                      <p className="text-sm font-tajawal mt-2 text-muted-foreground">
                        {grade.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
              {grades.length === 0 && (
                <p className="text-center text-muted-foreground font-tajawal py-8">
                  لا توجد تقييمات بعد
                </p>
              )}
            </TabsContent>

            <TabsContent value="attendance" className="space-y-4">
              <h3 className="text-2xl font-bold font-cairo">سجل الحضور</h3>
              {attendance.map((record) => (
                <Card key={record.id} className="glass-card hover-lift">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold font-cairo">
                          {new Date(record.date).toLocaleDateString('ar-DZ', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        {record.notes && (
                          <p className="text-sm text-muted-foreground font-tajawal mt-1">
                            {record.notes}
                          </p>
                        )}
                      </div>
                      <div className={`px-4 py-2 rounded-full font-tajawal ${
                        record.status === 'present' ? 'bg-green-500/20 text-green-700 dark:text-green-400' :
                        record.status === 'absent' ? 'bg-red-500/20 text-red-700 dark:text-red-400' :
                        record.status === 'late' ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' :
                        'bg-blue-500/20 text-blue-700 dark:text-blue-400'
                      }`}>
                        {record.status === 'present' ? 'حاضر' :
                         record.status === 'absent' ? 'غائب' :
                         record.status === 'late' ? 'متأخر' : 'غياب مبرر'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {attendance.length === 0 && (
                <p className="text-center text-muted-foreground font-tajawal py-8">
                  لا توجد سجلات حضور بعد
                </p>
              )}
            </TabsContent>

            <TabsContent value="messages" className="space-y-6">
              <h3 className="text-2xl font-bold font-cairo">مراسلة المعلمين</h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full font-cairo">
                    <Send className="ml-2 h-4 w-4" />
                    إرسال رسالة جديدة
                  </Button>
                </DialogTrigger>
                <DialogContent className="font-cairo" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>رسالة جديدة للمعلم</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>اختر المعلم</Label>
                      <Select value={newMessage.recipient_id} onValueChange={(value) => setNewMessage({ ...newMessage, recipient_id: value })}>
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="اختر معلم" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map((teacher) => (
                            <SelectItem key={teacher.teacher_id} value={teacher.teacher_id}>
                              {teacher.profiles.full_name} - {teacher.subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>الموضوع</Label>
                      <Input
                        value={newMessage.subject}
                        onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                        className="text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الرسالة</Label>
                      <Textarea
                        value={newMessage.content}
                        onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                        className="text-right font-tajawal"
                        rows={5}
                        dir="rtl"
                      />
                    </div>
                    <Button onClick={handleSendMessage} className="w-full">
                      إرسال
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="space-y-4">
                <h4 className="font-bold font-cairo">المعلمون</h4>
                {teachers.map((teacher, index) => (
                  <Card key={index} className="glass-card hover-lift">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                          <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h5 className="font-bold font-cairo">{teacher.profiles.full_name}</h5>
                          <p className="text-sm text-muted-foreground font-tajawal">
                            {teacher.subject}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default DashboardParent;