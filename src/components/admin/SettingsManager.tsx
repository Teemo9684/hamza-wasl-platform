import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Bell, Shield, Smartphone, Loader2, Tag, Download, RefreshCw, Package, CheckCircle, CloudDownload, Sparkles, GitBranch } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { APP_VERSION } from "@/config/version";
import { OTAUpdatesManager } from "./OTAUpdatesManager";


interface NotificationSettings {
  enabled: boolean;
}

interface AutoApprovalSettings {
  enabled: boolean;
}

interface LatestVersion {
  version: string;
  created_at: string;
  is_active: boolean;
}

interface GitHubBuildInfo {
  run_number: number;
  created_at: string;
  commit_message: string;
}

export const SettingsManager = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [buildingApk, setBuildingApk] = useState(false);
  const [appVersion, setAppVersion] = useState("1.0.0");
  const [latestVersion, setLatestVersion] = useState<LatestVersion | null>(null);
  
  // Auto OTA states
  const [fetchingOta, setFetchingOta] = useState(false);
  const [autoOtaVersion, setAutoOtaVersion] = useState("");
  const [autoOtaNotes, setAutoOtaNotes] = useState("");
  const [autoOtaMandatory, setAutoOtaMandatory] = useState(false);
  const [lastBuildInfo, setLastBuildInfo] = useState<GitHubBuildInfo | null>(null);
  const [checkingBuild, setCheckingBuild] = useState(false);

  const { toast } = useToast();
  

  useEffect(() => {
    fetchSettings();
    fetchLatestVersion();
    fetchLastVersion();
    checkLatestGitHubBuild();
  }, []);

  const checkLatestGitHubBuild = async () => {
    try {
      setCheckingBuild(true);
      const { data, error } = await supabase.functions.invoke('get-apk-download', {
        method: 'POST',
      });

      if (!error && data?.success && data?.run) {
        setLastBuildInfo({
          run_number: data.run.run_number,
          created_at: data.run.created_at,
          commit_message: data.run.head_commit || 'تحديث',
        });
        
        // Suggest version based on run number
        if (!autoOtaVersion) {
          setAutoOtaVersion(`1.2.${data.run.run_number}`);
        }
        
        // Use commit message as notes suggestion
        if (!autoOtaNotes && data.run.head_commit) {
          setAutoOtaNotes(data.run.head_commit);
        }
      }
    } catch (error) {
      console.error("Error checking GitHub build:", error);
    } finally {
      setCheckingBuild(false);
    }
  };

  const fetchLatestVersion = async () => {
    try {
      const { data, error } = await supabase
        .from("app_versions")
        .select("version, created_at, is_active")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setLatestVersion(data);
      }
    } catch (error) {
      console.error("Error fetching latest version:", error);
    }
  };

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

  const handleTriggerApkBuild = async () => {
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
        description: data.message || "تم تشغيل بناء التطبيق بنجاح. ستصلك رسالة عند الانتهاء.",
      });
      
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

  const handleAutoFetchOta = async () => {
    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (!versionRegex.test(autoOtaVersion)) {
      toast({
        title: "خطأ",
        description: "صيغة رقم الإصدار غير صحيحة. استخدم الصيغة: X.X.X",
        variant: "destructive"
      });
      return;
    }

    try {
      setFetchingOta(true);
      
      const { data, error } = await supabase.functions.invoke('fetch-github-ota', {
        method: 'POST',
        body: { 
          version: autoOtaVersion,
          releaseNotes: autoOtaNotes,
          isMandatory: autoOtaMandatory,
          minAppVersion: "1.0.0"
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "نجاح ✨",
          description: data.message || "تم إنشاء تحديث OTA بنجاح!",
        });
        
        // Reset form
        setAutoOtaVersion("");
        setAutoOtaNotes("");
        setAutoOtaMandatory(false);
        
        // Refresh versions
        fetchLatestVersion();
      } else {
        toast({
          title: "تنبيه",
          description: data?.message || data?.error || "لم يتم إنشاء التحديث",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching OTA:", error);
      toast({
        title: "خطأ",
        description: "فشل في جلب تحديث OTA من GitHub",
        variant: "destructive"
      });
    } finally {
      setFetchingOta(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setFetching(true);

      const { data: notifData } = await supabase
        .from("app_settings")
        .select("setting_value")
        .eq("setting_key", "notifications_enabled")
        .maybeSingle();

      if (notifData) {
        const settings = notifData.setting_value as unknown as NotificationSettings;
        setNotificationsEnabled(settings.enabled);
      }

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
    } finally {
      setFetching(false);
    }
  };

  const handleSaveSettings = async (key: string, value: boolean) => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from("app_settings")
        .update({
          setting_value: { enabled: value } as any,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq("setting_key", key);

      if (error) throw error;

      toast({
        title: "تم الحفظ",
        description: "تم حفظ الإعداد بنجاح",
      });
    } catch (error) {
      console.error("Error saving setting:", error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ الإعداد",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationChange = async (value: boolean) => {
    setNotificationsEnabled(value);
    await handleSaveSettings("notifications_enabled", value);
  };

  const handleAutoApproveChange = async (value: boolean) => {
    setAutoApprove(value);
    await handleSaveSettings("auto_approve_registrations", value);
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Auto OTA from GitHub - MOST IMPORTANT SECTION - FIRST */}
      <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-accent/10 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            نشر تحديث OTA تلقائي
            <Badge variant="outline" className="text-xs mr-2">من GitHub</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* GitHub Build Info */}
          {lastBuildInfo && (
            <div className="p-3 rounded-lg bg-muted/50 border border-muted overflow-hidden">
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <GitBranch className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground flex-shrink-0">آخر بناء ناجح:</span>
                <Badge variant="secondary" className="font-mono flex-shrink-0">#{lastBuildInfo.run_number}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words">
                {lastBuildInfo.commit_message}
              </p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                رقم الإصدار الجديد
              </Label>
              <Input
                type="text"
                value={autoOtaVersion}
                onChange={(e) => setAutoOtaVersion(e.target.value)}
                placeholder="مثال: 1.2.70"
                className="text-left ltr font-mono"
                dir="ltr"
                disabled={fetchingOta}
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch
                id="otaMandatory"
                checked={autoOtaMandatory}
                onCheckedChange={setAutoOtaMandatory}
                disabled={fetchingOta}
              />
              <Label htmlFor="otaMandatory" className="cursor-pointer">
                تحديث إجباري
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>ملاحظات التحديث (بالعربية - مختصرة)</Label>
            <Textarea
              value={autoOtaNotes}
              onChange={(e) => setAutoOtaNotes(e.target.value)}
              placeholder="مثال: تحسين الأداء، إصلاح الأخطاء، ميزات جديدة..."
              rows={2}
              disabled={fetchingOta}
              className="text-right"
              dir="rtl"
            />
          </div>

          <Button
            onClick={handleAutoFetchOta}
            disabled={fetchingOta || !autoOtaVersion}
            className="w-full bg-accent hover:bg-accent/90"
            size="lg"
          >
            {fetchingOta ? (
              <>
                <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                جاري إنشاء التحديث...
              </>
            ) : (
              <>
                <CloudDownload className="ml-2 h-5 w-5" />
                إنشاء تحديث OTA تلقائياً
              </>
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            سيتم جلب أحدث نسخة من الموقع المنشور وتحويلها إلى حزمة OTA تلقائياً
          </p>
        </CardContent>
      </Card>

      {/* App Version Display */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/20 rounded-xl">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">إصدار التطبيق</h3>
                <p className="text-sm text-muted-foreground">الإصدار المثبت في الكود</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="secondary" className="text-xl px-5 py-2 font-mono">
                {APP_VERSION}
              </Badge>
              {latestVersion && latestVersion.version !== APP_VERSION && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  آخر OTA: {latestVersion.version}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}

      {/* System Settings */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            إعدادات النظام
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Label className="text-base font-medium">الإشعارات</Label>
                <p className="text-sm text-muted-foreground">
                  إرسال إشعارات للمستخدمين
                </p>
              </div>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={handleNotificationChange}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-lg">
                <Shield className="w-5 h-5 text-accent" />
              </div>
              <div>
                <Label className="text-base font-medium">الموافقة التلقائية</Label>
                <p className="text-sm text-muted-foreground">
                  قبول التسجيلات الجديدة تلقائياً
                </p>
              </div>
            </div>
            <Switch 
              checked={autoApprove} 
              onCheckedChange={handleAutoApproveChange}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            بناء تطبيق الأندرويد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                رقم الإصدار
              </Label>
              <Input
                type="text"
                value={appVersion}
                onChange={(e) => setAppVersion(e.target.value)}
                placeholder="1.0.0"
                className="text-left ltr font-mono text-lg"
                dir="ltr"
              />
            </div>
            <Button 
              onClick={handleTriggerApkBuild} 
              disabled={buildingApk}
              size="lg"
              className="sm:w-auto w-full"
            >
              {buildingApk ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  جاري البناء...
                </>
              ) : (
                <>
                  <Download className="ml-2 h-5 w-5" />
                  بناء APK
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            سيتم بناء ملف APK وإرسال إشعار عند الانتهاء (5-10 دقائق)
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* OTA Updates Manager */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">تحديثات OTA</h2>
          <Badge variant="outline" className="text-xs">تحديث بدون إعادة تثبيت</Badge>
        </div>
        <OTAUpdatesManager />
      </div>
    </div>
  );
};
