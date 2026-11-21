import { useCallback } from "react";
import { setItem, getItem } from "@/utils/nativeStorage";
import { APP_AUDIENCE } from "@/config/appAudience";
import { supabase } from "@/integrations/supabase/client";

const CACHE_PREFIX = "offline_cache_";
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedData<T> {
  data: T;
  timestamp: number;
}

export const useOfflineCache = <T>(cacheKey: string) => {
  // Never show a previous parent's offline data on a shared device.
  const resolveKey = useCallback(async (): Promise<string | null> => {
    if (APP_AUDIENCE !== "parent") return CACHE_PREFIX + cacheKey;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return null;
    return CACHE_PREFIX + "parent_" + session.user.id + "_" + cacheKey;
  }, [cacheKey]);

  const saveToCache = useCallback(async (data: T): Promise<void> => {
    try {
      const cacheData: CachedData<T> = {
        data,
        timestamp: Date.now(),
      };
      const fullKey = await resolveKey();
      if (fullKey) await setItem(fullKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error(`Failed to save ${cacheKey} to cache:`, error);
    }
  }, [resolveKey, cacheKey]);

  const loadFromCache = useCallback(async (): Promise<T | null> => {
    try {
      const fullKey = await resolveKey();
      if (!fullKey) return null;
      const cached = await getItem(fullKey);
      if (!cached) return null;

      const cacheData: CachedData<T> = JSON.parse(cached);
      
      // Check if cache is still valid (within 24 hours)
      if (Date.now() - cacheData.timestamp < CACHE_EXPIRY_MS) {
        return cacheData.data;
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to load ${cacheKey} from cache:`, error);
      return null;
    }
  }, [resolveKey, cacheKey]);

  const clearCache = useCallback(async (): Promise<void> => {
    try {
      const { removeItem } = await import("@/utils/nativeStorage");
      const fullKey = await resolveKey();
      if (fullKey) await removeItem(fullKey);
    } catch (error) {
      console.error(`Failed to clear ${cacheKey} cache:`, error);
    }
  }, [resolveKey, cacheKey]);

  return {
    saveToCache,
    loadFromCache,
    clearCache,
  };
};

// Check if we're currently offline
export const isOffline = (): boolean => {
  return typeof navigator !== "undefined" && !navigator.onLine;
};
