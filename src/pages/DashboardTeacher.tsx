import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Users, GraduationCap, BookOpen, Award, MessageSquare, UserPlus, Trash2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const DashboardTeacher = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherInfo, setTeacherInfo] = useState<{ name: string; subject: string }>({ name: "", subject: "" });
  const [newStudent, setNewStudent] = useState({
    full_name: "",
    national_school_id: "",
    grade_level: "",
    class_section: "",
  });
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [attendance, setAttendance] = useState({
    status: "present",
    notes: "",
  });
  const [replyMessage, setReplyMessage] = useState({
    messageId: "",
    recipientId: "",
    recipientName: "",
    originalSubject: "",
    studentId: "",
    content: "",
  });
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);

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

      // Fetch teacher profile info
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      setTeacherInfo({
        name: profileData?.full_name || "المعلم",
        subject: user.user_metadata?.subject || "المادة غير محددة"
      });

      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          *,
          teacher_students!inner(teacher_id)
        `)
        .eq('teacher_students.teacher_id', user.id);

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Fetch messages
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

  const handleAddStudent = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Add student
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .insert({
          full_name: newStudent.full_name,
          national_school_id: newStudent.national_school_id,
          grade_level: newStudent.grade_level,
          class_section: newStudent.class_section,
        })
        .select()
        .single();

      if (studentError) throw studentError;

      // Link teacher to student
      const { error: linkError } = await supabase
        .from('teacher_students')
        .insert({
          teacher_id: user.id,
          student_id: studentData.id,
        });

      if (linkError) throw linkError;

      toast({
        title: "تم بنجاح",
        description: "تمت إضافة التلميذ بنجاح",
      });

      setNewStudent({
        full_name: "",
        national_school_id: "",
        grade_level: "",
        class_section: "",
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

  const handleRecordAttendance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedStudent) return;

      const { error } = await supabase
        .from('attendance')
        .insert({
          student_id: selectedStudent,
          date: new Date().toISOString().split('T')[0],
          status: attendance.status,
          notes: attendance.notes,
          recorded_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم تسجيل الحضور بنجاح",
      });

      setAttendance({ status: "present", notes: "" });
      setSelectedStudent("");
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
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

  const handleOpenReply = (message: any) => {
    setReplyMessage({
      messageId: message.id,
      recipientId: message.sender_id,
      recipientName: message.sender?.full_name || 'غير معروف',
      originalSubject: message.subject,
      studentId: message.student_id,
      content: "",
    });
    setIsReplyDialogOpen(true);
  };

  const handleSendReply = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: replyMessage.recipientId,
          subject: `رد: ${replyMessage.originalSubject}`,
          content: replyMessage.content,
          student_id: replyMessage.studentId,
        });

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إرسال الرد بنجاح",
      });

      setIsReplyDialogOpen(false);
      setReplyMessage({
        messageId: "",
        recipientId: "",
        recipientName: "",
        originalSubject: "",
        studentId: "",
        content: "",
      });

      // Mark original message as read
      await handleMarkAsRead(replyMessage.messageId);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
              <h1 className="text-2xl font-bold font-cairo">لوحة تحكم المعلم</h1>
            </div>
            <Button onClick={handleLogout} variant="ghost" className="font-tajawal">
              <LogOut className="ml-2 h-4 w-4" />
              تسجيل الخروج
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2 font-cairo">مرحباً {teacherInfo.name}</h2>
            <p className="text-muted-foreground font-tajawal">
              {teacherInfo.subject} • إدارة التلاميذ والتواصل مع الأولياء
            </p>
          </div>

          <Tabs defaultValue="students" className="space-y-6" dir="rtl">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="students" className="font-cairo">
                <Users className="ml-2 h-4 w-4" />
                التلاميذ
              </TabsTrigger>
              <TabsTrigger value="messages" className="font-cairo">
                <MessageSquare className="ml-2 h-4 w-4" />
                الرسائل
                {messages.filter(m => !m.is_read).length > 0 && (
                  <span className="mr-2 bg-destructive text-destructive-foreground rounded-full px-2 py-0.5 text-xs">
                    {messages.filter(m => !m.is_read).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="attendance" className="font-cairo">
                <Calendar className="ml-2 h-4 w-4" />
                الحضور
              </TabsTrigger>
            </TabsList>

            <TabsContent value="students" className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold font-cairo">قائمة التلاميذ</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="font-cairo">
                      <UserPlus className="ml-2 h-4 w-4" />
                      إضافة تلميذ
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="font-cairo" dir="rtl">
                    <DialogHeader>
                      <DialogTitle>إضافة تلميذ جديد</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>الاسم الكامل</Label>
                        <Input
                          value={newStudent.full_name}
                          onChange={(e) => setNewStudent({ ...newStudent, full_name: e.target.value })}
                          className="text-right"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>الرقم الوطني المدرسي</Label>
                        <Input
                          value={newStudent.national_school_id}
                          onChange={(e) => setNewStudent({ ...newStudent, national_school_id: e.target.value })}
                          className="text-right"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>السنة الدراسية</Label>
                        <Input
                          value={newStudent.grade_level}
                          onChange={(e) => setNewStudent({ ...newStudent, grade_level: e.target.value })}
                          className="text-right"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>القسم</Label>
                        <Input
                          value={newStudent.class_section}
                          onChange={(e) => setNewStudent({ ...newStudent, class_section: e.target.value })}
                          className="text-right"
                        />
                      </div>
                      <Button onClick={handleAddStudent} className="w-full">
                        إضافة
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                {students.map((student) => (
                  <Card key={student.id} className="glass-card hover-lift">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold font-cairo">{student.full_name}</h4>
                            <p className="text-sm text-muted-foreground font-tajawal">
                              {student.grade_level} - {student.class_section}
                            </p>
                            <p className="text-xs text-muted-foreground font-tajawal">
                              الرقم المدرسي: {student.national_school_id}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteStudent(student.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="messages" className="space-y-6">
              <h3 className="text-2xl font-bold font-cairo">رسائل الأولياء</h3>
              <div className="space-y-4">
                {messages.map((message) => (
                  <Card key={message.id} className={`glass-card hover-lift ${!message.is_read ? 'border-primary' : ''}`}>
                    <CardContent className="p-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold font-cairo">{message.subject}</h4>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleOpenReply(message)}
                            >
                              <MessageSquare className="ml-2 h-4 w-4" />
                              رد
                            </Button>
                            {!message.is_read && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAsRead(message.id)}
                              >
                                تحديد كمقروء
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground font-tajawal">
                          من: {message.sender?.full_name || 'غير معروف'}
                        </p>
                        {message.student && (
                          <p className="text-sm text-muted-foreground font-tajawal">
                            حول التلميذ: {message.student.full_name}
                          </p>
                        )}
                        <p className="text-sm font-tajawal mt-2">{message.content}</p>
                        <p className="text-xs text-muted-foreground font-tajawal">
                          {new Date(message.created_at).toLocaleDateString('ar-DZ')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {messages.length === 0 && (
                  <p className="text-center text-muted-foreground font-tajawal py-8">
                    لا توجد رسائل
                  </p>
                )}
              </div>
            </TabsContent>

            <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
              <DialogContent className="font-cairo" dir="rtl">
                <DialogHeader>
                  <DialogTitle>الرد على الرسالة</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>إلى</Label>
                    <Input
                      value={replyMessage.recipientName}
                      disabled
                      className="text-right bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الموضوع</Label>
                    <Input
                      value={`رد: ${replyMessage.originalSubject}`}
                      disabled
                      className="text-right bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الرسالة</Label>
                    <Textarea
                      value={replyMessage.content}
                      onChange={(e) => setReplyMessage({ ...replyMessage, content: e.target.value })}
                      className="text-right font-tajawal min-h-[150px]"
                      placeholder="اكتب رسالتك هنا..."
                      dir="rtl"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSendReply} className="flex-1">
                      إرسال
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsReplyDialogOpen(false)}
                      className="flex-1"
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <TabsContent value="attendance" className="space-y-6">
              <h3 className="text-2xl font-bold font-cairo">تسجيل الحضور</h3>
              <Card className="glass-card">
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="font-cairo">اختر التلميذ</Label>
                    <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="اختر تلميذ" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="font-cairo">الحالة</Label>
                    <Select value={attendance.status} onValueChange={(value) => setAttendance({ ...attendance, status: value })}>
                      <SelectTrigger className="text-right">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">حاضر</SelectItem>
                        <SelectItem value="absent">غائب</SelectItem>
                        <SelectItem value="late">متأخر</SelectItem>
                        <SelectItem value="excused">غياب مبرر</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-cairo">ملاحظات</Label>
                    <Textarea
                      value={attendance.notes}
                      onChange={(e) => setAttendance({ ...attendance, notes: e.target.value })}
                      className="text-right font-tajawal"
                      dir="rtl"
                    />
                  </div>

                  <Button onClick={handleRecordAttendance} className="w-full font-cairo">
                    تسجيل الحضور
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default DashboardTeacher;