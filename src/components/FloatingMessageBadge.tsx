import { MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { mediumHaptic } from "@/utils/haptics";

interface FloatingMessageBadgeProps {
  unreadCount: number;
  onClick?: () => void;
}

export const FloatingMessageBadge = ({ unreadCount, onClick }: FloatingMessageBadgeProps) => {
  const handleClick = () => {
    mediumHaptic();
    onClick?.();
  };

  return (
    <AnimatePresence>
      {unreadCount > 0 && (
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-24 left-4 z-50 cursor-pointer touch-feedback"
          onClick={handleClick}
          whileTap={{ scale: 0.9 }}
        >
          <div className="relative">
            <motion.div 
              className="bg-gradient-primary rounded-full p-4 shadow-xl hover:shadow-2xl transition-all min-w-[56px] min-h-[56px] flex items-center justify-center"
              animate={{ 
                boxShadow: [
                  "0 10px 30px rgba(139, 92, 246, 0.3)",
                  "0 15px 40px rgba(139, 92, 246, 0.5)",
                  "0 10px 30px rgba(139, 92, 246, 0.3)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <MessageCircle className="w-7 h-7 text-white" />
            </motion.div>
            <Badge 
              className="absolute -top-2 -right-2 bg-red-500 text-white border-2 border-background min-w-[26px] h-[26px] flex items-center justify-center px-2 animate-pulse font-bold text-sm shadow-lg"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
