import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { realtimeManager } from "@/utils/realtimeManager";

const TICKER_HEIGHT = 36; // Height in pixels

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

  const fetchNewsItems = useCallback(async () => {
    const { data } = await supabase
      .from("news_ticker")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (data) {
      setNewsItems(data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchNewsItems();

    const cleanup = realtimeManager.subscribe(
      'news-ticker-hook',
      'news_ticker',
      () => {
        fetchNewsItems();
      }
    );

    return cleanup;
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
