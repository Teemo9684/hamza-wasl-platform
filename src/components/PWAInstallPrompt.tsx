import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Download, X, Share2, Smartphone } from "lucide-react";

/**
 * مكون اقتراح تثبيت PWA
 * يظهر تلقائياً عند فتح التطبيق أول مرة في المتصفح
 */
export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    if (isStandalone || isIOSStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if user dismissed the prompt before
    const dismissedAt = localStorage.getItem('pwa_install_dismissed_at');
    if (dismissedAt) {
      const dismissedTime = new Date(dismissedAt).getTime();
      const now = new Date().getTime();
      const hoursSinceDismissed = (now - dismissedTime) / (1000 * 60 * 60);
      
      // Don't show again for 24 hours after dismissal
      if (hoursSinceDismissed < 24) {
        return;
      }
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // For iOS, show the prompt after a delay
    if (iOS) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show the prompt after a short delay
      setTimeout(() => {
        setIsVisible(true);
      }, 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if browser supports PWA but event hasn't fired
    const timer = setTimeout(() => {
      if (!deferredPrompt && !iOS && 'serviceWorker' in navigator) {
        // Show manual instructions for browsers that don't trigger the event
        setIsVisible(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsVisible(false);
        localStorage.setItem('pwa_installed', 'true');
      }
      
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa_install_dismissed_at', new Date().toISOString());
  };

  // Don't show if installed
  if (isInstalled) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto"
        >
          <div className="bg-gradient-to-br from-primary/95 to-primary-foreground/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 left-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            <div className="p-5">
              {/* App Icon and Title */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-white shadow-lg flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/icon-192.png" 
                    alt="همزة وصل" 
                    className="w-12 h-12 rounded-lg"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-cairo">
                    ثبّت التطبيق
                  </h3>
                  <p className="text-sm text-white/80 font-cairo">
                    للوصول السريع والإشعارات الفورية
                  </p>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-white/90 text-sm font-cairo">
                  <Smartphone className="w-4 h-4" />
                  <span>يعمل بدون إنترنت</span>
                </div>
                <div className="flex items-center gap-2 text-white/90 text-sm font-cairo">
                  <Download className="w-4 h-4" />
                  <span>إشعارات فورية للرسائل</span>
                </div>
              </div>

              {/* Action Buttons */}
              {isIOS ? (
                <div className="bg-white/10 rounded-xl p-3 text-sm text-white font-cairo">
                  <p className="mb-2 font-bold flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    للتثبيت على آيفون:
                  </p>
                  <ol className="space-y-1 mr-4 list-decimal list-inside text-white/90">
                    <li>اضغط على زر المشاركة <Share2 className="inline w-3 h-3" /></li>
                    <li>اختر "إضافة إلى الشاشة الرئيسية"</li>
                  </ol>
                </div>
              ) : deferredPrompt ? (
                <Button
                  onClick={handleInstall}
                  className="w-full bg-white text-primary hover:bg-white/90 font-cairo font-bold"
                  size="lg"
                >
                  <Download className="w-5 h-5 ml-2" />
                  تثبيت الآن
                </Button>
              ) : (
                <div className="bg-white/10 rounded-xl p-3 text-sm text-white font-cairo">
                  <p className="mb-2 font-bold">للتثبيت:</p>
                  <p className="text-white/90">
                    افتح قائمة المتصفح (⋮) واختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
