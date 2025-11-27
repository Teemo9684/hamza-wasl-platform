import { MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface FloatingMessageBadgeProps {
  unreadCount: number;
  onClick?: () => void;
}

export const FloatingMessageBadge = ({ unreadCount, onClick }: FloatingMessageBadgeProps) => {
  return (
    <AnimatePresence>
      {unreadCount > 0 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-20 left-6 z-50 cursor-pointer"
          onClick={onClick}
        >
          <div className="relative">
            <div className="bg-gradient-primary rounded-full p-4 shadow-lg hover:shadow-xl transition-shadow">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <Badge 
              className="absolute -top-2 -right-2 bg-red-500 text-white border-2 border-background min-w-[24px] h-6 flex items-center justify-center px-2 animate-pulse"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
