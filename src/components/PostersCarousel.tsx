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
  const [isPaused, setIsPaused] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Touch/drag state
  const touchStartRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const touchEndRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef<boolean>(false);
  const hasDraggedRef = useRef<boolean>(false); // Track if actual drag occurred
  const dragThreshold = 10; // Minimum pixels to consider it a drag vs tap

  // Pause rotation and resume after 2 seconds
  const pauseAndResume = useCallback(() => {
    setIsPaused(true);
    
    // Clear any existing resume timeout
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
    
    // Resume after 2 seconds
    resumeTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 2000);
  }, []);

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
    setCurrentIndex((prev) => (prev + 1) % posters.length);
  }, [posters.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + posters.length) % posters.length);
  }, [posters.length]);

  const goToIndex = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Touch handlers - improved to distinguish tap from swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = { 
      x: e.touches[0].clientX, 
      y: e.touches[0].clientY,
      time: Date.now()
    };
    touchEndRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    touchEndRef.current = { x: currentX, y: currentY };
    
    // Check if movement exceeds drag threshold
    const diffX = Math.abs(currentX - touchStartRef.current.x);
    const diffY = Math.abs(currentY - touchStartRef.current.y);
    
    if (diffX > dragThreshold || diffY > dragThreshold) {
      hasDraggedRef.current = true;
      // Pause auto-play only when actually dragging
      if (!isPaused) {
        pauseAndResume();
      }
    }
  }, [isPaused, pauseAndResume]);

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    
    const diffX = touchStartRef.current.x - touchEndRef.current.x;
    const swipeThreshold = 50;
    const timeDiff = Date.now() - touchStartRef.current.time;
    
    // If it was a swipe (moved enough horizontally)
    if (Math.abs(diffX) > swipeThreshold && hasDraggedRef.current) {
      if (diffX > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
    
    // Reset drag state after a small delay to allow click handler to check it
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 50);
  }, [goToNext, goToPrev]);

  // Mouse drag handlers - improved
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    touchStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    touchEndRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    
    const currentX = e.clientX;
    touchEndRef.current = { x: currentX, y: e.clientY };
    
    const diffX = Math.abs(currentX - touchStartRef.current.x);
    
    if (diffX > dragThreshold) {
      hasDraggedRef.current = true;
      if (!isPaused) {
        pauseAndResume();
      }
    }
  }, [isPaused, pauseAndResume]);

  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    
    const diffX = touchStartRef.current.x - touchEndRef.current.x;
    const swipeThreshold = 50;
    
    if (Math.abs(diffX) > swipeThreshold && hasDraggedRef.current) {
      if (diffX > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
    
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 50);
  }, [goToNext, goToPrev]);

  const handleMouseLeave = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      hasDraggedRef.current = false;
    }
  }, []);

  // Handle poster click - only if not dragging
  const handlePosterClick = useCallback((poster: Poster, isCurrent: boolean) => {
    // Only open if it's the current poster and user didn't drag
    if (isCurrent && !hasDraggedRef.current) {
      pauseAndResume();
      setSelectedPoster(poster);
    }
  }, [pauseAndResume]);

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

  // Continuous auto-play every 4 seconds (pauses when isPaused is true)
  useEffect(() => {
    if (posters.length > 1 && !isPaused) {
      autoPlayRef.current = setInterval(goToNext, 4000);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [posters.length, goToNext, isPaused]);

  // Cleanup resume timeout on unmount
  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
      }
    };
  }, []);

  // Calculate 3D position for each card
  const getCardStyle = (index: number) => {
    const total = posters.length;
    if (total === 0) return {};
    
    // Calculate the relative position from current
    let diff = index - currentIndex;
    
    // Normalize to shortest path around the circle
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    
    // Calculate rotation angle and z position
    const angle = diff * (360 / Math.max(total, 5));
    const radius = 180; // Distance from center
    const radians = (angle * Math.PI) / 180;
    
    // Calculate x position based on angle
    const translateX = Math.sin(radians) * radius;
    const translateZ = Math.cos(radians) * radius - radius;
    
    // Scale based on z position (closer = bigger)
    const scale = 0.6 + (0.4 * ((translateZ + radius) / radius));
    
    // Opacity based on position
    const opacity = diff === 0 ? 1 : Math.max(0.4, 1 - Math.abs(diff) * 0.25);
    
    // Z-index based on z position
    const zIndex = Math.round((translateZ + radius) * 10);
    
    return {
      transform: `translateX(${translateX}px) translateZ(${translateZ}px) scale(${scale})`,
      opacity,
      zIndex,
    };
  };

  if (loading) {
    return (
      <div className="w-full px-4 py-6">
        <div className="flex justify-center">
          <Skeleton className="w-64 h-44 rounded-xl" />
        </div>
      </div>
    );
  }

  if (posters.length === 0) {
    return null;
  }

  return (
    <>
      <div className="w-full py-6 overflow-hidden">
        <div className="relative group">
          {/* Navigation Arrows */}
          {posters.length > 1 && (
            <>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-background/80 shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-background"
                aria-label="التالي"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                onClick={goToPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-background/80 shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-background"
                aria-label="السابق"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </>
          )}

          {/* 3D Carousel Container */}
          <div 
            className="relative h-48 md:h-56 flex items-center justify-center select-none cursor-grab active:cursor-grabbing"
            style={{ perspective: '1000px' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            <div 
              className="relative w-56 md:w-64 h-full"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {posters.map((poster, index) => {
                const style = getCardStyle(index);
                const isCurrent = index === currentIndex;
                
                return (
                  <div
                    key={poster.id}
                    className={cn(
                      "absolute inset-0 cursor-pointer transition-all duration-700 ease-out",
                      isCurrent && "pointer-events-auto",
                      !isCurrent && "pointer-events-none"
                    )}
                    style={{
                      ...style,
                      transformStyle: 'preserve-3d',
                    }}
                    onClick={() => handlePosterClick(poster, isCurrent)}
                    onMouseEnter={() => isCurrent && setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                  >
                    <div className={cn(
                      "w-full h-full overflow-hidden rounded-xl shadow-xl transition-all duration-300",
                      isCurrent && "shadow-2xl ring-2 ring-primary/50",
                      isCurrent && isHovering && "shadow-[0_0_30px_rgba(255,255,255,0.4),0_0_60px_rgba(255,255,255,0.2)] ring-white/70"
                    )}>
                      <div className="relative w-full h-full bg-muted">
                        <img
                          src={poster.image_url}
                          alt={poster.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Image failed to load:', poster.image_url);
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                          draggable={false}
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
                        
                        {/* Title */}
                        <div className="absolute inset-x-0 bottom-0 p-3 pointer-events-none">
                          <h3 className="text-white text-sm md:text-base font-semibold text-right drop-shadow-lg line-clamp-2">
                            {poster.title}
                          </h3>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dot Indicators */}
          {posters.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-4">
              {posters.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToIndex(index)}
                  className="focus:outline-none"
                  aria-label={`انتقل إلى الملصقة ${index + 1}`}
                >
                  <div 
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      index === currentIndex 
                        ? "w-5 bg-gradient-to-r from-white/90 to-white/70 shadow-sm shadow-white/30" 
                        : "w-1.5 bg-white/30 hover:bg-white/50"
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
