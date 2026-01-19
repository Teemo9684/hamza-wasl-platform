import { useState, useEffect, useCallback } from "react";
import {
  isNativeApp,
  checkForUpdate,
  downloadAndApplyUpdate,
  getCurrentVersion,
  syncBundleVersion,
  initializeVersion,
  type UpdateInfo,
} from "@/utils/liveUpdate";
import { getItem, setItem, removeItem } from "@/utils/nativeStorage";

// Keys for native storage
const PENDING_UPDATE_KEY = "ota_pending_update";
const UPDATE_APPLIED_KEY = "ota_update_applied";

// Store pending update info to show message after reload
export const setPendingUpdate = async (updateInfo: UpdateInfo): Promise<void> => {
  try {
    await setItem(PENDING_UPDATE_KEY, JSON.stringify({
      version: updateInfo.version,
      releaseNotes: updateInfo.releaseNotes,
      appliedAt: Date.now()
    }));
    console.log("Pending update saved:", updateInfo.version);
  } catch (error) {
    console.error("Error saving pending update:", error);
  }
};

// Get pending update info
export const getPendingUpdate = async (): Promise<{ version: string; releaseNotes?: string; appliedAt: number } | null> => {
  try {
    const data = await getItem(PENDING_UPDATE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error reading pending update:", error);
    return null;
  }
};

// Convert pending update to applied (called after app restart)
export const checkAndConvertPendingUpdate = async (): Promise<void> => {
  try {
    const pendingData = await getItem(PENDING_UPDATE_KEY);
    if (pendingData) {
      const pending = JSON.parse(pendingData);
      await setItem(UPDATE_APPLIED_KEY, JSON.stringify({
        ...pending,
        appliedAt: Date.now()
      }));
      await removeItem(PENDING_UPDATE_KEY);
      console.log("Converted pending update to applied:", pending.version);
    }
  } catch (error) {
    console.error("Error checking pending update:", error);
  }
};

// Get applied update info (for showing success message)
export const getAppliedUpdate = async (): Promise<{ version: string; releaseNotes?: string; appliedAt: number } | null> => {
  try {
    const data = await getItem(UPDATE_APPLIED_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error reading applied update:", error);
    return null;
  }
};

// Clear applied update (after showing message)
export const clearAppliedUpdate = async (): Promise<void> => {
  try {
    await removeItem(UPDATE_APPLIED_KEY);
  } catch (error) {
    console.error("Error clearing applied update:", error);
  }
};

// Global state for update checking (prevent multiple checks)
interface UpdateState {
  isChecking: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  error: string | null;
  updateInfo: UpdateInfo | null;
}

let globalState: UpdateState = {
  isChecking: false,
  isDownloading: false,
  downloadProgress: 0,
  error: null,
  updateInfo: null,
};

let globalUpdateCheckInProgress = false;
let versionInitialized = false;

const listeners: Set<(state: UpdateState) => void> = new Set();

const notifyListeners = (newState: UpdateState) => {
  globalState = newState;
  listeners.forEach((listener) => listener(newState));
};

export const useLiveUpdate = (autoCheck: boolean = false) => {
  const [state, setState] = useState<UpdateState>(globalState);
  const [currentVersion, setCurrentVersion] = useState<string>(getCurrentVersion());
  const isNative = isNativeApp();

  // Subscribe to global state changes
  useEffect(() => {
    const handleStateChange = (newState: UpdateState) => {
      setState(newState);
    };

    listeners.add(handleStateChange);
    return () => {
      listeners.delete(handleStateChange);
    };
  }, []);

  // Initialize version on mount
  useEffect(() => {
    if (isNative && !versionInitialized) {
      const init = async () => {
        await initializeVersion();
        await syncBundleVersion();
        setCurrentVersion(getCurrentVersion());
        versionInitialized = true;
        console.log("Live update initialized, version:", getCurrentVersion());
      };
      init();
    }
  }, [isNative]);

  // Apply update
  const applyUpdateInternal = useCallback(async (updateInfo: UpdateInfo): Promise<boolean> => {
    if (!updateInfo.bundleUrl || !updateInfo.version) {
      console.error("Missing bundleUrl or version in updateInfo");
      return false;
    }

    notifyListeners({ ...globalState, isDownloading: true, downloadProgress: 0 });

    try {
      // Save pending update info BEFORE applying
      await setPendingUpdate(updateInfo);

      const success = await downloadAndApplyUpdate(
        updateInfo.bundleUrl,
        updateInfo.version,
        (progress) => {
          notifyListeners({ ...globalState, isDownloading: true, downloadProgress: progress });
        }
      );

      if (!success) {
        // Clear pending if failed
        await removeItem(PENDING_UPDATE_KEY);
        notifyListeners({ ...globalState, isDownloading: false, downloadProgress: 0, error: "فشل تطبيق التحديث" });
      }

      return success;
    } catch (error) {
      console.error("Error applying update:", error);
      await removeItem(PENDING_UPDATE_KEY);
      notifyListeners({ 
        ...globalState, 
        isDownloading: false, 
        downloadProgress: 0, 
        error: error instanceof Error ? error.message : "فشل تطبيق التحديث" 
      });
      return false;
    }
  }, []);

  // Check for update
  const checkUpdate = useCallback(async (): Promise<UpdateInfo | undefined> => {
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

      if (updateInfo.hasUpdate && updateInfo.bundleUrl && updateInfo.version) {
        console.log("Update available! Version:", updateInfo.version, "Starting automatic download...");
        notifyListeners({ ...globalState, isChecking: false, updateInfo });
        globalUpdateCheckInProgress = false;
        
        // Auto apply update immediately
        await applyUpdateInternal(updateInfo);
        return updateInfo;
      } else {
        console.log("No update available or already on latest version:", getCurrentVersion());
      }

      notifyListeners({ ...globalState, isChecking: false, updateInfo: null });
      globalUpdateCheckInProgress = false;

      return updateInfo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "فشل التحقق من التحديثات";
      notifyListeners({ ...globalState, isChecking: false, error: errorMessage });
      globalUpdateCheckInProgress = false;
      console.error("Update check failed:", error);
    }
  }, [isNative, applyUpdateInternal]);

  // Initial check on mount if autoCheck is enabled
  useEffect(() => {
    if (isNative && autoCheck && !globalUpdateCheckInProgress && versionInitialized) {
      // Delay initial check to allow app to fully load
      const timer = setTimeout(() => {
        checkUpdate();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isNative, autoCheck, checkUpdate]);

  return {
    ...state,
    checkUpdate,
    isNativeApp: isNative,
    currentVersion,
  };
};
