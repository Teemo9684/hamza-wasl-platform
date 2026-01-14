import { useEffect } from "react";
import { useLiveUpdate } from "@/hooks/useLiveUpdate";

interface LiveUpdateCheckerProps {
  /** Whether to automatically check for updates */
  autoCheck?: boolean;
  /** Interval in milliseconds to check for updates (default: 30 minutes) */
  checkInterval?: number;
}

/**
 * Component that handles automatic live update checking
 * Add this to your App.tsx or main layout to enable OTA updates
 */
export const LiveUpdateChecker = ({
  autoCheck = true,
  checkInterval = 30 * 60 * 1000, // 30 minutes
}: LiveUpdateCheckerProps) => {
  const { checkUpdate, isNativeApp } = useLiveUpdate(autoCheck);

  // Set up periodic update checks
  useEffect(() => {
    if (!isNativeApp || !autoCheck) return;

    const intervalId = setInterval(() => {
      checkUpdate();
    }, checkInterval);

    return () => clearInterval(intervalId);
  }, [isNativeApp, autoCheck, checkInterval, checkUpdate]);

  // This component doesn't render anything
  return null;
};
