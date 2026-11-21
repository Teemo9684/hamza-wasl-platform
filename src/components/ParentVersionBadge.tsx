import { createPortal } from "react-dom";
import { APP_VERSION } from "@/config/version";

/**
 * The root app uses Framer Motion transforms, which make CSS position:fixed
 * relative to an animated ancestor instead of the Android viewport.
 * Mount on document.body, outside those transforms and overflow clipping.
 * Keep the official application's original unboxed footer typography.
 */
export function ParentVersionBadge() {
  return createPortal(
    <div
      dir="ltr"
      aria-label={`إصدار تطبيق الأولياء ${APP_VERSION}`}
      className="fixed bottom-4 left-4 text-white/50 text-xs font-mono pointer-events-none"
      style={{ zIndex: 2147483000 }}
    >
      v{APP_VERSION}
    </div>,
    document.body
  );
}
