import { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, BookOpen, Calendar, FileText, Bell, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { lightHaptic } from '@/utils/haptics';

export type QuickNotificationType = 'messages' | 'homework' | 'attendance' | 'documents' | 'announcements';

interface QuickNotificationData {
  type: QuickNotificationType;
  count: number;
  label: string;
  onClick: () => void;
}

interface FloatingQuickNotificationProps {
  notifications: QuickNotificationData[];
  onDismiss?: (type: QuickNotificationType) => void;
  position?: 'bottom-left' | 'bottom-right';
}

const notificationConfig: Record<QuickNotificationType, {
  icon: typeof MessageSquare;
  gradient: string;
  emoji: string;
}> = {
  messages: {
    icon: MessageSquare,
    gradient: 'from-blue-500 to-indigo-600',
    emoji: '💬',
  },
  homework: {
    icon: BookOpen,
    gradient: 'from-emerald-500 to-teal-600',
    emoji: '📚',
  },
  attendance: {
    icon: Calendar,
    gradient: 'from-amber-500 to-orange-600',
    emoji: '✅',
  },
  documents: {
    icon: FileText,
    gradient: 'from-purple-500 to-violet-600',
    emoji: '📄',
  },
  announcements: {
    icon: Bell,
    gradient: 'from-rose-500 to-pink-600',
    emoji: '📢',
  },
};

const NotificationBadge = memo(({ 
  notification, 
  index,
  onDismiss 
}: { 
  notification: QuickNotificationData; 
  index: number;
  onDismiss?: (type: QuickNotificationType) => void;
}) => {
  const config = notificationConfig[notification.type];
  const Icon = config.icon;

  const handleClick = useCallback(() => {
    lightHaptic();
    notification.onClick();
    onDismiss?.(notification.type);
  }, [notification, onDismiss]);

  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    lightHaptic();
    onDismiss?.(notification.type);
  }, [notification.type, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ scale: 0, opacity: 0, x: -40 }}
      animate={{ scale: 1, opacity: 1, x: 0 }}
      exit={{ scale: 0, opacity: 0, x: -40 }}
      transition={{ 
        type: "spring", 
        stiffness: 350, 
        damping: 25,
        delay: index * 0.08
      }}
      whileHover={{ scale: 1.05, x: 4 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className="cursor-pointer touch-feedback group"
    >
      <div className={cn(
        "relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl shadow-xl",
        "bg-gradient-to-r backdrop-blur-sm",
        config.gradient
      )}>
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/15 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
        />
        
        <div className="relative flex items-center gap-2.5">
          <motion.div 
            className="flex items-center justify-center w-9 h-9 bg-white/20 rounded-xl"
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Icon className="w-5 h-5 text-white drop-shadow-md" />
          </motion.div>
          
          <div className="flex flex-col">
            <span className="text-white text-xs font-bold">
              {notification.label}
            </span>
            <span className="text-white/80 text-[10px]">
              {notification.count} {notification.count === 1 ? 'جديد' : 'جديدة'}
            </span>
          </div>
        </div>

        {/* Count Badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2"
        >
          <span className={cn(
            "flex items-center justify-center min-w-[22px] h-[22px] px-1.5",
            "bg-destructive text-destructive-foreground text-[11px] font-bold",
            "rounded-full border-2 border-background shadow-lg animate-pulse"
          )}>
            {notification.count > 99 ? '99+' : notification.count}
          </span>
        </motion.div>

        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="absolute -top-1.5 -left-1.5 w-5 h-5 flex items-center justify-center bg-background/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
      </div>
    </motion.div>
  );
});

NotificationBadge.displayName = 'NotificationBadge';

export const FloatingQuickNotification = memo(({ 
  notifications,
  onDismiss,
  position = 'bottom-left'
}: FloatingQuickNotificationProps) => {
  const activeNotifications = notifications.filter(n => n.count > 0);
  
  if (activeNotifications.length === 0) return null;

  const positionClasses = {
    'bottom-left': 'bottom-24 left-3',
    'bottom-right': 'bottom-24 right-3',
  };

  return (
    <div className={cn(
      "fixed z-50 flex flex-col-reverse gap-2.5",
      positionClasses[position]
    )}>
      <AnimatePresence mode="popLayout">
        {activeNotifications.map((notification, index) => (
          <NotificationBadge 
            key={notification.type}
            notification={notification}
            index={index}
            onDismiss={onDismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});

FloatingQuickNotification.displayName = 'FloatingQuickNotification';
