import { APP_VERSION } from "@/config/version";

/**
 * Match the official application's small, unobtrusive version text
 * at the bottom-left of the landing and parent-login screens.
 */
export function ParentVersionBadge() {
  return (
    <div
      dir="ltr"
      aria-label={`إصدار تطبيق الأولياء ${APP_VERSION}`}
      className="fixed bottom-4 left-4 z-50 text-white/50 text-xs font-mono"
    >
      v{APP_VERSION}
    </div>
  );
}
