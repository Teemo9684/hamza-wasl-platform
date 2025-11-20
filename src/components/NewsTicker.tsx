import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  icon_type: string;
  badge_color: string;
  is_active: boolean;
}

export const NewsTicker = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);

  useEffect(() => {
    fetchNewsItems();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('news-ticker-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'news_ticker',
        },
        () => {
          fetchNewsItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNewsItems = async () => {
    const { data } = await supabase
      .from("news_ticker")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (data) {
      setNewsItems(data);
    }
  };

  if (newsItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-primary/10 backdrop-blur-md border-b border-primary/20 overflow-hidden">
      <div className="ticker-animation py-3 inline-flex min-w-max items-center gap-8 whitespace-nowrap">
        {/* Repeat items 3 times for seamless scrolling */}
        {[...Array(3)].map((_, repeatIndex) => (
          newsItems.map((item, itemIndex) => (
            <div key={`${repeatIndex}-${item.id}`} className="flex items-center gap-8">
              <span className="text-foreground font-cairo flex items-center gap-2">
                <span className={`${item.badge_color} text-white px-3 py-1 rounded-full text-sm font-bold`}>
                  {item.icon_type}
                </span>
                {item.content}
              </span>
              
              {/* Logo separator */}
              <div className="relative h-8 w-12 flex-shrink-0">
                <div className="flex flex-col items-center justify-center">
                  <span className="text-sm font-bold text-primary/80 font-ruqaa leading-[0.8]">
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
