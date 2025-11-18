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
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-200 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <img
        src={splashLogo}
        alt="همزة وصل"
        className="max-w-[80%] max-h-[80%] object-contain animate-in fade-in zoom-in duration-500"
      />
    </div>
  );
};

export default SplashScreen;
