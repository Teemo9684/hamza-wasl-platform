import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, BookOpen, UserCheck, MessageSquare, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NotificationData {
  id: string;
  type: 'attendance' | 'message' | 'homework' | 'announcement';
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
}

interface IntelligentNotificationBannerProps {
  notification: NotificationData | null;
  onDismiss: () => void;
  onTap?: () => void;
  autoDismissTime?: number;
}

const getNotificationIcon = (type: NotificationData['type']) => {
  switch (type) {
    case 'attendance':
      return UserCheck;
    case 'message':
      return MessageSquare;
    case 'homework':
      return BookOpen;
    case 'announcement':
      return Bell;
    default:
      return Bell;
  }
};

const getNotificationColor = (type: NotificationData['type'], status?: string) => {
  if (type === 'attendance') {
    switch (status) {
      case 'حاضر':
        return 'from-emerald-500 to-green-600';
      case 'غائب':
        return 'from-red-500 to-rose-600';
      case 'متأخر':
        return 'from-amber-500 to-orange-600';
      default:
        return 'from-blue-500 to-indigo-600';
    }
  }
  
  switch (type) {
    case 'message':
      return 'from-blue-500 to-indigo-600';
    case 'homework':
      return 'from-purple-500 to-violet-600';
    case 'announcement':
      return 'from-amber-500 to-orange-600';
    default:
      return 'from-blue-500 to-indigo-600';
  }
};

const getStatusEmoji = (status?: string) => {
  switch (status) {
    case 'حاضر':
      return '✅';
    case 'غائب':
      return '❌';
    case 'متأخر':
      return '⏰';
    default:
      return '📋';
  }
};

export const IntelligentNotificationBanner: React.FC<IntelligentNotificationBannerProps> = ({
  notification,
  onDismiss,
  onTap,
  autoDismissTime = 8000,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!notification) return;

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
  }, [notification, autoDismissTime, onDismiss]);

  if (!notification) return null;

  const Icon = getNotificationIcon(notification.type);
  const colorClass = getNotificationColor(notification.type, notification.details?.status);

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ y: -100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -100, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-[env(safe-area-inset-top)] left-0 right-0 z-[100] px-3 pt-2"
          onClick={onTap}
        >
          <div 
            className={cn(
              "relative overflow-hidden rounded-2xl shadow-2xl",
              "bg-gradient-to-r",
              colorClass
            )}
          >
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <motion.div
                className="h-full bg-white/60"
                initial={{ width: '100%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.05 }}
              />
            </div>

            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-white text-base truncate">
                      {notification.title}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDismiss();
                      }}
                      className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  <p className="text-white/90 text-sm mt-0.5">
                    {notification.description}
                  </p>

                  {/* Details */}
                  {notification.details && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {notification.details.studentName && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 text-white text-xs">
                          👨‍🎓 {notification.details.studentName}
                        </span>
                      )}
                      {notification.details.teacherName && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 text-white text-xs">
                          👨‍🏫 {notification.details.teacherName}
                        </span>
                      )}
                      {notification.details.status && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 text-white text-xs">
                          {getStatusEmoji(notification.details.status)} {notification.details.status}
                        </span>
                      )}
                      {notification.details.subject && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 text-white text-xs">
                          📚 {notification.details.subject}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Time */}
                  <div className="mt-2 flex items-center gap-1 text-white/70 text-xs">
                    <Clock className="w-3 h-3" />
                    <span>الآن</span>
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
