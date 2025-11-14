import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Bell, Shield, Database, Users } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export const SettingsManager = () => {
  const [settings, setSettings] = useState({
    schoolName: "مدرسة همزة وصل الابتدائية",
    schoolAddress: "العنوان الكامل للمدرسة",
    schoolPhone: "0123456789",
    schoolEmail: "info@school.edu",
    enableNotifications: true,
    enableParentAccess: true,
    enableTeacherAccess: true,
    autoApproveRegistrations: false,
    maintenanceMode: false,
  });

  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "نجاح",
      description: "تم حفظ الإعدادات بنجاح",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold font-cairo">الإعدادات</h2>
        <Button onClick={handleSave} className="font-tajawal">
          <Save className="ml-2 h-4 w-4" />
          حفظ التغييرات
        </Button>
      </div>

      {/* School Information */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-cairo">
            <Settings className="w-5 h-5 text-primary" />
            معلومات المدرسة
          </CardTitle>
          <CardDescription className="font-tajawal">
            قم بتحديث المعلومات الأساسية للمدرسة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="schoolName" className="font-cairo">
                اسم المدرسة
              </Label>
              <Input
                id="schoolName"
                value={settings.schoolName}
                onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                className="font-tajawal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schoolPhone" className="font-cairo">
                رقم الهاتف
              </Label>
              <Input
                id="schoolPhone"
                value={settings.schoolPhone}
                onChange={(e) => setSettings({ ...settings, schoolPhone: e.target.value })}
                className="font-tajawal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schoolEmail" className="font-cairo">
                البريد الإلكتروني
              </Label>
              <Input
                id="schoolEmail"
                type="email"
                value={settings.schoolEmail}
                onChange={(e) => setSettings({ ...settings, schoolEmail: e.target.value })}
                className="font-tajawal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schoolAddress" className="font-cairo">
                العنوان
              </Label>
              <Input
                id="schoolAddress"
                value={settings.schoolAddress}
                onChange={(e) => setSettings({ ...settings, schoolAddress: e.target.value })}
                className="font-tajawal"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-cairo">
            <Shield className="w-5 h-5 text-secondary" />
            إعدادات النظام
          </CardTitle>
          <CardDescription className="font-tajawal">
            تحكم في إعدادات الوصول والأمان
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="font-cairo">تفعيل الإشعارات</Label>
              <p className="text-sm text-muted-foreground font-tajawal">
                إرسال إشعارات للمستخدمين عند وجود تحديثات
              </p>
            </div>
            <Switch
              checked={settings.enableNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enableNotifications: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="font-cairo">السماح لأولياء الأمور بالدخول</Label>
              <p className="text-sm text-muted-foreground font-tajawal">
                تمكين أولياء الأمور من الوصول إلى المنصة
              </p>
            </div>
            <Switch
              checked={settings.enableParentAccess}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enableParentAccess: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="font-cairo">السماح للمعلمين بالدخول</Label>
              <p className="text-sm text-muted-foreground font-tajawal">
                تمكين المعلمين من الوصول إلى المنصة
              </p>
            </div>
            <Switch
              checked={settings.enableTeacherAccess}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enableTeacherAccess: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="font-cairo">الموافقة التلقائية على التسجيلات</Label>
              <p className="text-sm text-muted-foreground font-tajawal">
                قبول التسجيلات الجديدة تلقائياً بدون مراجعة
              </p>
            </div>
            <Switch
              checked={settings.autoApproveRegistrations}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, autoApproveRegistrations: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="font-cairo text-destructive">وضع الصيانة</Label>
              <p className="text-sm text-muted-foreground font-tajawal">
                إيقاف الوصول للمستخدمين مؤقتاً للصيانة
              </p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, maintenanceMode: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Database Settings */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-cairo">
            <Database className="w-5 h-5 text-accent" />
            إدارة قاعدة البيانات
          </CardTitle>
          <CardDescription className="font-tajawal">
            أدوات الصيانة والنسخ الاحتياطي
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-cairo font-semibold">نسخ احتياطي للبيانات</p>
              <p className="text-sm text-muted-foreground font-tajawal">
                آخر نسخة احتياطية: منذ 3 أيام
              </p>
            </div>
            <Button variant="outline" className="font-tajawal">
              إنشاء نسخة احتياطية
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-cairo font-semibold">تنظيف البيانات القديمة</p>
              <p className="text-sm text-muted-foreground font-tajawal">
                حذف السجلات القديمة وغير المستخدمة
              </p>
            </div>
            <Button variant="outline" className="font-tajawal">
              تنظيف البيانات
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-cairo font-semibold">استعادة من نسخة احتياطية</p>
              <p className="text-sm text-muted-foreground font-tajawal">
                استعادة البيانات من نسخة سابقة
              </p>
            </div>
            <Button variant="outline" className="font-tajawal text-destructive">
              استعادة البيانات
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Management Settings */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-cairo">
            <Users className="w-5 h-5 text-primary" />
            إعدادات المستخدمين
          </CardTitle>
          <CardDescription className="font-tajawal">
            ضبط إعدادات حسابات المستخدمين
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxStudentsPerTeacher" className="font-cairo">
                الحد الأقصى للتلاميذ لكل معلم
              </Label>
              <Input
                id="maxStudentsPerTeacher"
                type="number"
                defaultValue="30"
                className="font-tajawal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionTimeout" className="font-cairo">
                مدة الجلسة (بالدقائق)
              </Label>
              <Input
                id="sessionTimeout"
                type="number"
                defaultValue="60"
                className="font-tajawal"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
