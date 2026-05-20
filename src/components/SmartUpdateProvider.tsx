import { useEffect, useState } from "react";
import { useSmartUpdate } from "@/hooks/useSmartUpdate";
import { MandatoryUpdateScreen } from "@/components/MandatoryUpdateScreen";
import { markBundleAsReady, isNativeApp as checkNativeApp } from "@/utils/liveUpdate";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SmartUpdateProviderProps {
  children: React.ReactNode;
  autoCheck?: boolean;
  checkInterval?: number;
}

/**
 * مُوفِّر التحديثات الذكية
 * يُغلِّف التطبيق ويتعامل مع:
 * - عرض شاشة التحديث الإجباري
 * - إظهار رسالة النجاح بعد التحديث
 * - الفحص الدوري في الخلفية
 */
export const SmartUpdateProvider = ({
  children,
  autoCheck = true,
  checkInterval = 30 * 60 * 1000, // 30 دقيقة
}: SmartUpdateProviderProps) => {
  const {
    isChecking,
    isDownloading,
    downloadProgress,
    error,
    updateInfo,
    isMandatoryUpdate,
    isOnline,
    checkUpdate,
    retryUpdate,
    getAppliedUpdate,
    clearAppliedUpdate,
    isNativeApp,
    currentVersion,
  } = useSmartUpdate();

  const [hasShownSuccess, setHasShownSuccess] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Bundle is already marked as ready in main.tsx IMMEDIATELY on startup.
  // No need to call markBundleAsReady() here - it was causing delays that
  // exceeded the readyTimeout, causing the bundle to roll back.
  useEffect(() => {
    if (!checkNativeApp() || isInitialized) return;
    setIsInitialized(true);
    console.log("[SmartUpdateProvider] Initialized (bundle already marked ready in main.tsx)");
  }, [isInitialized]);

  // عرض رسالة النجاح بعد التحديث
  useEffect(() => {
    if (!checkNativeApp() || !isInitialized || hasShownSuccess) return;

    const showSuccess = async () => {
      const applied = await getAppliedUpdate();
      
      if (applied) {
        setHasShownSuccess(true);
        
        toast.success(
          <div className="text-right" dir="rtl">
            <div className="font-bold text-base mb-1 flex items-center gap-2">
              <span className="text-xl">🎉</span>
              تم التحديث بنجاح!
            </div>
            <div className="text-sm text-muted-foreground">
              الإصدار الجديد: <span className="font-semibold text-primary">{applied.version}</span>
            </div>
            {applied.releaseNotes && (
              <div className="text-xs text-muted-foreground mt-2 border-t pt-2 border-border/50">
                {applied.releaseNotes}
              </div>
            )}
          </div>,
          {
            duration: 6000,
            position: "top-center",
          }
        );

        await clearAppliedUpdate();
        console.log("[SmartUpdateProvider] Showed success for version:", applied.version);
      }
    };

    // تأخير لعرض الرسالة بعد تحميل واجهة المستخدم
    const timer = setTimeout(showSuccess, 2000);
    return () => clearTimeout(timer);
  }, [isInitialized, hasShownSuccess, getAppliedUpdate, clearAppliedUpdate]);

  // الفحص الدوري
  useEffect(() => {
    if (!isNativeApp || !autoCheck || !isInitialized) return;

    console.log("[SmartUpdateProvider] Setting up periodic check every", checkInterval / 1000 / 60, "minutes");

    const intervalId = setInterval(() => {
      console.log("[SmartUpdateProvider] Periodic update check, version:", currentVersion);
      checkUpdate();
    }, checkInterval);

    return () => clearInterval(intervalId);
  }, [isNativeApp, autoCheck, checkInterval, checkUpdate, isInitialized, currentVersion]);

  // عرض شاشة التحديث الإجباري
  if (isMandatoryUpdate && updateInfo?.version) {
    return (
      <MandatoryUpdateScreen
        version={updateInfo.version}
        releaseNotes={updateInfo.releaseNotes}
        isDownloading={isDownloading}
        downloadProgress={downloadProgress}
        error={error}
        onRetry={retryUpdate}
        isOnline={isOnline}
      />
    );
  }

  // عرض شريط التقدم العائم أثناء التحميل
  if (isDownloading && !isMandatoryUpdate) {
    return (
      <>
        {children}
        <div 
          className="fixed bottom-20 left-4 right-4 z-[9999] bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl p-4 border border-primary/20"
          dir="rtl"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">جاري تحميل التحديث...</p>
              <p className="text-xs text-muted-foreground">
                الإصدار {updateInfo?.version}
              </p>
            </div>
            <span className="font-mono text-primary font-bold">{downloadProgress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-300 rounded-full"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
        </div>
      </>
    );
  }

  return <>{children}</>;
};
