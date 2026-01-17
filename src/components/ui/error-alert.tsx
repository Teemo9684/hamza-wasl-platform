import { AlertTriangle, XCircle, Info, CheckCircle2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export type AlertType = 'error' | 'warning' | 'info' | 'success';

interface ErrorAlertProps {
  type?: AlertType;
  title: string;
  message: string;
  details?: string;
  onClose?: () => void;
  className?: string;
}

const alertConfig = {
  error: {
    icon: XCircle,
    bgClass: "bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent",
    borderClass: "border-red-500/30",
    iconClass: "text-red-500",
    titleClass: "text-red-600 dark:text-red-400",
    glowClass: "shadow-red-500/20",
  },
  warning: {
    icon: AlertTriangle,
    bgClass: "bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent",
    borderClass: "border-amber-500/30",
    iconClass: "text-amber-500",
    titleClass: "text-amber-600 dark:text-amber-400",
    glowClass: "shadow-amber-500/20",
  },
  info: {
    icon: Info,
    bgClass: "bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent",
    borderClass: "border-blue-500/30",
    iconClass: "text-blue-500",
    titleClass: "text-blue-600 dark:text-blue-400",
    glowClass: "shadow-blue-500/20",
  },
  success: {
    icon: CheckCircle2,
    bgClass: "bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent",
    borderClass: "border-emerald-500/30",
    iconClass: "text-emerald-500",
    titleClass: "text-emerald-600 dark:text-emerald-400",
    glowClass: "shadow-emerald-500/20",
  },
};

export const ErrorAlert = ({
  type = 'error',
  title,
  message,
  details,
  onClose,
  className,
}: ErrorAlertProps) => {
  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-2xl border-2 p-4 backdrop-blur-sm",
        "shadow-lg",
        config.bgClass,
        config.borderClass,
        config.glowClass,
        className
      )}
      dir="rtl"
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/5 to-transparent pointer-events-none" />
      
      <div className="relative flex gap-4">
        {/* Icon container with pulse animation */}
        <div className="flex-shrink-0">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl",
              "bg-gradient-to-br from-white/10 to-transparent",
              "border border-white/10"
            )}
          >
            <Icon className={cn("w-6 h-6", config.iconClass)} />
          </motion.div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <motion.h4
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className={cn("font-bold text-lg mb-1", config.titleClass)}
          >
            {title}
          </motion.h4>
          
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-foreground/80 text-sm leading-relaxed"
          >
            {message}
          </motion.p>

          {details && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ delay: 0.25 }}
              className="mt-3 p-3 rounded-lg bg-black/5 dark:bg-white/5 border border-white/10"
            >
              <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                {details}
              </p>
            </motion.div>
          )}
        </div>

        {/* Close button */}
        {onClose && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={onClose}
            className={cn(
              "flex-shrink-0 p-1.5 rounded-lg transition-colors",
              "hover:bg-white/10 text-muted-foreground hover:text-foreground"
            )}
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

// Arabic error message mappings for common Supabase errors
export const getArabicErrorMessage = (error: string): { title: string; message: string; details?: string } => {
  const errorMappings: Record<string, { title: string; message: string; details?: string }> = {
    // Authentication errors
    "Invalid login credentials": {
      title: "بيانات الدخول غير صحيحة",
      message: "البريد الإلكتروني أو كلمة المرور التي أدخلتها غير صحيحة. يرجى التحقق من البيانات والمحاولة مرة أخرى.",
      details: "تأكد من كتابة البريد الإلكتروني بشكل صحيح وأن كلمة المرور تحتوي على الأحرف الصحيحة."
    },
    "Email not confirmed": {
      title: "البريد الإلكتروني غير مؤكد",
      message: "يجب تأكيد بريدك الإلكتروني قبل تسجيل الدخول. تحقق من صندوق الوارد أو مجلد الرسائل غير المرغوب فيها.",
      details: "إذا لم تجد رسالة التأكيد، يمكنك طلب إرسالها مرة أخرى."
    },
    "User already registered": {
      title: "المستخدم مسجل مسبقاً",
      message: "هذا البريد الإلكتروني مسجل بالفعل في النظام. جرب تسجيل الدخول بدلاً من إنشاء حساب جديد.",
      details: "إذا نسيت كلمة المرور، يمكنك استخدام خيار 'نسيت كلمة المرور'."
    },
    "Password should be at least": {
      title: "كلمة المرور ضعيفة",
      message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على أحرف كبيرة وصغيرة وأرقام.",
      details: "مثال: MyPassword123"
    },
    "Email rate limit exceeded": {
      title: "تم تجاوز الحد المسموح",
      message: "لقد أرسلت الكثير من الطلبات. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.",
      details: "عادة ما يستغرق الأمر بضع دقائق قبل أن تتمكن من المحاولة مرة أخرى."
    },
    "Signups not allowed": {
      title: "التسجيل غير متاح",
      message: "التسجيل في التطبيق غير متاح حالياً. تواصل مع إدارة المدرسة للمساعدة.",
    },
    
    // Network errors
    "Failed to fetch": {
      title: "خطأ في الاتصال",
      message: "تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.",
      details: "إذا استمرت المشكلة، قد يكون هناك صيانة جارية على الخادم."
    },
    "Network request failed": {
      title: "فشل الاتصال بالشبكة",
      message: "لا يوجد اتصال بالإنترنت أو أن الاتصال ضعيف جداً.",
      details: "تحقق من إعدادات WiFi أو بيانات الهاتف."
    },
    
    // Validation errors
    "national_school_id": {
      title: "خطأ في الرقم الوطني",
      message: "الرقم الوطني للتلميذ غير صحيح أو غير موجود في النظام.",
      details: "تأكد من إدخال الرقم الوطني بالشكل الصحيح كما هو مسجل في المدرسة."
    },
    "Student not found": {
      title: "التلميذ غير موجود",
      message: "لم يتم العثور على تلميذ بهذا الرقم الوطني في النظام.",
      details: "تواصل مع إدارة المدرسة للتأكد من أن التلميذ مسجل في النظام."
    },
    
    // Permission errors
    "permission denied": {
      title: "صلاحيات غير كافية",
      message: "ليس لديك الصلاحية للقيام بهذا الإجراء.",
      details: "إذا كنت تعتقد أن هذا خطأ، تواصل مع إدارة المدرسة."
    },
    "not authorized": {
      title: "غير مصرح",
      message: "يجب تسجيل الدخول للوصول إلى هذه الصفحة.",
    },
    
    // General errors
    "unexpected error": {
      title: "خطأ غير متوقع",
      message: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقاً.",
      details: "إذا تكررت المشكلة، تواصل مع الدعم الفني."
    },
  };

  // Find matching error
  const errorLower = error.toLowerCase();
  for (const [key, value] of Object.entries(errorMappings)) {
    if (errorLower.includes(key.toLowerCase())) {
      return value;
    }
  }

  // Default error message
  return {
    title: "حدث خطأ",
    message: error || "حدث خطأ غير معروف. يرجى المحاولة مرة أخرى.",
  };
};
