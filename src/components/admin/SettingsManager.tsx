import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Calendar, Bell, Shield } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface HolidayModeSettings {
  enabled: boolean;
  message: string;
}

interface NotificationSettings {
  enabled: boolean;
}

interface AutoApprovalSettings {
  enabled: boolean;
}

export const SettingsManager = () => {
  const [holidayMode, setHolidayMode] = useState<HolidayModeSettings>({
    enabled: false,
    message: "التطبيق في وضع العطلة، سيعود العمل قريباً بإذن الله"
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setFetching(true);
      
      // Fetch holiday mode settings
      const { data: holidayData } = await supabase
        .from("app_settings")
        .select("setting_value")
        .eq("setting_key", "holiday_mode")
        .maybeSingle();

      if (holidayData) {
        const settings = holidayData.setting_value as unknown as HolidayModeSettings;
        setHolidayMode(settings);
      }

      // Fetch notifications settings
      const { data: notifData } = await supabase
        .from("app_settings")
        .select("setting_value")
        .eq("setting_key", "notifications_enabled")
        .maybeSingle();

      if (notifData) {
        const settings = notifData.setting_value as unknown as NotificationSettings;
        setNotificationsEnabled(settings.enabled);
      }

      // Fetch auto approval settings
      const { data: autoApprovalData } = await supabase
        .from("app_settings")
        .select("setting_value")
        .eq("setting_key", "auto_approve_registrations")
        .maybeSingle();

      if (autoApprovalData) {
        const settings = autoApprovalData.setting_value as unknown as AutoApprovalSettings;
        setAutoApprove(settings.enabled);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الإعدادات",
        variant: "destructive"
      });
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Update holiday mode
      const { error: holidayError } = await supabase
        .from("app_settings")
        .update({
          setting_value: holidayMode as any,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq("setting_key", "holiday_mode");

      if (holidayError) throw holidayError;

      // Update notifications
      const { error: notifError } = await supabase
        .from("app_settings")
        .update({
          setting_value: { enabled: notificationsEnabled } as any,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq("setting_key", "notifications_enabled");

      if (notifError) throw notifError;

      // Update auto approval
      const { error: autoError } = await supabase
        .from("app_settings")
        .update({
          setting_value: { enabled: autoApprove } as any,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq("setting_key", "auto_approve_registrations");

      if (autoError) throw autoError;

      toast({
        title: "نجاح",
        description: "تم حفظ الإعدادات بنجاح",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ الإعدادات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold font-cairo">الإعدادات</h2>
        <Button onClick={handleSave} disabled={loading} className="font-cairo">
          <Save className="ml-2 h-4 w-4" />
          {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
        </Button>
      </div>

      {holidayMode.enabled && (
        <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
          <Calendar className="h-4 w-4 text-orange-500" />
          <AlertTitle className="font-cairo text-orange-700 dark:text-orange-400">
            وضع العطلة مفعّل
          </AlertTitle>
          <AlertDescription className="font-cairo text-orange-600 dark:text-orange-300">
            التطبيق حالياً في وضع العطلة. سيرى المستخدمون رسالة العطلة عند محاولة الدخول.
          </AlertDescription>
        </Alert>
      )}

      {/* Holiday Mode Settings */}
      <Card className="glass-card border-2 border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-cairo text-orange-600 dark:text-orange-400">
            <Calendar className="w-5 h-5" />
            وضع العطلة
          </CardTitle>
          <CardDescription className="font-cairo">
            تفعيل وضع العطلة يمنع المستخدمين من الدخول ويعرض رسالة مخصصة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
            <div className="space-y-1">
              <Label className="font-cairo font-semibold text-orange-700 dark:text-orange-400">
                تفعيل وضع العطلة
              </Label>
              <p className="text-sm text-muted-foreground font-cairo">
                عند التفعيل، سيتم منع جميع المستخدمين من الدخول للتطبيق
              </p>
            </div>
            <Switch
              checked={holidayMode.enabled}
              onCheckedChange={(checked) =>
                setHolidayMode({ ...holidayMode, enabled: checked })
              }
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="holidayMessage" className="font-cairo">
              رسالة العطلة
            </Label>
            <p className="text-sm text-muted-foreground font-cairo">
              هذه الرسالة ستظهر للمستخدمين عند محاولة الدخول للتطبيق
            </p>
            <Textarea
              id="holidayMessage"
              value={holidayMode.message}
              onChange={(e) =>
                setHolidayMode({ ...holidayMode, message: e.target.value })
              }
              className="font-cairo min-h-[100px]"
              placeholder="أدخل رسالة العطلة..."
            />
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-cairo">
            <Settings className="w-5 h-5 text-primary" />
            إعدادات النظام
          </CardTitle>
          <CardDescription className="font-cairo">
            تحكم في الإعدادات الأساسية للتطبيق
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="font-cairo flex items-center gap-2">
                <Bell className="w-4 h-4 text-secondary" />
                تفعيل الإشعارات
              </Label>
              <p className="text-sm text-muted-foreground font-cairo">
                إرسال إشعارات للمستخدمين عند وجود تحديثات
              </p>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="font-cairo flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent" />
                الموافقة التلقائية على التسجيلات
              </Label>
              <p className="text-sm text-muted-foreground font-cairo">
                قبول التسجيلات الجديدة تلقائياً بدون مراجعة إدارية
              </p>
            </div>
            <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};