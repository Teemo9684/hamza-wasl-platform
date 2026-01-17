import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { realtimeManager } from '@/utils/realtimeManager';

interface Poster {
  id: string;
  title: string;
  image_url: string;
  display_order: number;
}

export const PostersCarousel = () => {
  const [posters, setPosters] = useState<Poster[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoster, setSelectedPoster] = useState<Poster | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPosters = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('school_posters')
        .select('id, title, image_url, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching posters:', error);
        setPosters([]);
      } else {
        const newPosters = data || [];
        console.log('Posters fetched:', newPosters.length);
        setPosters(newPosters);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setPosters([]);
    }
    setLoading(false);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    if (scrollContainerRef.current && posters.length > 0) {
      const container = scrollContainerRef.current;
      const cardWidth = 200; // w-48 = 192px + gap
      const scrollPosition = index * cardWidth;
      container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
      setCurrentIndex(index);
    }
  }, [posters.length]);

  const scrollLeft = useCallback(() => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : posters.length - 1;
    scrollToIndex(newIndex);
  }, [currentIndex, posters.length, scrollToIndex]);

  const scrollRight = useCallback(() => {
    const newIndex = currentIndex < posters.length - 1 ? currentIndex + 1 : 0;
    scrollToIndex(newIndex);
  }, [currentIndex, posters.length, scrollToIndex]);

  // Auto-scroll function - continuous without stopping
  const autoScroll = useCallback(() => {
    if (scrollContainerRef.current && posters.length > 1) {
      const newIndex = currentIndex < posters.length - 1 ? currentIndex + 1 : 0;
      scrollToIndex(newIndex);
    }
  }, [currentIndex, posters.length, scrollToIndex]);

  // Track scroll position to update current index
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current && posters.length > 0) {
      const container = scrollContainerRef.current;
      const cardWidth = 200;
      const newIndex = Math.round(container.scrollLeft / cardWidth);
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < posters.length) {
        setCurrentIndex(newIndex);
      }
    }
  }, [currentIndex, posters.length]);

  // Setup realtime subscription
  useEffect(() => {
    fetchPosters();

    const cleanup = realtimeManager.subscribe(
      'posters-carousel-global',
      'school_posters',
      (payload) => {
        console.log('PostersCarousel: Realtime update received', payload);
        fetchPosters();
      }
    );

    return cleanup;
  }, [fetchPosters]);

  // Auto-play effect - continuous every 4 seconds
  useEffect(() => {
    if (posters.length > 1) {
      autoPlayRef.current = setInterval(autoScroll, 4000);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [posters.length, autoScroll]);

  if (loading) {
    return (
      <div className="w-full px-4 py-4">
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="flex-shrink-0 w-48 h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (posters.length === 0) {
    return null;
  }

  return (
    <>
      <div className="w-full py-4">
        <div className="relative group">
          {/* Navigation Arrows */}
          {posters.length > 1 && (
            <>
              <button
                onClick={scrollRight}
                className="absolute right-1 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-background/80 shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-background"
                aria-label="التالي"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={scrollLeft}
                className="absolute left-1 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-background/80 shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-background"
                aria-label="السابق"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </>
          )}

          {/* Carousel Container */}
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex gap-3 overflow-x-auto px-3 scrollbar-hide scroll-smooth snap-x snap-mandatory"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {posters.map((poster, index) => (
              <div
                key={poster.id}
                className="flex-shrink-0 w-48 md:w-56 cursor-pointer snap-start"
                onClick={() => setSelectedPoster(poster)}
              >
                <div className={cn(
                  "relative overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-all duration-300",
                  index === currentIndex && "ring-2 ring-primary ring-offset-2"
                )}>
                  <div className="aspect-[4/3] bg-muted">
                    <img
                      src={poster.image_url}
                      alt={poster.title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      onError={(e) => {
                        console.error('Image failed to load:', poster.image_url);
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                      draggable={false}
                    />
                  </div>
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
                  
                  {/* Title */}
                  <div className="absolute inset-x-0 bottom-0 p-2 pointer-events-none">
                    <h3 className="text-white text-sm font-semibold text-right drop-shadow-lg line-clamp-1">
                      {poster.title}
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dot Indicators */}
          {posters.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-3">
              {posters.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToIndex(index)}
                  className="focus:outline-none"
                  aria-label={`انتقل إلى الملصقة ${index + 1}`}
                >
                  <div 
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      index === currentIndex 
                        ? "w-4 bg-primary" 
                        : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    )}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={!!selectedPoster} onOpenChange={() => setSelectedPoster(null)}>
        <DialogContent className="max-w-5xl w-[95vw] p-0 overflow-hidden bg-black/95 border-0">
          <DialogTitle className="sr-only">{selectedPoster?.title}</DialogTitle>
          <button
            onClick={() => setSelectedPoster(null)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors backdrop-blur-sm"
          >
            <X className="h-6 w-6" />
          </button>
          {selectedPoster && (
            <div className="relative">
              <img
                src={selectedPoster.image_url}
                alt={selectedPoster.title}
                className="w-full h-auto max-h-[90vh] object-contain"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <h2 className="text-white text-xl md:text-3xl font-bold text-right">
                  {selectedPoster.title}
                </h2>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
