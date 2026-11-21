import { createPortal } from "react-dom";
import { APP_VERSION } from "@/config/version";

/**
 * Match the parents app: place the version label outside animated
 * wrappers, above the Android bottom navigation inset/overlay.
 * Display the version embedded in the active OTA bundle.
 */
export function TeacherVersionBadge() {
  return createPortal(
    <div
      className="fixed bottom-4 left-4 text-white/70 text-xs font-mono"
      dir="ltr"
      aria-label={`إصدار تطبيق الأساتذة ${APP_VERSION}`}
      style={{
        bottom: "calc(max(24px, env(safe-area-inset-bottom, 0px)) + 16px)",
        zIndex: 10020,
        pointerEvents: "none",
      }}
    >
      v{APP_VERSION}
    </div>,
    document.body
  );
}
