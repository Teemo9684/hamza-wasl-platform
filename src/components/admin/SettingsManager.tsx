import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Bell, Shield, Smartphone, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface NotificationSettings {
  enabled: boolean;
}

interface AutoApprovalSettings {
  enabled: boolean;
}

export const SettingsManager = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [buildingApk, setBuildingApk] = useState(false);

  const { toast } = useToast();

  const handleTriggerApkBuild = async () => {
    try {
      setBuildingApk(true);
      
      const { data, error } = await supabase.functions.invoke('trigger-apk-build', {
        method: 'POST',
      });

      if (error) throw error;

      toast({
        title: "نجاح",
        description: data.message || "تم تشغيل بناء التطبيق بنجاح",
      });
    } catch (error) {
      console.error("Error triggering APK build:", error);
      toast({
        title: "خطأ",
        description: "فشل في تشغيل بناء التطبيق",
        variant: "destructive"
      });
    } finally {
      setBuildingApk(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setFetching(true);

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

      {/* APK Build Section */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-cairo">
            <Smartphone className="w-5 h-5 text-primary" />
            بناء تطبيق الأندرويد
          </CardTitle>
          <CardDescription className="font-cairo">
            قم بتشغيل بناء ملف APK الجديد للتطبيق
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-cairo">
                سيتم بناء ملف APK جديد وإرسال إشعار عند الانتهاء
              </p>
            </div>
            <Button 
              onClick={handleTriggerApkBuild} 
              disabled={buildingApk}
              className="font-cairo"
            >
              {buildingApk ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التشغيل...
                </>
              ) : (
                <>
                  <Smartphone className="ml-2 h-4 w-4" />
                  بناء التطبيق
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};