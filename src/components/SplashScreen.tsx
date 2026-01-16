import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import splashLogo from "@/assets/splash-logo.svg";

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [phase, setPhase] = useState<'logo' | 'exit'>('logo');

  useEffect(() => {
    // Show logo for 5 seconds, then start exit animation
    const logoTimer = setTimeout(() => {
      setPhase('exit');
    }, 5000);

    // Finish after exit animation completes
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 5800);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <AnimatePresence>
      {phase !== 'exit' ? (
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
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 20,
              delay: 0.2
            }}
          >
            {/* Logo */}
            <motion.div
              className="relative"
              animate={{ 
                y: [0, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <img 
                src={splashLogo} 
                alt="شعار التطبيق" 
                className="w-48 h-48 object-contain drop-shadow-2xl"
              />
              
              {/* Glow effect */}
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full -z-10 scale-150" />
            </motion.div>

            {/* Welcome Text */}
            <motion.div
              className="text-center max-w-xs px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <h1 className="text-2xl font-bold text-foreground mb-3">
                أهلاً وسهلاً بكم
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                تطبيق همزة وصل يربطكم بالمدرسة لمتابعة أبنائكم. استخدموه بمسؤولية للتواصل البنّاء مع المعلمين والإدارة.
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
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5"
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 1.2 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <motion.div
            className="relative z-10 flex flex-col items-center gap-6"
            animate={{ 
              scale: [1, 1.1, 0.8],
              opacity: [1, 0.8, 0],
              filter: ["blur(0px)", "blur(2px)", "blur(10px)"]
            }}
            transition={{ duration: 0.8 }}
          >
            <img 
              src={splashLogo} 
              alt="شعار التطبيق" 
              className="w-48 h-48 object-contain"
            />
            <div className="text-center max-w-xs px-4">
              <h1 className="text-2xl font-bold text-foreground mb-3">
                أهلاً وسهلاً بكم
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                تطبيق همزة وصل يربطكم بالمدرسة لمتابعة أبنائكم. استخدموه بمسؤولية للتواصل البنّاء مع المعلمين والإدارة.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
