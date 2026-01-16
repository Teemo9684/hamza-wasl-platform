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
        console.warn('PostersCarousel: Error fetching posters:', error.message);
        // Don't clear posters on error - keep showing cached data
        setLoading(false);
        return;
      }
      
      const newPosters = data || [];
      console.log('PostersCarousel: Fetched', newPosters.length, 'posters');
      setPosters(newPosters);
    } catch (err) {
      console.warn('PostersCarousel: Network error:', err);
      // Don't clear posters on network error
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

  // Setup realtime subscription using realtimeManager for better reconnection
  useEffect(() => {
    // Fetch immediately - don't wait for realtime
    fetchPosters();

    // Re-fetch when app comes back online
    const handleBackOnline = () => {
      console.log('PostersCarousel: App back online, refetching...');
      fetchPosters();
    };
    window.addEventListener('app-back-online', handleBackOnline);

    // Realtime is optional - data still loads from initial fetch
    const cleanup = realtimeManager.subscribe(
      'posters-carousel-global',
      'school_posters',
      (payload) => {
        console.log('PostersCarousel: Realtime update received', payload);
        fetchPosters();
      }
    );

    return () => {
      cleanup();
      window.removeEventListener('app-back-online', handleBackOnline);
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
                <div className="absolute inset-x-0 bottom-6 p-4 md:p-6 pointer-events-none">
                  <h3 className="text-white text-lg md:text-2xl lg:text-3xl font-bold text-right drop-shadow-lg">
                    {currentPoster.title}
                  </h3>
                </div>
              </div>
            )}
          </div>


          {/* Minimal Line Indicators */}
          {posters.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
              {posters.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className="focus:outline-none"
                  aria-label={`انتقل إلى الملصقة ${index + 1}`}
                >
                  <div 
                    className={cn(
                      "h-1 rounded-full transition-all duration-300",
                      index === currentIndex 
                        ? "w-6 bg-white/90" 
                        : "w-3 bg-white/40 hover:bg-white/60"
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
