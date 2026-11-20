import { Capacitor } from "@capacitor/core";
import { APP_VERSION } from "@/config/version";
import { APP_AUDIENCE } from "@/config/appAudience";
import { setItem, removeItem, getItem } from "@/utils/nativeStorage";

export interface UpdateInfo {
  hasUpdate: boolean;
  version?: string;
  bundleUrl?: string;
  isMandatory?: boolean;
  releaseNotes?: string;
  bundleId?: string;
}

// Keys for storing update state
const APPLIED_BUNDLE_ID_KEY = "ota_applied_bundle_id";
const UPDATE_IN_PROGRESS_KEY = "ota_update_in_progress";
const LAST_UPDATE_CHECK_KEY = "ota_last_update_check";
const LAST_APPLIED_VERSION_KEY = "ota_last_applied_version";

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

// Initialize version - simply returns APP_VERSION
export const initializeVersion = async (): Promise<string> => {
  console.log("[LiveUpdate] Using APP_VERSION:", APP_VERSION);
  return APP_VERSION;
};

// Get current app version - ALWAYS returns APP_VERSION from the bundle
// The version is baked into the code during build, not stored externally
export const getCurrentVersion = (): string => {
  return APP_VERSION;
};

// Save the applied bundle ID
export const setAppliedBundleId = async (bundleId: string): Promise<void> => {
  try {
    await setItem(APPLIED_BUNDLE_ID_KEY, bundleId);
    console.log("[LiveUpdate] Saved applied bundleId:", bundleId);
  } catch (error) {
    console.error("[LiveUpdate] Error saving bundle ID:", error);
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

// Save last applied version
export const setLastAppliedVersion = async (version: string): Promise<void> => {
  try {
    await setItem(LAST_APPLIED_VERSION_KEY, version);
    console.log("[LiveUpdate] Saved last applied version:", version);
  } catch (error) {
    console.error("[LiveUpdate] Error saving last applied version:", error);
  }
};

// Get last applied version - returns the version that was last successfully applied
export const getLastAppliedVersion = async (): Promise<string | null> => {
  try {
    return await getItem(LAST_APPLIED_VERSION_KEY);
  } catch (error) {
    console.error("[LiveUpdate] Error reading last applied version:", error);
    return null;
  }
};

// Mark that an update is in progress
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

const pilotFeed = "https://raw.githubusercontent.com/Teemo9684/hamza-wasl-platform/pilot-updates";

export const checkForUpdate = async (): Promise<UpdateInfo> => {
  // Standalone apps must never consume the combined pilot OTA bundle.
  // Their feed and native update channel are enabled only after verification.
  if (APP_AUDIENCE !== "combined") {
    return { hasUpdate: false };
  }

  const response = await fetch(`${pilotFeed}/latest.json`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Pilot update check failed (${response.status})`);

  const { version } = await response.json();
  if (typeof version !== "string" || !/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error("Invalid pilot version");
  }
  const hasUpdate = compareVersions(version, APP_VERSION) > 0;
  await logUpdateCheck(APP_VERSION, version, hasUpdate ? "update_available" : "already_up_to_date");
  return hasUpdate
    ? { hasUpdate, version, bundleUrl: `${pilotFeed}/bundles/${version}.zip`, isMandatory: false }
    : { hasUpdate };
};

// Download and apply update
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
    console.log("[LiveUpdate] ====== STARTING UPDATE ======");
    console.log("[LiveUpdate] URL:", bundleUrl);
    console.log("[LiveUpdate] Target version:", version);
    console.log("[LiveUpdate] Current APP_VERSION:", APP_VERSION);
    
    // Mark update in progress
    await setUpdateInProgress(version);
    
    const { LiveUpdate } = await import("@capawesome/capacitor-live-update");

    const bundleId = `update-${version}-${Date.now()}`;
    console.log("[LiveUpdate] Bundle ID:", bundleId);

    // Simulate progress
    let lastProgress = 0;
    const progressInterval = setInterval(() => {
      if (lastProgress < 90) {
        lastProgress += 10;
        onProgress?.(lastProgress);
      }
    }, 500);

    // Download bundle
    console.log("[LiveUpdate] Downloading...");
    await LiveUpdate.downloadBundle({
      url: bundleUrl,
      bundleId: bundleId,
    });

    clearInterval(progressInterval);
    onProgress?.(95);
    console.log("[LiveUpdate] Download complete!");

    // Set as next bundle
    console.log("[LiveUpdate] Setting next bundle...");
    await LiveUpdate.setNextBundle({
      bundleId: bundleId,
    });

    // Save bundle ID and the version we're applying
    await setAppliedBundleId(bundleId);
    // حفظ الإصدار الجديد الذي تم تطبيقه
    await setLastAppliedVersion(version);

    onProgress?.(100);
    console.log("[LiveUpdate] Version", version, "saved, ready to reload...");

    // Small delay before reload
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log("[LiveUpdate] Reloading app...");
    await LiveUpdate.reload();

    return true;
  } catch (error) {
    console.error("[LiveUpdate] Update failed:", error);
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
    await setUpdateInProgress(null);
    console.log("[LiveUpdate] Bundle marked as ready");
  } catch (error) {
    console.error("[LiveUpdate] Error marking bundle as ready:", error);
  }
};

// Get current bundle info
export const getCurrentBundleInfo = async (): Promise<{ bundleId: string | null; version: string }> => {
  if (!isNativeApp()) {
    return { bundleId: null, version: APP_VERSION };
  }

  try {
    const { LiveUpdate } = await import("@capawesome/capacitor-live-update");
    const bundle = await LiveUpdate.getCurrentBundle();
    return {
      bundleId: bundle?.bundleId || null,
      version: APP_VERSION
    };
  } catch (error) {
    console.error("[LiveUpdate] Error getting current bundle:", error);
    return { bundleId: null, version: APP_VERSION };
  }
};

// Reset to default bundle
export const resetToDefaultBundle = async (): Promise<boolean> => {
  if (!isNativeApp()) return false;

  try {
    const { LiveUpdate } = await import("@capawesome/capacitor-live-update");
    await LiveUpdate.reset();
    
    await removeItem(APPLIED_BUNDLE_ID_KEY);
    await removeItem(UPDATE_IN_PROGRESS_KEY);
    await removeItem(LAST_UPDATE_CHECK_KEY);
    await removeItem(LAST_APPLIED_VERSION_KEY);
    
    console.log("[LiveUpdate] Reset to default bundle");
    return true;
  } catch (error) {
    console.error("[LiveUpdate] Error resetting bundle:", error);
    return false;
  }
};

// Sync bundle version (simplified)
export const syncBundleVersion = async (): Promise<void> => {
  if (!isNativeApp()) return;

  try {
    const { LiveUpdate } = await import("@capawesome/capacitor-live-update");
    const bundle = await LiveUpdate.getCurrentBundle();
    
    console.log("[LiveUpdate] Current bundle:", bundle?.bundleId || "default");
    console.log("[LiveUpdate] APP_VERSION:", APP_VERSION);
    
    if (!bundle?.bundleId) {
      // Running default bundle
      await removeItem(APPLIED_BUNDLE_ID_KEY);
      await removeItem(UPDATE_IN_PROGRESS_KEY);
    }
  } catch (error) {
    console.error("[LiveUpdate] Error syncing bundle:", error);
  }
};

// Get last update check log
export const getLastUpdateCheckLog = async (): Promise<object | null> => {
  try {
    const log = await getItem(LAST_UPDATE_CHECK_KEY);
    return log ? JSON.parse(log) : null;
  } catch (error) {
    console.error("[LiveUpdate] Error reading update check log:", error);
    return null;
  }
};
