import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, Trash2, CheckCircle, XCircle, Package, AlertCircle, Loader2 } from "lucide-react";
import { APP_VERSION } from "@/config/version";

interface AppVersion {
  id: string;
  version: string;
  bundle_id: string;
  bundle_url: string;
  min_app_version: string | null;
  release_notes: string | null;
  is_mandatory: boolean | null;
  is_active: boolean | null;
  created_at: string;
}

export const OTAUpdatesManager = () => {
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newVersion, setNewVersion] = useState("");
  const [minAppVersion, setMinAppVersion] = useState("1.0.0");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [isMandatory, setIsMandatory] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchVersions();
  }, []);

  const fetchVersions = async () => {
    try {
      const { data, error } = await supabase
        .from("app_versions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error("Error fetching versions:", error);
      toast.error("فشل في تحميل الإصدارات");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".zip")) {
        toast.error("يرجى اختيار ملف ZIP فقط");
        return;
      }
      setSelectedFile(file);
    }
  };

  const uploadBundle = async () => {
    if (!selectedFile || !newVersion) {
      toast.error("يرجى اختيار ملف وتحديد رقم الإصدار");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique bundle ID
      const bundleId = `bundle-${newVersion}-${Date.now()}`;
      const filePath = `${bundleId}/${selectedFile.name}`;
      
      // Get file size for progress calculation
      const fileSize = selectedFile.size;
      const chunkSize = 256 * 1024; // 256KB chunks for progress tracking
      const totalChunks = Math.ceil(fileSize / chunkSize);
      
      // Create a custom upload with progress tracking using XMLHttpRequest
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Get the storage URL and token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        throw new Error("غير مصرح");
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const uploadUrl = `${supabaseUrl}/storage/v1/object/app-updates/${filePath}`;

      // Upload with progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('POST', uploadUrl);
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
        xhr.setRequestHeader('x-upsert', 'false');
        xhr.send(selectedFile);
      });

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("app-updates")
        .getPublicUrl(filePath);

      // Create version record
      const { error: insertError } = await supabase.from("app_versions").insert({
        version: newVersion,
        bundle_id: bundleId,
        bundle_url: publicUrl,
        min_app_version: minAppVersion,
        release_notes: releaseNotes || null,
        is_mandatory: isMandatory,
        is_active: true,
      });

      if (insertError) throw insertError;

      toast.success("تم رفع التحديث بنجاح!");
      
      // Reset form
      setNewVersion("");
      setMinAppVersion("1.0.0");
      setReleaseNotes("");
      setIsMandatory(false);
      setSelectedFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // Refresh list
      fetchVersions();
    } catch (error) {
      console.error("Error uploading bundle:", error);
      toast.error("فشل رفع التحديث");
    } finally {
      setUploading(false);
    }
  };

  const toggleVersionActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("app_versions")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success(currentStatus ? "تم إلغاء تفعيل الإصدار" : "تم تفعيل الإصدار");
      fetchVersions();
    } catch (error) {
      console.error("Error toggling version:", error);
      toast.error("فشل في تحديث حالة الإصدار");
    }
  };

  const deleteVersion = async (id: string, bundleId: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("app-updates")
        .remove([`${bundleId}/`]);

      // Delete from database
      const { error: dbError } = await supabase
        .from("app_versions")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;

      toast.success("تم حذف الإصدار");
      fetchVersions();
    } catch (error) {
      console.error("Error deleting version:", error);
      toast.error("فشل في حذف الإصدار");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Version Info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <span className="font-medium">الإصدار الحالي للتطبيق</span>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-1">
              {APP_VERSION}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Upload New Version */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            رفع إصدار جديد (OTA)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="version">رقم الإصدار الجديد *</Label>
              <Input
                id="version"
                placeholder="مثال: 1.2.0"
                value={newVersion}
                onChange={(e) => setNewVersion(e.target.value)}
                disabled={uploading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minVersion">الحد الأدنى للإصدار المدعوم</Label>
              <Input
                id="minVersion"
                placeholder="مثال: 1.0.0"
                value={minAppVersion}
                onChange={(e) => setMinAppVersion(e.target.value)}
                disabled={uploading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات الإصدار</Label>
            <Textarea
              id="notes"
              placeholder="اكتب هنا ما الجديد في هذا الإصدار..."
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              rows={3}
              disabled={uploading}
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="mandatory"
              checked={isMandatory}
              onCheckedChange={setIsMandatory}
              disabled={uploading}
            />
            <Label htmlFor="mandatory" className="cursor-pointer">
              تحديث إجباري (سيتم إجبار المستخدمين على التحديث)
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bundle">ملف التحديث (ZIP) *</Label>
            <div className="flex items-center gap-4">
              <Input
                ref={fileInputRef}
                id="bundle"
                type="file"
                accept=".zip"
                onChange={handleFileChange}
                className="flex-1"
                disabled={uploading}
              />
              {selectedFile && (
                <Badge variant="outline" className="whitespace-nowrap">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </Badge>
              )}
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري رفع الملف...
                </span>
                <span className="font-semibold text-primary">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-3" />
              <p className="text-xs text-muted-foreground text-center">
                يرجى عدم إغلاق الصفحة حتى اكتمال الرفع
              </p>
            </div>
          )}

          <Button
            onClick={uploadBundle}
            disabled={uploading || !selectedFile || !newVersion}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جاري الرفع... {uploadProgress}%
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 ml-2" />
                رفع التحديث
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Versions */}
      <Card>
        <CardHeader>
          <CardTitle>الإصدارات المتاحة</CardTitle>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد إصدارات مرفوعة بعد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{version.version}</span>
                      {version.is_active ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 ml-1" />
                          نشط
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 ml-1" />
                          معطل
                        </Badge>
                      )}
                      {version.is_mandatory && (
                        <Badge variant="destructive">إجباري</Badge>
                      )}
                    </div>
                    {version.release_notes && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {version.release_notes}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(version.created_at).toLocaleDateString("ar-SA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toggleVersionActive(version.id, version.is_active || false)
                      }
                    >
                      {version.is_active ? "تعطيل" : "تفعيل"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteVersion(version.id, version.bundle_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">كيفية إنشاء ملف التحديث</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <ol className="list-decimal list-inside space-y-2 mr-2">
            <li>قم بتشغيل أمر <code className="bg-muted px-2 py-1 rounded">npm run build</code> في مشروعك</li>
            <li>انتقل إلى مجلد <code className="bg-muted px-2 py-1 rounded">dist</code></li>
            <li>اختر جميع الملفات داخل المجلد وقم بضغطها في ملف ZIP</li>
            <li>ارفع ملف ZIP هنا مع تحديد رقم الإصدار الجديد</li>
          </ol>
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-600 dark:text-yellow-400 font-medium">
              ⚠️ تأكد من أن رقم الإصدار الجديد أكبر من الإصدار الحالي ({APP_VERSION})
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
