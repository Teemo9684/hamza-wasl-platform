import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLiveUpdate } from "@/hooks/useLiveUpdate";

export const UpdateNotificationBanner = () => {
  const {
    updateInfo,
    isDownloading,
    downloadProgress,
    applyUpdate,
    isNativeApp,
  } = useLiveUpdate(false); // Don't auto-check here, LiveUpdateChecker handles it

  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (updateInfo?.hasUpdate) {
      setDismissed(false);
    }
  }, [updateInfo?.version]);

  // Don't show if not native app, no update, or dismissed (unless mandatory)
  if (!isNativeApp || !updateInfo?.hasUpdate || (dismissed && !updateInfo?.isMandatory)) {
    return null;
  }

  const handleUpdate = async () => {
    await applyUpdate();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`mx-4 mt-2 rounded-xl overflow-hidden shadow-lg ${
          updateInfo.isMandatory 
            ? "bg-gradient-to-r from-red-600 to-red-500" 
            : "bg-gradient-to-r from-primary to-primary/80"
        } text-white`}
        dir="rtl"
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="flex-shrink-0"
              >
                <Sparkles className="w-5 h-5" />
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <p className="font-cairo font-semibold text-sm truncate">
                  {updateInfo.isMandatory ? "تحديث إلزامي متوفر!" : "تحديث جديد متوفر!"}
                </p>
                <p className="font-cairo text-xs text-white/80 truncate">
                  {updateInfo.releaseNotes || `الإصدار ${updateInfo.version}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {isDownloading ? (
                <div className="flex items-center gap-2 min-w-[140px]">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-xs font-cairo whitespace-nowrap">جارٍ التحديث...</span>
                </div>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleUpdate}
                    className="font-cairo text-xs bg-white text-primary hover:bg-white/90"
                  >
                    <Download className="w-4 h-4 ml-1" />
                    تحديث الآن
                  </Button>
                  
                  {!updateInfo.isMandatory && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDismissed(true)}
                      className="h-8 w-8 text-white hover:bg-white/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
