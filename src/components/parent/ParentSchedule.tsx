import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ParentScheduleProps {
  selectedChild: string;
  children: any[];
}

export const ParentSchedule = ({ selectedChild, children }: ParentScheduleProps) => {
  const [schedule, setSchedule] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedChild) {
      fetchSchedule();
    }
  }, [selectedChild]);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      // Get the selected child's grade level
      const child = children.find(c => c.id === selectedChild);
      if (!child) return;

      const { data, error } = await supabase
        .from('class_schedules')
        .select('*')
        .eq('grade_level', child.grade_level)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      setSchedule(data);
    } catch (error: any) {
      toast.error("خطأ في تحميل جدول الحصص");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (schedule?.schedule_image_url) {
      window.open(schedule.schedule_image_url, '_blank');
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!schedule) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-cairo">
            <Calendar className="w-6 h-6 text-primary" />
            جدول الحصص الأسبوعي
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-bold mb-2 font-cairo">لا يوجد جدول حصص</h3>
          <p className="text-muted-foreground font-cairo">
            جدول الحصص غير متوفر حالياً لهذا القسم
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between font-cairo">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            جدول الحصص الأسبوعي
          </div>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 ml-2" />
            تحميل
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <img
            src={schedule.schedule_image_url}
            alt="جدول الحصص الأسبوعي"
            className="w-full h-auto rounded-lg border shadow-lg"
          />
          <p className="text-sm text-muted-foreground text-center font-cairo">
            آخر تحديث: {new Date(schedule.updated_at).toLocaleDateString('ar-DZ', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};