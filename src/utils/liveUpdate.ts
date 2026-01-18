import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { APP_VERSION } from "@/config/version";

// Update information from server
export interface UpdateInfo {
  hasUpdate: boolean;
  version?: string;
  bundleUrl?: string;
  isMandatory?: boolean;
  releaseNotes?: string;
}

// Live update state
export interface LiveUpdateState {
  isChecking: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  updateInfo: UpdateInfo | null;
  error: string | null;
}

// Check if running in native app
export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

// Get current app version
export const getCurrentVersion = (): string => {
  return APP_VERSION;
};

// Check for updates
export const checkForUpdate = async (): Promise<UpdateInfo> => {
  try {
    console.log("Checking for update, current version:", getCurrentVersion());
    
    const { data, error } = await supabase.functions.invoke("check-app-update", {
      body: {
        currentVersion: getCurrentVersion(),
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

// Download and apply update with progress callback
export const downloadAndApplyUpdate = async (
  bundleUrl: string,
  onProgress?: (progress: number) => void
): Promise<boolean> => {
  if (!isNativeApp()) {
    console.log("Live updates only work in native apps");
    return false;
  }

  try {
    console.log("Starting update download from:", bundleUrl);
    
    // Dynamically import the live update plugin
    const { LiveUpdate } = await import("@capawesome/capacitor-live-update");

    // Generate a unique bundle ID based on timestamp
    const bundleId = `update-${Date.now()}`;

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

    onProgress?.(100);
    console.log("Bundle set, reloading app...");

    // Small delay before reload to ensure UI updates
    await new Promise(resolve => setTimeout(resolve, 500));

    // Reload the app to apply the update
    await LiveUpdate.reload();

    return true;
  } catch (error) {
    console.error("Error downloading/applying update:", error);
    return false;
  }
};

// Get current bundle info
export const getCurrentBundleInfo = async (): Promise<any | null> => {
  if (!isNativeApp()) {
    return null;
  }

  try {
    const { LiveUpdate } = await import("@capawesome/capacitor-live-update");
    const result = await LiveUpdate.getCurrentBundle();
    return result;
  } catch (error) {
    console.error("Error getting bundle info:", error);
    return null;
  }
};

// Mark bundle as ready - prevents rollback to previous version
export const markBundleAsReady = async (): Promise<boolean> => {
  if (!isNativeApp()) {
    return false;
  }

  try {
    const { LiveUpdate } = await import("@capawesome/capacitor-live-update");
    await LiveUpdate.ready();
    console.log("Bundle marked as ready - update confirmed");
    return true;
  } catch (error) {
    console.error("Error marking bundle as ready:", error);
    return false;
  }
};

// Reset to the original bundle (factory reset)
export const resetToOriginalBundle = async (): Promise<boolean> => {
  if (!isNativeApp()) {
    return false;
  }

  try {
    const { LiveUpdate } = await import("@capawesome/capacitor-live-update");
    await LiveUpdate.reset();
    await LiveUpdate.reload();
    return true;
  } catch (error) {
    console.error("Error resetting to original bundle:", error);
    return false;
  }
};

// Delete a specific bundle
export const deleteBundle = async (bundleId: string): Promise<boolean> => {
  if (!isNativeApp()) {
    return false;
  }

  try {
    const { LiveUpdate } = await import("@capawesome/capacitor-live-update");
    await LiveUpdate.deleteBundle({ bundleId });
    return true;
  } catch (error) {
    console.error("Error deleting bundle:", error);
    return false;
  }
};

// Get all downloaded bundles
export const getAllBundles = async (): Promise<string[]> => {
  if (!isNativeApp()) {
    return [];
  }

  try {
    const { LiveUpdate } = await import("@capawesome/capacitor-live-update");
    const result = await LiveUpdate.getBundles();
    return result.bundleIds || [];
  } catch (error) {
    console.error("Error getting bundles:", error);
    return [];
  }
};

// Create initial state
export const createInitialState = (): LiveUpdateState => ({
  isChecking: false,
  isDownloading: false,
  downloadProgress: 0,
  updateInfo: null,
  error: null,
});
