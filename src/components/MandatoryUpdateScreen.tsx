import { motion } from "framer-motion";
import { Download, RefreshCw, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface MandatoryUpdateScreenProps {
  version: string;
  releaseNotes?: string;
  isDownloading: boolean;
  downloadProgress: number;
  error: string | null;
  onRetry: () => void;
  isOnline: boolean;
}

/**
 * شاشة التحديث الإجباري - تُعرض عندما يكون هناك تحديث ضروري
 * لا يمكن للمستخدم تجاوزها حتى يتم التحديث
 */
export const MandatoryUpdateScreen = ({
  version,
  releaseNotes,
  isDownloading,
  downloadProgress,
  error,
  onRetry,
  isOnline,
}: MandatoryUpdateScreenProps) => {
  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5"
      dir="rtl"
    >
      {/* خلفية متحركة */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/2 -right-1/2 w-full h-full rounded-full bg-primary/5"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute -bottom-1/2 -left-1/2 w-full h-full rounded-full bg-primary/5"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* المحتوى الرئيسي */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="relative bg-card/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mx-4 max-w-md w-full border border-primary/20"
      >
        {/* أيقونة التحديث */}
        <div className="flex justify-center mb-6">
          <motion.div
            animate={isDownloading ? { rotate: 360 } : { scale: [1, 1.1, 1] }}
            transition={isDownloading ? { duration: 2, repeat: Infinity, ease: "linear" } : { duration: 2, repeat: Infinity }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30"
          >
            {isDownloading ? (
              <RefreshCw className="w-10 h-10 text-primary-foreground" />
            ) : error ? (
              <AlertTriangle className="w-10 h-10 text-primary-foreground" />
            ) : (
              <Download className="w-10 h-10 text-primary-foreground" />
            )}
          </motion.div>
        </div>

        {/* العنوان */}
        <h2 className="text-2xl font-bold text-center mb-2 text-foreground">
          تحديث مهم متوفر
        </h2>
        
        {/* رقم الإصدار */}
        <div className="text-center mb-4">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-lg">
            الإصدار {version}
          </span>
        </div>

        {/* ملاحظات الإصدار */}
        {releaseNotes && (
          <div className="bg-muted/50 rounded-xl p-4 mb-6 text-sm text-muted-foreground text-center leading-relaxed">
            {releaseNotes}
          </div>
        )}

        {/* حالة الاتصال */}
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 text-destructive mb-4 p-3 bg-destructive/10 rounded-xl"
          >
            <WifiOff className="w-5 h-5" />
            <span className="font-medium">لا يوجد اتصال بالإنترنت</span>
          </motion.div>
        )}

        {/* شريط التقدم */}
        {isDownloading && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>جاري التحميل...</span>
              <span className="font-mono">{downloadProgress}%</span>
            </div>
            <Progress value={downloadProgress} className="h-3" />
          </div>
        )}

        {/* رسالة الخطأ */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-destructive/10 text-destructive rounded-xl p-4 mb-6 text-center"
          >
            <p className="font-medium mb-1">حدث خطأ أثناء التحديث</p>
            <p className="text-sm opacity-80">{error}</p>
          </motion.div>
        )}

        {/* زر إعادة المحاولة */}
        {(error || !isDownloading) && isOnline && (
          <Button
            onClick={onRetry}
            className="w-full h-14 text-lg font-bold rounded-xl shadow-lg"
            disabled={isDownloading}
          >
            <RefreshCw className={`ml-2 w-5 h-5 ${isDownloading ? 'animate-spin' : ''}`} />
            {error ? 'إعادة المحاولة' : 'تحميل التحديث'}
          </Button>
        )}

        {/* رسالة انتظار الاتصال */}
        {!isOnline && (
          <div className="text-center text-muted-foreground">
            <Wifi className="w-8 h-8 mx-auto mb-2 animate-pulse" />
            <p>في انتظار الاتصال بالإنترنت...</p>
          </div>
        )}

        {/* ملاحظة */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          يجب تحديث التطبيق للاستمرار في استخدامه
        </p>
      </motion.div>
    </div>
  );
};
