import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  isNativeApp,
  checkForUpdate,
  downloadAndApplyUpdate,
  getCurrentVersion,
  createInitialState,
} from "@/utils/liveUpdate";

interface UpdateInfo {
  hasUpdate: boolean;
  version?: string;
  bundleUrl?: string;
  isMandatory?: boolean;
  releaseNotes?: string;
}

interface LiveUpdateState {
  isChecking: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  updateInfo: UpdateInfo | null;
  error: string | null;
}

export const useLiveUpdate = (autoCheck: boolean = true) => {
  const [state, setState] = useState<LiveUpdateState>(createInitialState());

  // Check for updates
  const checkUpdate = useCallback(async () => {
    if (!isNativeApp()) {
      console.log("Not a native app, skipping update check");
      return;
    }

    setState((prev) => ({ ...prev, isChecking: true, error: null }));

    try {
      const updateInfo = await checkForUpdate();
      setState((prev) => ({ ...prev, isChecking: false, updateInfo }));

      if (updateInfo.hasUpdate) {
        if (updateInfo.isMandatory) {
          toast.error("تحديث إلزامي متوفر!", {
            description: updateInfo.releaseNotes || `الإصدار ${updateInfo.version}`,
            duration: Infinity,
            action: {
              label: "تحديث الآن",
              onClick: () => applyUpdate(),
            },
          });
        } else {
          toast.info("تحديث جديد متوفر!", {
            description: updateInfo.releaseNotes || `الإصدار ${updateInfo.version}`,
            duration: 10000,
            action: {
              label: "تحديث",
              onClick: () => applyUpdate(),
            },
          });
        }
      }

      return updateInfo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "فشل التحقق من التحديثات";
      setState((prev) => ({ ...prev, isChecking: false, error: errorMessage }));
      console.error("Update check failed:", error);
    }
  }, []);

  // Apply the update
  const applyUpdate = useCallback(async () => {
    if (!state.updateInfo?.bundleUrl) {
      toast.error("لا يوجد تحديث للتطبيق");
      return false;
    }

    setState((prev) => ({ ...prev, isDownloading: true, downloadProgress: 0 }));

    try {
      toast.loading("جارٍ تحميل التحديث...", { id: "update-download" });

      const success = await downloadAndApplyUpdate(
        state.updateInfo.bundleUrl,
        (progress) => {
          setState((prev) => ({ ...prev, downloadProgress: progress }));
        }
      );

      if (success) {
        toast.success("تم تطبيق التحديث بنجاح!", { id: "update-download" });
        return true;
      } else {
        throw new Error("فشل تطبيق التحديث");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "فشل تحميل التحديث";
      setState((prev) => ({ ...prev, isDownloading: false, error: errorMessage }));
      toast.error("فشل تحميل التحديث", { id: "update-download" });
      console.error("Update failed:", error);
      return false;
    }
  }, [state.updateInfo]);

  // Auto-check for updates on mount
  useEffect(() => {
    if (autoCheck && isNativeApp()) {
      // Delay the check slightly to allow the app to fully initialize
      const timer = setTimeout(() => {
        checkUpdate();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [autoCheck, checkUpdate]);

  return {
    ...state,
    currentVersion: getCurrentVersion(),
    isNativeApp: isNativeApp(),
    checkUpdate,
    applyUpdate,
  };
};
