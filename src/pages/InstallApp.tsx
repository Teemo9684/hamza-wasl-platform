import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Share2, Smartphone, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const InstallApp = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">تم التثبيت بنجاح!</CardTitle>
            <CardDescription className="text-base">
              التطبيق مثبت بالفعل على جهازك
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => navigate("/")} className="w-full" size="lg">
              الذهاب إلى التطبيق
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <Smartphone className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">ثبّت تطبيق همزة وصل</CardTitle>
          <CardDescription className="text-base">
            استمتع بتجربة أفضل مع التطبيق على هاتفك
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <Download className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">تثبيت سريع</h3>
                <p className="text-sm text-muted-foreground">
                  لا حاجة للمتجر، ثبّت مباشرة من المتصفح
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">يعمل بدون إنترنت</h3>
                <p className="text-sm text-muted-foreground">
                  الوصول للتطبيق حتى بدون اتصال بالإنترنت
                </p>
              </div>
            </div>
          </div>

          {isIOS ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  خطوات التثبيت على آيفون:
                </h3>
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                  <li>اضغط على زر المشاركة <Share2 className="inline w-4 h-4" /> في شريط Safari</li>
                  <li>اختر "إضافة إلى الشاشة الرئيسية"</li>
                  <li>اضغط "إضافة" للتأكيد</li>
                </ol>
              </div>
            </div>
          ) : isInstallable ? (
            <Button onClick={handleInstallClick} className="w-full" size="lg">
              <Download className="w-5 h-5 ml-2" />
              تثبيت التطبيق الآن
            </Button>
          ) : (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm">
                <strong>للتثبيت على أندرويد:</strong><br />
                افتح قائمة المتصفح (⋮) واختر "إضافة إلى الشاشة الرئيسية" أو "تثبيت التطبيق"
              </p>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button onClick={() => navigate("/")} variant="outline" className="w-full">
              تصفح بدون تثبيت
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallApp;