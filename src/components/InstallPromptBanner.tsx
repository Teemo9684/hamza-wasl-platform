import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPromptBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently (within 24 hours)
    const dismissedAt = localStorage.getItem('installPromptDismissed');
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) {
        return;
      }
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // Show banner for iOS after a short delay
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(timer);
    }

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show banner after a short delay
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
        setDeferredPrompt(null);
      }
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  if (isInstalled || !showBanner) {
    return null;
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe"
        >
          <div className="mx-auto max-w-md">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-4 shadow-2xl">
              {/* Background decoration */}
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
              <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-white/5" />
              
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute left-3 top-3 rounded-full bg-white/20 p-1 text-white transition-colors hover:bg-white/30"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative flex items-center gap-4">
                {/* Icon */}
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <Smartphone className="h-7 w-7 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 text-right">
                  <h3 className="text-lg font-bold text-white">
                    ثبّت التطبيق
                  </h3>
                  <p className="mt-0.5 text-sm text-white/80">
                    {isIOS 
                      ? 'اضغط على "مشاركة" ثم "إضافة للشاشة الرئيسية"'
                      : 'احصل على تجربة أفضل وأسرع'
                    }
                  </p>
                </div>
              </div>

              {/* Install button (only for non-iOS) */}
              {!isIOS && deferredPrompt && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-3"
                >
                  <Button
                    onClick={handleInstallClick}
                    className="w-full bg-white text-primary hover:bg-white/90 font-semibold"
                  >
                    <Download className="ml-2 h-4 w-4" />
                    تثبيت الآن
                  </Button>
                </motion.div>
              )}

              {/* iOS instructions */}
              {isIOS && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-white/10 p-2 text-sm text-white"
                >
                  <span>1. اضغط</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L12 14M12 2L8 6M12 2L16 6M4 14V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>2. "إضافة للشاشة الرئيسية"</span>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPromptBanner;
