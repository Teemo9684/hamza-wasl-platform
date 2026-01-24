import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Shield, ArrowRight, Settings, Download, Check, Smartphone, X, Share } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess, showWarning, ErrorMessages } from "@/utils/errorMessages";

// Set admin-specific manifest and theme color
const useAdminManifest = () => {
  useEffect(() => {
    // Update manifest link
    const existingManifest = document.querySelector('link[rel="manifest"]');
    const adminManifest = document.createElement('link');
    adminManifest.rel = 'manifest';
    adminManifest.href = '/admin-manifest.json';
    
    if (existingManifest) {
      existingManifest.parentNode?.replaceChild(adminManifest, existingManifest);
    } else {
      document.head.appendChild(adminManifest);
    }
    
    // Update theme color
    let themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    const originalThemeColor = themeColorMeta?.content;
    if (themeColorMeta) {
      themeColorMeta.content = '#7c3aed';
    } else {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';
      themeColorMeta.content = '#7c3aed';
      document.head.appendChild(themeColorMeta);
    }
    
    // Update apple touch icon
    let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
    const originalAppleIcon = appleTouchIcon?.href;
    if (appleTouchIcon) {
      appleTouchIcon.href = '/admin-icon-192.png';
    }
    
    // Cleanup on unmount
    return () => {
      // Restore original manifest
      const currentManifest = document.querySelector('link[rel="manifest"]');
      if (currentManifest) {
        const originalManifestLink = document.createElement('link');
        originalManifestLink.rel = 'manifest';
        originalManifestLink.href = '/manifest.webmanifest';
        currentManifest.parentNode?.replaceChild(originalManifestLink, currentManifest);
      }
      
      // Restore original theme color
      if (themeColorMeta && originalThemeColor) {
        themeColorMeta.content = originalThemeColor;
      }
      
      // Restore original apple touch icon
      if (appleTouchIcon && originalAppleIcon) {
        appleTouchIcon.href = originalAppleIcon;
      }
    };
  }, []);
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const AdminApp = () => {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  
  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  
  // Use admin-specific manifest and theme
  useAdminManifest();
  
  // Check if app is already installed and show install prompt
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const installed = isStandalone || isIOSStandalone;
    setIsInstalled(installed);
    
    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);
    
    // Show install dialog after a short delay if not installed
    if (!installed) {
      const timer = setTimeout(() => {
        setShowInstallDialog(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
    
    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show dialog when prompt is available
      if (!installed) {
        setShowInstallDialog(true);
      }
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstallDialog(false);
      showSuccess("تم التثبيت", "تم تثبيت تطبيق الإدارة بنجاح!");
    });
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  // Check if user is already logged in as admin
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .eq("role", "admin")
            .maybeSingle();
          
          if (roleData) {
            setIsLoggedIn(true);
            navigate("/dashboard/admin", { replace: true });
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsCheckingSession(false);
      }
    };
    checkSession();
  }, [navigate]);
  
  const handleInstall = async () => {
    if (!deferredPrompt) {
      // For iOS, show instructions
      showWarning(
        "تعليمات التثبيت",
        "اضغط على زر المشاركة في المتصفح ثم اختر 'إضافة إلى الشاشة الرئيسية'"
      );
      return;
    }
    
    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        showSuccess("تم التثبيت", "تم تثبيت تطبيق الإدارة بنجاح!");
      }
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Install error:', error);
    } finally {
      setIsInstalling(false);
    }
  };
  
  const handleSetupAdmin = async () => {
    setIsSettingUp(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-admin');
      
      if (error) {
        console.error('Setup error:', error);
        showError("حدث خطأ في إعداد حساب المسؤول");
        return;
      }

      showSuccess("تم إعداد حساب المسؤول", data.message || "تم إعداد الحساب بنجاح");
    } catch (error) {
      console.error('Setup admin error:', error);
      showError("حدث خطأ في إعداد حساب المسؤول");
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pin || pin.trim().length === 0) {
      showWarning("حقل مطلوب", "الرجاء إدخال الرقم السري");
      return;
    }

    setIsLoading(true);

    try {
      const { data: loginData, error: loginError } = await supabase.functions.invoke('admin-login', {
        body: { password: pin.trim() }
      });

      if (loginError || !loginData?.success) {
        showError("invalid login credentials");
        setIsLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: pin.trim(),
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error("لم يتم العثور على المستخدم");
      }

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleError) {
        throw roleError;
      }

      if (!roleData) {
        await supabase.auth.signOut();
        ErrorMessages.PERMISSION_DENIED();
        setIsLoading(false);
        return;
      }

      showSuccess("تم تسجيل الدخول بنجاح", "مرحباً بك في لوحة التحكم");
      navigate("/dashboard/admin", { replace: true });
    } catch (error: any) {
      showError(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-sm mb-4">
            <Shield className="h-4 w-4" />
            <span>لوحة التحكم الإدارية</span>
          </div>
          <h1 className="text-4xl font-bold text-white font-cairo mb-2">همزة وصل</h1>
          <p className="text-purple-200/70">نظام إدارة المدرسة</p>
        </div>

        {/* Login Card */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-cairo text-white">تسجيل دخول المدير</CardTitle>
            <CardDescription className="font-cairo text-purple-200/70">
              أدخل الرقم السري للوصول إلى لوحة التحكم
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleLogin} autoComplete="on">
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin" className="font-cairo text-lg text-white/90">الرقم السري</Label>
                <Input
                  id="pin"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="أدخل الرقم السري"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="font-cairo text-lg h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-purple-400 focus:ring-purple-400/20"
                  required
                  autoFocus
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-3 pt-2">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-cairo shadow-lg shadow-purple-500/30"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "جاري التحميل..." : "تسجيل الدخول"}
                <ArrowRight className="mr-2 h-5 w-5" />
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full font-cairo bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white"
                size="lg"
                disabled={isSettingUp}
                onClick={handleSetupAdmin}
              >
                {isSettingUp ? "جاري الإعداد..." : "إعداد حساب المسؤول"}
                <Settings className="mr-2 h-5 w-5" />
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Install Card */}
        {!isInstalled && (
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-cairo font-medium">تثبيت التطبيق</h3>
                  <p className="text-purple-200/60 text-sm">ثبّت تطبيق الإدارة على جهازك</p>
                </div>
                <Button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white border-0"
                >
                  {isInstalling ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isInstalled && (
          <div className="flex items-center justify-center gap-2 text-green-400/80 text-sm">
            <Check className="h-4 w-4" />
            <span>التطبيق مثبّت</span>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-purple-200/40 text-sm">
          هذا الرابط مخصص للإدارة فقط
        </p>
      </div>

      {/* Install Dialog */}
      <Dialog open={showInstallDialog && !isInstalled} onOpenChange={setShowInstallDialog}>
        <DialogContent className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border-purple-500/30 text-white max-w-sm mx-auto">
          <DialogHeader className="text-center">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-4 shadow-xl shadow-purple-500/40">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <DialogTitle className="text-2xl font-cairo text-white text-center">
              تثبيت تطبيق الإدارة
            </DialogTitle>
            <DialogDescription className="text-purple-200/70 font-cairo text-center">
              ثبّت التطبيق على جهازك للوصول السريع والمباشر
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Features */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-purple-200/80">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Smartphone className="h-4 w-4 text-purple-400" />
                </div>
                <span className="font-cairo text-sm">وصول سريع من الشاشة الرئيسية</span>
              </div>
              <div className="flex items-center gap-3 text-purple-200/80">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-purple-400" />
                </div>
                <span className="font-cairo text-sm">تطبيق منفصل خاص بالإدارة</span>
              </div>
              <div className="flex items-center gap-3 text-purple-200/80">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Check className="h-4 w-4 text-purple-400" />
                </div>
                <span className="font-cairo text-sm">إشعارات فورية للطلبات الجديدة</span>
              </div>
            </div>

            {/* iOS Instructions */}
            {isIOS && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-purple-200/80 text-sm font-cairo mb-2 text-center">
                  لتثبيت التطبيق على iPhone:
                </p>
                <div className="flex items-center justify-center gap-2 text-white/90">
                  <Share className="h-5 w-5" />
                  <span className="text-sm font-cairo">اضغط على زر المشاركة</span>
                </div>
                <p className="text-purple-200/60 text-xs text-center mt-2 font-cairo">
                  ثم اختر "إضافة إلى الشاشة الرئيسية"
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            {!isIOS && (
              <Button
                onClick={handleInstall}
                disabled={isInstalling}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-cairo shadow-lg"
                size="lg"
              >
                {isInstalling ? (
                  <>
                    <span className="animate-spin ml-2">⏳</span>
                    جاري التثبيت...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 ml-2" />
                    تثبيت التطبيق الآن
                  </>
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => setShowInstallDialog(false)}
              className="w-full text-purple-200/70 hover:text-white hover:bg-white/10 font-cairo"
            >
              <X className="h-4 w-4 ml-2" />
              تخطي والمتابعة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminApp;
