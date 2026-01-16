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
      // Set status bar with app primary color (blue) and light icons
      await StatusBar.setStyle({ style: Style.Light }); // Light icons on dark background
      await StatusBar.setBackgroundColor({ color: '#1e40af' }); // App primary blue color
      await StatusBar.setOverlaysWebView({ overlay: false });
    } catch (e) {
      console.log('StatusBar configuration error:', e);
    }
  }
};

// Hide native splash screen after a short delay to allow React to render
const hideNativeSplash = () => {
  if (Capacitor.isNativePlatform()) {
    // Wait for React to mount and render the custom splash screen
    setTimeout(() => {
      CapacitorSplashScreen.hide().catch((e) => {
        console.log('Splash screen hide error:', e);
      });
    }, 100);
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