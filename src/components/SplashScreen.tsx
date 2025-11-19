import { useEffect, useState } from "react";
import splashLogo from "@/assets/splash-logo.png";

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false);
  const [stage, setStage] = useState<'logo' | 'breaking' | 'text'>('logo');

  useEffect(() => {
    // Stage 1: Show logo (0-1.5s)
    const breakTimer = setTimeout(() => {
      setStage('breaking');
    }, 1500);

    // Stage 2: Breaking effect (1.5-2.3s)
    const textTimer = setTimeout(() => {
      setStage('text');
    }, 2300);

    // Stage 3: Fade out (3.5s)
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 3500);

    // Finish (4s)
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 4000);

    return () => {
      clearTimeout(breakTimer);
      clearTimeout(textTimer);
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
      <div className="flex items-center justify-center w-full h-full">
        {/* Logo Stage */}
        {stage === 'logo' && (
          <div className="splash-zoom-fade w-full h-full flex items-center justify-center">
            <img 
              src={splashLogo} 
              alt="العربي التبسي" 
              className="w-[70vw] h-[70vh] object-contain drop-shadow-2xl"
            />
          </div>
        )}

        {/* Breaking Stage */}
        {stage === 'breaking' && (
          <div className="splash-break-apart w-full h-full flex items-center justify-center">
            <img 
              src={splashLogo} 
              alt="العربي التبسي" 
              className="w-[70vw] h-[70vh] object-contain drop-shadow-2xl"
            />
          </div>
        )}

        {/* Text Stage */}
        {stage === 'text' && (
          <div className="splash-text-appear flex items-center justify-center">
            <h1 className="text-6xl md:text-8xl font-bold text-white font-aref drop-shadow-2xl">
              العربي التبسي
            </h1>
          </div>
        )}
      </div>
    </div>
  );
};

export default SplashScreen;
