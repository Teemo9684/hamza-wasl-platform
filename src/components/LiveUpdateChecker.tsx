import { useEffect } from "react";
import { useLiveUpdate } from "@/hooks/useLiveUpdate";

interface LiveUpdateCheckerProps {
  autoCheck?: boolean;
  checkInterval?: number;
}

/**
 * Component that handles automatic live update checking
 */
export const LiveUpdateChecker = ({
  autoCheck = true,
  checkInterval = 30 * 60 * 1000,
}: LiveUpdateCheckerProps) => {
  const { checkUpdate, isNativeApp } = useLiveUpdate(autoCheck);

  useEffect(() => {
    if (!isNativeApp || !autoCheck) return;

    const intervalId = setInterval(() => {
      checkUpdate();
    }, checkInterval);

    return () => clearInterval(intervalId);
  }, [isNativeApp, autoCheck, checkInterval, checkUpdate]);

  return null;
};
