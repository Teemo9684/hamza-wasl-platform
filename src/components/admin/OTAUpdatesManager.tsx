import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Package, Trash2, RefreshCw, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { formatDate } from "@/utils/formatters";

interface AppVersion {
  id: string;
  version: string;
  bundle_id: string;
  bundle_url: string;
  min_app_version: string;
  release_notes: string | null;
  is_mandatory: boolean;
  is_active: boolean;
  created_at: string;
}

export const OTAUpdatesManager = () => {
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Form state
  const [newVersion, setNewVersion] = useState("");
  const [minAppVersion, setMinAppVersion] = useState("1.0.0");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [isMandatory, setIsMandatory] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
      toast.error("فشل تحميل الإصدارات");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".zip")) {
        toast.error("يجب أن يكون الملف بصيغة ZIP");
        return;
      }
      setSelectedFile(file);
    }
  };

  const uploadBundle = async () => {
    if (!selectedFile || !newVersion) {
      toast.error("يرجى إدخال رقم الإصدار واختيار ملف التحديث");
      return;
    }

    // Validate version format
    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (!versionRegex.test(newVersion)) {
      toast.error("صيغة الإصدار غير صحيحة (مثال: 1.0.0)");
      return;
    }

    setUploading(true);

    try {
      // Generate unique bundle ID
      const bundleId = `bundle-${newVersion}-${Date.now()}`;
      const filePath = `${bundleId}/${selectedFile.name}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("app-updates")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

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
      
      toast.success(currentStatus ? "تم تعطيل الإصدار" : "تم تفعيل الإصدار");
      fetchVersions();
    } catch (error) {
      console.error("Error toggling version:", error);
      toast.error("فشل تحديث حالة الإصدار");
    }
  };

  const deleteVersion = async (id: string, bundleId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإصدار؟")) return;

    try {
      // Delete from storage
      const { data: files } = await supabase.storage
        .from("app-updates")
        .list(bundleId);

      if (files && files.length > 0) {
        const filePaths = files.map((file) => `${bundleId}/${file.name}`);
        await supabase.storage.from("app-updates").remove(filePaths);
      }

      // Delete record
      const { error } = await supabase
        .from("app_versions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("تم حذف الإصدار بنجاح");
      fetchVersions();
    } catch (error) {
      console.error("Error deleting version:", error);
      toast.error("فشل حذف الإصدار");
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
      {/* Upload New Version */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            رفع تحديث جديد (OTA)
          </CardTitle>
          <CardDescription>
            قم برفع ملف ZIP يحتوي على محتوى مجلد dist بعد البناء
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="version">رقم الإصدار *</Label>
              <Input
                id="version"
                placeholder="مثال: 1.2.0"
                value={newVersion}
                onChange={(e) => setNewVersion(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minVersion">الحد الأدنى للإصدار المدعوم</Label>
              <Input
                id="minVersion"
                placeholder="مثال: 1.0.0"
                value={minAppVersion}
                onChange={(e) => setMinAppVersion(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="releaseNotes">ملاحظات الإصدار</Label>
            <Textarea
              id="releaseNotes"
              placeholder="ما الجديد في هذا الإصدار..."
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="mandatory"
              checked={isMandatory}
              onCheckedChange={setIsMandatory}
            />
            <Label htmlFor="mandatory">تحديث إلزامي</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bundle">ملف التحديث (ZIP) *</Label>
            <Input
              id="bundle"
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                تم اختيار: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <Button onClick={uploadBundle} disabled={uploading || !selectedFile || !newVersion}>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جارٍ الرفع...
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

      {/* Versions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              الإصدارات المتوفرة
            </span>
            <Button variant="outline" size="sm" onClick={fetchVersions}>
              <RefreshCw className="h-4 w-4 ml-2" />
              تحديث
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              لا توجد إصدارات مرفوعة بعد
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الإصدار</TableHead>
                    <TableHead>الحد الأدنى</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>إلزامي</TableHead>
                    <TableHead>تاريخ الرفع</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((version) => (
                    <TableRow key={version.id}>
                      <TableCell className="font-medium">{version.version}</TableCell>
                      <TableCell>{version.min_app_version}</TableCell>
                      <TableCell>
                        <Badge variant={version.is_active ? "default" : "secondary"}>
                          {version.is_active ? (
                            <CheckCircle className="h-3 w-3 ml-1" />
                          ) : (
                            <XCircle className="h-3 w-3 ml-1" />
                          )}
                          {version.is_active ? "مفعّل" : "معطّل"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {version.is_mandatory ? (
                          <Badge variant="destructive">إلزامي</Badge>
                        ) : (
                          <Badge variant="outline">اختياري</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(version.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleVersionActive(version.id, version.is_active)}
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>كيفية إنشاء ملف التحديث</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>قم بتشغيل أمر البناء: <code className="bg-muted px-2 py-1 rounded">npm run build</code></li>
            <li>انتقل إلى مجلد <code className="bg-muted px-2 py-1 rounded">dist</code></li>
            <li>اضغط جميع الملفات داخل مجلد dist في ملف ZIP (وليس المجلد نفسه)</li>
            <li>قم برفع ملف ZIP هنا مع تحديد رقم الإصدار</li>
          </ol>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>ملاحظة:</strong> تأكد من أن ملف ZIP يحتوي على الملفات مباشرة (index.html, assets/, etc.) وليس مجلد dist.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
