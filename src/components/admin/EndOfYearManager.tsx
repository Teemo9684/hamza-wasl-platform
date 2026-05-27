import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Sparkles, Eye } from "lucide-react";
import { toast } from "sonner";

interface Setting {
  enabled: boolean;
  title: string;
  message: string;
  submessage: string;
}

const DEFAULTS: Setting = {
  enabled: false,
  title: "انتهى العام الدراسي",
  message: "نتمنى لجميع تلاميذنا الأعزاء عطلة صيفية ممتعة ومفيدة",
  submessage: "انتظرونا مع انطلاقة عام دراسي جديد بإذن الله",
};

export const EndOfYearManager = () => {
  const [setting, setSetting] = useState<Setting>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("setting_value")
        .eq("setting_key", "end_of_year_mode")
        .maybeSingle();

      if (data?.setting_value) {
        setSetting({ ...DEFAULTS, ...(data.setting_value as any) });
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("app_settings")
        .select("id")
        .eq("setting_key", "end_of_year_mode")
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("app_settings")
          .update({ setting_value: setting as any })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("app_settings").insert({
          setting_key: "end_of_year_mode",
          setting_value: setting as any,
        });
        if (error) throw error;
      }
      toast.success("تم حفظ الإعدادات بنجاح");
    } catch (e: any) {
      toast.error(`فشل الحفظ: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-cairo" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">وضع نهاية العام الدراسي</h2>
          <p className="text-sm text-muted-foreground">
            عند التفعيل، ستظهر شاشة ترحيبية بنهاية العام لجميع المستخدمين وتحجب باقي محتوى التطبيق
          </p>
        </div>
      </div>

      {setting.enabled && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <Eye className="h-5 w-5 text-amber-600" />
          <AlertDescription className="mr-2 text-amber-900 dark:text-amber-100">
            <strong>الوضع مفعّل حالياً</strong> — يرى جميع المستخدمين (عدا المسؤول) شاشة نهاية العام فقط.
          </AlertDescription>
        </Alert>
      )}

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>إعدادات الشاشة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between p-4 rounded-lg bg-card/50 border">
            <div>
              <Label htmlFor="enabled" className="text-base font-semibold cursor-pointer">
                تفعيل وضع نهاية العام
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                إخفاء جميع البطاقات والأقسام وعرض رسالة نهاية العام
              </p>
            </div>
            <Switch
              id="enabled"
              checked={setting.enabled}
              onCheckedChange={(checked) => setSetting({ ...setting, enabled: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">العنوان الرئيسي</Label>
            <Input
              id="title"
              value={setting.title}
              onChange={(e) => setSetting({ ...setting, title: e.target.value })}
              placeholder="انتهى العام الدراسي"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">الرسالة الأساسية</Label>
            <Textarea
              id="message"
              value={setting.message}
              onChange={(e) => setSetting({ ...setting, message: e.target.value })}
              rows={3}
              placeholder="نتمنى لجميع تلاميذنا..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="submessage">الرسالة الفرعية</Label>
            <Input
              id="submessage"
              value={setting.submessage}
              onChange={(e) => setSetting({ ...setting, submessage: e.target.value })}
              placeholder="انتظرونا مع انطلاقة عام دراسي جديد"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white"
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              "حفظ الإعدادات"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
