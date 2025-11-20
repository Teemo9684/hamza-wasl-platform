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
    <div className="w-full bg-primary/10 backdrop-blur-md border-b border-primary/20 overflow-hidden">
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
