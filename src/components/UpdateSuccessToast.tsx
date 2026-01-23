import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Sparkles, Download, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpdateSuccessToastProps {
  version: string;
  releaseNotes?: string;
  isVisible: boolean;
  onDismiss: () => void;
}

export const UpdateSuccessToast = ({ 
  version, 
  releaseNotes, 
  isVisible, 
  onDismiss 
}: UpdateSuccessToastProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 25 
          }}
          className="fixed top-4 left-4 right-4 z-[100] flex justify-center"
          dir="rtl"
        >
          <motion.div
            className={cn(
              "relative overflow-hidden rounded-3xl",
              "bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600",
              "shadow-2xl shadow-emerald-500/40",
              "max-w-md w-full"
            )}
            onClick={onDismiss}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Animated background shimmer */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
            
            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-white/30"
                  style={{
                    left: `${15 + i * 15}%`,
                    bottom: '10%',
                  }}
                  animate={{
                    y: [-10, -40, -10],
                    opacity: [0.3, 0.7, 0.3],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
            
            {/* Content */}
            <div className="relative p-5">
              <div className="flex items-start gap-4">
                {/* Success Icon with glow */}
                <motion.div 
                  className="relative flex-shrink-0"
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                >
                  <div className="absolute inset-0 bg-white/30 rounded-full blur-lg animate-pulse" />
                  <div className="relative bg-white/20 rounded-2xl p-3 backdrop-blur-sm">
                    <CheckCircle2 className="w-8 h-8 text-white drop-shadow-lg" />
                  </div>
                  <motion.div
                    className="absolute -top-1 -right-1"
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-5 h-5 text-yellow-300 drop-shadow-md" />
                  </motion.div>
                </motion.div>
                
                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-yellow-300" />
                      <h3 className="text-lg font-bold text-white">
                        تم التحديث بنجاح!
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Download className="w-4 h-4 text-white/70" />
                      <p className="text-white/90 text-sm">
                        الإصدار الجديد: 
                        <span className="font-bold text-white mr-1 bg-white/20 px-2 py-0.5 rounded-full">
                          {version}
                        </span>
                      </p>
                    </div>
                    
                    {releaseNotes && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-white/80 text-xs leading-relaxed border-t border-white/20 pt-2 mt-2"
                      >
                        {releaseNotes}
                      </motion.p>
                    )}
                  </motion.div>
                </div>
              </div>
              
              {/* Progress bar auto-dismiss indicator */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-1 bg-white/30"
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 5, ease: "linear" }}
                style={{ transformOrigin: "left" }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
