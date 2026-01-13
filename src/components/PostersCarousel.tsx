import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

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

  const goToNext = useCallback(() => {
    if (posters.length <= 1) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % posters.length);
      setIsTransitioning(false);
    }, 300);
  }, [posters.length]);

  const goToPrev = useCallback(() => {
    if (posters.length <= 1) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + posters.length) % posters.length);
      setIsTransitioning(false);
    }, 300);
  }, [posters.length]);

  const goToSlide = useCallback((index: number) => {
    if (index === currentIndex) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 300);
  }, [currentIndex]);

  // Auto-advance slides
  useEffect(() => {
    if (posters.length <= 1) return;

    intervalRef.current = setInterval(goToNext, 4000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [posters.length, goToNext]);

  // Reset interval when manually changing slides
  const resetInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (posters.length > 1) {
      intervalRef.current = setInterval(goToNext, 4000);
    }
  }, [posters.length, goToNext]);

  const handlePrev = useCallback(() => {
    goToPrev();
    resetInterval();
  }, [goToPrev, resetInterval]);

  const handleNext = useCallback(() => {
    goToNext();
    resetInterval();
  }, [goToNext, resetInterval]);

  const handleDotClick = useCallback((index: number) => {
    goToSlide(index);
    resetInterval();
  }, [goToSlide, resetInterval]);

  // Setup realtime subscription
  useEffect(() => {
    fetchPosters();

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
        () => {
          fetchPosters();
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [fetchPosters]);

  // Reset current index if it exceeds posters length
  useEffect(() => {
    if (currentIndex >= posters.length && posters.length > 0) {
      setCurrentIndex(0);
    }
  }, [posters.length, currentIndex]);

  if (loading) {
    return (
      <div className="w-full px-4 py-6">
        <Skeleton className="w-full h-48 md:h-64 rounded-2xl" />
      </div>
    );
  }

  if (posters.length === 0) {
    return null;
  }

  const currentPoster = posters[currentIndex];

  return (
    <>
      <div className="w-full px-4 py-6">
        <div className="relative overflow-hidden rounded-2xl shadow-2xl">
          {/* Main Image Container */}
          <div className="relative aspect-[16/9] md:aspect-[21/9] bg-muted">
            {currentPoster && (
              <div
                className={cn(
                  "absolute inset-0 transition-all duration-500 ease-in-out cursor-pointer",
                  isTransitioning ? "opacity-0 scale-105" : "opacity-100 scale-100"
                )}
                onClick={() => setSelectedPoster(currentPoster)}
              >
                <img
                  src={currentPoster.image_url}
                  alt={currentPoster.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Image failed to load:', currentPoster.image_url);
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                
                {/* Title */}
                <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 pointer-events-none">
                  <h3 className="text-white text-lg md:text-2xl lg:text-3xl font-bold text-right drop-shadow-lg">
                    {currentPoster.title}
                  </h3>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Arrows */}
          {posters.length > 1 && (
            <>
              <button
                onClick={handleNext}
                className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 z-10 
                  h-10 w-10 md:h-12 md:w-12 rounded-full 
                  bg-white/90 hover:bg-white 
                  shadow-lg backdrop-blur-sm
                  flex items-center justify-center
                  transition-all duration-200 hover:scale-110
                  focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="الملصقة التالية"
              >
                <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-gray-800" />
              </button>
              <button
                onClick={handlePrev}
                className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 z-10 
                  h-10 w-10 md:h-12 md:w-12 rounded-full 
                  bg-white/90 hover:bg-white 
                  shadow-lg backdrop-blur-sm
                  flex items-center justify-center
                  transition-all duration-200 hover:scale-110
                  focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="الملصقة السابقة"
              >
                <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-gray-800" />
              </button>
            </>
          )}

          {/* Modern Progress Indicator - Inside the image */}
          {posters.length > 1 && (
            <div className="absolute bottom-14 md:bottom-16 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2 rounded-full bg-black/30 backdrop-blur-md border border-white/10 shadow-lg">
              {posters.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className="group relative focus:outline-none focus:ring-2 focus:ring-white/50 rounded-full"
                  aria-label={`انتقل إلى الملصقة ${index + 1}`}
                >
                  <div 
                    className={cn(
                      "relative overflow-hidden rounded-full transition-all duration-300",
                      index === currentIndex 
                        ? "w-8 h-2.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                        : "w-2.5 h-2.5 bg-white/40 hover:bg-white/60 hover:scale-110"
                    )}
                  >
                    {index === currentIndex && (
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-white/80 via-white to-white/80 animate-pulse"
                      />
                    )}
                  </div>
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
