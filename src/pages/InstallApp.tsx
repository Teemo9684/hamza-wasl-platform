import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Share2, Smartphone, CheckCircle2, Copy, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
      toast.success("تم تثبيت التطبيق بنجاح! 🎉");
    }
    
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("تم نسخ الرابط! يمكنك الآن مشاركته مع الأولياء");
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
        <div className="absolute inset-0 animated-bg opacity-90" />
        
        <Card className="relative z-10 max-w-lg w-full glass-card border-none shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center animate-pulse">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-3xl font-cairo text-green-600">تم التثبيت بنجاح! 🎉</CardTitle>
            <CardDescription className="text-lg font-cairo mt-2">
              التطبيق مثبت بالفعل على جهازك
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50/80 dark:bg-green-950/30 rounded-lg text-center">
              <p className="text-sm font-cairo text-green-700 dark:text-green-300">
                يمكنك الآن فتح التطبيق من الشاشة الرئيسية لهاتفك
              </p>
            </div>
            <Button onClick={() => navigate("/")} className="w-full bg-gradient-primary" size="lg">
              <ExternalLink className="ml-2" />
              الذهاب إلى التطبيق
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 animated-bg opacity-90" />
      
      <Card className="relative z-10 max-w-2xl w-full glass-card border-none shadow-2xl slide-in-up">
        <CardHeader className="text-center space-y-4">
          {/* Logo */}
          <div className="mx-auto mb-2">
            <img 
              src="/icon-192.png" 
              alt="همزة وصل" 
              className="w-24 h-24 rounded-2xl shadow-lg"
            />
          </div>
          
          <div>
            <CardTitle className="text-4xl font-aref mb-2">همزة وصل</CardTitle>
            <p className="text-xl font-cairo text-muted-foreground">المدرسة الابتدائية العربي التبسي</p>
          </div>
          
          <CardDescription className="text-lg font-cairo leading-relaxed">
            ثبّت التطبيق على هاتفك لمتابعة دراسة أبنائك وتلقي الإشعارات الفورية
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Benefits */}
          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50/80 to-blue-100/80 dark:from-blue-950/30 dark:to-blue-900/30 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-cairo font-bold text-blue-900 dark:text-blue-100 mb-1">متابعة شاملة</h3>
                <p className="text-sm font-cairo text-blue-700 dark:text-blue-300">
                  الحضور، الواجبات، الدرجات، والرسائل - كل شيء في مكان واحد
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50/80 to-purple-100/80 dark:from-purple-950/30 dark:to-purple-900/30 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-cairo font-bold text-purple-900 dark:text-purple-100 mb-1">إشعارات فورية</h3>
                <p className="text-sm font-cairo text-purple-700 dark:text-purple-300">
                  تنبيهات مباشرة للرسائل والإعلانات المهمة حتى عند إغلاق التطبيق
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50/80 to-green-100/80 dark:from-green-950/30 dark:to-green-900/30 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-cairo font-bold text-green-900 dark:text-green-100 mb-1">سهل وسريع</h3>
                <p className="text-sm font-cairo text-green-700 dark:text-green-300">
                  بدون متاجر تطبيقات - التثبيت مباشر والتحديثات تلقائية
                </p>
              </div>
            </div>
          </div>

          {/* Installation Instructions */}
          <div className="space-y-4">
            {isIOS ? (
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                <h3 className="font-cairo font-bold text-xl mb-4 flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <Share2 className="w-6 h-6" />
                  خطوات التثبيت على آيفون:
                </h3>
                <ol className="space-y-3 font-cairo list-decimal list-inside mr-2">
                  <li className="leading-relaxed text-lg">
                    <span className="font-bold">افتح Safari</span> (إذا لم تكن فيه بالفعل)
                  </li>
                  <li className="leading-relaxed text-lg">
                    اضغط زر <span className="font-bold">المشاركة</span> <Share2 className="inline w-5 h-5 mx-1" /> (في أسفل الشاشة)
                  </li>
                  <li className="leading-relaxed text-lg">
                    مرر للأسفل واختر <span className="font-bold">"إضافة إلى الشاشة الرئيسية"</span>
                  </li>
                  <li className="leading-relaxed text-lg">
                    اضغط <span className="font-bold">"إضافة"</span> للتأكيد
                  </li>
                  <li className="leading-relaxed text-lg font-bold text-blue-600 dark:text-blue-400">
                    ستجد أيقونة التطبيق على الشاشة الرئيسية! 🎉
                  </li>
                </ol>
              </div>
            ) : isInstallable ? (
              <Button 
                onClick={handleInstallClick} 
                className="w-full bg-gradient-primary text-white hover:opacity-90 transition-opacity" 
                size="lg"
              >
                <Download className="w-6 h-6 ml-2" />
                <span className="text-xl font-cairo">تثبيت التطبيق الآن</span>
              </Button>
            ) : (
              <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 rounded-xl border-2 border-amber-200 dark:border-amber-800">
                <h3 className="font-cairo font-bold text-xl mb-4 text-amber-900 dark:text-amber-100">
                  خطوات التثبيت على أندرويد:
                </h3>
                <ol className="space-y-3 font-cairo list-decimal list-inside mr-2">
                  <li className="leading-relaxed text-lg">
                    افتح <span className="font-bold">قائمة Chrome</span> (النقاط الثلاث ⋮ في الأعلى)
                  </li>
                  <li className="leading-relaxed text-lg">
                    اختر <span className="font-bold">"إضافة إلى الشاشة الرئيسية"</span> أو <span className="font-bold">"تثبيت التطبيق"</span>
                  </li>
                  <li className="leading-relaxed text-lg">
                    اضغط <span className="font-bold">"إضافة"</span> أو <span className="font-bold">"تثبيت"</span> للتأكيد
                  </li>
                  <li className="leading-relaxed text-lg font-bold text-amber-600 dark:text-amber-400">
                    التطبيق جاهز على شاشتك الرئيسية! 🎉
                  </li>
                </ol>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-4 border-t">
            <Button 
              onClick={handleCopyLink} 
              variant="outline" 
              className="w-full font-cairo text-base"
              size="lg"
            >
              <Copy className="ml-2" />
              نسخ رابط التثبيت للمشاركة
            </Button>
            
            <Button 
              onClick={() => navigate("/")} 
              variant="ghost" 
              className="w-full font-cairo text-base"
            >
              <Smartphone className="ml-2" />
              تصفح التطبيق بدون تثبيت
            </Button>
          </div>

          {/* Help Note */}
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-sm font-cairo text-muted-foreground">
              هل تواجه صعوبة في التثبيت؟ تواصل مع إدارة المدرسة للمساعدة
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallApp;
