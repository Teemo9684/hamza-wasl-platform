import { MessageCircle, FileText, BookOpen, Users, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { mediumHaptic } from "@/utils/haptics";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { useNotifications } from "@/contexts/NotificationContext";
import { useEffect, useState } from "react";

export type NotificationType = 'messages' | 'documents' | 'homework' | 'attendance' | 'announcements';

interface NotificationItem {
  type: NotificationType;
  count: number;
  path: string;
  clearSection?: 'messages' | 'attendance' | 'homework' | 'documents';
}

const notificationConfig: Record<NotificationType, { 
  icon: typeof MessageCircle; 
  label: string;
  gradient: string;
  shadowColor: string;
}> = {
  messages: {
    icon: MessageCircle,
    label: 'رسائل',
    gradient: 'from-blue-500 via-blue-600 to-indigo-600',
    shadowColor: 'rgba(59, 130, 246, 0.5)',
  },
  documents: {
    icon: FileText,
    label: 'وثائق',
    gradient: 'from-orange-500 via-orange-600 to-amber-600',
    shadowColor: 'rgba(249, 115, 22, 0.5)',
  },
  homework: {
    icon: BookOpen,
    label: 'واجبات',
    gradient: 'from-emerald-500 via-green-600 to-teal-600',
    shadowColor: 'rgba(34, 197, 94, 0.5)',
  },
  attendance: {
    icon: Users,
    label: 'حضور',
    gradient: 'from-purple-500 via-violet-600 to-fuchsia-600',
    shadowColor: 'rgba(168, 85, 247, 0.5)',
  },
  announcements: {
    icon: Bell,
    label: 'إعلانات',
    gradient: 'from-rose-500 via-pink-600 to-red-600',
    shadowColor: 'rgba(244, 63, 94, 0.5)',
  },
};

interface FloatingQuickNotificationProps {
  userRole: 'parent' | 'teacher' | 'admin';
}

export const FloatingQuickNotification = ({ userRole }: FloatingQuickNotificationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { counts, clearSection } = useNotifications();
  const [dismissed, setDismissed] = useState<Set<NotificationType>>(new Set());
  
  // Reset dismissed when counts change
  useEffect(() => {
    setDismissed(new Set());
  }, [counts.messages, counts.attendance, counts.homework, counts.documents]);

  // Build notifications based on user role
  const getNotifications = (): NotificationItem[] => {
    const notifications: NotificationItem[] = [];
    
    if (userRole === 'parent') {
      if (counts.messages > 0) {
        notifications.push({ 
          type: 'messages', 
          count: counts.messages, 
          path: '/dashboard/parent/messages',
          clearSection: 'messages'
        });
      }
      if (counts.attendance > 0) {
        notifications.push({ 
          type: 'attendance', 
          count: counts.attendance, 
          path: '/dashboard/parent/attendance',
          clearSection: 'attendance'
        });
      }
      if (counts.homework > 0) {
        notifications.push({ 
          type: 'homework', 
          count: counts.homework, 
          path: '/dashboard/parent/homework',
          clearSection: 'homework'
        });
      }
      if (counts.documents > 0) {
        notifications.push({ 
          type: 'documents', 
          count: counts.documents, 
          path: '/dashboard/parent/documents',
          clearSection: 'documents'
        });
      }
    } else if (userRole === 'teacher') {
      if (counts.messages > 0) {
        notifications.push({ 
          type: 'messages', 
          count: counts.messages, 
          path: '/dashboard/teacher/messages',
          clearSection: 'messages'
        });
      }
    }
    
    return notifications;
  };

  const notifications = getNotifications();
  
  // Filter out notifications for current page and dismissed ones
  const filteredNotifications = notifications.filter(n => {
    const isCurrentPage = location.pathname === n.path || 
                          location.pathname.includes(n.type);
    return !isCurrentPage && !dismissed.has(n.type);
  });
  
  if (filteredNotifications.length === 0) return null;

  const handleClick = (notification: NotificationItem) => {
    mediumHaptic();
    if (notification.clearSection) {
      clearSection(notification.clearSection);
    }
    setDismissed(prev => new Set([...prev, notification.type]));
    navigate(notification.path);
  };

  return (
    <div className="fixed bottom-24 left-4 z-50 flex flex-col-reverse gap-2">
      <AnimatePresence mode="popLayout">
        {filteredNotifications.map((notification, index) => {
          const config = notificationConfig[notification.type];
          const Icon = config.icon;

          return (
            <motion.div
              key={notification.type}
              layout
              initial={{ scale: 0, opacity: 0, x: -50 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0, opacity: 0, x: -50 }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 25,
                delay: index * 0.05
              }}
              className="cursor-pointer touch-feedback group"
              onClick={() => handleClick(notification)}
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="relative flex items-center">
                {/* Main Badge */}
                <motion.div 
                  className={cn(
                    "relative bg-gradient-to-br rounded-2xl shadow-xl transition-all overflow-hidden",
                    "px-4 py-2.5 flex items-center gap-2.5",
                    config.gradient
                  )}
                  animate={{ 
                    boxShadow: [
                      `0 4px 20px ${config.shadowColor}`,
                      `0 8px 30px ${config.shadowColor}`,
                      `0 4px 20px ${config.shadowColor}`
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5 }}
                  />
                  
                  <div className="relative flex items-center gap-2.5">
                    <Icon className="w-5 h-5 text-white drop-shadow-md" />
                    
                    <span className="text-white text-sm font-bold whitespace-nowrap">
                      {config.label}
                    </span>
                    
                    {/* Count Badge */}
                    <Badge 
                      className={cn(
                        "bg-white text-primary-foreground shadow-lg font-bold",
                        "min-w-[24px] h-[24px] text-xs px-1.5 rounded-full",
                        "flex items-center justify-center animate-pulse"
                      )}
                    >
                      {notification.count > 99 ? '99+' : notification.count}
                    </Badge>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
