import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { APP_VERSION } from "@/config/version";
import { getItem, setItem, removeItem } from "@/utils/nativeStorage";

export interface UpdateInfo {
  hasUpdate: boolean;
  version?: string;
  bundleUrl?: string;
  isMandatory?: boolean;
  releaseNotes?: string;
  bundleId?: string;
}

// Keys for storing update state using native storage
const APPLIED_BUNDLE_VERSION_KEY = "ota_applied_bundle_version";
const APPLIED_BUNDLE_ID_KEY = "ota_applied_bundle_id";
const UPDATE_IN_PROGRESS_KEY = "ota_update_in_progress";
const LAST_UPDATE_CHECK_KEY = "ota_last_update_check";

// In-memory cache for current version (to avoid async calls during comparison)
let cachedVersion: string | null = null;
let versionInitialized = false;

// Check if running in a native app
export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

// Compare semantic versions: returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
export const compareVersions = (v1: string, v2: string): number => {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0;
};

// Initialize version from native storage (call this early in app startup)
export const initializeVersion = async (): Promise<string> => {
  if (!isNativeApp()) {
    cachedVersion = APP_VERSION;
    versionInitialized = true;
    console.log("[LiveUpdate] Web platform, using APP_VERSION:", APP_VERSION);
    return APP_VERSION;
  }

  try {
    const appliedVersion = await getItem(APPLIED_BUNDLE_VERSION_KEY);
    if (appliedVersion) {
      console.log("[LiveUpdate] Loaded applied bundle version from storage:", appliedVersion);
      cachedVersion = appliedVersion;
    } else {
      console.log("[LiveUpdate] No applied version found, using base APP_VERSION:", APP_VERSION);
      cachedVersion = APP_VERSION;
    }
    versionInitialized = true;
    return cachedVersion;
  } catch (error) {
    console.error("[LiveUpdate] Error initializing version:", error);
    cachedVersion = APP_VERSION;
    versionInitialized = true;
    return APP_VERSION;
  }
};

// Get current app version (sync, uses cached value)
export const getCurrentVersion = (): string => {
  if (cachedVersion) {
    return cachedVersion;
  }
  return APP_VERSION;
};

// Save the applied bundle version using native storage
export const setAppliedBundleVersion = async (version: string, bundleId?: string): Promise<void> => {
  try {
    await setItem(APPLIED_BUNDLE_VERSION_KEY, version);
    if (bundleId) {
      await setItem(APPLIED_BUNDLE_ID_KEY, bundleId);
    }
    // Update cached version immediately
    cachedVersion = version;
    console.log("[LiveUpdate] Saved applied bundle version:", version, "bundleId:", bundleId);
  } catch (error) {
    console.error("[LiveUpdate] Error saving applied version:", error);
  }
};

// Get the applied bundle ID
export const getAppliedBundleId = async (): Promise<string | null> => {
  try {
    return await getItem(APPLIED_BUNDLE_ID_KEY);
  } catch (error) {
    console.error("[LiveUpdate] Error reading applied bundle ID:", error);
    return null;
  }
};

// Mark that an update is in progress (to prevent re-downloads after reload)
export const setUpdateInProgress = async (version: string | null): Promise<void> => {
  try {
    if (version) {
      await setItem(UPDATE_IN_PROGRESS_KEY, version);
      console.log("[LiveUpdate] Marked update in progress for version:", version);
    } else {
      await removeItem(UPDATE_IN_PROGRESS_KEY);
      console.log("[LiveUpdate] Cleared update in progress flag");
    }
  } catch (error) {
    console.error("[LiveUpdate] Error setting update in progress:", error);
  }
};

// Check if there's an update in progress
export const getUpdateInProgress = async (): Promise<string | null> => {
  try {
    return await getItem(UPDATE_IN_PROGRESS_KEY);
  } catch (error) {
    console.error("[LiveUpdate] Error checking update in progress:", error);
    return null;
  }
};

// Log update check for debugging
const logUpdateCheck = async (version: string, serverVersion: string | undefined, result: string): Promise<void> => {
  try {
    const checkLog = {
      timestamp: new Date().toISOString(),
      currentVersion: version,
      serverVersion: serverVersion || 'N/A',
      result: result
    };
    await setItem(LAST_UPDATE_CHECK_KEY, JSON.stringify(checkLog));
    console.log("[LiveUpdate] Check logged:", checkLog);
  } catch (e) {
    console.error("[LiveUpdate] Failed to log update check:", e);
  }
};

// Check for updates
export const checkForUpdate = async (): Promise<UpdateInfo> => {
  try {
    // Make sure version is initialized
    if (!versionInitialized) {
      await initializeVersion();
    }

    const currentVersion = getCurrentVersion();
    console.log("[LiveUpdate] ====== UPDATE CHECK START ======");
    console.log("[LiveUpdate] Current version:", currentVersion);
    console.log("[LiveUpdate] APP_VERSION (base):", APP_VERSION);
    console.log("[LiveUpdate] Platform:", Capacitor.getPlatform());
    
    // Check if this version was already being updated (to prevent loops)
    const updateInProgress = await getUpdateInProgress();
    console.log("[LiveUpdate] Update in progress:", updateInProgress);
    
    if (updateInProgress) {
      // Check if the in-progress version matches current - means update completed
      const storedVersion = await getItem(APPLIED_BUNDLE_VERSION_KEY);
      if (storedVersion === updateInProgress) {
        console.log("[LiveUpdate] Update to", updateInProgress, "completed, clearing flag");
        await setUpdateInProgress(null);
      }
    }
    
    console.log("[LiveUpdate] Calling check-app-update function...");
    const { data, error } = await supabase.functions.invoke("check-app-update", {
      body: {
        currentVersion: currentVersion,
        platform: Capacitor.getPlatform(),
      },
    });

    if (error) {
      console.error("[LiveUpdate] Error from edge function:", error);
      await logUpdateCheck(currentVersion, undefined, "error: " + error.message);
      return { hasUpdate: false };
    }

    console.log("[LiveUpdate] Server response:", JSON.stringify(data));
    
    // If server says update available
    if (data?.hasUpdate && data?.version && data?.bundleUrl) {
      console.log("[LiveUpdate] Server indicates update available to version:", data.version);
      
      // Use semantic version comparison
      const comparison = compareVersions(data.version, currentVersion);
      console.log("[LiveUpdate] Version comparison result:", comparison, "(1=newer, 0=same, -1=older)");
      
      if (comparison <= 0) {
        console.log("[LiveUpdate] Already on version", currentVersion, "which is >= server version", data.version);
        await logUpdateCheck(currentVersion, data.version, "already_up_to_date");
        return { hasUpdate: false };
      }
      
      // Double check - if the server version matches our stored version, no update needed
      const storedVersion = await getItem(APPLIED_BUNDLE_VERSION_KEY);
      console.log("[LiveUpdate] Stored version:", storedVersion);
      
      if (storedVersion === data.version) {
        console.log("[LiveUpdate] Already on version", data.version, "- no update needed");
        await logUpdateCheck(currentVersion, data.version, "already_applied");
        return { hasUpdate: false };
      }
      
      // Check if we're currently updating to this version
      const inProgress = await getUpdateInProgress();
      if (inProgress === data.version) {
        console.log("[LiveUpdate] Update to version", data.version, "already in progress");
        await logUpdateCheck(currentVersion, data.version, "in_progress");
        return { hasUpdate: false };
      }
      
      console.log("[LiveUpdate] ✅ UPDATE AVAILABLE:", data.version);
      await logUpdateCheck(currentVersion, data.version, "update_available");
      return data as UpdateInfo;
    }
    
    console.log("[LiveUpdate] No update available from server");
    await logUpdateCheck(currentVersion, data?.version, "no_update");
    console.log("[LiveUpdate] ====== UPDATE CHECK END ======");
    return { hasUpdate: false };
  } catch (error) {
    console.error("[LiveUpdate] Error checking for update:", error);
    return { hasUpdate: false };
  }
};

// Download and apply update with progress tracking
export const downloadAndApplyUpdate = async (
  bundleUrl: string,
  version: string,
  onProgress?: (progress: number) => void
): Promise<boolean> => {
  if (!isNativeApp()) {
    console.log("[LiveUpdate] Live updates only work in native apps");
    return false;
  }

  try {
    console.log("[LiveUpdate] ====== STARTING UPDATE DOWNLOAD ======");
    console.log("[LiveUpdate] URL:", bundleUrl);
    console.log("[LiveUpdate] Version:", version);
    
    // Mark update in progress FIRST
    await setUpdateInProgress(version);
    
    // Dynamically import the live update plugin
    const { LiveUpdate } = await import("@capawesome/capacitor-live-update");

    // Generate a unique bundle ID based on version and timestamp
    const bundleId = `update-${version}-${Date.now()}`;
    console.log("[LiveUpdate] Generated bundle ID:", bundleId);

    // Track download progress
    let lastProgress = 0;
    const progressInterval = setInterval(() => {
      if (lastProgress < 90) {
        lastProgress += 10;
        onProgress?.(lastProgress);
      }
    }, 500);

    // Download the bundle
    console.log("[LiveUpdate] Starting download...");
    await LiveUpdate.downloadBundle({
      url: bundleUrl,
      bundleId: bundleId,
    });

    clearInterval(progressInterval);
    onProgress?.(95);
    console.log("[LiveUpdate] Download complete!");

    // Set the downloaded bundle as the next bundle to use
    console.log("[LiveUpdate] Setting next bundle...");
    await LiveUpdate.setNextBundle({
      bundleId: bundleId,
    });

    // Save the version BEFORE reload using native storage
    await setAppliedBundleVersion(version, bundleId);

    onProgress?.(100);
    console.log("[LiveUpdate] Bundle set, version saved. Preparing to reload...");

    // Small delay before reload to ensure everything is saved
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log("[LiveUpdate] Reloading app...");
    // Reload the app to apply the update
    await LiveUpdate.reload();

    return true;
  } catch (error) {
    console.error("[LiveUpdate] Error downloading/applying update:", error);
    // Clear update in progress on failure
    await setUpdateInProgress(null);
    return false;
  }
};

// Mark bundle as ready to prevent rollback
export const markBundleAsReady = async (): Promise<void> => {
  if (!isNativeApp()) return;

  try {
    const { LiveUpdate } = await import("@capawesome/capacitor-live-update");
    await LiveUpdate.ready();
    
    // Clear update in progress flag after successful ready
    await setUpdateInProgress(null);
    
    console.log("[LiveUpdate] Bundle marked as ready - rollback prevention enabled");
  } catch (error) {
    console.error("[LiveUpdate] Error marking bundle as ready:", error);
  }
};

// Get current bundle info
export const getCurrentBundleInfo = async (): Promise<{ bundleId: string | null; version: string }> => {
  if (!isNativeApp()) {
    return { bundleId: null, version: getCurrentVersion() };
  }

  try {
    const { LiveUpdate } = await import("@capawesome/capacitor-live-update");
    const bundle = await LiveUpdate.getCurrentBundle();
    return {
      bundleId: bundle?.bundleId || null,
      version: getCurrentVersion()
    };
  } catch (error) {
    console.error("[LiveUpdate] Error getting current bundle:", error);
    return { bundleId: null, version: getCurrentVersion() };
  }
};

// Reset to default bundle (for troubleshooting)
export const resetToDefaultBundle = async (): Promise<boolean> => {
  if (!isNativeApp()) return false;

  try {
    const { LiveUpdate } = await import("@capawesome/capacitor-live-update");
    await LiveUpdate.reset();
    
    // Clear the stored applied version using native storage
    await removeItem(APPLIED_BUNDLE_VERSION_KEY);
    await removeItem(APPLIED_BUNDLE_ID_KEY);
    await removeItem(UPDATE_IN_PROGRESS_KEY);
    await removeItem(LAST_UPDATE_CHECK_KEY);
    
    // Reset cached version
    cachedVersion = APP_VERSION;
    
    console.log("[LiveUpdate] Reset to default bundle");
    return true;
  } catch (error) {
    console.error("[LiveUpdate] Error resetting bundle:", error);
    return false;
  }
};

// Sync bundle version with actual bundle (for recovery)
export const syncBundleVersion = async (): Promise<void> => {
  if (!isNativeApp()) return;

  try {
    const { LiveUpdate } = await import("@capawesome/capacitor-live-update");
    const bundle = await LiveUpdate.getCurrentBundle();
    
    console.log("[LiveUpdate] Syncing bundle version, current bundle:", bundle?.bundleId);
    
    if (!bundle?.bundleId) {
      // Running default bundle, clear any stored version
      await removeItem(APPLIED_BUNDLE_VERSION_KEY);
      await removeItem(APPLIED_BUNDLE_ID_KEY);
      await removeItem(UPDATE_IN_PROGRESS_KEY);
      cachedVersion = APP_VERSION;
      console.log("[LiveUpdate] Synced: Running default bundle, version:", APP_VERSION);
    } else {
      // We have a bundle - read version from storage
      const storedVersion = await getItem(APPLIED_BUNDLE_VERSION_KEY);
      const storedBundleId = await getItem(APPLIED_BUNDLE_ID_KEY);
      
      console.log("[LiveUpdate] Stored version:", storedVersion, "Stored bundleId:", storedBundleId);
      
      if (storedVersion) {
        cachedVersion = storedVersion;
        console.log("[LiveUpdate] Synced: Running bundle", bundle.bundleId, "version:", storedVersion);
      }
      
      // If bundle ID matches, clear update in progress
      if (storedBundleId === bundle.bundleId) {
        await setUpdateInProgress(null);
      }
    }
    
    versionInitialized = true;
  } catch (error) {
    console.error("[LiveUpdate] Error syncing bundle version:", error);
  }
};

// Get last update check log (for debugging)
export const getLastUpdateCheckLog = async (): Promise<object | null> => {
  try {
    const log = await getItem(LAST_UPDATE_CHECK_KEY);
    return log ? JSON.parse(log) : null;
  } catch (error) {
    console.error("[LiveUpdate] Error reading update check log:", error);
    return null;
  }
};
