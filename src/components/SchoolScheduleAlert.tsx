import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, School, Home } from 'lucide-react';
import { playNotificationSound } from '@/utils/pushNotifications';
import { heavyHaptic } from '@/utils/haptics';

interface ScheduleAlertData {
  title: string;
  message: string;
  type: 'start' | 'end';
  session: 'morning' | 'afternoon';
  time: string;
}

export const SchoolScheduleAlert = () => {
  const [alert, setAlert] = useState<ScheduleAlertData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const dismissAlert = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => setAlert(null), 300);
  }, []);

  useEffect(() => {
    const handleScheduleAlert = (event: CustomEvent<ScheduleAlertData>) => {
      setAlert(event.detail);
      setIsVisible(true);
      
      // Auto-dismiss after 8 seconds
      const timer = setTimeout(dismissAlert, 8000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('school-schedule-alert', handleScheduleAlert as EventListener);
    return () => {
      window.removeEventListener('school-schedule-alert', handleScheduleAlert as EventListener);
    };
  }, [dismissAlert]);

  if (!alert) return null;

  const isStart = alert.type === 'start';
  const Icon = isStart ? School : Home;
  
  const gradientClass = isStart 
    ? 'from-emerald-500 via-green-500 to-teal-500'
    : 'from-orange-500 via-amber-500 to-yellow-500';
  
  const glowColor = isStart ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -100, opacity: 0, scale: 0.9 }}
          transition={{ 
            type: 'spring', 
            stiffness: 300, 
            damping: 25,
            mass: 0.8
          }}
          className="fixed top-0 left-0 right-0 z-[9999] p-3 pt-safe"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}
        >
          <motion.div
            className={`relative mx-auto max-w-md rounded-2xl bg-gradient-to-r ${gradientClass} p-4 shadow-2xl`}
            style={{ 
              boxShadow: `0 20px 50px -10px ${glowColor}`,
            }}
            layoutId="school-alert"
          >
            {/* Animated background pulse */}
            <motion.div
              className="absolute inset-0 rounded-2xl bg-white/10"
              animate={{ 
                opacity: [0.1, 0.3, 0.1],
                scale: [1, 1.02, 1]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
            
            {/* Content */}
            <div className="relative flex items-start gap-3">
              {/* Icon with animation */}
              <motion.div
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm"
                animate={{ 
                  rotate: [0, -5, 5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 0.6, 
                  repeat: 3,
                  ease: 'easeInOut'
                }}
              >
                <Icon className="h-6 w-6 text-white" />
              </motion.div>
              
              {/* Text content */}
              <div className="flex-1 text-right" dir="rtl">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-white/80" />
                  <span className="text-xs font-medium text-white/80">
                    {alert.time}
                  </span>
                </div>
                <h3 className="mt-1 text-lg font-bold text-white">
                  {alert.title}
                </h3>
                <p className="mt-0.5 text-sm text-white/90">
                  {alert.message}
                </p>
              </div>
              
              {/* Close button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={dismissAlert}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>
            
            {/* Progress bar */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl bg-white/30"
            >
              <motion.div
                className="h-full rounded-b-2xl bg-white"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 8, ease: 'linear' }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SchoolScheduleAlert;
