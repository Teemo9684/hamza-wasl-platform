import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, LogIn, Loader2, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const AdminPortal = () => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(isStandalone);
    
    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const checkAdminStatus = async () => {
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
          setIsAdmin(true);
          // Redirect directly to admin dashboard if already logged in as admin
          navigate("/dashboard/admin", { replace: true });
          return;
        }
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Installation failed:', error);
      } finally {
        setIsInstalling(false);
      }
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 max-w-md w-full border border-white/20 shadow-2xl"
      >
        {/* Admin Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="flex justify-center mb-6"
        >
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-4 rounded-2xl shadow-lg">
            <Shield className="w-12 h-12 text-white" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white font-cairo mb-2">
            بوابة الإدارة
          </h1>
          <p className="text-white/70 font-cairo text-sm">
            لوحة التحكم الإدارية للتطبيق
          </p>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10"
        >
          <p className="text-white/80 text-sm font-cairo text-center leading-relaxed">
            هذه البوابة مخصصة للمسؤولين فقط للتحكم في التطبيق عن بُعد.
            <br />
            يمكنك إدارة المستخدمين، الإعلانات، الجداول، والإعدادات.
          </p>
        </motion.div>

        {/* Install PWA Section */}
        {!isInstalled && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-4"
          >
            <Button
              onClick={handleInstallPWA}
              disabled={!deferredPrompt || isInstalling}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-cairo font-bold py-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isInstalling ? (
                <Loader2 className="w-5 h-5 ml-2 animate-spin" />
              ) : (
                <Download className="w-5 h-5 ml-2" />
              )}
              {isInstalling ? 'جاري التثبيت...' : 'تثبيت التطبيق (PWA)'}
            </Button>
            {!deferredPrompt && (
              <p className="text-white/50 text-xs text-center mt-2 font-cairo">
                افتح هذا الرابط من متصفح Chrome لتتمكن من التثبيت
              </p>
            )}
          </motion.div>
        )}

        {isInstalled && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-4 bg-emerald-500/20 rounded-xl p-3 border border-emerald-500/30"
          >
            <div className="flex items-center justify-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-400" />
              <p className="text-emerald-300 text-sm font-cairo">
                التطبيق مثبت بالفعل على جهازك
              </p>
            </div>
          </motion.div>
        )}

        {/* Login Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            onClick={() => navigate("/login/admin")}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-cairo font-bold py-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
          >
            <LogIn className="w-5 h-5 ml-2" />
            تسجيل الدخول كمسؤول
          </Button>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-white/50 text-xs text-center mt-6 font-cairo"
        >
          هذا الرابط مخصص للمسؤولين فقط
        </motion.p>
      </motion.div>
    </div>
  );
};

export default AdminPortal;
