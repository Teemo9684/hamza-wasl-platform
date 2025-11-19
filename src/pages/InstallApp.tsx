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
            حمّل التطبيق على هاتفك للحصول على تجربة أفضل وإشعارات فورية
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <Download className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">بدون متجر التطبيقات</h3>
                <p className="text-sm text-muted-foreground">
                  ثبّت مباشرة من متصفحك بدون الحاجة لمتجر Google Play أو App Store
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">إشعارات فورية</h3>
                <p className="text-sm text-muted-foreground">
                  احصل على تنبيهات مباشرة للرسائل والإعلانات حتى عند إغلاق التطبيق
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <Smartphone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">تحديثات تلقائية</h3>
                <p className="text-sm text-muted-foreground">
                  التطبيق يُحدّث نفسه تلقائياً لتحصل دائماً على آخر المميزات
                </p>
              </div>
            </div>
          </div>

          {isIOS ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  خطوات التثبيت على آيفون (Safari):
                </h3>
                <ol className="space-y-3 text-sm list-decimal list-inside mr-2">
                  <li className="leading-relaxed">افتح هذه الصفحة في متصفح Safari (إذا لم تكن فيه بالفعل)</li>
                  <li className="leading-relaxed">اضغط على زر المشاركة <Share2 className="inline w-4 h-4 mx-1" /> في الأسفل (وسط الشاشة)</li>
                  <li className="leading-relaxed">مرر للأسفل واختر "إضافة إلى الشاشة الرئيسية"</li>
                  <li className="leading-relaxed">اضغط "إضافة" في الأعلى لتأكيد التثبيت</li>
                  <li className="leading-relaxed font-semibold text-primary">ستجد أيقونة التطبيق على شاشتك الرئيسية 🎉</li>
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
              <h3 className="font-semibold mb-3">خطوات التثبيت على أندرويد (Chrome):</h3>
              <ol className="space-y-2 text-sm list-decimal list-inside mr-2">
                <li className="leading-relaxed">افتح قائمة المتصفح (النقاط الثلاث ⋮ في الأعلى)</li>
                <li className="leading-relaxed">اختر "إضافة إلى الشاشة الرئيسية" أو "تثبيت التطبيق"</li>
                <li className="leading-relaxed">اضغط "إضافة" أو "تثبيت" للتأكيد</li>
                <li className="leading-relaxed font-semibold text-primary">التطبيق جاهز للاستخدام من شاشتك الرئيسية! 🎉</li>
              </ol>
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