import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { realtimeManager } from "@/utils/realtimeManager";
import { useOfflineCache, isOffline } from "@/hooks/useOfflineCache";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  icon_type: string;
  badge_color: string;
  is_active: boolean;
}

const TICKER_HEIGHT = 36; // Height in pixels
const CACHE_KEY = "news_ticker_component";

export const NewsTicker = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const { saveToCache, loadFromCache } = useOfflineCache<NewsItem[]>(CACHE_KEY);

  const fetchNewsItems = useCallback(async () => {
    // Try to load from cache first if offline
    if (isOffline()) {
      const cachedData = await loadFromCache();
      if (cachedData && cachedData.length > 0) {
        setNewsItems(cachedData);
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
        console.error('News ticker fetch error:', error);
        // Try to load from cache on error
        const cachedData = await loadFromCache();
        if (cachedData && cachedData.length > 0) {
          setNewsItems(cachedData);
        }
      } else if (data) {
        console.log('NewsTicker: Fetched', data.length, 'items');
        setNewsItems(data);
        // Save to cache for offline use
        if (data.length > 0) {
          await saveToCache(data);
        }
      }
    } catch (err) {
      console.error('News ticker network error:', err);
      // Try to load from cache on network error
      const cachedData = await loadFromCache();
      if (cachedData && cachedData.length > 0) {
        setNewsItems(cachedData);
      }
    }
  }, [loadFromCache, saveToCache]);

  useEffect(() => {
    fetchNewsItems();

    // Subscribe using realtimeManager for better reconnection handling
    const cleanup = realtimeManager.subscribe(
      'news-ticker-global',
      'news_ticker',
      (payload) => {
        console.log('NewsTicker: Realtime update received', payload);
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

  if (newsItems.length === 0) {
    return null;
  }

  return (
    <div 
      className="w-full bg-primary/10 backdrop-blur-md border-b border-primary/20 overflow-hidden"
      style={{ height: TICKER_HEIGHT }}
    >
      <div className="ticker-animation py-2 inline-flex min-w-max items-center gap-6 whitespace-nowrap">
        {/* Repeat items 3 times for seamless scrolling */}
        {[...Array(3)].map((_, repeatIndex) => (
          newsItems.map((item, itemIndex) => (
            <div key={`${repeatIndex}-${item.id}`} className="flex items-center gap-6">
              <span className="text-foreground font-cairo flex items-center gap-2 text-sm">
                <span className={`${item.badge_color} text-white px-2 py-0.5 rounded-full text-xs font-bold`}>
                  {item.icon_type}
                </span>
                {item.content}
              </span>
              
              {/* Logo separator */}
              <div className="relative h-6 w-10 flex-shrink-0">
                <div className="flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-primary/80 font-ruqaa leading-[0.8]">
                    {itemIndex % 2 === 0 ? (
                      <>
                        <div>همزة</div>
                        <div>وصل</div>
                      </>
                    ) : (
                      <>
                        <div>العربي</div>
                        <div>التبسي</div>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))
        ))}
      </div>
    </div>
  );
};

// Export ticker height for use in other components
export const getTickerHeight = () => TICKER_HEIGHT;
