import { useState, useEffect, useCallback, useRef } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import {
  isNativeApp,
  checkForUpdate,
  downloadAndApplyUpdate,
  getCurrentVersion,
  initializeVersion,
  syncBundleVersion,
  type UpdateInfo,
} from "@/utils/liveUpdate";
import { getItem, setItem, removeItem } from "@/utils/nativeStorage";

// Storage keys
const LAST_CHECK_KEY = "smart_update_last_check";
const RETRY_COUNT_KEY = "smart_update_retry_count";
const PENDING_UPDATE_KEY = "smart_update_pending";
const UPDATE_APPLIED_KEY = "smart_update_applied";

// Configuration
const MIN_CHECK_INTERVAL = 60 * 1000; // 1 minute minimum between checks
const MAX_RETRY_COUNT = 5;
const RETRY_DELAYS = [5000, 15000, 30000, 60000, 120000]; // Exponential backoff

interface SmartUpdateState {
  isChecking: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  error: string | null;
  updateInfo: UpdateInfo | null;
  isMandatoryUpdate: boolean;
  isOnline: boolean;
  retryCount: number;
  currentVersion: string;
}

interface AppliedUpdate {
  version: string;
  releaseNotes?: string;
  appliedAt: number;
}

/**
 * Hook ذكي لإدارة التحديثات مع:
 * - فحص فوري عند فتح التطبيق
 * - إعادة المحاولة التلقائية مع تأخير تصاعدي
 * - فحص عند العودة من الخلفية
 * - دعم التحديثات الإجبارية
 * - تتبع حالة الاتصال
 */
export const useSmartUpdate = () => {
  const [state, setState] = useState<SmartUpdateState>({
    isChecking: false,
    isDownloading: false,
    downloadProgress: 0,
    error: null,
    updateInfo: null,
    isMandatoryUpdate: false,
    isOnline: navigator.onLine,
    retryCount: 0,
    currentVersion: getCurrentVersion(),
  });

  const isNative = isNativeApp();
  const checkInProgress = useRef(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitialized = useRef(false);

  // تحديث حالة الاتصال
  useEffect(() => {
    const handleOnline = () => setState((s) => ({ ...s, isOnline: true }));
    const handleOffline = () => setState((s) => ({ ...s, isOnline: false }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // حفظ معلومات التحديث المعلق
  const savePendingUpdate = async (info: UpdateInfo) => {
    await setItem(PENDING_UPDATE_KEY, JSON.stringify({
      version: info.version,
      releaseNotes: info.releaseNotes,
      savedAt: Date.now(),
    }));
  };

  // تحويل التحديث المعلق إلى مُطبق بعد إعادة التشغيل
  const convertPendingToApplied = async () => {
    try {
      const pending = await getItem(PENDING_UPDATE_KEY);
      if (pending) {
        const data = JSON.parse(pending);
        await setItem(UPDATE_APPLIED_KEY, JSON.stringify({
          ...data,
          appliedAt: Date.now(),
        }));
        await removeItem(PENDING_UPDATE_KEY);
        console.log("[SmartUpdate] Converted pending update to applied:", data.version);
      }
    } catch (e) {
      console.error("[SmartUpdate] Error converting pending update:", e);
    }
  };

  // الحصول على التحديث المُطبق (لعرض رسالة النجاح)
  const getAppliedUpdate = async (): Promise<AppliedUpdate | null> => {
    try {
      const data = await getItem(UPDATE_APPLIED_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  };

  // مسح التحديث المُطبق
  const clearAppliedUpdate = async () => {
    await removeItem(UPDATE_APPLIED_KEY);
  };

  // حفظ عدد المحاولات
  const saveRetryCount = async (count: number) => {
    await setItem(RETRY_COUNT_KEY, count.toString());
  };

  // الحصول على عدد المحاولات
  const getRetryCount = async (): Promise<number> => {
    try {
      const count = await getItem(RETRY_COUNT_KEY);
      return count ? parseInt(count, 10) : 0;
    } catch {
      return 0;
    }
  };

  // إعادة تعيين عدد المحاولات
  const resetRetryCount = async () => {
    await removeItem(RETRY_COUNT_KEY);
    setState((s) => ({ ...s, retryCount: 0 }));
  };

  // تطبيق التحديث
  const applyUpdate = useCallback(async (updateInfo: UpdateInfo) => {
    if (!updateInfo.bundleUrl || !updateInfo.version) {
      console.error("[SmartUpdate] Missing bundleUrl or version");
      return false;
    }

    console.log("[SmartUpdate] Starting update to version:", updateInfo.version);
    setState((s) => ({ ...s, isDownloading: true, downloadProgress: 0, error: null }));

    try {
      // حفظ التحديث المعلق قبل التطبيق
      await savePendingUpdate(updateInfo);
      await resetRetryCount();

      const success = await downloadAndApplyUpdate(
        updateInfo.bundleUrl,
        updateInfo.version,
        (progress) => {
          setState((s) => ({ ...s, downloadProgress: progress }));
        }
      );

      if (!success) {
        await removeItem(PENDING_UPDATE_KEY);
        setState((s) => ({
          ...s,
          isDownloading: false,
          downloadProgress: 0,
          error: "فشل تحميل التحديث",
        }));
        return false;
      }

      return true;
    } catch (error) {
      console.error("[SmartUpdate] Update failed:", error);
      await removeItem(PENDING_UPDATE_KEY);
      setState((s) => ({
        ...s,
        isDownloading: false,
        downloadProgress: 0,
        error: error instanceof Error ? error.message : "خطأ غير معروف",
      }));
      return false;
    }
  }, []);

  // فحص التحديثات
  const checkUpdate = useCallback(async (force: boolean = false): Promise<UpdateInfo | null> => {
    if (!isNative) {
      console.log("[SmartUpdate] Not native platform, skipping");
      return null;
    }

    if (checkInProgress.current && !force) {
      console.log("[SmartUpdate] Check already in progress");
      return null;
    }

    // التحقق من الفاصل الزمني الأدنى
    if (!force) {
      const lastCheck = await getItem(LAST_CHECK_KEY);
      if (lastCheck) {
        const elapsed = Date.now() - parseInt(lastCheck, 10);
        if (elapsed < MIN_CHECK_INTERVAL) {
          console.log("[SmartUpdate] Too soon since last check, skipping");
          return null;
        }
      }
    }

    checkInProgress.current = true;
    setState((s) => ({ ...s, isChecking: true, error: null }));

    try {
      console.log("[SmartUpdate] Checking for updates...");
      await setItem(LAST_CHECK_KEY, Date.now().toString());

      const updateInfo = await checkForUpdate();
      console.log("[SmartUpdate] Check result:", JSON.stringify(updateInfo));

      if (updateInfo.hasUpdate && updateInfo.bundleUrl && updateInfo.version) {
        console.log("[SmartUpdate] ✅ Update available:", updateInfo.version);
        
        setState((s) => ({
          ...s,
          isChecking: false,
          updateInfo,
          isMandatoryUpdate: updateInfo.isMandatory || false,
        }));

        // تطبيق التحديث تلقائياً
        await applyUpdate(updateInfo);
        
        checkInProgress.current = false;
        return updateInfo;
      }

      console.log("[SmartUpdate] No update available");
      setState((s) => ({
        ...s,
        isChecking: false,
        updateInfo: null,
        isMandatoryUpdate: false,
      }));

      checkInProgress.current = false;
      return null;
    } catch (error) {
      console.error("[SmartUpdate] Check failed:", error);
      
      const currentRetry = await getRetryCount();
      const newRetryCount = currentRetry + 1;
      
      setState((s) => ({
        ...s,
        isChecking: false,
        error: error instanceof Error ? error.message : "فشل الفحص",
        retryCount: newRetryCount,
      }));

      // جدولة إعادة المحاولة
      if (newRetryCount <= MAX_RETRY_COUNT && state.isOnline) {
        await saveRetryCount(newRetryCount);
        const delay = RETRY_DELAYS[Math.min(newRetryCount - 1, RETRY_DELAYS.length - 1)];
        console.log(`[SmartUpdate] Scheduling retry #${newRetryCount} in ${delay}ms`);
        
        retryTimeoutRef.current = setTimeout(() => {
          checkUpdate(true);
        }, delay);
      }

      checkInProgress.current = false;
      return null;
    }
  }, [isNative, applyUpdate, state.isOnline]);

  // إعادة المحاولة يدوياً
  const retryUpdate = useCallback(async () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    await resetRetryCount();
    return checkUpdate(true);
  }, [checkUpdate]);

  // تهيئة النظام
  useEffect(() => {
    if (!isNative || hasInitialized.current) return;

    const initialize = async () => {
      console.log("[SmartUpdate] Initializing...");
      hasInitialized.current = true;

      await initializeVersion();
      await syncBundleVersion();
      await convertPendingToApplied();

      setState((s) => ({ ...s, currentVersion: getCurrentVersion() }));

      // فحص فوري بعد التهيئة
      setTimeout(() => {
        checkUpdate();
      }, 3000);
    };

    initialize();
  }, [isNative, checkUpdate]);

  // الاستماع لأحداث التطبيق (العودة من الخلفية)
  useEffect(() => {
    if (!isNative) return;

    let listener: { remove: () => void } | null = null;

    const setupListener = async () => {
      listener = await App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) {
          console.log("[SmartUpdate] App resumed, checking for updates...");
          // تأخير صغير للسماح بإعادة الاتصال
          setTimeout(() => {
            if (state.isOnline) {
              checkUpdate();
            }
          }, 2000);
        }
      });
    };

    setupListener();

    return () => {
      listener?.remove();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [isNative, checkUpdate, state.isOnline]);

  // فحص عند استعادة الاتصال
  useEffect(() => {
    if (state.isOnline && state.error && isNative) {
      console.log("[SmartUpdate] Connection restored, retrying...");
      checkUpdate(true);
    }
  }, [state.isOnline, state.error, isNative, checkUpdate]);

  return {
    ...state,
    checkUpdate,
    retryUpdate,
    getAppliedUpdate,
    clearAppliedUpdate,
    isNativeApp: isNative,
  };
};
