import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Plus, Edit, Trash2, Save, X, Send } from "lucide-react";
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

export const AnnouncementsManager = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isAddingAnnouncement, setIsAddingAnnouncement] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    content: "",
    target_role: "all",
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

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

    try {
      // Validate message content
      messageSchema.parse({
        subject: formData.subject,
        content: formData.content,
      });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get target users based on role
      let targetUserIds: string[] = [];
      
      if (formData.target_role !== "all") {
        const roleValue = formData.target_role as "teacher" | "parent";
        const { data: userRoles } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", roleValue);
        
        targetUserIds = userRoles?.map(ur => ur.user_id) || [];
      } else {
        const { data: allUserRoles } = await supabase
          .from("user_roles")
          .select("user_id");
        
        targetUserIds = allUserRoles?.map(ur => ur.user_id) || [];
      }

      // Send message to all target users
      const messages = targetUserIds.map(userId => ({
        sender_id: user.id,
        recipient_id: userId,
        subject: formData.subject,
        content: formData.content,
        student_id: null,
      }));

      const { error } = await supabase
        .from("messages")
        .insert(messages);

      if (error) throw error;

      toast({
        title: "نجاح",
        description: `تم إرسال الإعلان إلى ${targetUserIds.length} مستخدم`,
      });

      resetForm();
      fetchAnnouncements();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.errors?.[0]?.message || error.message || "فشل إرسال الإعلان",
        variant: "destructive",
      });
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
      target_role: "all",
    });
    setIsAddingAnnouncement(false);
  };

  const getRoleBadge = (role: string) => {
    const roleMap: { [key: string]: string } = {
      all: "الكل",
      teacher: "المعلمين",
      parent: "أولياء الأمور",
    };
    return roleMap[role] || role;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold font-cairo">إدارة الإعلانات</h2>
        <Button
          onClick={() => setIsAddingAnnouncement(true)}
          className="font-tajawal"
        >
          <Plus className="ml-2 h-4 w-4" />
          إعلان جديد
        </Button>
      </div>

      {/* Add Announcement Form */}
      {isAddingAnnouncement && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-cairo">إرسال إعلان جديد</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendAnnouncement} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="target_role" className="font-cairo">
                  المستهدفون
                </Label>
                <Select
                  value={formData.target_role}
                  onValueChange={(value) => setFormData({ ...formData, target_role: value })}
                >
                  <SelectTrigger className="font-tajawal">
                    <SelectValue placeholder="اختر الفئة المستهدفة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="font-tajawal">الجميع</SelectItem>
                    <SelectItem value="teacher" className="font-tajawal">المعلمين فقط</SelectItem>
                    <SelectItem value="parent" className="font-tajawal">أولياء الأمور فقط</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="font-cairo">
                  العنوان
                </Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="font-tajawal"
                  placeholder="عنوان الإعلان"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="font-cairo">
                  المحتوى
                </Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="font-tajawal min-h-[150px]"
                  placeholder="نص الإعلان"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={resetForm} className="font-tajawal">
                  <X className="ml-2 h-4 w-4" />
                  إلغاء
                </Button>
                <Button type="submit" className="font-tajawal">
                  <Send className="ml-2 h-4 w-4" />
                  إرسال الإعلان
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {loading ? (
          <Card className="glass-card">
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground font-tajawal">
                جاري التحميل...
              </div>
            </CardContent>
          </Card>
        ) : announcements.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground font-tajawal">
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
                      <Badge variant="secondary" className="font-tajawal">
                        <Megaphone className="ml-1 h-3 w-3" />
                        إعلان
                      </Badge>
                      <span className="text-sm text-muted-foreground font-tajawal">
                        {new Date(announcement.created_at).toLocaleDateString("ar-EG")}
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
                        <DialogDescription className="font-tajawal">
                          هل أنت متأكد من حذف هذا الإعلان؟ لا يمكن التراجع عن هذا الإجراء.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="destructive"
                          onClick={() => handleDelete(announcement.id)}
                          className="font-tajawal"
                        >
                          حذف
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground font-tajawal whitespace-pre-wrap">
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
