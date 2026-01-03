import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

// Register service worker with aggressive auto-update
if ('serviceWorker' in navigator) {
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

createRoot(document.getElementById("root")!).render(<App />);
