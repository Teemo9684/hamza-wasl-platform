import { useEffect, useState } from "react";

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
        {/* Logo SVG */}
        <div className="mb-6">
          <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
            <path d="M100 40C80 40 60 50 50 70L70 80C75 70 85 60 100 60C115 60 125 70 130 80L150 70C140 50 120 40 100 40Z" fill="#FFA500"/>
            <circle cx="100" cy="80" r="15" fill="#FFA500"/>
            <path d="M50 100C50 100 60 140 100 160C140 140 150 100 150 100L100 120L50 100Z" fill="#4A90E2"/>
            <path d="M60 105L100 125L140 105C138 130 120 145 100 155C80 145 62 130 60 105Z" fill="#5BA3F5"/>
            <path d="M170 85L175 75L165 70L160 80L170 85Z" fill="white"/>
          </svg>
        </div>
        
        {/* Text */}
        <h1 className="text-5xl font-bold text-white mb-2 font-ruqaa">همزة وصل</h1>
        <p className="text-xl text-white/90 font-cairo">مدرسة العربي التبسي</p>
      </div>
    </div>
  );
};

export default SplashScreen;
