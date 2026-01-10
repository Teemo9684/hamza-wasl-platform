import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import Autoplay from 'embla-carousel-autoplay';
import Fade from 'embla-carousel-fade';
import { X } from 'lucide-react';

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
  const [carouselKey, setCarouselKey] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        
        // Force complete re-render by updating key
        setPosters(newPosters);
        setCarouselKey(prev => prev + 1);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setPosters([]);
    }
    setLoading(false);
  }, []);

  const setupRealtimeSubscription = useCallback(() => {
    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channelName = `posters-realtime-${Date.now()}`;
    
    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'school_posters',
        },
        (payload) => {
          console.log('Realtime poster update:', payload.eventType);
          // Fetch immediately on any change
          fetchPosters();
        }
      )
      .subscribe((status) => {
        console.log('Realtime status:', status);
        
        if (status === 'SUBSCRIBED') {
          // Clear any retry timeout
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
          }
          // Refresh data on successful subscription
          fetchPosters();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.log('Subscription failed, retrying in 2s...');
          // Retry subscription after error
          retryTimeoutRef.current = setTimeout(() => {
            setupRealtimeSubscription();
          }, 2000);
        }
      });
  }, [fetchPosters]);

  useEffect(() => {
    // Initial fetch
    fetchPosters();
    
    // Setup realtime subscription
    setupRealtimeSubscription();

    // Backup polling every 10 seconds in case realtime fails
    const pollInterval = setInterval(() => {
      fetchPosters();
    }, 10000);

    return () => {
      clearInterval(pollInterval);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [fetchPosters, setupRealtimeSubscription]);

  if (loading) {
    return (
      <div className="w-full px-4 py-6">
        <Skeleton className="w-full h-48 rounded-xl" />
      </div>
    );
  }

  // CRITICAL: Return null when no active posters
  if (posters.length === 0) {
    return null;
  }

  return (
    <>
      <div className="w-full px-4 py-6">
        {/* Key forces complete re-mount of carousel when data changes */}
        <Carousel
          key={carouselKey}
          opts={{
            align: 'start',
            loop: true,
            skipSnaps: false,
            slidesToScroll: 1,
          }}
          plugins={[
            Autoplay({
              delay: 4000,
              stopOnInteraction: false,
              stopOnMouseEnter: false,
              playOnInit: true,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent className="ml-0">
            {posters.map((poster) => (
              <CarouselItem 
                key={poster.id} 
                className="pl-0 basis-full transition-opacity duration-700"
              >
                <Card 
                  className="overflow-hidden border-0 shadow-xl cursor-pointer transition-all duration-500 hover:shadow-2xl hover:scale-[1.01]"
                  onClick={() => setSelectedPoster(poster)}
                >
                  <div className="relative aspect-[16/9] md:aspect-[21/9]">
                    <img
                      src={poster.image_url}
                      alt={poster.title}
                      className="w-full h-full object-cover transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
                      <h3 className="text-white text-lg md:text-2xl font-bold text-right drop-shadow-lg">
                        {poster.title}
                      </h3>
                    </div>
                  </div>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          {posters.length > 1 && (
            <>
              <CarouselPrevious className="left-4 md:left-6 bg-white/90 hover:bg-white shadow-lg border-0 h-10 w-10 md:h-12 md:w-12" />
              <CarouselNext className="right-4 md:right-6 bg-white/90 hover:bg-white shadow-lg border-0 h-10 w-10 md:h-12 md:w-12" />
              <div className="flex justify-center gap-2 mt-4">
                {posters.map((_, index) => (
                  <div
                    key={index}
                    className="h-1.5 w-8 rounded-full bg-muted-foreground/30 transition-all duration-300"
                  />
                ))}
              </div>
            </>
          )}
        </Carousel>
      </div>

      <Dialog open={!!selectedPoster} onOpenChange={() => setSelectedPoster(null)}>
        <DialogContent className="max-w-4xl w-[95vw] p-0 overflow-hidden bg-black/95 border-0">
          <DialogTitle className="sr-only">{selectedPoster?.title}</DialogTitle>
          <button
            onClick={() => setSelectedPoster(null)}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          {selectedPoster && (
            <div className="relative">
              <img
                src={selectedPoster.image_url}
                alt={selectedPoster.title}
                className="w-full h-auto max-h-[85vh] object-contain"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <h2 className="text-white text-xl md:text-2xl font-bold text-right">
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
