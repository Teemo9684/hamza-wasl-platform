import { useEffect, useState } from "react";
import { useLiveUpdate, checkAndConvertPendingUpdate, getAppliedUpdate, clearAppliedUpdate } from "@/hooks/useLiveUpdate";
import { markBundleAsReady, isNativeApp as checkNativeApp } from "@/utils/liveUpdate";
import { toast } from "sonner";

interface LiveUpdateCheckerProps {
  autoCheck?: boolean;
  checkInterval?: number;
}

/**
 * Component that handles automatic live update checking
 * Also marks the current bundle as ready to prevent rollback
 * Shows success message after update is applied
 */
export const LiveUpdateChecker = ({
  autoCheck = true,
  checkInterval = 30 * 60 * 1000,
}: LiveUpdateCheckerProps) => {
  const { checkUpdate, isNativeApp, isDownloading, downloadProgress } = useLiveUpdate(autoCheck);
  const [hasShownUpdateSuccess, setHasShownUpdateSuccess] = useState(false);

  // Check for pending update and show success message
  useEffect(() => {
    if (!checkNativeApp()) return;

    // Convert pending update to applied on app start
    checkAndConvertPendingUpdate();

    // Check if we just completed an update
    const timer = setTimeout(() => {
      const appliedUpdate = getAppliedUpdate();
      if (appliedUpdate && !hasShownUpdateSuccess) {
        setHasShownUpdateSuccess(true);
        
        // Show success toast with update info
        toast.success(
          <div className="text-right" dir="rtl">
            <div className="font-bold text-base mb-1">✅ تم التحديث بنجاح!</div>
            <div className="text-sm text-muted-foreground mb-1">
              الإصدار الجديد: <span className="font-semibold text-primary">{appliedUpdate.version}</span>
            </div>
            {appliedUpdate.releaseNotes && (
              <div className="text-xs text-muted-foreground mt-1 border-t pt-1">
                {appliedUpdate.releaseNotes}
              </div>
            )}
          </div>,
          {
            duration: 5000,
            position: "top-center",
          }
        );

        // Clear the applied update flag after showing
        clearAppliedUpdate();
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [hasShownUpdateSuccess]);

  // Mark bundle as ready on app start - this prevents rollback to previous version
  useEffect(() => {
    if (!checkNativeApp()) return;
    
    // Give the app a moment to fully load before confirming the bundle
    const timer = setTimeout(() => {
      markBundleAsReady();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Periodic update check
  useEffect(() => {
    if (!isNativeApp || !autoCheck) return;

    const intervalId = setInterval(() => {
      checkUpdate();
    }, checkInterval);

    return () => clearInterval(intervalId);
  }, [isNativeApp, autoCheck, checkInterval, checkUpdate]);

  // Show download progress toast when downloading
  useEffect(() => {
    if (isDownloading && downloadProgress > 0) {
      toast.loading(
        <div className="text-right" dir="rtl">
          <div className="font-semibold">جاري تحميل التحديث...</div>
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1">{downloadProgress}%</div>
        </div>,
        {
          id: "update-progress",
          position: "top-center",
        }
      );
    } else if (!isDownloading && downloadProgress === 0) {
      toast.dismiss("update-progress");
    }
  }, [isDownloading, downloadProgress]);

  return null;
};
