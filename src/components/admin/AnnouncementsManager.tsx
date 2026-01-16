import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtime } from "@/hooks/useRealtime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Plus, Trash2, X, Send, Users, Loader2 } from "lucide-react";
import { formatDateOnly } from "@/utils/formatters";
import { sendAnnouncementNotification } from "@/utils/sendPushNotification";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { messageSchema } from "@/lib/validations";

interface Announcement {
  id: string;
  subject: string;
  content: string;
  created_at: string;
  sender_id: string;
}

interface GradeLevel {
  grade_level: string;
  count: number;
}

export const AnnouncementsManager = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isAddingAnnouncement, setIsAddingAnnouncement] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    content: "",
    recipient_type: "all" as "all" | "teachers" | "parents",
    target_audience: "all" as "all" | "grade",
    selected_grade: "",
  });
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [recipientCount, setRecipientCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleAnnouncementsChange = useCallback(() => {
    fetchAnnouncements();
  }, []);

  // Real-time subscription for messages/announcements
  useRealtime({
    table: 'messages',
    onChange: handleAnnouncementsChange,
  });

  // Real-time subscription for news ticker
  useRealtime({
    table: 'news_ticker',
    onChange: handleAnnouncementsChange,
  });

  useEffect(() => {
    fetchAnnouncements();
    fetchGradeLevels();
  }, []);

  useEffect(() => {
    calculateRecipientCount();
  }, [formData.recipient_type, formData.target_audience, formData.selected_grade]);

  const fetchGradeLevels = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("grade_level");

      if (error) throw error;

      const gradeCounts = data.reduce((acc: Record<string, number>, student) => {
        acc[student.grade_level] = (acc[student.grade_level] || 0) + 1;
        return acc;
      }, {});

      const grades = Object.entries(gradeCounts).map(([grade, count]) => ({
        grade_level: grade,
        count: count as number,
      }));

      setGradeLevels(grades);
    } catch (error) {
      console.error("Error fetching grade levels:", error);
    }
  };

  const calculateRecipientCount = async () => {
    try {
      const { recipient_type, target_audience, selected_grade } = formData;

      if (recipient_type === "all") {
        // Count all users
        const { count } = await supabase
          .from("user_roles")
          .select("user_id", { count: "exact", head: true });
        setRecipientCount(count || 0);
        return;
      }

      if (recipient_type === "teachers") {
        let query = supabase
          .from("user_roles")
          .select("user_id", { count: "exact", head: true })
          .eq("role", "teacher");

        if (target_audience === "grade" && selected_grade) {
          const { data: teachers } = await supabase
            .from("teacher_grade_levels")
            .select("teacher_id")
            .eq("grade_level", selected_grade);

          if (teachers && teachers.length > 0) {
            const teacherIds = teachers.map(t => t.teacher_id);
            query = query.in("user_id", teacherIds);
          } else {
            setRecipientCount(0);
            return;
          }
        }

        const { count } = await query;
        setRecipientCount(count || 0);
      } else {
        // Parents
        let query = supabase
          .from("parent_students")
          .select("parent_id", { count: "exact", head: true });

        if (target_audience === "grade" && selected_grade) {
          const { data: students } = await supabase
            .from("students")
            .select("id")
            .eq("grade_level", selected_grade);

          if (students && students.length > 0) {
            const studentIds = students.map(s => s.id);
            query = query.in("student_id", studentIds);
          }
        }

        const { count } = await query;
        setRecipientCount(count || 0);
      }
    } catch (error) {
      console.error("Error calculating recipient count:", error);
    }
  };

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل تحميل الإعلانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.content.trim()) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال عنوان الإعلان والمحتوى",
        variant: "destructive",
      });
      return;
    }

    if (formData.target_audience === "grade" && !formData.selected_grade && formData.recipient_type !== "all") {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار القسم",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      // Validate message content
      messageSchema.parse({
        subject: formData.subject,
        content: formData.content,
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get target users based on recipient type and audience
      let targetUserIds: string[] = [];
      const { recipient_type, target_audience, selected_grade } = formData;

      if (recipient_type === "all") {
        const { data: allUserRoles } = await supabase
          .from("user_roles")
          .select("user_id");
        targetUserIds = allUserRoles?.map(ur => ur.user_id) || [];
      } else if (recipient_type === "teachers") {
        if (target_audience === "all") {
          const { data: allTeachers } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role", "teacher");
          targetUserIds = allTeachers?.map(t => t.user_id) || [];
        } else {
          const { data: teachers } = await supabase
            .from("teacher_grade_levels")
            .select("teacher_id")
            .eq("grade_level", selected_grade);
          targetUserIds = teachers?.map(t => t.teacher_id) || [];
        }
      } else {
        // Parents
        if (target_audience === "all") {
          const { data: allParents } = await supabase
            .from("parent_students")
            .select("parent_id");
          targetUserIds = [...new Set(allParents?.map(p => p.parent_id) || [])];
        } else {
          const { data: students } = await supabase
            .from("students")
            .select("id")
            .eq("grade_level", selected_grade);

          if (students && students.length > 0) {
            const studentIds = students.map(s => s.id);
            const { data: parents } = await supabase
              .from("parent_students")
              .select("parent_id")
              .in("student_id", studentIds);
            targetUserIds = [...new Set(parents?.map(p => p.parent_id) || [])];
          }
        }
      }

      if (targetUserIds.length === 0) {
        toast({
          title: "تنبيه",
          description: "لا يوجد مستلمون للإعلان",
          variant: "destructive",
        });
        setSending(false);
        return;
      }

      // Send message to all target users
      const messages = targetUserIds.map(userId => ({
        sender_id: user.id,
        recipient_id: userId,
        subject: formData.subject,
        content: formData.content,
        student_id: null,
        is_read: false,
      }));

      const { error } = await supabase
        .from("messages")
        .insert(messages);

      if (error) throw error;

      // Send push notifications to all target users
      await sendAnnouncementNotification(targetUserIds, formData.subject, formData.content);

      toast({
        title: "نجاح",
        description: `تم إرسال الإعلان والإشعارات إلى ${targetUserIds.length} مستخدم`,
      });

      resetForm();
      fetchAnnouncements();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.errors?.[0]?.message || error.message || "فشل إرسال الإعلان",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (announcementId: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", announcementId);

      if (error) throw error;

      toast({
        title: "نجاح",
        description: "تم حذف الإعلان بنجاح",
      });

      fetchAnnouncements();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل حذف الإعلان",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      subject: "",
      content: "",
      recipient_type: "all",
      target_audience: "all",
      selected_grade: "",
    });
    setIsAddingAnnouncement(false);
  };

  const getRecipientLabel = () => {
    if (formData.recipient_type === "all") return "مستخدم";
    if (formData.recipient_type === "teachers") return "أستاذ";
    return "ولي أمر";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold font-cairo">الإعلانات والرسائل الجماعية</h2>
        <Button
          onClick={() => setIsAddingAnnouncement(true)}
          className="font-cairo"
        >
          <Plus className="ml-2 h-4 w-4" />
          إعلان جديد
        </Button>
      </div>

      {/* Add Announcement Form */}
      {isAddingAnnouncement && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-cairo">
              <Send className="w-5 h-5" />
              إرسال إعلان جديد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendAnnouncement} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipient_type" className="font-cairo">
                  المستهدفون
                </Label>
                <Select
                  value={formData.recipient_type}
                  onValueChange={(value: "all" | "teachers" | "parents") => 
                    setFormData({ ...formData, recipient_type: value, target_audience: "all", selected_grade: "" })
                  }
                >
                  <SelectTrigger className="font-cairo">
                    <SelectValue placeholder="اختر الفئة المستهدفة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="font-cairo">الجميع</SelectItem>
                    <SelectItem value="teachers" className="font-cairo">المعلمين فقط</SelectItem>
                    <SelectItem value="parents" className="font-cairo">أولياء الأمور فقط</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.recipient_type !== "all" && (
                <div className="space-y-2">
                  <Label htmlFor="target_audience" className="font-cairo">نطاق الإرسال</Label>
                  <Select 
                    value={formData.target_audience} 
                    onValueChange={(value: "all" | "grade") => 
                      setFormData({ ...formData, target_audience: value, selected_grade: "" })
                    }
                  >
                    <SelectTrigger className="font-cairo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="font-cairo">
                        {formData.recipient_type === "parents" ? "جميع أولياء الأمور" : "جميع الأساتذة"}
                      </SelectItem>
                      <SelectItem value="grade" className="font-cairo">قسم محدد</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.target_audience === "grade" && formData.recipient_type !== "all" && (
                <div className="space-y-2">
                  <Label htmlFor="grade" className="font-cairo">اختر القسم</Label>
                  <Select 
                    value={formData.selected_grade} 
                    onValueChange={(value) => setFormData({ ...formData, selected_grade: value })}
                  >
                    <SelectTrigger className="font-cairo">
                      <SelectValue placeholder="اختر القسم" />
                    </SelectTrigger>
                    <SelectContent>
                      {gradeLevels.map((grade) => (
                        <SelectItem key={grade.grade_level} value={grade.grade_level} className="font-cairo">
                          {grade.grade_level} ({grade.count} تلميذ)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-cairo text-sm">
                  عدد المستلمين: <strong>{recipientCount}</strong> {getRecipientLabel()}
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="font-cairo">
                  العنوان
                </Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="font-cairo"
                  placeholder="عنوان الإعلان"
                  maxLength={200}
                  required
                />
                <p className="text-xs text-muted-foreground font-cairo">
                  {formData.subject.length}/200 حرف
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="font-cairo">
                  المحتوى
                </Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="font-cairo min-h-[150px] resize-none"
                  placeholder="نص الإعلان"
                  maxLength={5000}
                  required
                />
                <p className="text-xs text-muted-foreground font-cairo">
                  {formData.content.length}/5000 حرف
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={resetForm} className="font-cairo">
                  <X className="ml-2 h-4 w-4" />
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  className="font-cairo bg-gradient-primary text-white"
                  disabled={sending || !formData.subject.trim() || !formData.content.trim() || recipientCount === 0}
                >
                  {sending ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="ml-2 h-4 w-4" />
                      إرسال لـ {recipientCount} مستلم
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold font-cairo">الإعلانات السابقة</h3>
        {loading ? (
          <Card className="glass-card">
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground font-cairo">
                جاري التحميل...
              </div>
            </CardContent>
          </Card>
        ) : announcements.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground font-cairo">
                لا توجد إعلانات
              </div>
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id} className="glass-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="font-cairo">
                      {announcement.subject}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-cairo">
                        <Megaphone className="ml-1 h-3 w-3" />
                        إعلان
                      </Badge>
                      <span className="text-sm text-muted-foreground font-cairo">
                        {formatDateOnly(announcement.created_at)}
                      </span>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="font-cairo">
                          تأكيد الحذف
                        </DialogTitle>
                        <DialogDescription className="font-cairo">
                          هل أنت متأكد من حذف هذا الإعلان؟ لا يمكن التراجع عن هذا الإجراء.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="destructive"
                          onClick={() => handleDelete(announcement.id)}
                          className="font-cairo"
                        >
                          حذف
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground font-cairo whitespace-pre-wrap">
                  {announcement.content}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-cairo text-lg">
              <Megaphone className="w-5 h-5 text-primary" />
              إجمالي الإعلانات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{announcements.length}</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-cairo text-lg">
              <Send className="w-5 h-5 text-secondary" />
              إعلانات هذا الشهر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {announcements.filter(a => {
                const date = new Date(a.created_at);
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
              }).length}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
