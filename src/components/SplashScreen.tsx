import { useEffect, useState } from "react";

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Fade out after 2.5s
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2500);

    // Finish after 3s
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 3000);

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
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-6 px-6 max-w-2xl mx-auto">
        {/* Logo Text with Glow Effect */}
        <div className="relative mb-4">
          <h1 className="text-6xl md:text-8xl font-bold text-white font-aref drop-shadow-2xl animate-fade-in">
            همزة وصل
          </h1>
          {/* Glow Effect */}
          <div className="absolute inset-0 text-6xl md:text-8xl font-bold text-white font-aref blur-2xl opacity-50 animate-pulse">
            همزة وصل
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/20 animate-fade-in delay-300">
          <h2 className="text-2xl md:text-3xl font-bold text-white font-cairo mb-4 text-center">
            مرحباً بك في منصة المدرسة
          </h2>
          <p className="text-lg md:text-xl text-white/90 font-cairo text-center leading-relaxed">
            هذا التطبيق مخصص فقط لمتابعة والاستفسار عن أبنائكم في المدرسة. 
            يرجى استخدام التطبيق بالطريقة الصحيحة والتواصل مع المعلمين بشكل محترم ومهني.
          </p>
        </div>

        {/* Loading Dots Animation */}
        <div className="flex gap-2 mt-2 animate-fade-in delay-500">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" />
          <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-100" />
          <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-200" />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
