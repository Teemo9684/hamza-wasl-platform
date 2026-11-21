import { createPortal } from "react-dom";
import { APP_VERSION } from "@/config/version";

/**
 * Mirror the official Index.tsx footer markup. The separated parents APK has
 * an additional 24px Android bottom-bar overlay absent from the official app:
 * shift this footer clear of that surface and render outside motion transforms.
 */
export function ParentVersionBadge() {
  return createPortal(
    <div
      className="fixed bottom-4 left-4 z-50 text-white/50 text-xs font-mono"
      dir="ltr"
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
