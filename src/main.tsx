import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

// Hide native splash screen when app is ready
const hideNativeSplash = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await SplashScreen.hide();
    } catch (e) {
      console.log('Splash screen hide error:', e);
    }
  }
};

// Register service worker only for web/PWA (not native)
if ('serviceWorker' in navigator && !Capacitor.isNativePlatform()) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // Automatically reload when a new version is available
      console.log('تحديث جديد متاح، جاري التحديث...');
      updateSW(true);
    },
    onOfflineReady() {
      console.log('التطبيق جاهز للعمل بدون إنترنت');
    },
    onRegisteredSW(swUrl, r) {
      // Check for updates every 5 seconds for faster updates
      if (r) {
        setInterval(() => {
          r.update();
        }, 5 * 1000);
      }
    }
  });
}

// Initialize app
const initApp = async () => {
  createRoot(document.getElementById("root")!).render(<App />);
  
  // Hide splash after a short delay to ensure content is rendered
  setTimeout(() => {
    hideNativeSplash();
  }, 100);
};

initApp();
