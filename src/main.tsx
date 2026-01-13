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
  
  // Force viewport scale for Android WebView
  if (platform === 'android') {
    // Add meta viewport with proper density settings
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=0.88, minimum-scale=0.88, maximum-scale=0.88, user-scalable=no, viewport-fit=cover'
      );
    }
    
    // Also try to detect screen density and adjust
    const screenDensity = window.devicePixelRatio || 1;
    console.log('Android screen density:', screenDensity);
    
    // For high density screens, apply additional class
    if (screenDensity > 2) {
      document.documentElement.classList.add('high-density');
    }
  }
}

// Configure status bar for native platforms (dynamic import to avoid web issues)
const configureStatusBar = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      const { StatusBar, Style } = await import("@capacitor/status-bar");
      // Set status bar to match app theme (dark icons on transparent/colored background)
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#1e40af' });
      await StatusBar.setOverlaysWebView({ overlay: false });
    } catch (e) {
      console.log('StatusBar configuration error:', e);
    }
  }
};

// Hide native splash screen when app is ready
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

// Configure status bar and render app
configureStatusBar();
createRoot(document.getElementById("root")!).render(<App />);

// Hide native splash after a short delay
setTimeout(hideNativeSplash, 100);