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

// Global state to share between hook instances
let globalState: LiveUpdateState = createInitialState();
let globalUpdateCheckInProgress = false;
let lastUpdateVersion: string | null = null;
const listeners = new Set<(state: LiveUpdateState) => void>();

const notifyListeners = (newState: LiveUpdateState) => {
  globalState = newState;
  listeners.forEach((listener) => listener(newState));
};

export const useLiveUpdate = (autoCheck: boolean = true) => {
  const [state, setState] = useState<LiveUpdateState>(globalState);
  const hasCheckedRef = useRef(false);
  const isNative = isNativeApp();

  // Subscribe to global state changes
  useEffect(() => {
    const listener = (newState: LiveUpdateState) => {
      setState(newState);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  // Check for updates
  const checkUpdate = useCallback(async () => {
    if (!isNative) {
      console.log("Not a native app, skipping update check");
      return;
    }

    // Prevent multiple simultaneous checks
    if (globalUpdateCheckInProgress) {
      console.log("Update check already in progress, skipping");
      return;
    }

    globalUpdateCheckInProgress = true;
    notifyListeners({ ...globalState, isChecking: true, error: null });

    try {
      const updateInfo = await checkForUpdate();

      // Check if we already applied this version
      const appliedVersion = getAppliedVersion();
      if (updateInfo.hasUpdate && updateInfo.version === appliedVersion) {
        console.log("Update already applied, clearing applied version marker");
        updateInfo.hasUpdate = false;
      }

      // Check if we already notified about this version
      if (updateInfo.hasUpdate && updateInfo.version === lastUpdateVersion) {
        console.log("Already notified about this version, skipping notification");
        notifyListeners({ ...globalState, isChecking: false, updateInfo });
        globalUpdateCheckInProgress = false;
        return updateInfo;
      }

      if (updateInfo.hasUpdate) {
        lastUpdateVersion = updateInfo.version || null;
      }

      notifyListeners({ ...globalState, isChecking: false, updateInfo });
      globalUpdateCheckInProgress = false;

      return updateInfo;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "فشل التحقق من التحديثات";
      notifyListeners({ ...globalState, isChecking: false, error: errorMessage });
      globalUpdateCheckInProgress = false;
      console.error("Update check failed:", error);
    }
  }, [isNative]);

  // Apply the update
  const applyUpdate = useCallback(async () => {
    if (!globalState.updateInfo?.bundleUrl) {
      toast.error("لا يوجد تحديث للتطبيق");
      return false;
    }

    notifyListeners({ ...globalState, isDownloading: true, downloadProgress: 0 });

    try {
      toast.loading("جارٍ تحميل التحديث...", { id: "update-download" });

      // Save the version we're applying so we don't show notification again
      if (globalState.updateInfo.version) {
        setAppliedVersion(globalState.updateInfo.version);
      }

      const success = await downloadAndApplyUpdate(
        globalState.updateInfo.bundleUrl,
        (progress) => {
          notifyListeners({ ...globalState, downloadProgress: progress });
        }
      );

      if (success) {
        toast.success("تم تطبيق التحديث بنجاح!", { id: "update-download" });
        return true;
      } else {
        throw new Error("فشل تطبيق التحديث");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "فشل تحميل التحديث";
      notifyListeners({ ...globalState, isDownloading: false, error: errorMessage });
      toast.error("فشل تحميل التحديث", { id: "update-download" });
      console.error("Update failed:", error);
      return false;
    }
  }, []);

  // Auto-check for updates on mount - only once per app lifecycle
  useEffect(() => {
    if (autoCheck && isNative && !hasCheckedRef.current) {
      hasCheckedRef.current = true;
      const timer = setTimeout(() => {
        checkUpdate();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [autoCheck, isNative, checkUpdate]);

  return {
    ...state,
    currentVersion: getCurrentVersion(),
    isNativeApp: isNative,
    checkUpdate,
    applyUpdate,
  };
};
