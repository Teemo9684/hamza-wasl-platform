import { APP_VERSION } from "@/config/version";

/** Parents-only build/version marker, visible on both the landing and login pages. */
export function ParentVersionBadge() {
  return (
    <div
      dir="ltr"
      aria-label={`إصدار تطبيق الأولياء ${APP_VERSION}`}
      className="fixed left-3 z-[100] rounded-full border border-slate-300/70 bg-white/95 px-3 py-1.5 text-xs font-mono font-bold tracking-wide text-slate-800 shadow-md"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
    >
      v{APP_VERSION}
    </div>
  );
}
