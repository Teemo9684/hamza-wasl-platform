import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image as ImageIcon, Loader2, Save, X, Trophy } from "lucide-react";
import { showError, showSuccess } from "@/utils/errorMessages";

interface CountdownRow {
  id: string;
  title: string;
  subtitle: string | null;
  target_date: string;
  image_url: string | null;
  result_message: string | null;
  is_enabled: boolean;
}

// Convert ISO/UTC date string to local "YYYY-MM-DDTHH:mm" for datetime-local input
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const ResultsCountdownManager = () => {
  const [row, setRow] = useState<CountdownRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("results_countdown")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      showError("تعذر تحميل بيانات العد التنازلي");
      setLoading(false);
      return;
    }

    if (data) {
      setRow(data as CountdownRow);
      setTitle(data.title);
      setSubtitle(data.subtitle || "");
      setTargetDate(toLocalInput(data.target_date));
      setResultMessage(data.result_message || "");
      setImageUrl(data.image_url);
      setIsEnabled(data.is_enabled);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      showError("حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت)");
      return;
    }
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const fileName = `results-${Date.now()}.${ext}`;
      const path = `results-countdown/${fileName}`;
      const { error: upErr } = await supabase.storage
        .from("posters")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("posters").getPublicUrl(path);
      setImageUrl(urlData.publicUrl);
      showSuccess("تم رفع الصورة");
    } catch (err: any) {
      console.error(err);
      showError(err.message || "تعذر رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !targetDate) {
      showError("يرجى ملء العنوان والتاريخ");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        target_date: new Date(targetDate).toISOString(),
        image_url: imageUrl,
        result_message: resultMessage.trim() || null,
        is_enabled: isEnabled,
      };

      if (row) {
        const { error } = await supabase
          .from("results_countdown")
          .update(payload)
          .eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("results_countdown")
          .insert(payload);
        if (error) throw error;
      }
      showSuccess("تم حفظ الإعدادات");
      await load();
    } catch (err: any) {
      console.error(err);
      showError(err.message || "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-cairo">العد التنازلي للنتائج</h2>
          <p className="text-sm text-muted-foreground font-cairo">
            تحكم في تاريخ ووقت الإعلان والصورة التي تظهر بعد انتهاء العد
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-cairo text-base">الإعدادات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="font-cairo">تفعيل العرض في الواجهة الرئيسية</Label>
              <p className="text-xs text-muted-foreground font-cairo">
                إذا أوقفته، يختفي العد من الصفحة الرئيسية
              </p>
            </div>
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="font-cairo">العنوان</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="نتائج شهادة التعليم الابتدائي"
              dir="rtl"
              className="font-cairo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle" className="font-cairo">نص فرعي (اختياري)</Label>
            <Input
              id="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="العد التنازلي للإعلان عن النتائج"
              dir="rtl"
              className="font-cairo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="font-cairo">تاريخ ووقت الإعلان</Label>
            <Input
              id="date"
              type="datetime-local"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="font-cairo"
            />
            <p className="text-xs text-muted-foreground font-cairo">
              بالتوقيت المحلي للجهاز
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="msg" className="font-cairo">رسالة بعد انتهاء العد (اختياري)</Label>
            <Textarea
              id="msg"
              value={resultMessage}
              onChange={(e) => setResultMessage(e.target.value)}
              placeholder="مبروك النجاح لتلاميذنا الأعزاء"
              dir="rtl"
              rows={2}
              className="font-cairo resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-cairo">صورة النتائج (تظهر بعد انتهاء العد)</Label>
            {imageUrl ? (
              <div className="relative rounded-lg overflow-hidden border">
                <img src={imageUrl} alt="معاينة" className="w-full max-h-72 object-contain bg-muted" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 left-2"
                  onClick={() => setImageUrl(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                {uploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <ImageIcon className="w-10 h-10 text-muted-foreground mb-2" />
                    <span className="text-muted-foreground font-cairo text-sm">
                      اضغط لاختيار صورة (حتى 5 ميجابايت)
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                  }}
                />
              </label>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full font-cairo"
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 ml-2" />
                حفظ الإعدادات
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
