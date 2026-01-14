import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  isNativeApp,
  checkForUpdate,
  downloadAndApplyUpdate,
  getCurrentVersion,
  createInitialState,
  getAppliedVersion,
  setAppliedVersion,
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

// Global flag to prevent multiple update checks showing multiple notifications
let globalUpdateCheckInProgress = false;
let lastUpdateVersion: string | null = null;

export const useLiveUpdate = (autoCheck: boolean = true) => {
  const [state, setState] = useState<LiveUpdateState>(createInitialState());
  const hasChecked = useRef(false);

  // Check for updates
  const checkUpdate = useCallback(async () => {
    if (!isNativeApp()) {
      console.log("Not a native app, skipping update check");
      return;
    }

    // Prevent multiple simultaneous checks
    if (globalUpdateCheckInProgress) {
      console.log("Update check already in progress, skipping");
      return;
    }

    globalUpdateCheckInProgress = true;
    setState((prev) => ({ ...prev, isChecking: true, error: null }));

    try {
      const updateInfo = await checkForUpdate();
      
      // Check if we already applied this version
      const appliedVersion = getAppliedVersion();
      if (updateInfo.hasUpdate && updateInfo.version === appliedVersion) {
        console.log("Update already applied, clearing applied version marker");
        // User just updated to this version, so it's not really a new update
        updateInfo.hasUpdate = false;
      }

      // Check if we already notified about this version
      if (updateInfo.hasUpdate && updateInfo.version === lastUpdateVersion) {
        console.log("Already notified about this version, skipping notification");
        setState((prev) => ({ ...prev, isChecking: false, updateInfo }));
        globalUpdateCheckInProgress = false;
        return updateInfo;
      }

      if (updateInfo.hasUpdate) {
        lastUpdateVersion = updateInfo.version || null;
      }

      setState((prev) => ({ ...prev, isChecking: false, updateInfo }));
      globalUpdateCheckInProgress = false;

      // Note: We don't show toasts here anymore - UpdateNotificationBanner handles the UI
      return updateInfo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "فشل التحقق من التحديثات";
      setState((prev) => ({ ...prev, isChecking: false, error: errorMessage }));
      globalUpdateCheckInProgress = false;
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

      // Save the version we're applying so we don't show notification again
      if (state.updateInfo.version) {
        setAppliedVersion(state.updateInfo.version);
      }

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

  // Auto-check for updates on mount - only once per app lifecycle
  useEffect(() => {
    if (autoCheck && isNativeApp() && !hasChecked.current) {
      hasChecked.current = true;
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
