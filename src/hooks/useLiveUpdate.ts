import { useState, useEffect, useCallback, useRef } from "react";
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

// Global state to share between hook instances
let globalState: LiveUpdateState = createInitialState();
let globalUpdateCheckInProgress = false;
let hasPerformedInitialCheck = false;
const listeners = new Set<(state: LiveUpdateState) => void>();

// Storage key for tracking the last notified version
const NOTIFIED_VERSION_KEY = "ota_notified_version";

const getNotifiedVersion = (): string | null => {
  try {
    return localStorage.getItem(NOTIFIED_VERSION_KEY);
  } catch {
    return null;
  }
};

const setNotifiedVersion = (version: string): void => {
  try {
    localStorage.setItem(NOTIFIED_VERSION_KEY, version);
  } catch (error) {
    console.error("Error saving notified version:", error);
  }
};

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
    // Sync with current global state
    setState(globalState);
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
      
      // Check if we already notified about this version
      const notifiedVersion = getNotifiedVersion();
      if (updateInfo.hasUpdate && updateInfo.version === notifiedVersion) {
        console.log("Already notified about this version, skipping notification");
        notifyListeners({ ...globalState, isChecking: false, updateInfo: null });
        globalUpdateCheckInProgress = false;
        return { hasUpdate: false };
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
        setNotifiedVersion(globalState.updateInfo.version);
      }

      const success = await downloadAndApplyUpdate(
        globalState.updateInfo.bundleUrl,
        (progress) => {
          notifyListeners({ ...globalState, downloadProgress: progress });
        }
      );

      if (success) {
        toast.success("تم تطبيق التحديث بنجاح!", { id: "update-download" });
        // Clear the update info after successful application
        notifyListeners({ 
          ...globalState, 
          isDownloading: false, 
          updateInfo: null 
        });
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

  // Auto-check for updates on mount - only once globally
  useEffect(() => {
    if (autoCheck && isNative && !hasCheckedRef.current && !hasPerformedInitialCheck) {
      hasCheckedRef.current = true;
      hasPerformedInitialCheck = true;
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
