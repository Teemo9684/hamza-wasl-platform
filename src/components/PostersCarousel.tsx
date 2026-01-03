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

  const fetchPosters = useCallback(async () => {
    const { data, error } = await supabase
      .from('school_posters')
      .select('id, title, image_url, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (!error && data) {
      setPosters(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosters();

    // Realtime subscription
    const channel = supabase
      .channel('posters-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'school_posters',
        },
        () => {
          fetchPosters();
        }
      )
      .subscribe();

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

  if (posters.length === 0) {
    return null;
  }

  return (
    <div className="w-full px-4 py-6">
      <Carousel
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
              <Card className="overflow-hidden border-0 shadow-lg">
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
  );
};
