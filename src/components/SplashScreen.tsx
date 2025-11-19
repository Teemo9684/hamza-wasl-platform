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
    }, 1800);

    const finishTimer = setTimeout(() => {
      onFinish();
    }, 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-primary via-primary/95 to-accent transition-opacity duration-200 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="text-center animate-in fade-in zoom-in duration-500">
        {/* Logo */}
        <div className="mb-6">
          <img 
            src={splashLogo} 
            alt="العربي التبسي" 
            className="mx-auto w-72 h-72 object-contain"
          />
        </div>
        
        {/* Text */}
        <h1 className="text-5xl font-bold text-white mb-2 font-ruqaa">همزة وصل</h1>
        <p className="text-xl text-white/90 font-cairo">مدرسة العربي التبسي</p>
      </div>
    </div>
  );
};

export default SplashScreen;
