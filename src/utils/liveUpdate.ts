import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { APP_VERSION } from "@/config/version";

export interface UpdateInfo {
  hasUpdate: boolean;
  version?: string;
  bundleUrl?: string;
  isMandatory?: boolean;
  releaseNotes?: string;
  bundleId?: string;
}

// Key for storing the current applied bundle version
const APPLIED_BUNDLE_VERSION_KEY = "ota_applied_bundle_version";
const APPLIED_BUNDLE_ID_KEY = "ota_applied_bundle_id";

// Check if running in a native app
export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

// Get current app version - prioritize the applied bundle version over the base APP_VERSION
export const getCurrentVersion = (): string => {
  try {
    const appliedVersion = localStorage.getItem(APPLIED_BUNDLE_VERSION_KEY);
    if (appliedVersion) {
      console.log("Using applied bundle version:", appliedVersion);
      return appliedVersion;
    }
  } catch (error) {
    console.error("Error reading applied version:", error);
  }
  console.log("Using base APP_VERSION:", APP_VERSION);
  return APP_VERSION;
};

// Save the applied bundle version
export const setAppliedBundleVersion = (version: string, bundleId?: string): void => {
  try {
    localStorage.setItem(APPLIED_BUNDLE_VERSION_KEY, version);
    if (bundleId) {
      localStorage.setItem(APPLIED_BUNDLE_ID_KEY, bundleId);
    }
    console.log("Saved applied bundle version:", version);
  } catch (error) {
    console.error("Error saving applied version:", error);
  }
};

// Get the applied bundle ID
export const getAppliedBundleId = (): string | null => {
  try {
    return localStorage.getItem(APPLIED_BUNDLE_ID_KEY);
  } catch (error) {
    console.error("Error reading applied bundle ID:", error);
    return null;
  }
};

// Check for updates
export const checkForUpdate = async (): Promise<UpdateInfo> => {
  try {
    const currentVersion = getCurrentVersion();
    console.log("Checking for update, current version:", currentVersion);
    
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

    // Save the version BEFORE reload so we know what version we're running after restart
    setAppliedBundleVersion(version, bundleId);

    onProgress?.(100);
    console.log("Bundle set, version saved, reloading app...");

    // Small delay before reload to ensure everything is saved
    await new Promise(resolve => setTimeout(resolve, 500));

    // Reload the app to apply the update
    await LiveUpdate.reload();

    return true;
  } catch (error) {
    console.error("Error downloading/applying update:", error);
    return false;
  }
};

// Mark bundle as ready to prevent rollback
export const markBundleAsReady = async (): Promise<void> => {
  if (!isNativeApp()) return;

  try {
    const { LiveUpdate } = await import("@capawesome/capacitor-live-update");
    await LiveUpdate.ready();
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
    
    // Clear the stored applied version
    localStorage.removeItem(APPLIED_BUNDLE_VERSION_KEY);
    localStorage.removeItem(APPLIED_BUNDLE_ID_KEY);
    
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
      localStorage.removeItem(APPLIED_BUNDLE_VERSION_KEY);
      localStorage.removeItem(APPLIED_BUNDLE_ID_KEY);
      console.log("Synced: Running default bundle");
    } else {
      // We have a bundle, make sure we have the version stored
      const storedBundleId = getAppliedBundleId();
      if (storedBundleId !== bundle.bundleId) {
        console.log("Bundle ID mismatch detected, version may be out of sync");
      }
    }
  } catch (error) {
    console.error("Error syncing bundle version:", error);
  }
};
