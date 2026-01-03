import { useState, useEffect, useCallback } from 'react';
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
  const [refreshKey, setRefreshKey] = useState(0);

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
        console.log('Fetched posters count:', newPosters.length);
        setPosters(newPosters);
        // Force carousel re-render when data changes
        setRefreshKey(prev => prev + 1);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setPosters([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosters();

    // Realtime subscription - listen for all changes and update immediately
    const channel = supabase
      .channel(`posters-sync-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'school_posters',
        },
        (payload) => {
          console.log('Poster change detected:', payload.eventType, payload);
          // Small delay to ensure DB consistency then refetch
          setTimeout(() => {
            fetchPosters();
          }, 100);
        }
      )
      .subscribe((status) => {
        console.log('Posters subscription:', status);
        if (status === 'SUBSCRIBED') {
          fetchPosters();
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosters]);

  if (loading) {
    return (
      <div className="w-full px-4 py-6">
        <Skeleton className="w-full h-48 rounded-xl" />
      </div>
    );
  }

  // Don't render if no active posters
  if (!loading && posters.length === 0) {
    return null;
  }

  return (
    <>
      <div className="w-full px-4 py-6">
        <Carousel
          key={`posters-carousel-${refreshKey}-${posters.length}`}
          opts={{
            align: 'center',
            loop: true,
            direction: 'rtl',
          }}
          plugins={[
            Autoplay({
              delay: 4000,
              stopOnInteraction: false,
              stopOnMouseEnter: true,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {posters.map((poster) => (
              <CarouselItem key={poster.id} className="pl-2 md:pl-4 basis-full md:basis-4/5 lg:basis-3/4">
                <Card 
                  className="overflow-hidden border-0 shadow-lg cursor-pointer transition-transform hover:scale-[1.02]"
                  onClick={() => setSelectedPoster(poster)}
                >
                  <div className="relative aspect-[16/9] md:aspect-[21/9]">
                    <img
                      src={poster.image_url}
                      alt={poster.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <h3 className="text-white text-lg md:text-xl font-bold text-right">
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
              <CarouselPrevious className="left-2 md:left-4" />
              <CarouselNext className="right-2 md:right-4" />
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