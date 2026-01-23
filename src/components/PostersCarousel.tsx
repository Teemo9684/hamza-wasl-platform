import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { realtimeManager } from '@/utils/realtimeManager';
import { motion, AnimatePresence } from 'framer-motion';

interface Poster {
  id: string;
  title: string;
  image_url: string;
  display_order: number;
}

// Memoized poster card for better performance
const PosterCard = memo(({ 
  poster, 
  isCurrent, 
  style, 
  onTap,
  isHovering,
  onHoverStart,
  onHoverEnd
}: {
  poster: Poster;
  isCurrent: boolean;
  style: React.CSSProperties;
  onTap: () => void;
  isHovering: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}) => {
  return (
    <div
      className={cn(
        "absolute inset-0 transition-all duration-500 ease-out",
        isCurrent ? "pointer-events-auto" : "pointer-events-none"
      )}
      style={{
        ...style,
        transformStyle: 'preserve-3d',
        willChange: 'transform, opacity',
      }}
      onClick={onTap}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      <div className={cn(
        "w-full h-full overflow-hidden rounded-xl shadow-xl transition-shadow duration-300",
        isCurrent && "shadow-2xl ring-2 ring-primary/50",
        isCurrent && isHovering && "shadow-[0_0_30px_rgba(255,255,255,0.4),0_0_60px_rgba(255,255,255,0.2)] ring-white/70"
      )}>
        <div className="relative w-full h-full bg-muted">
          <img
            src={poster.image_url}
            alt={poster.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
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
});

PosterCard.displayName = 'PosterCard';

// Fullscreen preview with zoom animation
const FullscreenPreview = memo(({ 
  poster, 
  onClose 
}: { 
  poster: Poster | null; 
  onClose: () => void;
}) => {
  return (
    <AnimatePresence>
      {poster && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={onClose}
        >
          {/* Close button */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-4 right-4 z-10 p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.1, duration: 0.2 }}
          >
            <X className="h-6 w-6" />
          </motion.button>

          {/* Image with zoom animation */}
          <motion.div
            className="relative max-w-5xl w-[95vw] max-h-[90vh] overflow-hidden rounded-xl"
            initial={{ scale: 0.7, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 25,
              duration: 0.35
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={poster.image_url}
              alt={poster.title}
              className="w-full h-auto max-h-[90vh] object-contain"
            />
            
            {/* Title with slide up animation */}
            <motion.div 
              className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              <h2 className="text-white text-xl md:text-3xl font-bold text-right">
                {poster.title}
              </h2>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

FullscreenPreview.displayName = 'FullscreenPreview';

export const PostersCarousel = () => {
  const [posters, setPosters] = useState<Poster[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoster, setSelectedPoster] = useState<Poster | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Touch/drag state - improved for distinguishing tap vs swipe
  const touchStartRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const touchEndRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasDraggedRef = useRef<boolean>(false);
  const isInteractingRef = useRef<boolean>(false);
  const hasTriggeredPauseRef = useRef<boolean>(false);

  // Constants for gesture detection
  const TAP_THRESHOLD = 15; // pixels - movement less than this is a tap
  const SWIPE_THRESHOLD = 50; // pixels - movement more than this triggers swipe
  const PAUSE_THRESHOLD = 30; // pixels - horizontal movement needed to pause autoplay
  const TAP_DURATION = 250; // ms - quick taps under this duration

  // Pause rotation and resume after delay (only for actual swipes)
  const pauseAndResume = useCallback(() => {
    if (hasTriggeredPauseRef.current) return; // Prevent multiple pauses
    hasTriggeredPauseRef.current = true;
    setIsPaused(true);
    
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
    
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
        setPosters(data || []);
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
    pauseAndResume();
  }, [pauseAndResume]);

  // Touch handlers - improved to distinguish tap vs swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { 
      x: touch.clientX, 
      y: touch.clientY, 
      time: Date.now() 
    };
    touchEndRef.current = { x: touch.clientX, y: touch.clientY };
    hasDraggedRef.current = false;
    isInteractingRef.current = true;
    hasTriggeredPauseRef.current = false; // Reset pause trigger
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isInteractingRef.current) return;
    
    const touch = e.touches[0];
    touchEndRef.current = { x: touch.clientX, y: touch.clientY };
    
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    
    // Mark as dragged only if significant movement occurred
    if (deltaX > TAP_THRESHOLD || deltaY > TAP_THRESHOLD) {
      hasDraggedRef.current = true;
    }
    
    // Pause only when significant HORIZONTAL dragging occurs (not vertical scroll)
    if (deltaX > PAUSE_THRESHOLD && deltaX > deltaY) {
      pauseAndResume();
    }
  }, [pauseAndResume]);

  const handleTouchEnd = useCallback(() => {
    if (!isInteractingRef.current) return;
    isInteractingRef.current = false;
    
    const deltaX = touchStartRef.current.x - touchEndRef.current.x;
    const deltaY = Math.abs(touchStartRef.current.y - touchEndRef.current.y);
    const absDeltaX = Math.abs(deltaX);
    
    // If it's a horizontal swipe (significant horizontal movement, more than vertical)
    if (hasDraggedRef.current && absDeltaX > SWIPE_THRESHOLD && absDeltaX > deltaY) {
      if (deltaX > 0) {
        goToNext();
      } else {
        goToPrev();
      }
      pauseAndResume();
    }
    // Reset for next interaction
    hasDraggedRef.current = false;
    hasTriggeredPauseRef.current = false;
  }, [goToNext, goToPrev, pauseAndResume]);

  // Mouse drag handlers - improved
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    touchStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    touchEndRef.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;
    isInteractingRef.current = true;
    hasTriggeredPauseRef.current = false;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isInteractingRef.current) return;
    
    touchEndRef.current = { x: e.clientX, y: e.clientY };
    
    const deltaX = Math.abs(e.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(e.clientY - touchStartRef.current.y);
    
    if (deltaX > TAP_THRESHOLD || deltaY > TAP_THRESHOLD) {
      hasDraggedRef.current = true;
    }
    
    // Pause only on significant horizontal movement
    if (deltaX > PAUSE_THRESHOLD && deltaX > deltaY) {
      pauseAndResume();
    }
  }, [pauseAndResume]);

  const handleMouseUp = useCallback(() => {
    if (!isInteractingRef.current) return;
    isInteractingRef.current = false;
    
    const deltaX = touchStartRef.current.x - touchEndRef.current.x;
    const deltaY = Math.abs(touchStartRef.current.y - touchEndRef.current.y);
    const absDeltaX = Math.abs(deltaX);
    
    // Only trigger swipe if horizontal movement is significant and greater than vertical
    if (hasDraggedRef.current && absDeltaX > SWIPE_THRESHOLD && absDeltaX > deltaY) {
      if (deltaX > 0) {
        goToNext();
      } else {
        goToPrev();
      }
      pauseAndResume();
    }
    
    hasDraggedRef.current = false;
    hasTriggeredPauseRef.current = false;
  }, [goToNext, goToPrev, pauseAndResume]);

  const handleMouseLeave = useCallback(() => {
    isInteractingRef.current = false;
    hasDraggedRef.current = false;
    hasTriggeredPauseRef.current = false;
  }, []);

  // Handle tap on current poster - improved detection
  const handlePosterTap = useCallback((poster: Poster, index: number) => {
    const duration = Date.now() - touchStartRef.current.time;
    const deltaX = Math.abs(touchStartRef.current.x - touchEndRef.current.x);
    const deltaY = Math.abs(touchStartRef.current.y - touchEndRef.current.y);
    
    // Only open preview if it's a genuine tap (minimal movement, quick duration)
    const isTap = deltaX < TAP_THRESHOLD && deltaY < TAP_THRESHOLD && duration < TAP_DURATION;
    
    if (index === currentIndex && (isTap || !hasDraggedRef.current)) {
      setSelectedPoster(poster);
    }
  }, [currentIndex]);

  // Setup realtime subscription
  useEffect(() => {
    fetchPosters();

    const cleanup = realtimeManager.subscribe(
      'posters-carousel-global',
      'school_posters',
      () => {
        fetchPosters();
      }
    );

    return cleanup;
  }, [fetchPosters]);

  // Continuous auto-play every 4 seconds
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

  // Calculate 3D position for each card - optimized
  const getCardStyle = useCallback((index: number): React.CSSProperties => {
    const total = posters.length;
    if (total === 0) return {};
    
    let diff = index - currentIndex;
    
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    
    const angle = diff * (360 / Math.max(total, 5));
    const radius = 180;
    const radians = (angle * Math.PI) / 180;
    
    const translateX = Math.sin(radians) * radius;
    const translateZ = Math.cos(radians) * radius - radius;
    
    const scale = 0.6 + (0.4 * ((translateZ + radius) / radius));
    const opacity = diff === 0 ? 1 : Math.max(0.4, 1 - Math.abs(diff) * 0.25);
    const zIndex = Math.round((translateZ + radius) * 10);
    
    return {
      transform: `translate3d(${translateX}px, 0, ${translateZ}px) scale(${scale})`,
      opacity,
      zIndex,
    };
  }, [posters.length, currentIndex]);

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
                onClick={() => { goToNext(); pauseAndResume(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-background/80 shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-background"
                aria-label="التالي"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => { goToPrev(); pauseAndResume(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-background/80 shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-background"
                aria-label="السابق"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </>
          )}

          {/* 3D Carousel Container */}
          <div 
            className="relative h-48 md:h-56 flex items-center justify-center select-none cursor-grab active:cursor-grabbing touch-pan-y"
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
              {posters.map((poster, index) => (
                <PosterCard
                  key={poster.id}
                  poster={poster}
                  isCurrent={index === currentIndex}
                  style={getCardStyle(index)}
                  onTap={() => handlePosterTap(poster, index)}
                  isHovering={isHovering && index === currentIndex}
                  onHoverStart={() => index === currentIndex && setIsHovering(true)}
                  onHoverEnd={() => setIsHovering(false)}
                />
              ))}
            </div>
          </div>

          {/* Dot Indicators */}
          {posters.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-4">
              {posters.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToIndex(index)}
                  className="focus:outline-none p-1"
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

      {/* Fullscreen Preview with Zoom Animation */}
      <FullscreenPreview 
        poster={selectedPoster} 
        onClose={() => setSelectedPoster(null)} 
      />
    </>
  );
};
