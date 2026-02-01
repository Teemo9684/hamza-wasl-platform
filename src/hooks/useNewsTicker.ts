import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { realtimeManager } from "@/utils/realtimeManager";
import { useOfflineCache, isOffline } from "./useOfflineCache";

const TICKER_HEIGHT = 36; // Height in pixels
const CACHE_KEY = "news_ticker";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  icon_type: string;
  badge_color: string;
  is_active: boolean;
}

export const useNewsTicker = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { saveToCache, loadFromCache } = useOfflineCache<NewsItem[]>(CACHE_KEY);

  const fetchNewsItems = useCallback(async () => {
    // Try to load from cache first if offline
    if (isOffline()) {
      const cachedData = await loadFromCache();
      if (cachedData) {
        setNewsItems(cachedData);
        setIsLoading(false);
        return;
      }
    }

    try {
      const { data, error } = await supabase
        .from("news_ticker")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) {
        // On error, try to load from cache
        const cachedData = await loadFromCache();
        if (cachedData) {
          setNewsItems(cachedData);
        }
      } else if (data) {
        setNewsItems(data);
        // Save to cache for offline use
        await saveToCache(data);
      }
    } catch (err) {
      console.error("Failed to fetch news ticker:", err);
      // Try to load from cache on network error
      const cachedData = await loadFromCache();
      if (cachedData) {
        setNewsItems(cachedData);
      }
    }
    
    setIsLoading(false);
  }, [loadFromCache, saveToCache]);

  useEffect(() => {
    fetchNewsItems();

    const cleanup = realtimeManager.subscribe(
      'news-ticker-hook',
      'news_ticker',
      () => {
        fetchNewsItems();
      }
    );

    // Listen for online/offline events
    const handleOnline = () => {
      fetchNewsItems();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      cleanup();
      window.removeEventListener('online', handleOnline);
    };
  }, [fetchNewsItems]);

  const hasNews = newsItems.length > 0;
  const tickerHeight = hasNews ? TICKER_HEIGHT : 0;

  return {
    newsItems,
    hasNews,
    tickerHeight,
    isLoading,
  };
};
