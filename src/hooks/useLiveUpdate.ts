import { useState, useEffect, useCallback, useRef } from "react";
import {
  isNativeApp,
  getCurrentVersion,
  checkForUpdate,
  downloadAndApplyUpdate,
  UpdateInfo,
  LiveUpdateState,
  createInitialState,
} from "@/utils/liveUpdate";

// Global state to share between hook instances
let globalState: LiveUpdateState = createInitialState();
let globalUpdateCheckInProgress = false;
let hasPerformedInitialCheck = false;

// Listeners for state updates
const listeners = new Set<(state: LiveUpdateState) => void>();

const notifyListeners = (newState: LiveUpdateState) => {
  globalState = newState;
  listeners.forEach((listener) => listener(newState));
};

// Store pending update info to show message after reload
const PENDING_UPDATE_KEY = "ota_pending_update";
const UPDATE_APPLIED_KEY = "ota_update_applied";

export const setPendingUpdate = (updateInfo: UpdateInfo): void => {
  try {
    localStorage.setItem(PENDING_UPDATE_KEY, JSON.stringify({
      version: updateInfo.version,
      releaseNotes: updateInfo.releaseNotes,
      appliedAt: Date.now()
    }));
  } catch (error) {
    console.error("Error saving pending update:", error);
  }
};

export const getAppliedUpdate = (): { version: string; releaseNotes?: string; appliedAt: number } | null => {
  try {
    const data = localStorage.getItem(UPDATE_APPLIED_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Only return if applied within last 30 seconds
      if (Date.now() - parsed.appliedAt < 30000) {
        return parsed;
      }
      localStorage.removeItem(UPDATE_APPLIED_KEY);
    }
    return null;
  } catch {
    return null;
  }
};

export const clearAppliedUpdate = (): void => {
  try {
    localStorage.removeItem(UPDATE_APPLIED_KEY);
  } catch (error) {
    console.error("Error clearing applied update:", error);
  }
};

// Check for pending update on app load and convert to applied
export const checkAndConvertPendingUpdate = (): void => {
  try {
    const pendingData = localStorage.getItem(PENDING_UPDATE_KEY);
    if (pendingData) {
      const pending = JSON.parse(pendingData);
      localStorage.setItem(UPDATE_APPLIED_KEY, JSON.stringify({
        ...pending,
        appliedAt: Date.now()
      }));
      localStorage.removeItem(PENDING_UPDATE_KEY);
      console.log("Converted pending update to applied:", pending.version);
    }
  } catch (error) {
    console.error("Error checking pending update:", error);
  }
};

export const useLiveUpdate = (autoCheck: boolean = true) => {
  const [state, setState] = useState<LiveUpdateState>(globalState);
  const isNative = isNativeApp();
  const hasCheckedRef = useRef(false);

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
      
      console.log("Update info received:", updateInfo);

      if (updateInfo.hasUpdate && updateInfo.bundleUrl) {
        console.log("Update available! Starting automatic download...");
        notifyListeners({ ...globalState, isChecking: false, updateInfo });
        globalUpdateCheckInProgress = false;
        
        // Auto apply update immediately
        await applyUpdateInternal(updateInfo);
        return updateInfo;
      }

      notifyListeners({ ...globalState, isChecking: false, updateInfo: null });
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

  // Internal apply update function
  const applyUpdateInternal = async (updateInfo: UpdateInfo) => {
    if (!updateInfo?.bundleUrl) {
      return false;
    }

    // Save the update info before starting download
    setPendingUpdate(updateInfo);

    notifyListeners({ ...globalState, isDownloading: true, downloadProgress: 0, updateInfo });

    try {
      const success = await downloadAndApplyUpdate(
        updateInfo.bundleUrl,
        (progress) => {
          notifyListeners({ ...globalState, isDownloading: true, downloadProgress: progress, updateInfo });
        }
      );

      if (success) {
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
      console.error("Update failed:", error);
      return false;
    }
  };

  // Apply the update (public function)
  const applyUpdate = useCallback(async () => {
    if (!globalState.updateInfo) {
      return false;
    }
    return applyUpdateInternal(globalState.updateInfo);
  }, []);

  // Auto check for updates when component mounts
  useEffect(() => {
    if (autoCheck && isNative && !hasCheckedRef.current && !hasPerformedInitialCheck) {
      hasCheckedRef.current = true;
      hasPerformedInitialCheck = true;
      
      // Check for updates after 3 seconds
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
