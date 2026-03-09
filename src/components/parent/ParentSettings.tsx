import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings, User, Phone, Lock, Save, Loader2, Eye, EyeOff, Trash2, Info, Palettette } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAppVersion } from "@/hooks/useAppVersion";
import { supabase } from "@/integrations/supabase/client";
import { lightHaptic, successHaptic, errorHaptic, warningHaptic } from "@/utils/haptics";
import { showError, showSuccess, showWarning, ErrorMessages } from "@/utils/errorMessages";
import { useTh, THEME_OPTIONS, ThemeNameeme } from "@/contexts/ThemeContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ParentSettingsProps {
  children: any[];
  onChildRemoved?: () => void;
}

export const ParentSettings = ({ children, onChildRemoved }: ParentSettingsProps) => {
  const { version: appVersion } = useAppVersion();
  const { isRamadanMode, toggleRamadanMode } = useTheme();
  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    email: "",
  });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [removingChild, setRemovingChild] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile({
        full_name: profileData?.full_name || "",
        phone: profileData?.phone || "",
        email: user.email || "",
      });
    } catch (error: any) {
      showError(error, "خطأ في جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile.full_name.trim()) {
      errorHaptic();
      ErrorMessages.REQUIRED_FIELDS();
      return;
    }

    setSavingProfile(true);
    lightHaptic();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("غير مسجل الدخول");

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name.trim(),
          phone: profile.phone.trim() || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      successHaptic();
      showSuccess("تم الحفظ", "تم تحديث البيانات الشخصية بنجاح");
    } catch (error: any) {
      errorHaptic();
      showError(error, "خطأ في الحفظ");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.newPassword || !passwords.confirmPassword) {
      errorHaptic();
      showWarning("حقول مطلوبة", "يرجى إدخال كلمة المرور الجديدة وتأكيدها");
      return;
    }

    if (passwords.newPassword.length < 6) {
      errorHaptic();
      showError("password should be at least");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      errorHaptic();
      ErrorMessages.PASSWORDS_MISMATCH();
      return;
    }

    setChangingPassword(true);
    lightHaptic();

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword,
      });

      if (error) throw error;

      successHaptic();
      showSuccess("تم التغيير", "تم تغيير كلمة المرور بنجاح");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      errorHaptic();
      showError(error, "خطأ في تغيير كلمة المرور");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleRemoveChild = async (childId: string, childName: string) => {
    setRemovingChild(childId);
    warningHaptic();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("غير مسجل الدخول");

      const { error } = await supabase
        .from('parent_students')
        .delete()
        .eq('parent_id', user.id)
        .eq('student_id', childId);

      if (error) throw error;

      successHaptic();
      showSuccess("تم إلغاء الربط", `تم إلغاء ربط "${childName}" من حسابك`);
      onChildRemoved?.();
    } catch (error: any) {
      errorHaptic();
      showError(error, "خطأ في إلغاء الربط");
    } finally {
      setRemovingChild(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-xl md:text-3xl font-bold mb-1 md:mb-2 flex items-center gap-2">
          <Settings className="h-6 w-6 md:h-8 md:w-8" />
          الإعدادات
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">إدارة حسابك وبياناتك الشخصية</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            البيانات الشخصية
          </CardTitle>
          <CardDescription>تعديل اسمك ومعلومات التواصل</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">الاسم الكامل</Label>
            <div className="relative">
              <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="pr-10"
                placeholder="أدخل اسمك الكامل"
                dir="rtl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <div className="relative">
              <Phone className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="pr-10"
                placeholder="أدخل رقم الهاتف"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              disabled
              className="bg-muted"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">لا يمكن تغيير البريد الإلكتروني</p>
          </div>

          <Button 
            onClick={handleSaveProfile} 
            disabled={savingProfile}
            className="w-full md:w-auto"
          >
            {savingProfile ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="ml-2 h-4 w-4" />
                حفظ التغييرات
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Password Settings */}
      <Card>
        <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Lock className="h-5 w-5" />
            تغيير كلمة المرور
          </CardTitle>
          <CardDescription>تأمين حسابك بكلمة مرور جديدة</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="newPassword"
                type={showPasswords.new ? "text" : "password"}
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                className="pr-10 pl-10"
                placeholder="أدخل كلمة المرور الجديدة"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                className="absolute left-3 top-3 text-muted-foreground hover:text-foreground"
              >
                {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showPasswords.confirm ? "text" : "password"}
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                className="pr-10 pl-10"
                placeholder="أعد إدخال كلمة المرور الجديدة"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                className="absolute left-3 top-3 text-muted-foreground hover:text-foreground"
              >
                {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button 
            onClick={handleChangePassword} 
            disabled={changingPassword}
            variant="secondary"
            className="w-full md:w-auto"
          >
            {changingPassword ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري التغيير...
              </>
            ) : (
              <>
                <Lock className="ml-2 h-4 w-4" />
                تغيير كلمة المرور
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Linked Children */}
      {children.length > 0 && (
        <Card>
          <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
            <CardTitle className="text-base md:text-lg">الأبناء المرتبطون</CardTitle>
            <CardDescription>إدارة الأبناء المرتبطين بحسابك</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-2 space-y-3">
            {children.map((child, index) => (
              <div key={child.id}>
                {index > 0 && <Separator className="my-3" />}
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{child.full_name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {child.grade_level} • {child.national_school_id}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                        disabled={removingChild === child.id}
                      >
                        {removingChild === child.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>إلغاء ربط الابن</AlertDialogTitle>
                        <AlertDialogDescription>
                          هل أنت متأكد من إلغاء ربط "{child.full_name}" من حسابك؟ 
                          لن تتمكن من متابعة بياناته بعد ذلك.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveChild(child.id, child.full_name)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          إلغاء الربط
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Ramadan Theme Toggle */}
      <Card className="border-[hsl(45,60%,40%)]/30 bg-gradient-to-br from-[hsl(150,20%,15%)]/10 to-[hsl(230,20%,15%)]/10">
        <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Moon className="h-5 w-5 text-[hsl(45,70%,50%)]" />
            الوضع الرمضاني
          </CardTitle>
          <CardDescription>تفعيل تصميم خاص بشهر رمضان المبارك</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-2">
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[hsl(45,60%,50%)]/20 rounded-lg">
                <Moon className="w-5 h-5 text-[hsl(45,70%,50%)]" />
              </div>
              <div>
                <Label className="text-base font-medium">وضع رمضان</Label>
                <p className="text-sm text-muted-foreground">
                  خلفية ليلية مع زخارف رمضانية أنيقة
                </p>
              </div>
            </div>
            <Switch
              checked={isRamadanMode}
              onCheckedChange={toggleRamadanMode}
            />
          </div>
        </CardContent>
      </Card>

      {/* App Version */}
      <div className="text-center pt-4 pb-2">
        <p className="text-xs text-muted-foreground font-cairo">
          إصدار التطبيق: {appVersion}
        </p>
      </div>
    </div>
  );
};
