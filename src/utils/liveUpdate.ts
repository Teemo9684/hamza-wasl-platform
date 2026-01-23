import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { APP_VERSION } from "@/config/version";
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

// Check for updates - يقارن مع السيرفر بشكل ذكي
// يستخدم bundle_id المخزن محلياً أو APP_VERSION للمقارنة
export const checkForUpdate = async (): Promise<UpdateInfo> => {
  try {
    // الحصول على الإصدار المُطبق محلياً
    const lastAppliedVersion = await getLastAppliedVersion();
    // استخدام الإصدار المُطبق إذا وجد، وإلا استخدام APP_VERSION
    const effectiveVersion = lastAppliedVersion || APP_VERSION;
    
    console.log("[LiveUpdate] ====== UPDATE CHECK START ======");
    console.log("[LiveUpdate] APP_VERSION (baked in):", APP_VERSION);
    console.log("[LiveUpdate] Last applied version:", lastAppliedVersion || "none");
    console.log("[LiveUpdate] Effective version for check:", effectiveVersion);
    console.log("[LiveUpdate] Platform:", Capacitor.getPlatform());
    
    // Check if update is already in progress
    const updateInProgress = await getUpdateInProgress();
    if (updateInProgress) {
      // If the in-progress version matches last applied, update was completed
      if (updateInProgress === lastAppliedVersion) {
        console.log("[LiveUpdate] Update to", lastAppliedVersion, "completed");
        await setUpdateInProgress(null);
      } else {
        console.log("[LiveUpdate] Update to", updateInProgress, "still in progress");
      }
    }
    
    console.log("[LiveUpdate] Calling check-app-update function...");
    const { data, error } = await supabase.functions.invoke("check-app-update", {
      body: {
        currentVersion: effectiveVersion,
        platform: Capacitor.getPlatform(),
      },
    });

    if (error) {
      console.error("[LiveUpdate] Error from edge function:", error);
      await logUpdateCheck(effectiveVersion, undefined, "error: " + error.message);
      return { hasUpdate: false };
    }

    console.log("[LiveUpdate] Server response:", JSON.stringify(data));
    
    // Check if server indicates update available
    if (data?.hasUpdate && data?.version && data?.bundleUrl) {
      console.log("[LiveUpdate] Server indicates update to version:", data.version);
      
      // Compare versions: server version must be GREATER than effective version
      const comparison = compareVersions(data.version, effectiveVersion);
      console.log("[LiveUpdate] Comparison:", data.version, "vs", effectiveVersion, "=", comparison);
      
      if (comparison <= 0) {
        console.log("[LiveUpdate] Already on latest version or newer");
        await logUpdateCheck(effectiveVersion, data.version, "already_up_to_date");
        return { hasUpdate: false };
      }
      
      // Check if we're currently updating to this version
      if (updateInProgress === data.version) {
        console.log("[LiveUpdate] Already updating to", data.version);
        await logUpdateCheck(effectiveVersion, data.version, "in_progress");
        return { hasUpdate: false };
      }
      
      console.log("[LiveUpdate] ✅ UPDATE AVAILABLE:", effectiveVersion, "->", data.version);
      await logUpdateCheck(effectiveVersion, data.version, "update_available");
      return data as UpdateInfo;
    }
    
    console.log("[LiveUpdate] No update available");
    await logUpdateCheck(effectiveVersion, data?.version, "no_update");
    console.log("[LiveUpdate] ====== UPDATE CHECK END ======");
    return { hasUpdate: false };
  } catch (error) {
    console.error("[LiveUpdate] Error checking for update:", error);
    return { hasUpdate: false };
  }
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
