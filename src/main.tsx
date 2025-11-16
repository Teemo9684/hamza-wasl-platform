import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

// Register service worker
if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      if (confirm('يتوفر تحديث جديد. هل تريد تحديث التطبيق؟')) {
        window.location.reload();
      }
    },
    onOfflineReady() {
      console.log('التطبيق جاهز للعمل بدون إنترنت');
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);
