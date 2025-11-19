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
      <div className="relative z-10 flex flex-col items-center justify-center gap-8">
        {/* Logo Text with Glow Effect */}
        <div className="relative">
          <h1 className="text-7xl md:text-9xl font-bold text-white font-aref drop-shadow-2xl animate-fade-in">
            همزة وصل
          </h1>
          {/* Glow Effect */}
          <div className="absolute inset-0 text-7xl md:text-9xl font-bold text-white font-aref blur-2xl opacity-50 animate-pulse">
            همزة وصل
          </div>
        </div>

        {/* Animated Underline */}
        <div className="w-64 h-1 bg-gradient-to-r from-transparent via-white to-transparent animate-fade-in delay-300" />

        {/* Subtitle with Fade In */}
        <p className="text-xl md:text-2xl text-white/90 font-cairo animate-fade-in delay-500">
          جسر التواصل بين المدرسة و البيت
        </p>

        {/* Loading Dots Animation */}
        <div className="flex gap-2 mt-4 animate-fade-in delay-700">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" />
          <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-100" />
          <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-200" />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
