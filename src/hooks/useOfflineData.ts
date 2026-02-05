 import { useCallback, useEffect, useState } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useOfflineCache, isOffline } from "./useOfflineCache";
 
 // Generic hook for offline-enabled data fetching
 export const useOfflineData = <T>(
   cacheKey: string,
   fetchFn: () => Promise<T | null>,
   deps: any[] = []
 ) => {
   const [data, setData] = useState<T | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const { saveToCache, loadFromCache } = useOfflineCache<T>(cacheKey);
 
   const fetchData = useCallback(async () => {
     setLoading(true);
     setError(null);
 
     // Try to load from cache first if offline
     if (isOffline()) {
       const cachedData = await loadFromCache();
       if (cachedData) {
         setData(cachedData);
         setLoading(false);
         return;
       }
     }
 
     try {
       const result = await fetchFn();
       if (result) {
         setData(result);
         // Save to cache for offline use
         await saveToCache(result);
       }
     } catch (err: any) {
       console.error(`Failed to fetch ${cacheKey}:`, err);
       setError(err.message || "Failed to fetch data");
       
       // Try to load from cache on network error
       const cachedData = await loadFromCache();
       if (cachedData) {
         setData(cachedData);
         setError(null); // Clear error if we got cached data
       }
     }
 
     setLoading(false);
   }, [cacheKey, fetchFn, loadFromCache, saveToCache, ...deps]);
 
   useEffect(() => {
     fetchData();
 
     // Listen for online events to refresh data
     const handleOnline = () => {
       fetchData();
     };
 
     window.addEventListener('online', handleOnline);
     return () => window.removeEventListener('online', handleOnline);
   }, [fetchData]);
 
   return {
     data,
     loading,
     error,
     refresh: fetchData,
     isOffline: isOffline(),
   };
 };
 
 // Helper to create offline-enabled queries
 export const createOfflineQuery = async <T>(
   cacheKey: string,
   queryFn: () => Promise<{ data: T | null; error: any }>,
   saveToCache: (data: T) => Promise<void>,
   loadFromCache: () => Promise<T | null>
 ): Promise<T | null> => {
   // Try to load from cache first if offline
   if (isOffline()) {
     const cachedData = await loadFromCache();
     if (cachedData) {
       return cachedData;
     }
   }
 
   try {
     const { data, error } = await queryFn();
     if (error) throw error;
 
     if (data) {
       // Save to cache for offline use
       await saveToCache(data);
       return data;
     }
     return null;
   } catch (err) {
     console.error(`Failed to fetch ${cacheKey}:`, err);
     // Try to load from cache on network error
     const cachedData = await loadFromCache();
     return cachedData;
   }
 };