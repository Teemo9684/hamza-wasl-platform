import { useEffect, useState } from "react";
import { useAppVersion } from "@/hooks/useAppVersion";

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false);
  const { version: appVersion } = useAppVersion();

  useEffect(() => {
    // Fade out after 4.5s
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 4500);

    // Finish after 5s
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 5000);

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
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-white/5 rounded-full blur-3xl -top-48 -left-48 animate-pulse" />
        <div className="absolute w-96 h-96 bg-white/5 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-700" />
        <div className="absolute w-64 h-64 bg-white/3 rounded-full blur-2xl top-1/4 right-1/4 animate-bounce" style={{ animationDuration: '3s' }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-6 px-6 max-w-2xl mx-auto">
        {/* Welcome Message */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/20 overflow-hidden">
          {/* Animated Welcome Text */}
          <h1 
            className="text-3xl md:text-4xl font-bold text-white font-cairo mb-2 text-center opacity-0"
            style={{
              animation: 'slideInUp 0.8s ease-out 0.3s forwards'
            }}
          >
            أهلاً بكم
          </h1>
          <h2 
            className="text-2xl md:text-3xl font-bold text-white font-cairo mb-4 text-center opacity-0"
            style={{
              animation: 'slideInUp 0.8s ease-out 0.6s forwards'
            }}
          >
            في منصة العربي التبسي
          </h2>
          <p 
            className="text-lg md:text-xl text-white/90 font-cairo text-center leading-relaxed opacity-0"
            style={{
              animation: 'fadeInScale 0.8s ease-out 0.9s forwards'
            }}
          >
            هذا التطبيق مخصص فقط لمتابعة والاستفسار عن أبنائكم في المدرسة. 
            يرجى استخدام التطبيق بالطريقة الصحيحة والتواصل مع المعلمين بشكل محترم ومهني.
          </p>
        </div>

        {/* Loading Dots Animation */}
        <div className="flex gap-2 mt-2 opacity-0" style={{ animation: 'fadeIn 0.5s ease-out 1.5s forwards' }}>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>

      {/* Version Number */}
      <div 
        className="absolute bottom-6 left-0 right-0 text-center opacity-0"
        style={{ animation: 'fadeIn 0.5s ease-out 2s forwards' }}
      >
        <p className="text-white/70 text-sm font-cairo">الإصدار {appVersion}</p>
      </div>

      {/* Custom Keyframes */}
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;