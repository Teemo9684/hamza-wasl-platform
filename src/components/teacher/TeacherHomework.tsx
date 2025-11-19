import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Plus, Trash2, Upload, FileText, Calendar, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Homework {
  id: string;
  title: string;
  description: string;
  grade_level: string;
  subject: string | null;
  due_date: string;
  attachment_url: string | null;
  created_at: string;
}

export const TeacherHomework = () => {
  const [homework, setHomework] = useState<Homework[]>([]);
  const [gradeLevels, setGradeLevels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    fetchTeacherGrades();
    fetchHomework();
  }, []);

  const fetchTeacherGrades = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("teacher_grade_levels")
        .select("grade_level")
        .eq("teacher_id", user.id);

      if (data) {
        setGradeLevels(data.map(g => g.grade_level));
        if (data.length > 0) {
          setSelectedGrade(data[0].grade_level);
        }
      }
    } catch (error) {
      console.error("Error fetching grades:", error);
    }
  };

  const fetchHomework = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("homework")
        .select("*")
        .order("due_date", { ascending: true });

      if (error) throw error;
      setHomework(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل تحميل الواجبات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Limit file size to 10MB
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "خطأ",
          description: "حجم الملف يجب أن يكون أقل من 10 ميجابايت",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('homework')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('homework')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading file:", error);
      return null;
    }
  };

  const handleAddHomework = async () => {
    if (!title.trim() || !description.trim() || !selectedGrade || !dueDate) {
      toast({
        title: "خطأ",
        description: "الرجاء ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      let attachmentUrl = null;
      if (file) {
        attachmentUrl = await uploadFile(file);
      }

      const { error } = await supabase
        .from("homework")
        .insert({
          title,
          description,
          grade_level: selectedGrade,
          subject: subject || null,
          due_date: dueDate,
          teacher_id: user.id,
          attachment_url: attachmentUrl,
        });

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إضافة الواجب بنجاح",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setSubject("");
      setDueDate("");
      setFile(null);
      setIsDialogOpen(false);
      fetchHomework();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل إضافة الواجب",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteHomework = async (id: string) => {
    try {
      const { error } = await supabase
        .from("homework")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم حذف الواجب بنجاح",
      });
      fetchHomework();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل حذف الواجب",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-cairo">
              <BookOpen className="w-5 h-5" />
              الواجبات المنزلية
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary text-white font-cairo">
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة واجب جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="font-cairo">إضافة واجب منزلي جديد</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="font-cairo">عنوان الواجب *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="مثال: حل تمارين الرياضيات"
                      maxLength={200}
                      className="font-cairo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="font-cairo">وصف الواجب *</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="اكتب تفاصيل الواجب والتعليمات..."
                      rows={4}
                      maxLength={2000}
                      className="font-cairo resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="grade" className="font-cairo">القسم *</Label>
                      <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                        <SelectTrigger className="font-cairo">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {gradeLevels.map((grade) => (
                            <SelectItem key={grade} value={grade} className="font-cairo">
                              {grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="font-cairo">المادة</Label>
                      <Input
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="مثال: الرياضيات"
                        className="font-cairo"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate" className="font-cairo">تاريخ التسليم *</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="font-cairo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file" className="font-cairo">إرفاق ملف (اختياري)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="file"
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        className="font-cairo"
                      />
                      {file && (
                        <span className="text-sm text-muted-foreground font-cairo">
                          {file.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-cairo">
                      الحجم الأقصى: 10 ميجابايت | الصيغ المدعومة: PDF, Word, صور
                    </p>
                  </div>

                  <Button
                    onClick={handleAddHomework}
                    disabled={uploading}
                    className="w-full bg-gradient-primary text-white font-cairo"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جاري الإضافة...
                      </>
                    ) : (
                      <>
                        <Plus className="ml-2 h-4 w-4" />
                        إضافة الواجب
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
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
              {homework.map((hw) => (
                <Card key={hw.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg font-cairo mb-2">{hw.title}</h3>
                        <p className="text-muted-foreground font-cairo mb-3">{hw.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span className="font-cairo">
                              التسليم: {new Date(hw.due_date).toLocaleDateString('ar-DZ')}
                            </span>
                          </div>
                          <span className="font-cairo text-primary">القسم: {hw.grade_level}</span>
                          {hw.subject && (
                            <span className="font-cairo">المادة: {hw.subject}</span>
                          )}
                        </div>
                        {hw.attachment_url && (
                          <a
                            href={hw.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-primary hover:underline font-cairo"
                          >
                            <FileText className="w-4 h-4" />
                            عرض المرفق
                          </a>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteHomework(hw.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
