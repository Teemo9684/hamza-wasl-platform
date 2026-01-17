import { MessageCircle, FileText, Bell, BookOpen, Users, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { mediumHaptic } from "@/utils/haptics";
import { cn } from "@/lib/utils";

export type NotificationType = 'message' | 'document' | 'homework' | 'announcement' | 'attendance';

interface NotificationItem {
  type: NotificationType;
  count: number;
  onClick?: () => void;
  pulse?: boolean;
}

interface FloatingNotificationBadgeProps {
  notifications: NotificationItem[];
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  compact?: boolean;
}

const notificationConfig: Record<NotificationType, { 
  icon: typeof MessageCircle; 
  label: string;
  gradient: string;
  shadowColor: string;
  emoji: string;
}> = {
  message: {
    icon: MessageCircle,
    label: 'رسائل',
    gradient: 'from-blue-500 via-blue-600 to-indigo-600',
    shadowColor: 'rgba(59, 130, 246, 0.5)',
    emoji: '💬',
  },
  document: {
    icon: FileText,
    label: 'وثائق',
    gradient: 'from-orange-500 via-orange-600 to-amber-600',
    shadowColor: 'rgba(249, 115, 22, 0.5)',
    emoji: '📄',
  },
  homework: {
    icon: BookOpen,
    label: 'واجبات',
    gradient: 'from-emerald-500 via-green-600 to-teal-600',
    shadowColor: 'rgba(34, 197, 94, 0.5)',
    emoji: '📚',
  },
  announcement: {
    icon: Bell,
    label: 'إعلانات',
    gradient: 'from-purple-500 via-violet-600 to-fuchsia-600',
    shadowColor: 'rgba(168, 85, 247, 0.5)',
    emoji: '📢',
  },
  attendance: {
    icon: Users,
    label: 'حضور',
    gradient: 'from-teal-500 via-cyan-600 to-sky-600',
    shadowColor: 'rgba(20, 184, 166, 0.5)',
    emoji: '✅',
  },
};

const positionClasses = {
  'bottom-left': 'bottom-24 left-4',
  'bottom-right': 'bottom-24 right-4',
  'top-left': 'top-20 left-4',
  'top-right': 'top-20 right-4',
};

export const FloatingNotificationBadge = ({ 
  notifications, 
  position = 'bottom-left',
  compact = false,
}: FloatingNotificationBadgeProps) => {
  const activeNotifications = notifications.filter(n => n.count > 0);
  
  if (activeNotifications.length === 0) return null;

  return (
    <div className={cn(
      "fixed z-50 flex gap-2",
      positionClasses[position],
      position.includes('bottom') ? 'flex-col-reverse' : 'flex-col'
    )}>
      <AnimatePresence mode="popLayout">
        {activeNotifications.map((notification, index) => {
          const config = notificationConfig[notification.type];
          const Icon = config.icon;

          const handleClick = () => {
            mediumHaptic();
            notification.onClick?.();
          };

          return (
            <motion.div
              key={notification.type}
              layout
              initial={{ scale: 0, opacity: 0, x: position.includes('left') ? -30 : 30 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0, opacity: 0, x: position.includes('left') ? -30 : 30 }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 25,
                delay: index * 0.05
              }}
              className="cursor-pointer touch-feedback group"
              onClick={handleClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="relative flex items-center gap-2">
                {/* Main Badge */}
                <motion.div 
                  className={cn(
                    "relative bg-gradient-to-br rounded-2xl shadow-xl hover:shadow-2xl transition-all overflow-hidden",
                    config.gradient,
                    compact ? "p-2.5" : "p-3"
                  )}
                  animate={notification.pulse !== false ? { 
                    boxShadow: [
                      `0 4px 20px ${config.shadowColor}`,
                      `0 8px 30px ${config.shadowColor}`,
                      `0 4px 20px ${config.shadowColor}`
                    ]
                  } : undefined}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                  />
                  
                  <div className="relative flex items-center gap-2">
                    <Icon className={cn(
                      "text-white drop-shadow-md",
                      compact ? "w-4 h-4" : "w-5 h-5"
                    )} />
                    
                    {!compact && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        className="text-white text-xs font-bold whitespace-nowrap overflow-hidden"
                      >
                        {config.label}
                      </motion.span>
                    )}
                  </div>
                </motion.div>
                
                {/* Count Badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2"
                >
                  <Badge 
                    className={cn(
                      "bg-red-500 text-white border-2 border-background flex items-center justify-center shadow-lg font-bold",
                      notification.pulse !== false && "animate-pulse",
                      compact 
                        ? "min-w-[18px] h-[18px] text-[9px] px-1" 
                        : "min-w-[22px] h-[22px] text-[10px] px-1.5"
                    )}
                  >
                    {notification.count > 99 ? '99+' : notification.count}
                  </Badge>
                </motion.div>

                {/* Sparkle effect for high counts */}
                {notification.count >= 5 && (
                  <motion.div
                    className="absolute -top-1 -left-1"
                    animate={{ 
                      rotate: [0, 15, -15, 0],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-3 h-3 text-yellow-400 drop-shadow-md" />
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// Multi-badge component for showing all notifications at once
interface NotificationBadgeGroupProps {
  messages?: number;
  documents?: number;
  homework?: number;
  attendance?: number;
  announcements?: number;
  onMessageClick?: () => void;
  onDocumentClick?: () => void;
  onHomeworkClick?: () => void;
  onAttendanceClick?: () => void;
  onAnnouncementClick?: () => void;
}

export const NotificationBadgeGroup = ({
  messages = 0,
  documents = 0,
  homework = 0,
  attendance = 0,
  announcements = 0,
  onMessageClick,
  onDocumentClick,
  onHomeworkClick,
  onAttendanceClick,
  onAnnouncementClick,
}: NotificationBadgeGroupProps) => {
  const notifications: NotificationItem[] = [
    { type: 'message' as NotificationType, count: messages, onClick: onMessageClick },
    { type: 'document' as NotificationType, count: documents, onClick: onDocumentClick },
    { type: 'homework' as NotificationType, count: homework, onClick: onHomeworkClick },
    { type: 'attendance' as NotificationType, count: attendance, onClick: onAttendanceClick },
    { type: 'announcement' as NotificationType, count: announcements, onClick: onAnnouncementClick },
  ].filter(n => n.count > 0);

  return <FloatingNotificationBadge notifications={notifications} />;
};

// Keep the old component for backward compatibility
interface FloatingMessageBadgeProps {
  unreadCount: number;
  onClick?: () => void;
}

export const FloatingMessageBadge = ({ unreadCount, onClick }: FloatingMessageBadgeProps) => {
  return (
    <FloatingNotificationBadge 
      notifications={[
        { type: 'message', count: unreadCount, onClick }
      ]}
    />
  );
};
