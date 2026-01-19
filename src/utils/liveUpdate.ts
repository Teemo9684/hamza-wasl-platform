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

// In-memory cache for current version (to avoid async calls during comparison)
let cachedVersion: string | null = null;
let versionInitialized = false;

// Check if running in a native app
export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

// Initialize version from native storage (call this early in app startup)
export const initializeVersion = async (): Promise<string> => {
  if (!isNativeApp()) {
    cachedVersion = APP_VERSION;
    versionInitialized = true;
    return APP_VERSION;
  }

  try {
    const appliedVersion = await getItem(APPLIED_BUNDLE_VERSION_KEY);
    if (appliedVersion) {
      console.log("Loaded applied bundle version from storage:", appliedVersion);
      cachedVersion = appliedVersion;
    } else {
      console.log("No applied version found, using base APP_VERSION:", APP_VERSION);
      cachedVersion = APP_VERSION;
    }
    versionInitialized = true;
    return cachedVersion;
  } catch (error) {
    console.error("Error initializing version:", error);
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
    console.log("Saved applied bundle version:", version, "bundleId:", bundleId);
  } catch (error) {
    console.error("Error saving applied version:", error);
  }
};

// Get the applied bundle ID
export const getAppliedBundleId = async (): Promise<string | null> => {
  try {
    return await getItem(APPLIED_BUNDLE_ID_KEY);
  } catch (error) {
    console.error("Error reading applied bundle ID:", error);
    return null;
  }
};

// Mark that an update is in progress (to prevent re-downloads after reload)
export const setUpdateInProgress = async (version: string | null): Promise<void> => {
  try {
    if (version) {
      await setItem(UPDATE_IN_PROGRESS_KEY, version);
      console.log("Marked update in progress for version:", version);
    } else {
      await removeItem(UPDATE_IN_PROGRESS_KEY);
      console.log("Cleared update in progress flag");
    }
  } catch (error) {
    console.error("Error setting update in progress:", error);
  }
};

// Check if there's an update in progress
export const getUpdateInProgress = async (): Promise<string | null> => {
  try {
    return await getItem(UPDATE_IN_PROGRESS_KEY);
  } catch (error) {
    console.error("Error checking update in progress:", error);
    return null;
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
    console.log("Checking for update, current version:", currentVersion);
    
    // Check if this version was already being updated (to prevent loops)
    const updateInProgress = await getUpdateInProgress();
    if (updateInProgress === currentVersion) {
      console.log("Update to this version already completed, clearing flag");
      await setUpdateInProgress(null);
    }
    
    const { data, error } = await supabase.functions.invoke("check-app-update", {
      body: {
        currentVersion: currentVersion,
        platform: Capacitor.getPlatform(),
      },
    });

    if (error) {
      console.error("Error checking for update:", error);
      return { hasUpdate: false };
    }

    console.log("Update check response:", data);
    
    // If server says update available, check if we're not already on that version
    if (data?.hasUpdate && data?.version) {
      // Double check - if the server version matches our stored version, no update needed
      const storedVersion = await getItem(APPLIED_BUNDLE_VERSION_KEY);
      if (storedVersion === data.version) {
        console.log("Already on version", data.version, "- no update needed");
        return { hasUpdate: false };
      }
      
      // Check if we're currently updating to this version
      const inProgress = await getUpdateInProgress();
      if (inProgress === data.version) {
        console.log("Update to version", data.version, "already in progress");
        return { hasUpdate: false };
      }
    }
    
    return data as UpdateInfo;
  } catch (error) {
    console.error("Error checking for update:", error);
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
    console.log("Live updates only work in native apps");
    return false;
  }

  try {
    console.log("Starting update download from:", bundleUrl, "version:", version);
    
    // Mark update in progress FIRST
    await setUpdateInProgress(version);
    
    // Dynamically import the live update plugin
    const { LiveUpdate } = await import("@capawesome/capacitor-live-update");

    // Generate a unique bundle ID based on version and timestamp
    const bundleId = `update-${version}-${Date.now()}`;

    // Track download progress
    let lastProgress = 0;
    const progressInterval = setInterval(() => {
      if (lastProgress < 90) {
        lastProgress += 10;
        onProgress?.(lastProgress);
      }
    }, 500);

    // Download the bundle
    console.log("Downloading bundle with ID:", bundleId);
    await LiveUpdate.downloadBundle({
      url: bundleUrl,
      bundleId: bundleId,
    });

    clearInterval(progressInterval);
    onProgress?.(95);

    console.log("Bundle downloaded, setting as next bundle...");
    
    // Set the downloaded bundle as the next bundle to use
    await LiveUpdate.setNextBundle({
      bundleId: bundleId,
    });

    // Save the version BEFORE reload using native storage
    await setAppliedBundleVersion(version, bundleId);

    onProgress?.(100);
    console.log("Bundle set, version saved, reloading app...");

    // Small delay before reload to ensure everything is saved
    await new Promise(resolve => setTimeout(resolve, 500));

    // Reload the app to apply the update
    await LiveUpdate.reload();

    return true;
  } catch (error) {
    console.error("Error downloading/applying update:", error);
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
    
    console.log("Bundle marked as ready - rollback prevention enabled");
  } catch (error) {
    console.error("Error marking bundle as ready:", error);
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
    console.error("Error getting current bundle:", error);
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
    
    // Reset cached version
    cachedVersion = APP_VERSION;
    
    console.log("Reset to default bundle");
    return true;
  } catch (error) {
    console.error("Error resetting bundle:", error);
    return false;
  }
};

// Sync bundle version with actual bundle (for recovery)
export const syncBundleVersion = async (): Promise<void> => {
  if (!isNativeApp()) return;

  try {
    const { LiveUpdate } = await import("@capawesome/capacitor-live-update");
    const bundle = await LiveUpdate.getCurrentBundle();
    
    if (!bundle?.bundleId) {
      // Running default bundle, clear any stored version
      await removeItem(APPLIED_BUNDLE_VERSION_KEY);
      await removeItem(APPLIED_BUNDLE_ID_KEY);
      await removeItem(UPDATE_IN_PROGRESS_KEY);
      cachedVersion = APP_VERSION;
      console.log("Synced: Running default bundle, version:", APP_VERSION);
    } else {
      // We have a bundle - read version from storage
      const storedVersion = await getItem(APPLIED_BUNDLE_VERSION_KEY);
      const storedBundleId = await getItem(APPLIED_BUNDLE_ID_KEY);
      
      if (storedVersion) {
        cachedVersion = storedVersion;
        console.log("Synced: Running bundle", bundle.bundleId, "version:", storedVersion);
      }
      
      // If bundle ID matches, clear update in progress
      if (storedBundleId === bundle.bundleId) {
        await setUpdateInProgress(null);
      }
    }
    
    versionInitialized = true;
  } catch (error) {
    console.error("Error syncing bundle version:", error);
  }
};
