import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { SplashScreen as CapacitorSplashScreen } from "@capacitor/splash-screen";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

// Environment check - rebuild trigger

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
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#f8fafc' });
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

/**
 * On Android, localStorage can be cleared after OTA bundle swaps.
 * Restore critical cached settings from nativeStorage (Capacitor Preferences)
 * BEFORE React renders, so synchronous reads in components find the right values.
 */
const restoreNativeSettings = async () => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { getItem } = await import('./utils/nativeStorage');
    
    // Restore Ramadan mode cache
    const ramadanCache = await getItem('ramadan_mode_active');
    if (ramadanCache !== null) {
      localStorage.setItem('ramadan_mode_active', ramadanCache);
      console.log('[main] Restored ramadan_mode_active from nativeStorage:', ramadanCache);
      
      // Apply ramadan class immediately if active (before React renders)
      if (ramadanCache === 'true') {
        document.documentElement.classList.add('ramadan');
      }
    }
  } catch (e) {
    console.log('[main] Failed to restore native settings:', e);
  }
};

// Register service worker only for web/PWA (not native)
if ('serviceWorker' in navigator && !Capacitor.isNativePlatform()) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('تحديث جديد متاح، جاري التحديث...');
      updateSW(true);
    },
    onOfflineReady() {
      console.log('التطبيق جاهز للعمل بدون إنترنت');
    },
    onRegisteredSW(swUrl, r) {
      if (r) {
        setInterval(() => {
          r.update();
        }, 5 * 1000);
      }
    }
  });
}

// Start the app - restore native settings BEFORE rendering
const startApp = async () => {
  hideNativeSplash();
  configureStatusBar();
  
  // CRITICAL: Restore cached settings from nativeStorage to localStorage
  // before React renders, so ThemeContext reads the correct initial value
  await restoreNativeSettings();
  
  createRoot(document.getElementById("root")!).render(<App />);
};

startApp();
