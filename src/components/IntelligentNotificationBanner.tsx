import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, Bell, BookOpen, UserCheck, MessageSquare, Clock, FileText, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { lightHaptic } from '@/utils/haptics';

export interface NotificationData {
  id: string;
  type: 'attendance' | 'message' | 'homework' | 'announcement' | 'document';
  title: string;
  description: string;
  details?: {
    studentName?: string;
    teacherName?: string;
    status?: string;
    subject?: string;
    time?: string;
  };
  timestamp: Date;
  priority?: 'low' | 'normal' | 'high';
}

interface IntelligentNotificationBannerProps {
  notification: NotificationData | null;
  onDismiss: () => void;
  onTap?: () => void;
  autoDismissTime?: number;
}

const getNotificationIcon = (type: NotificationData['type']) => {
  const icons = {
    attendance: UserCheck,
    message: MessageSquare,
    homework: BookOpen,
    announcement: Bell,
    document: FileText,
  };
  return icons[type] || Bell;
};

const getNotificationConfig = (type: NotificationData['type'], status?: string) => {
  if (type === 'attendance') {
    const statusConfigs: Record<string, { gradient: string; glow: string; emoji: string }> = {
      'حاضر': { gradient: 'from-emerald-500 via-green-500 to-teal-500', glow: 'shadow-emerald-500/40', emoji: '✅' },
      'غائب': { gradient: 'from-red-500 via-rose-500 to-pink-500', glow: 'shadow-red-500/40', emoji: '❌' },
      'متأخر': { gradient: 'from-amber-500 via-orange-500 to-yellow-500', glow: 'shadow-amber-500/40', emoji: '⏰' },
    };
    return statusConfigs[status || ''] || { gradient: 'from-blue-500 via-indigo-500 to-violet-500', glow: 'shadow-blue-500/40', emoji: '📋' };
  }
  
  const typeConfigs: Record<string, { gradient: string; glow: string; emoji: string }> = {
    message: { gradient: 'from-blue-500 via-indigo-500 to-violet-500', glow: 'shadow-blue-500/40', emoji: '💬' },
    homework: { gradient: 'from-purple-500 via-violet-500 to-fuchsia-500', glow: 'shadow-purple-500/40', emoji: '📚' },
    announcement: { gradient: 'from-amber-500 via-orange-500 to-red-500', glow: 'shadow-amber-500/40', emoji: '📢' },
    document: { gradient: 'from-teal-500 via-cyan-500 to-sky-500', glow: 'shadow-teal-500/40', emoji: '📄' },
  };
  
  return typeConfigs[type] || typeConfigs.message;
};

const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  
  if (diffSec < 10) return 'الآن';
  if (diffSec < 60) return `منذ ${diffSec} ثانية`;
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
  return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
};

export const IntelligentNotificationBanner: React.FC<IntelligentNotificationBannerProps> = ({
  notification,
  onDismiss,
  onTap,
  autoDismissTime = 8000,
}) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const [dragY, setDragY] = useState(0);

  useEffect(() => {
    if (!notification || isPaused) return;

    setProgress(100);
    const startTime = Date.now();
    const duration = autoDismissTime;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [notification, autoDismissTime, onDismiss, isPaused]);

  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    if (info.offset.y < -50) {
      lightHaptic();
      onDismiss();
    }
    setDragY(0);
  }, [onDismiss]);

  const handleTap = useCallback(() => {
    lightHaptic();
    onTap?.();
  }, [onTap]);

  if (!notification) return null;

  const Icon = getNotificationIcon(notification.type);
  const config = getNotificationConfig(notification.type, notification.details?.status);

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ y: -100, opacity: 0, scale: 0.95 }}
          animate={{ 
            y: dragY, 
            opacity: dragY < -30 ? 0.5 : 1, 
            scale: dragY < -30 ? 0.95 : 1 
          }}
          exit={{ y: -100, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-[env(safe-area-inset-top)] left-0 right-0 z-[100] px-3 pt-2"
          drag="y"
          dragConstraints={{ top: -100, bottom: 0 }}
          dragElastic={0.2}
          onDrag={(e, info) => setDragY(info.offset.y)}
          onDragEnd={handleDragEnd}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setTimeout(() => setIsPaused(false), 1000)}
          onClick={handleTap}
        >
          {/* Swipe hint */}
          <motion.div 
            className="flex justify-center mb-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: dragY < 0 ? 1 : 0.5 }}
          >
            <ChevronUp className="w-4 h-4 text-white/60" />
          </motion.div>

          <div 
            className={cn(
              "relative overflow-hidden rounded-2xl shadow-2xl backdrop-blur-xl",
              "bg-gradient-to-r",
              config.gradient,
              config.glow,
              "shadow-xl"
            )}
          >
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-20">
              <motion.div
                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.4),transparent_60%)]"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <motion.div
                className="h-full bg-white/70"
                initial={{ width: '100%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.05 }}
              />
            </div>

            <div className="relative p-4">
              <div className="flex items-start gap-3">
                {/* Animated Icon */}
                <motion.div 
                  className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: notification.type === 'announcement' ? [0, -5, 5, 0] : 0
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Icon className="w-6 h-6 text-white drop-shadow-md" />
                </motion.div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{config.emoji}</span>
                      <h3 className="font-bold text-white text-base truncate drop-shadow-md">
                        {notification.title}
                      </h3>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        lightHaptic();
                        onDismiss();
                      }}
                      className="flex-shrink-0 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 active:scale-90 transition-all"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  <p className="text-white/90 text-sm mt-1 line-clamp-2 drop-shadow-sm">
                    {notification.description}
                  </p>

                  {/* Details chips */}
                  {notification.details && (
                    <motion.div 
                      className="mt-2 flex flex-wrap gap-1.5"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {notification.details.studentName && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/25 text-white text-xs font-medium backdrop-blur-sm">
                          👨‍🎓 {notification.details.studentName}
                        </span>
                      )}
                      {notification.details.teacherName && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/25 text-white text-xs font-medium backdrop-blur-sm">
                          👨‍🏫 {notification.details.teacherName}
                        </span>
                      )}
                      {notification.details.status && (
                        <motion.span 
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/30 text-white text-xs font-bold backdrop-blur-sm"
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 1, repeat: 3 }}
                        >
                          {notification.details.status}
                        </motion.span>
                      )}
                      {notification.details.subject && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/25 text-white text-xs font-medium backdrop-blur-sm">
                          📚 {notification.details.subject}
                        </span>
                      )}
                    </motion.div>
                  )}

                  {/* Time */}
                  <div className="mt-2 flex items-center gap-1.5 text-white/70 text-xs">
                    <Clock className="w-3 h-3" />
                    <span>{getRelativeTime(notification.timestamp)}</span>
                    {isPaused && (
                      <span className="mr-2 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">
                        متوقف مؤقتاً
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
