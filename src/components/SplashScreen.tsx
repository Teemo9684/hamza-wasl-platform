import { useEffect, useState } from "react";
import splashLogo from "@/assets/splash-logo.png";

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 3500);

    const finishTimer = setTimeout(() => {
      onFinish();
    }, 4000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-primary via-primary/95 to-accent transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center justify-center gap-8">
        {/* Logo with animation */}
        <div className="splash-zoom-fade" style={{ animationDelay: '0.2s', opacity: 0 }}>
          <img 
            src={splashLogo} 
            alt="العربي التبسي" 
            className="w-80 h-80 object-contain drop-shadow-2xl"
          />
        </div>
        
        {/* Text with staggered animation */}
        <div className="flex flex-col items-center gap-3 splash-slide-up" style={{ animationDelay: '0.6s', opacity: 0 }}>
          <h1 className="text-6xl font-bold text-white font-ruqaa drop-shadow-lg">همزة وصل</h1>
          <p className="text-2xl text-white/95 font-cairo drop-shadow-md">مدرسة العربي التبسي</p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
