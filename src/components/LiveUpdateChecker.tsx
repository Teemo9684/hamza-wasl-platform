import { useEffect } from "react";
import { useLiveUpdate } from "@/hooks/useLiveUpdate";
import { markBundleAsReady, isNativeApp as checkNativeApp } from "@/utils/liveUpdate";

interface LiveUpdateCheckerProps {
  autoCheck?: boolean;
  checkInterval?: number;
}

/**
 * Component that handles automatic live update checking
 * Also marks the current bundle as ready to prevent rollback
 */
export const LiveUpdateChecker = ({
  autoCheck = true,
  checkInterval = 30 * 60 * 1000,
}: LiveUpdateCheckerProps) => {
  const { checkUpdate, isNativeApp } = useLiveUpdate(autoCheck);

  // Mark bundle as ready on app start - this prevents rollback to previous version
  useEffect(() => {
    if (!checkNativeApp()) return;
    
    // Give the app a moment to fully load before confirming the bundle
    const timer = setTimeout(() => {
      markBundleAsReady();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isNativeApp || !autoCheck) return;

    const intervalId = setInterval(() => {
      checkUpdate();
    }, checkInterval);

    return () => clearInterval(intervalId);
  }, [isNativeApp, autoCheck, checkInterval, checkUpdate]);

  return null;
};
