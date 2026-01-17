import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Send, Users, Loader2, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { sendMessageNotification } from "@/utils/sendPushNotification";

interface GradeLevel {
  grade_level: string;
  count: number;
}

export const TeacherGroupMessaging = () => {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [recipientCount, setRecipientCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTeacherGrades();
  }, []);

  useEffect(() => {
    if (selectedGrades.length > 0) {
      calculateRecipientCount();
    } else {
      setRecipientCount(0);
    }
  }, [selectedGrades]);

  const fetchTeacherGrades = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get grades assigned to this teacher
      const { data: assignedGrades } = await supabase
        .from("teacher_grade_levels")
        .select("grade_level")
        .eq("teacher_id", user.id);

      if (!assignedGrades || assignedGrades.length === 0) {
        toast({
          title: "تنبيه",
          description: "لا توجد أقسام مسندة لك حالياً",
          variant: "destructive",
        });
        return;
      }

      const gradeList = assignedGrades.map(g => g.grade_level);

      // Get student count for each grade
      const { data: students } = await supabase
        .from("students")
        .select("grade_level")
        .in("grade_level", gradeList);

      if (students) {
        const gradeCounts = students.reduce((acc: Record<string, number>, student) => {
          acc[student.grade_level] = (acc[student.grade_level] || 0) + 1;
          return acc;
        }, {});

        const grades = Object.entries(gradeCounts).map(([grade, count]) => ({
          grade_level: grade,
          count: count as number,
        }));

        setGradeLevels(grades);
        
        // Select all grades by default
        if (grades.length > 0) {
          setSelectedGrades(grades.map(g => g.grade_level));
        }
      }
    } catch (error) {
      console.error("Error fetching teacher grades:", error);
    }
  };

  const calculateRecipientCount = async () => {
    try {
      if (selectedGrades.length === 0) {
        setRecipientCount(0);
        return;
      }

      const { data: students } = await supabase
        .from("students")
        .select("id")
        .in("grade_level", selectedGrades);

      if (students && students.length > 0) {
        const studentIds = students.map(s => s.id);
        const { count } = await supabase
          .from("parent_students")
          .select("parent_id", { count: "exact", head: true })
          .in("student_id", studentIds);

        setRecipientCount(count || 0);
      } else {
        setRecipientCount(0);
      }
    } catch (error) {
      console.error("Error calculating recipient count:", error);
    }
  };

  const toggleGrade = (grade: string) => {
    setSelectedGrades(prev => {
      if (prev.includes(grade)) {
        return prev.filter(g => g !== grade);
      } else {
        return [...prev, grade];
      }
    });
  };

  const selectAllGrades = () => {
    if (selectedGrades.length === gradeLevels.length) {
      setSelectedGrades([]);
    } else {
      setSelectedGrades(gradeLevels.map(g => g.grade_level));
    }
  };

  const handleSendGroupMessage = async () => {
    if (!subject.trim() || !content.trim()) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال عنوان الرسالة والمحتوى",
        variant: "destructive",
      });
      return;
    }

    if (selectedGrades.length === 0) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار قسم واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get students in selected grades
      const { data: students } = await supabase
        .from("students")
        .select("id")
        .in("grade_level", selectedGrades);

      if (!students || students.length === 0) {
        toast({
          title: "تنبيه",
          description: "لا يوجد تلاميذ في الأقسام المحددة",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const studentIds = students.map(s => s.id);

      // Get parents of these students
      const { data: parents } = await supabase
        .from("parent_students")
        .select("parent_id")
        .in("student_id", studentIds);

      if (!parents || parents.length === 0) {
        toast({
          title: "تنبيه",
          description: "لا يوجد أولياء أمور مرتبطين بتلاميذ هذه الأقسام",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const recipientIds = [...new Set(parents.map(p => p.parent_id))];

      // Insert messages for all recipients
      const messages = recipientIds.map(recipientId => ({
        sender_id: user.id,
        recipient_id: recipientId,
        subject,
        content,
        is_read: false,
      }));

      const { error } = await supabase
        .from("messages")
        .insert(messages);

      if (error) throw error;

      // Get teacher name for notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      // Send push notification to all recipients
      await sendMessageNotification(
        recipientIds,
        profile?.full_name || 'معلم',
        subject
      );

      toast({
        title: "تم الإرسال",
        description: `تم إرسال الرسالة إلى ${recipientIds.length} ولي أمر في ${selectedGrades.length} قسم`,
      });

      // Reset form
      setSubject("");
      setContent("");
    } catch (error) {
      console.error("Error sending group message:", error);
      toast({
        title: "خطأ",
        description: "فشل إرسال الرسالة الجماعية",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (gradeLevels.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground font-cairo">
            لا توجد أقسام مسندة لك حالياً. الرجاء مراجعة الإدارة.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-cairo">
            <Send className="w-5 h-5" />
            إرسال رسالة جماعية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-cairo">اختر الأقسام</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={selectAllGrades}
                className="font-cairo text-xs"
              >
                {selectedGrades.length === gradeLevels.length ? "إلغاء تحديد الكل" : "تحديد الكل"}
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {gradeLevels.map((grade) => (
                <div
                  key={grade.grade_level}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedGrades.includes(grade.grade_level)
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                  onClick={() => toggleGrade(grade.grade_level)}
                >
                  <Checkbox
                    checked={selectedGrades.includes(grade.grade_level)}
                    onCheckedChange={() => toggleGrade(grade.grade_level)}
                    className="pointer-events-none"
                  />
                  <div className="flex-1">
                    <p className="font-cairo font-medium text-sm">{grade.grade_level}</p>
                    <p className="font-cairo text-xs text-muted-foreground">{grade.count} تلميذ</p>
                  </div>
                  {selectedGrades.includes(grade.grade_level) && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Users className="w-5 h-5 text-primary" />
            <span className="font-cairo text-sm">
              عدد المستلمين: <strong>{recipientCount}</strong> ولي أمر في <strong>{selectedGrades.length}</strong> قسم
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject" className="font-cairo">عنوان الرسالة</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="أدخل عنوان الرسالة"
              maxLength={200}
              className="font-cairo"
            />
            <p className="text-xs text-muted-foreground font-cairo">
              {subject.length}/200 حرف
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="font-cairo">محتوى الرسالة</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="أدخل محتوى الرسالة"
              rows={6}
              maxLength={5000}
              className="font-cairo resize-none"
            />
            <p className="text-xs text-muted-foreground font-cairo">
              {content.length}/5000 حرف
            </p>
          </div>

          <Button
            onClick={handleSendGroupMessage}
            disabled={loading || !subject.trim() || !content.trim() || recipientCount === 0}
            className="w-full bg-gradient-primary text-white font-cairo"
          >
            {loading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <Send className="ml-2 h-4 w-4" />
                إرسال الرسالة لـ {recipientCount} مستلم
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
