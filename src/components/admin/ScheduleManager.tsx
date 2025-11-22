import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Trash2, Calendar } from "lucide-react";

const GRADE_LEVELS = [
  "التحضيري",
  "سنة أولى",
  "سنة ثانية",
  "سنة ثالثة",
  "سنة رابعة",
  "سنة خامسة"
];

export const ScheduleManager = () => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('class_schedules')
        .select('*')
        .order('grade_level', { ascending: true });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error: any) {
      toast.error("خطأ في تحميل جداول الحصص");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    if (!selectedGrade) {
      toast.error("الرجاء اختيار القسم أولاً");
      return;
    }

    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${selectedGrade}-${Date.now()}.${fileExt}`;

    setUploading(true);
    try {
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('schedules')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('schedules')
        .getPublicUrl(fileName);

      // Check if schedule exists for this grade
      const { data: existingSchedule } = await supabase
        .from('class_schedules')
        .select('id')
        .eq('grade_level', selectedGrade)
        .maybeSingle();

      if (existingSchedule) {
        // Update existing
        const { error: updateError } = await supabase
          .from('class_schedules')
          .update({ schedule_image_url: publicUrl, updated_at: new Date().toISOString() })
          .eq('id', existingSchedule.id);

        if (updateError) throw updateError;
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('class_schedules')
          .insert({
            grade_level: selectedGrade,
            schedule_image_url: publicUrl,
            is_active: true
          });

        if (insertError) throw insertError;
      }

      toast.success("تم رفع جدول الحصص بنجاح");
      fetchSchedules();
      setSelectedGrade("");
    } catch (error: any) {
      toast.error("خطأ في رفع جدول الحصص");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    if (!confirm("هل أنت متأكد من حذف جدول الحصص؟")) return;

    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('schedules')
        .remove([fileName]);

      if (storageError) console.error("Storage delete error:", storageError);

      // Delete from database
      const { error: dbError } = await supabase
        .from('class_schedules')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      toast.success("تم حذف جدول الحصص بنجاح");
      fetchSchedules();
    } catch (error: any) {
      toast.error("خطأ في حذف جدول الحصص");
      console.error(error);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('class_schedules')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(currentStatus ? "تم إخفاء الجدول" : "تم تفعيل الجدول");
      fetchSchedules();
    } catch (error: any) {
      toast.error("خطأ في تحديث حالة الجدول");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-cairo">
            <Calendar className="w-6 h-6 text-primary" />
            إدارة جدول الحصص الأسبوعي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="grade" className="font-cairo">اختر القسم</Label>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger id="grade">
                <SelectValue placeholder="اختر القسم" />
              </SelectTrigger>
              <SelectContent>
                {GRADE_LEVELS.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="schedule-file" className="font-cairo">رفع صورة جدول الحصص</Label>
            <div className="flex gap-2">
              <Input
                id="schedule-file"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={!selectedGrade || uploading}
                className="font-cairo"
              />
              <Button disabled={uploading} className="shrink-0">
                <Upload className="w-4 h-4 ml-2" />
                {uploading ? "جاري الرفع..." : "رفع"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground font-cairo">
              قم برفع صورة جدول الحصص للقسم المحدد (JPG, PNG, أو PDF)
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schedules.map((schedule) => (
          <Card key={schedule.id} className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg font-cairo flex items-center justify-between">
                {schedule.grade_level}
                <div className="flex gap-2">
                  <Button
                    variant={schedule.is_active ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleActive(schedule.id, schedule.is_active)}
                  >
                    {schedule.is_active ? "مفعل" : "معطل"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(schedule.id, schedule.schedule_image_url)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={schedule.schedule_image_url}
                alt={`جدول ${schedule.grade_level}`}
                className="w-full h-auto rounded-lg border"
              />
              <p className="text-xs text-muted-foreground mt-2 font-cairo">
                آخر تحديث: {new Date(schedule.updated_at).toLocaleDateString('ar-DZ')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {schedules.length === 0 && (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-bold mb-2 font-cairo">لا توجد جداول حصص</h3>
            <p className="text-muted-foreground font-cairo">
              قم برفع جدول الحصص لكل قسم من الأعلى
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};