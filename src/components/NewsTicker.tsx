import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { realtimeManager } from "@/utils/realtimeManager";
import { motion } from "framer-motion";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  icon_type: string;
  badge_color: string;
  is_active: boolean;
}

const TICKER_HEIGHT = 44; // Height in pixels

export const NewsTicker = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);

  const fetchNewsItems = useCallback(async () => {
    const { data } = await supabase
      .from("news_ticker")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (data) {
      console.log('NewsTicker: Fetched', data.length, 'items');
      setNewsItems(data);
    }
  }, []);

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

    return cleanup;
  }, [fetchNewsItems]);

  if (newsItems.length === 0) {
    return null;
  }

  return (
    <div 
      className="w-full relative overflow-hidden"
      style={{ height: TICKER_HEIGHT }}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/15 via-secondary/10 to-accent/15 animate-gradient-x" />
      
      {/* Shimmer overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 4, repeat: Infinity, repeatDelay: 2, ease: "linear" }}
      />
      
      {/* Glass effect border */}
      <div className="absolute inset-0 backdrop-blur-md border-b border-primary/20 shadow-[0_4px_15px_rgba(168,85,247,0.1)]" />
      
      {/* Decorative side gradients */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-primary/20 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-primary/20 to-transparent z-10 pointer-events-none" />
      
      {/* Content */}
      <div className="relative h-full flex items-center">
        <div className="ticker-animation py-2.5 inline-flex min-w-max items-center gap-8 whitespace-nowrap">
          {/* Repeat items 3 times for seamless scrolling */}
          {[...Array(3)].map((_, repeatIndex) => (
            newsItems.map((item, itemIndex) => (
              <div key={`${repeatIndex}-${item.id}`} className="flex items-center gap-8">
                {/* News item with enhanced styling */}
                <motion.div 
                  className="flex items-center gap-3"
                  whileHover={{ scale: 1.02 }}
                >
                  {/* Animated badge */}
                  <motion.span 
                    className={`${item.badge_color} text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg relative overflow-hidden`}
                    whileHover={{ scale: 1.05 }}
                  >
                    {/* Badge shimmer */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    />
                    <span className="relative z-10">{item.icon_type}</span>
                  </motion.span>
                  
                  {/* Content text with gradient */}
                  <span className="text-foreground font-cairo text-sm font-medium bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                    {item.content}
                  </span>
                </motion.div>
                
                {/* Enhanced logo separator */}
                <div className="relative h-8 w-12 flex-shrink-0">
                  {/* Glow effect behind logo */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/30 to-primary/20 rounded-full blur-md" />
                  
                  <div className="relative flex flex-col items-center justify-center h-full">
                    <motion.span 
                      className="text-xs font-bold font-ruqaa leading-[0.85] text-transparent bg-gradient-to-br from-primary via-secondary to-accent bg-clip-text"
                      animate={{ 
                        opacity: [0.7, 1, 0.7],
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
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
                    </motion.span>
                  </div>
                </div>
              </div>
            ))
          ))}
        </div>
      </div>
      
      {/* Top highlight line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      
      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-secondary/30 to-transparent" />
    </div>
  );
};

// Export ticker height for use in other components
export const getTickerHeight = () => TICKER_HEIGHT;
