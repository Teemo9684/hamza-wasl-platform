import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { APP_VERSION } from "@/config/version";

// Types for the live update system
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

// Check if we're running in a native app
export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

// Get current app version
export const getCurrentVersion = (): string => {
  return APP_VERSION;
};

// Check for available updates from the server
export const checkForUpdate = async (): Promise<UpdateInfo> => {
  try {
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

    return data as UpdateInfo;
  } catch (error) {
    console.error("Error checking for update:", error);
    return { hasUpdate: false };
  }
};

// Download and apply update using Capawesome Live Update
export const downloadAndApplyUpdate = async (
  bundleUrl: string,
  onProgress?: (progress: number) => void
): Promise<boolean> => {
  if (!isNativeApp()) {
    console.log("Live updates only work in native apps");
    return false;
  }

  try {
    // Dynamically import the live update plugin
    const { LiveUpdate } = await import("@capawesome/capacitor-live-update");

    // Generate a unique bundle ID based on timestamp
    const bundleId = `update-${Date.now()}`;

    // Download the bundle
    await LiveUpdate.downloadBundle({
      url: bundleUrl,
      bundleId: bundleId,
    });

    // Set the downloaded bundle as the next bundle to use
    await LiveUpdate.setNextBundle({
      bundleId: bundleId,
    });

    // Reload the app to apply the update
    await LiveUpdate.reload();

    return true;
  } catch (error) {
    console.error("Error downloading/applying update:", error);
    return false;
  }
};

// Get the current bundle info
export const getCurrentBundleInfo = async () => {
  if (!isNativeApp()) {
    return null;
  }

  try {
    const { LiveUpdate } = await import("@capawesome/capacitor-live-update");
    const bundle = await LiveUpdate.getCurrentBundle();
    return bundle;
  } catch (error) {
    console.error("Error getting current bundle:", error);
    return null;
  }
};

// Reset to the original bundle (shipped with the app)
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
export const getAllBundles = async () => {
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

// Storage key for tracking applied versions
const APPLIED_VERSION_KEY = "ota_applied_version";

// Get the version that was just applied (to prevent showing update notification after applying)
export const getAppliedVersion = (): string | null => {
  try {
    return localStorage.getItem(APPLIED_VERSION_KEY);
  } catch {
    return null;
  }
};

// Set the version that was just applied
export const setAppliedVersion = (version: string): void => {
  try {
    localStorage.setItem(APPLIED_VERSION_KEY, version);
  } catch (error) {
    console.error("Error saving applied version:", error);
  }
};

// Clear the applied version marker (useful for testing)
export const clearAppliedVersion = (): void => {
  try {
    localStorage.removeItem(APPLIED_VERSION_KEY);
  } catch (error) {
    console.error("Error clearing applied version:", error);
  }
};

// Create initial state for live update
export const createInitialState = (): LiveUpdateState => ({
  isChecking: false,
  isDownloading: false,
  downloadProgress: 0,
  updateInfo: null,
  error: null,
});
