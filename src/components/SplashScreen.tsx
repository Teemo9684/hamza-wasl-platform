import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import splashLogo from "@/assets/splash-logo.svg";

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const handleFinish = useCallback(() => {
    setIsVisible(false);
    onFinish();
  }, [onFinish]);

  useEffect(() => {
    // Start exit animation after 4 seconds
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 4000);

    // Complete and hide after exit animation
    const finishTimer = setTimeout(() => {
      handleFinish();
    }, 4800);

    // Fallback: Force finish after 6 seconds no matter what
    const fallbackTimer = setTimeout(() => {
      handleFinish();
    }, 6000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
      clearTimeout(fallbackTimer);
    };
  }, [handleFinish]);

  // Allow users to skip by tapping
  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(handleFinish, 300);
  };

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 cursor-pointer"
      initial={{ opacity: 1 }}
      animate={{ 
        opacity: isExiting ? 0 : 1,
        scale: isExiting ? 1.1 : 1
      }}
      transition={{ duration: 0.5 }}
      onClick={handleSkip}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Logo Container */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-6"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ 
          scale: isExiting ? 0.8 : 1, 
          opacity: isExiting ? 0 : 1 
        }}
        transition={{ 
          type: "spring",
          stiffness: 200,
          damping: 20,
          delay: isExiting ? 0 : 0.2
        }}
      >
        {/* Logo */}
        <motion.div
          className="relative"
          animate={{ 
            y: isExiting ? -20 : [0, -10, 0],
          }}
          transition={{
            duration: isExiting ? 0.3 : 2,
            repeat: isExiting ? 0 : Infinity,
            ease: "easeInOut"
          }}
        >
          <img 
            src={splashLogo} 
            alt="شعار التطبيق" 
            className="w-48 h-48 object-contain drop-shadow-2xl"
            onError={(e) => {
              // If logo fails to load, skip splash
              console.error('Splash logo failed to load');
              handleFinish();
            }}
          />
          
          {/* Glow effect */}
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full -z-10 scale-150" />
        </motion.div>

        {/* Welcome Text */}
        <motion.div
          className="text-center max-w-xs px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isExiting ? 0 : 1, y: isExiting ? -10 : 0 }}
          transition={{ delay: isExiting ? 0 : 0.5, duration: 0.5 }}
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
          animate={{ opacity: isExiting ? 0 : 1 }}
          transition={{ delay: isExiting ? 0 : 0.8 }}
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

        {/* Skip hint */}
        <motion.p
          className="text-xs text-muted-foreground/50 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: isExiting ? 0 : 0.7 }}
          transition={{ delay: 2 }}
        >
          انقر للمتابعة
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
