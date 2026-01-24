import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { APP_VERSION } from "@/config/version";
import { isNativeApp } from "@/utils/liveUpdate";

const VERSION_CACHE_KEY = "cached_app_version";

// Get cached version from localStorage
const getCachedVersion = (): string | null => {
  try {
    return localStorage.getItem(VERSION_CACHE_KEY);
  } catch {
    return null;
  }
};

// Cache version in localStorage
const setCachedVersion = (version: string): void => {
  try {
    localStorage.setItem(VERSION_CACHE_KEY, version);
  } catch (error) {
    console.error("Error caching version:", error);
  }
};

/**
 * Hook to get the current app version
 * For both native apps and PWA: fetches the latest active version from the server
 * Falls back to APP_VERSION if no server version is available
 */
export const useAppVersion = () => {
  // Start with cached version or static version
  const [version, setVersion] = useState<string>(getCachedVersion() || APP_VERSION);
  const [isLoading, setIsLoading] = useState(true);
  const [isNative] = useState(() => isNativeApp());

  useEffect(() => {
    const fetchVersion = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("app_versions")
          .select("version")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.error("Error fetching version:", error);
          // Fall back to cached or static version
          setVersion(getCachedVersion() || APP_VERSION);
        } else if (data?.version) {
          setVersion(data.version);
          setCachedVersion(data.version);
        } else {
          // No active version in DB, use APP_VERSION
          setVersion(APP_VERSION);
        }
      } catch (error) {
        console.error("Error fetching version:", error);
        setVersion(getCachedVersion() || APP_VERSION);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVersion();
  }, []);

  return { version, isLoading, isNative };
};
