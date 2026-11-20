import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ALWAYS use the static path from public/ folder.
// Hashed imports (from src/assets/) break after OTA bundle swaps because
// the new JS references a hash that doesn't exist in the old native shell.
// The public/ path is stable and always available.
const LOGO_SRC = "/assets/splash-logo.svg";

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [phase, setPhase] = useState<'logo' | 'exit'>('logo');

  const LogoImage = (
    <img
      src={LOGO_SRC}
      alt="شعار التطبيق"
      className="w-56 h-56 object-contain drop-shadow-2xl"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );

  useEffect(() => {
    if (phase === 'logo') {
      const logoTimer = setTimeout(() => setPhase('exit'), 4000);
      return () => clearTimeout(logoTimer);
    }
    if (phase === 'exit') {
      const finishTimer = setTimeout(() => onFinish(), 800);
      return () => clearTimeout(finishTimer);
    }
  }, [phase, onFinish]);


  return (
    <AnimatePresence>
      {phase === 'logo' ? (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse delay-500" />
          </div>

          {/* Logo Container */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-6"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
          >
            {/* Logo */}
            <motion.div
              className="relative"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              {LogoImage}
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full -z-10 scale-150" />
            </motion.div>

            {/* Welcome Text */}
            <motion.div
              className="text-center space-y-3 max-w-xs px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <p className="text-xl font-semibold text-foreground">مرحباً بكم</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                يرجى استخدام التطبيق بشكل مسؤول والتواصل باحترام مع الإدارة والمعلمين لضمان تجربة تعليمية ناجحة لأبنائنا
              </p>
            </motion.div>

            {/* Loading Indicator */}
            <motion.div
              className="flex gap-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
        >
          <motion.div className="absolute inset-0 overflow-hidden" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          </motion.div>

          <div className="relative z-10 flex flex-col items-center gap-6">
            <motion.div className="relative" initial={{ scale: 1, opacity: 1, y: 0 }} animate={{ scale: 1.2, opacity: 0, y: -30 }} transition={{ duration: 0.8, ease: "easeOut" }}>
              {LogoImage}
              <motion.div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full -z-10 scale-150" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.4 }} />
            </motion.div>

            <motion.div className="text-center space-y-3 max-w-xs px-4" initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: 20 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <p className="text-xl font-semibold text-foreground">مرحباً بكم</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                يرجى استخدام التطبيق بشكل مسؤول والتواصل باحترام مع الإدارة والمعلمين لضمان تجربة تعليمية ناجحة لأبنائنا
              </p>
            </motion.div>

            <motion.div className="flex gap-1.5" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-primary" />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
