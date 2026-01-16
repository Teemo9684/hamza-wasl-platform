import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import splashLogo from "@/assets/splash-logo.svg";

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [phase, setPhase] = useState<'enter' | 'display' | 'exit'>('enter');

  const handleFinish = useCallback(() => {
    setIsVisible(false);
    onFinish();
  }, [onFinish]);

  useEffect(() => {
    // Enter phase complete after 0.8s
    const enterTimer = setTimeout(() => {
      setPhase('display');
    }, 800);

    // Start exit animation after 3.5 seconds
    const exitTimer = setTimeout(() => {
      setPhase('exit');
    }, 3500);

    // Complete and hide after exit animation
    const finishTimer = setTimeout(() => {
      handleFinish();
    }, 4500);

    // Fallback: Force finish after 5 seconds no matter what
    const fallbackTimer = setTimeout(() => {
      handleFinish();
    }, 5000);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
      clearTimeout(fallbackTimer);
    };
  }, [handleFinish]);

  // Allow users to skip by tapping
  const handleSkip = () => {
    setPhase('exit');
    setTimeout(handleFinish, 400);
  };

  if (!isVisible) return null;

  const isExiting = phase === 'exit';

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center cursor-pointer overflow-hidden"
      style={{ backgroundColor: '#f5f8ff' }}
      initial={{ opacity: 1 }}
      animate={{ 
        opacity: isExiting ? 0 : 1,
      }}
      transition={{ 
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1]
      }}
      onClick={handleSkip}
    >
      {/* Animated gradient background */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5"
        initial={{ opacity: 0 }}
        animate={{ opacity: isExiting ? 0 : 1 }}
        transition={{ duration: 0.8 }}
      />

      {/* Animated circles background */}
      <motion.div 
        className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/8 rounded-full blur-3xl"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: isExiting ? 1.5 : 1, 
          opacity: isExiting ? 0 : 0.6,
          x: isExiting ? -100 : 0
        }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
      <motion.div 
        className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/8 rounded-full blur-3xl"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: isExiting ? 1.5 : 1, 
          opacity: isExiting ? 0 : 0.6,
          x: isExiting ? 100 : 0
        }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
      />

      {/* Main content container with stagger animation */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-6"
        initial={{ y: 30, opacity: 0 }}
        animate={{ 
          y: isExiting ? -50 : 0, 
          opacity: isExiting ? 0 : 1,
          scale: isExiting ? 0.9 : 1
        }}
        transition={{ 
          type: "spring",
          stiffness: 100,
          damping: 15,
          mass: 1
        }}
      >
        {/* Logo with bounce and glow */}
        <motion.div
          className="relative"
          initial={{ scale: 0.3, opacity: 0, rotate: -10 }}
          animate={{ 
            scale: isExiting ? 0.7 : 1, 
            opacity: isExiting ? 0 : 1,
            rotate: isExiting ? 5 : 0,
            y: isExiting ? -30 : 0
          }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 12,
            delay: 0.1
          }}
        >
          {/* Pulsing ring effect */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/30"
            style={{ margin: '-20px', width: 'calc(100% + 40px)', height: 'calc(100% + 40px)' }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: isExiting ? 0 : [0.3, 0, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Floating animation for logo */}
          <motion.img 
            src={splashLogo} 
            alt="شعار التطبيق" 
            className="w-48 h-48 object-contain drop-shadow-2xl"
            animate={{ 
              y: isExiting ? 0 : [0, -8, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            onError={() => {
              console.error('Splash logo failed to load');
              handleFinish();
            }}
          />
          
          {/* Glow effect */}
          <motion.div 
            className="absolute inset-0 bg-primary/20 blur-3xl rounded-full -z-10"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ 
              scale: isExiting ? 0.3 : 1.5, 
              opacity: isExiting ? 0 : 0.5 
            }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        </motion.div>

        {/* Welcome Text with slide up */}
        <motion.div
          className="text-center max-w-xs px-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ 
            opacity: isExiting ? 0 : 1, 
            y: isExiting ? -20 : 0 
          }}
          transition={{ 
            delay: isExiting ? 0 : 0.4, 
            duration: 0.6,
            ease: [0.4, 0, 0.2, 1]
          }}
        >
          <motion.h1 
            className="text-2xl font-bold text-foreground mb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isExiting ? 0 : 1, y: 0 }}
            transition={{ delay: isExiting ? 0 : 0.5, duration: 0.5 }}
          >
            أهلاً وسهلاً بكم
          </motion.h1>
          <motion.p 
            className="text-muted-foreground text-sm leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isExiting ? 0 : 1, y: 0 }}
            transition={{ delay: isExiting ? 0 : 0.6, duration: 0.5 }}
          >
            تطبيق همزة وصل يربطكم بالمدرسة لمتابعة أبنائكم
          </motion.p>
        </motion.div>

        {/* Loading Indicator with stagger */}
        <motion.div
          className="flex gap-2"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: isExiting ? 0 : 1, scale: 1 }}
          transition={{ delay: isExiting ? 0 : 0.7, duration: 0.4 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-primary"
              initial={{ scale: 0 }}
              animate={{
                scale: isExiting ? 0 : [1, 1.4, 1],
                opacity: isExiting ? 0 : [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: isExiting ? 0 : 0.8 + i * 0.15,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>

        {/* Skip hint with fade in */}
        <motion.p
          className="text-xs text-muted-foreground/60 mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: isExiting ? 0 : 0.8 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        >
          انقر للمتابعة
        </motion.p>
      </motion.div>

      {/* Exit overlay effect - creates smooth transition to app */}
      <motion.div
        className="absolute inset-0 bg-background pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isExiting ? 1 : 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      />
    </motion.div>
  );
};

export default SplashScreen;
