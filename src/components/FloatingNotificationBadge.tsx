import { MessageCircle, FileText, Bell, BookOpen, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { mediumHaptic } from "@/utils/haptics";

export type NotificationType = 'message' | 'document' | 'homework' | 'announcement' | 'attendance';

interface NotificationItem {
  type: NotificationType;
  count: number;
  onClick?: () => void;
}

interface FloatingNotificationBadgeProps {
  notifications: NotificationItem[];
}

const notificationConfig: Record<NotificationType, { 
  icon: typeof MessageCircle; 
  label: string;
  gradient: string;
  shadowColor: string;
}> = {
  message: {
    icon: MessageCircle,
    label: 'رسائل',
    gradient: 'from-blue-500 to-blue-600',
    shadowColor: 'rgba(59, 130, 246, 0.4)',
  },
  document: {
    icon: FileText,
    label: 'وثائق',
    gradient: 'from-orange-500 to-orange-600',
    shadowColor: 'rgba(249, 115, 22, 0.4)',
  },
  homework: {
    icon: BookOpen,
    label: 'واجبات',
    gradient: 'from-green-500 to-green-600',
    shadowColor: 'rgba(34, 197, 94, 0.4)',
  },
  announcement: {
    icon: Bell,
    label: 'إعلانات',
    gradient: 'from-purple-500 to-purple-600',
    shadowColor: 'rgba(168, 85, 247, 0.4)',
  },
  attendance: {
    icon: Users,
    label: 'حضور',
    gradient: 'from-teal-500 to-teal-600',
    shadowColor: 'rgba(20, 184, 166, 0.4)',
  },
};

export const FloatingNotificationBadge = ({ notifications }: FloatingNotificationBadgeProps) => {
  const activeNotifications = notifications.filter(n => n.count > 0);
  
  if (activeNotifications.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-4 z-50 flex flex-col-reverse gap-3">
      <AnimatePresence>
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
              initial={{ scale: 0, opacity: 0, x: -20 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0, opacity: 0, x: -20 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 25,
                delay: index * 0.05
              }}
              className="cursor-pointer touch-feedback"
              onClick={handleClick}
              whileTap={{ scale: 0.9 }}
            >
              <div className="relative flex items-center gap-2">
                <motion.div 
                  className={`bg-gradient-to-r ${config.gradient} rounded-full p-3 shadow-xl hover:shadow-2xl transition-all min-w-[48px] min-h-[48px] flex items-center justify-center`}
                  animate={{ 
                    boxShadow: [
                      `0 8px 24px ${config.shadowColor}`,
                      `0 12px 32px ${config.shadowColor}`,
                      `0 8px 24px ${config.shadowColor}`
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </motion.div>
                
                {/* Label */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`bg-gradient-to-r ${config.gradient} text-white text-xs font-medium px-2 py-1 rounded-full shadow-md`}
                >
                  {config.label}
                </motion.div>

                {/* Count Badge */}
                <Badge 
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white border-2 border-background min-w-[22px] h-[22px] flex items-center justify-center px-1.5 animate-pulse font-bold text-xs shadow-lg"
                >
                  {notification.count > 99 ? '99+' : notification.count}
                </Badge>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
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
