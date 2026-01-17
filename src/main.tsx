import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { SplashScreen as CapacitorSplashScreen } from "@capacitor/splash-screen";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

// Add platform-specific class to html element for CSS targeting
if (Capacitor.isNativePlatform()) {
  const platform = Capacitor.getPlatform();
  document.documentElement.classList.add(`capacitor-${platform}`);
}

// Configure status bar for native platforms (dynamic import to avoid web issues)
const configureStatusBar = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      const { StatusBar, Style } = await import("@capacitor/status-bar");
      // Set status bar with splash screen background color and dark icons
      await StatusBar.setStyle({ style: Style.Dark }); // Dark icons on light background
      await StatusBar.setBackgroundColor({ color: '#f8fafc' }); // Light background matching splash
      await StatusBar.setOverlaysWebView({ overlay: false });
    } catch (e) {
      console.log('StatusBar configuration error:', e);
    }
  }
};

// Hide native splash screen immediately when app starts
const hideNativeSplash = () => {
  if (Capacitor.isNativePlatform()) {
    CapacitorSplashScreen.hide().catch((e) => {
      console.log('Splash screen hide error:', e);
    });
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

// Hide native splash immediately, configure status bar, then render app
hideNativeSplash();
configureStatusBar();
createRoot(document.getElementById("root")!).render(<App />);