import { useState } from "react";
import { createPortal } from "react-dom";
import { APP_VERSION } from "@/config/version";
import { getCurrentPushTokenForTest } from "@/utils/pushNotifications";

/**
 * Keep the official unboxed version label outside the animated app wrapper and
 * above the additional Android bottom bar.
 * Private OTA test builds can tap it to copy their own FCM token.
 * Never print the token on-screen, to logs, or in a URL.
 */
export function ParentVersionBadge() {
  const testMode = import.meta.env.VITE_PARENT_FCM_TEST_ENABLED === "true";
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const copyToken = async () => {
    const token = getCurrentPushTokenForTest();
    if (!token) {
      setMessage("رمز Firebase غير جاهز. تأكد من السماح بالإشعارات ثم أغلق التطبيق وافتحه مجدداً.");
      return;
    }
    try {
      await navigator.clipboard.writeText(token);
      setMessage("تم نسخ رمز الجهاز إلى الحافظة. لا تنشره علناً.");
    } catch {
      setMessage("تعذّر النسخ تلقائياً. تحقّق من أذونات الحافظة على الجهاز.");
    }
  };

  return createPortal(
    <>
      {testMode ? (
        <button
          type="button"
          aria-label="إصدار التطبيق — إعداد اختبار Firebase"
          className="fixed bottom-4 left-4 z-50 text-white/50 text-xs font-mono"
          dir="ltr"
          style={{
            bottom: "calc(max(24px, env(safe-area-inset-bottom, 0px)) + 16px)",
            zIndex: 10020,
          }}
          onClick={() => {
            setMessage("");
            setOpen(true);
          }}
        >
          v{APP_VERSION}
        </button>
      ) : (
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
        </div>
      )}
      {testMode && open && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/65 px-5"
          style={{ zIndex: 10100 }}
          dir="rtl"
          role="dialog"
          aria-modal="true"
          aria-label="اختبار إشعارات Firebase"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-slate-900 shadow-2xl">
            <h2 className="mb-3 text-lg font-bold">اختبار Firebase — الأولياء</h2>
            <p className="mb-4 text-sm leading-6">
              يمكنك نسخ رمز الإشعارات الخاص بهاتفك لتجربة إرسال إشعار من Firebase Console.
              لا تشارك الرمز في محادثة عامة أو صورة للشاشة.
            </p>
            <button
              type="button"
              onClick={() => { void copyToken(); }}
              className="w-full rounded-xl bg-violet-700 px-4 py-3 font-semibold text-white"
            >
              نسخ رمز FCM
            </button>
            {message && <p className="mt-3 text-sm leading-6" role="status">{message}</p>}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
