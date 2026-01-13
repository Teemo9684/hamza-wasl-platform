import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Bell, Shield, Smartphone, Loader2, Tag, Download, Calendar, HardDrive } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/utils/formatters";

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
  const [appVersion, setAppVersion] = useState("1.0.0");
  const [downloadingApk, setDownloadingApk] = useState(false);
  const [latestApkInfo, setLatestApkInfo] = useState<{
    name: string;
    created_at: string;
    size_in_bytes: number;
    run_number: number;
  } | null>(null);
  const [apkNotAvailable, setApkNotAvailable] = useState(false);
  const [buildJustTriggered, setBuildJustTriggered] = useState(false);

  const { toast } = useToast();

  const handleTriggerApkBuild = async () => {
    // Validate version format
    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (!versionRegex.test(appVersion)) {
      toast({
        title: "خطأ",
        description: "صيغة رقم الإصدار غير صحيحة. استخدم الصيغة: X.X.X",
        variant: "destructive"
      });
      return;
    }

    try {
      setBuildingApk(true);
      
      const { data, error } = await supabase.functions.invoke('trigger-apk-build', {
        method: 'POST',
        body: { version: appVersion },
      });

      if (error) throw error;

      toast({
        title: "نجاح",
        description: data.message || "تم تشغيل بناء التطبيق بنجاح",
      });
      setBuildJustTriggered(true);
      setApkNotAvailable(true);
      
      // Save the version for next time
      await saveLastVersion(appVersion);
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
    fetchLatestApkInfo();
    fetchLastVersion();
  }, []);

  const fetchLastVersion = async () => {
    try {
      const { data } = await supabase
        .from("app_settings")
        .select("setting_value")
        .eq("setting_key", "last_apk_version")
        .maybeSingle();

      if (data?.setting_value) {
        const settings = data.setting_value as { version: string };
        if (settings.version) {
          setAppVersion(settings.version);
        }
      }
    } catch (error) {
      console.error("Error fetching last version:", error);
    }
  };

  const saveLastVersion = async (version: string) => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      // Try to update first
      const { data: existing } = await supabase
        .from("app_settings")
        .select("id")
        .eq("setting_key", "last_apk_version")
        .maybeSingle();

      if (existing) {
        await supabase
          .from("app_settings")
          .update({
            setting_value: { version } as any,
            updated_by: userId
          })
          .eq("setting_key", "last_apk_version");
      } else {
        await supabase
          .from("app_settings")
          .insert({
            setting_key: "last_apk_version",
            setting_value: { version } as any,
            updated_by: userId
          });
      }
    } catch (error) {
      console.error("Error saving version:", error);
    }
  };

  const fetchLatestApkInfo = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-apk-download', {
        method: 'POST',
      });

      if (error) {
        console.error("Error fetching APK info:", error);
        setApkNotAvailable(true);
        setLatestApkInfo(null);
        return;
      }

      // Check if build is available
      if (data?.available === false || data?.success === false) {
        setApkNotAvailable(true);
        setLatestApkInfo(null);
        return;
      }

      if (data?.artifact) {
        setLatestApkInfo({
          name: data.artifact.name,
          created_at: data.artifact.created_at,
          size_in_bytes: data.artifact.size_in_bytes,
          run_number: data.run.run_number,
        });
        setApkNotAvailable(false);
        setBuildJustTriggered(false);
      } else {
        setApkNotAvailable(true);
        setLatestApkInfo(null);
      }
    } catch (error) {
      console.error("Error fetching APK info:", error);
      setApkNotAvailable(true);
    }
  };

  const handleDownloadApk = async () => {
    try {
      setDownloadingApk(true);
      
      const { data, error } = await supabase.functions.invoke('get-apk-download', {
        method: 'POST',
      });

      if (error) {
        toast({
          title: "تنبيه",
          description: "حدث خطأ أثناء جلب معلومات البناء",
        });
        setApkNotAvailable(true);
        return;
      }

      // Check if build is not available
      if (data?.available === false || data?.success === false) {
        toast({
          title: "تنبيه",
          description: data.message || "لا يوجد بناء متاح حالياً. قم ببناء التطبيق أولاً أو انتظر اكتمال البناء الجاري.",
        });
        setApkNotAvailable(true);
        return;
      }

      if (data?.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
        toast({
          title: "نجاح",
          description: "جاري تحميل ملف APK...",
        });
      } else if (data?.error) {
        toast({
          title: "تنبيه",
          description: data.message || data.error,
        });
        setApkNotAvailable(true);
      }
    } catch (error) {
      console.error("Error downloading APK:", error);
      toast({
        title: "تنبيه",
        description: "حدث خطأ غير متوقع",
      });
      setApkNotAvailable(true);
    } finally {
      setDownloadingApk(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDateLocal = (dateString: string) => {
    return formatDateTime(dateString);
  };

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
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 space-y-2 w-full sm:w-auto">
              <Label className="font-cairo flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                رقم الإصدار
              </Label>
              <Input
                type="text"
                value={appVersion}
                onChange={(e) => setAppVersion(e.target.value)}
                placeholder="1.0.0"
                className="font-cairo text-left ltr max-w-[150px]"
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground font-cairo">
                استخدم الصيغة: X.X.X (مثال: 1.0.0)
              </p>
            </div>
            <Button 
              onClick={handleTriggerApkBuild} 
              disabled={buildingApk}
              className="font-cairo mt-2 sm:mt-6"
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
          <p className="text-sm text-muted-foreground font-cairo">
            سيتم بناء ملف APK جديد بالإصدار المحدد وإرسال إشعار عند الانتهاء
          </p>

          <Separator className="my-4" />

          {/* Download APK Section */}
          <div className="space-y-3">
            <Label className="font-cairo flex items-center gap-2 text-base">
              <Download className="w-4 h-4 text-green-500" />
              تحميل آخر ملف APK
            </Label>
            
            {buildJustTriggered && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 font-cairo">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري بناء التطبيق... يستغرق هذا عادة 5-10 دقائق</span>
                </div>
                <p className="text-xs text-muted-foreground font-cairo">
                  سيتم إشعارك عند اكتمال البناء. يمكنك تحديث الصفحة للتحقق من حالة البناء.
                </p>
                <Button 
                  onClick={fetchLatestApkInfo} 
                  variant="ghost"
                  size="sm"
                  className="font-cairo"
                >
                  تحديث الحالة
                </Button>
              </div>
            )}

            {apkNotAvailable && !buildJustTriggered && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm text-muted-foreground font-cairo">
                  لا يوجد ملف APK متاح حالياً. قم ببناء التطبيق أولاً باستخدام الزر أعلاه.
                </p>
              </div>
            )}
            
            {latestApkInfo && (
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-cairo">
                  <Calendar className="w-4 h-4" />
                  <span>تاريخ البناء: {formatDateLocal(latestApkInfo.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-cairo">
                  <HardDrive className="w-4 h-4" />
                  <span>الحجم: {formatFileSize(latestApkInfo.size_in_bytes)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-cairo">
                  <Tag className="w-4 h-4" />
                  <span>رقم البناء: #{latestApkInfo.run_number}</span>
                </div>
              </div>
            )}

            <Button 
              onClick={handleDownloadApk} 
              disabled={downloadingApk || apkNotAvailable}
              variant="outline"
              className="font-cairo w-full sm:w-auto"
            >
              {downloadingApk ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التحميل...
                </>
              ) : (
                <>
                  <Download className="ml-2 h-4 w-4" />
                  تحميل ملف APK
                </>
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground font-cairo">
              سيتم تحميل ملف مضغوط يحتوي على آخر نسخة من التطبيق
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};