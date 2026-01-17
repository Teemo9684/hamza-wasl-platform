import { useState, useEffect, useCallback } from 'react';
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
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

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

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true, 
      align: 'start',
      dragFree: true,
      containScroll: 'trimSnaps',
      direction: 'rtl'
    },
    [Autoplay({ delay: 4000, stopOnInteraction: true, stopOnMouseEnter: true })]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

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

  if (loading) {
    return (
      <div className="w-full px-4 py-6">
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="flex-shrink-0 w-72 h-44 rounded-2xl" />
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
      <div className="w-full py-6">
        <div className="relative group">
          {/* Navigation Arrows */}
          {posters.length > 1 && (
            <>
              <button
                onClick={scrollNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/80 shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-background"
                aria-label="التالي"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                onClick={scrollPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/80 shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-background"
                aria-label="السابق"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Carousel Container */}
          <div className="overflow-hidden px-4" ref={emblaRef}>
            <div className="flex gap-4">
              {posters.map((poster) => (
                <div
                  key={poster.id}
                  className="flex-shrink-0 w-72 md:w-80 lg:w-96 cursor-grab active:cursor-grabbing"
                  onClick={() => setSelectedPoster(poster)}
                >
                  <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 group/card">
                    <div className="aspect-[4/3] bg-muted">
                      <img
                        src={poster.image_url}
                        alt={poster.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                        onError={(e) => {
                          console.error('Image failed to load:', poster.image_url);
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                        draggable={false}
                      />
                    </div>
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                    
                    {/* Title */}
                    <div className="absolute inset-x-0 bottom-0 p-4 pointer-events-none">
                      <h3 className="text-white text-base md:text-lg font-bold text-right drop-shadow-lg line-clamp-2">
                        {poster.title}
                      </h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
