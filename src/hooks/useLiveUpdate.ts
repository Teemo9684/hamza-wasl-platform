import { useState, useEffect, useCallback, useRef } from "react";
import {
  isNativeApp,
  checkForUpdate,
  downloadAndApplyUpdate,
  getCurrentVersion,
  createInitialState,
} from "@/utils/liveUpdate";
import { toast } from "@/hooks/use-toast";
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
let silentUpdateInProgress = false;
const listeners = new Set<(state: LiveUpdateState) => void>();

// Storage key for tracking the last applied version
const APPLIED_VERSION_KEY = "ota_applied_version";

const getAppliedVersion = (): string | null => {
  try {
    return localStorage.getItem(APPLIED_VERSION_KEY);
  } catch {
    return null;
  }
};

const setAppliedVersion = (version: string): void => {
  try {
    localStorage.setItem(APPLIED_VERSION_KEY, version);
  } catch (error) {
    console.error("Error saving applied version:", error);
  }
};

const notifyListeners = (newState: LiveUpdateState) => {
  globalState = newState;
  listeners.forEach((listener) => listener(newState));
};

/**
 * Performs a silent background update without user interaction
 * Downloads and applies the update automatically, then reloads the app
 */
const performSilentUpdate = async (bundleUrl: string, version: string): Promise<boolean> => {
  if (silentUpdateInProgress) {
    console.log("Silent update already in progress");
    return false;
  }

  silentUpdateInProgress = true;
  console.log(`Starting silent update to version ${version}...`);

  // Show notification to user
  toast({
    title: "🔄 جاري تحديث التطبيق",
    description: `يتم تحميل الإصدار ${version} في الخلفية...`,
    duration: 5000,
  });

  try {
    // Save the version BEFORE applying to prevent re-download after reload
    setAppliedVersion(version);

    const success = await downloadAndApplyUpdate(bundleUrl);

    if (success) {
      console.log("Silent update applied successfully, app will reload");
      toast({
        title: "✅ تم التحديث بنجاح",
        description: "سيتم إعادة تشغيل التطبيق الآن...",
        duration: 2000,
      });
      // The downloadAndApplyUpdate function already calls reload
      return true;
    } else {
      console.error("Silent update failed");
      silentUpdateInProgress = false;
      return false;
    }
  } catch (error) {
    console.error("Silent update error:", error);
    silentUpdateInProgress = false;
    return false;
  }
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

  // Check for updates and apply silently in background
  const checkUpdate = useCallback(async () => {
    if (!isNative) {
      console.log("Not a native app, skipping update check");
      return;
    }

    // Prevent multiple simultaneous checks
    if (globalUpdateCheckInProgress || silentUpdateInProgress) {
      console.log("Update check or silent update already in progress, skipping");
      return;
    }

    globalUpdateCheckInProgress = true;
    notifyListeners({ ...globalState, isChecking: true, error: null });

    try {
      const updateInfo = await checkForUpdate();
      
      // Check if we already applied this version
      const appliedVersion = getAppliedVersion();
      if (updateInfo.hasUpdate && updateInfo.version === appliedVersion) {
        console.log("Already applied this version, skipping");
        notifyListeners({ ...globalState, isChecking: false, updateInfo: null });
        globalUpdateCheckInProgress = false;
        return { hasUpdate: false };
      }

      notifyListeners({ ...globalState, isChecking: false, updateInfo });
      globalUpdateCheckInProgress = false;

      // If update is available, apply it silently in background
      if (updateInfo.hasUpdate && updateInfo.bundleUrl && updateInfo.version) {
        console.log(`Update available: ${updateInfo.version}, applying silently...`);
        performSilentUpdate(updateInfo.bundleUrl, updateInfo.version);
      }

      return updateInfo;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "فشل التحقق من التحديثات";
      notifyListeners({ ...globalState, isChecking: false, error: errorMessage });
      globalUpdateCheckInProgress = false;
      console.error("Update check failed:", error);
    }
  }, [isNative]);

  // Manual apply update (kept for compatibility, but auto-update is default now)
  const applyUpdate = useCallback(async () => {
    if (!globalState.updateInfo?.bundleUrl) {
      return false;
    }

    const version = globalState.updateInfo.version || "";
    
    // Save the version BEFORE starting download/apply
    if (version) {
      setAppliedVersion(version);
    }

    notifyListeners({ ...globalState, isDownloading: true, downloadProgress: 0 });

    try {
      const success = await downloadAndApplyUpdate(
        globalState.updateInfo.bundleUrl,
        (progress) => {
          notifyListeners({ ...globalState, isDownloading: true, downloadProgress: progress });
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
  }, []);

  // Auto-check for updates on mount - only once globally
  useEffect(() => {
    if (autoCheck && isNative && !hasCheckedRef.current && !hasPerformedInitialCheck) {
      hasCheckedRef.current = true;
      hasPerformedInitialCheck = true;
      // Check for updates after app fully loads
      const timer = setTimeout(() => {
        checkUpdate();
      }, 5000);

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
