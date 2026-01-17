import { toast } from "sonner";
import { errorHaptic, warningHaptic } from "@/utils/haptics";

// Arabic error message mappings for common errors
const errorMappings: Record<string, { title: string; description: string }> = {
  // Authentication errors
  "invalid login credentials": {
    title: "❌ بيانات الدخول غير صحيحة",
    description: "البريد الإلكتروني أو كلمة المرور غير صحيحة. تحقق من البيانات وحاول مجدداً.",
  },
  "email not confirmed": {
    title: "📧 البريد غير مؤكد",
    description: "يجب تأكيد بريدك الإلكتروني أولاً. تحقق من صندوق الوارد.",
  },
  "user already registered": {
    title: "👤 المستخدم موجود مسبقاً",
    description: "هذا البريد الإلكتروني مسجل بالفعل. جرب تسجيل الدخول بدلاً من إنشاء حساب جديد.",
  },
  "password should be at least": {
    title: "🔐 كلمة المرور ضعيفة",
    description: "كلمة المرور يجب أن تكون 8 أحرف على الأقل مع أحرف كبيرة وصغيرة وأرقام.",
  },
  "email rate limit exceeded": {
    title: "⏳ انتظر قليلاً",
    description: "لقد أرسلت الكثير من الطلبات. انتظر بضع دقائق ثم حاول مجدداً.",
  },
  "signups not allowed": {
    title: "🚫 التسجيل غير متاح",
    description: "التسجيل غير متاح حالياً. تواصل مع إدارة المدرسة للمساعدة.",
  },
  
  // Network errors
  "failed to fetch": {
    title: "📡 خطأ في الاتصال",
    description: "تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت وحاول مجدداً.",
  },
  "network request failed": {
    title: "📶 لا يوجد اتصال",
    description: "تحقق من اتصالك بالإنترنت أو WiFi وحاول مجدداً.",
  },
  "timeout": {
    title: "⏱️ انتهت المهلة",
    description: "الاتصال بطيء جداً. حاول مجدداً لاحقاً.",
  },
  
  // Student/Parent errors
  "student not found": {
    title: "🔍 التلميذ غير موجود",
    description: "لم يتم العثور على تلميذ بهذا الرقم الوطني. تواصل مع إدارة المدرسة.",
  },
  "national_school_id": {
    title: "📝 خطأ في الرقم الوطني",
    description: "تأكد من إدخال الرقم الوطني بالشكل الصحيح كما هو مسجل في المدرسة.",
  },
  
  // Permission errors
  "permission denied": {
    title: "🔒 صلاحيات غير كافية",
    description: "ليس لديك الصلاحية للقيام بهذا الإجراء.",
  },
  "not authorized": {
    title: "⚠️ غير مصرح",
    description: "يجب تسجيل الدخول للوصول إلى هذه الصفحة.",
  },
  "row level security": {
    title: "🔐 خطأ في الصلاحيات",
    description: "ليس لديك صلاحية الوصول لهذه البيانات.",
  },
  
  // Account status
  "account not approved": {
    title: "⏳ الحساب قيد المراجعة",
    description: "حسابك قيد المراجعة من قبل الإدارة. انتظر حتى يتم اعتماده.",
  },
  "not a parent account": {
    title: "👤 حساب غير صحيح",
    description: "هذا الحساب ليس حساب ولي أمر. تأكد من استخدام الحساب الصحيح.",
  },
  "not a teacher account": {
    title: "👨‍🏫 حساب غير صحيح",
    description: "هذا الحساب ليس حساب معلم. تأكد من استخدام الحساب الصحيح.",
  },
  
  // Validation errors
  "passwords do not match": {
    title: "🔑 كلمتا المرور غير متطابقتين",
    description: "تأكد من كتابة نفس كلمة المرور في كلا الحقلين.",
  },
  "invalid email": {
    title: "📧 بريد إلكتروني غير صحيح",
    description: "تأكد من كتابة البريد الإلكتروني بالشكل الصحيح (مثال: name@email.com).",
  },
  "required field": {
    title: "📋 حقل مطلوب",
    description: "يرجى ملء جميع الحقول المطلوبة.",
  },
};

/**
 * Show a beautiful error toast with Arabic message
 */
export const showError = (error: string | Error | unknown, fallbackTitle?: string) => {
  // Extract error message
  let errorMessage = "";
  if (typeof error === "string") {
    errorMessage = error;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (error && typeof error === "object" && "message" in error) {
    errorMessage = String((error as { message: unknown }).message);
  }
  
  const errorLower = errorMessage.toLowerCase();
  
  // Find matching error
  let matched: { title: string; description: string } | null = null;
  for (const [key, value] of Object.entries(errorMappings)) {
    if (errorLower.includes(key)) {
      matched = value;
      break;
    }
  }
  
  // Trigger haptic feedback
  errorHaptic();
  
  // Show toast
  if (matched) {
    toast.error(matched.title, {
      description: matched.description,
    });
  } else {
    toast.error(fallbackTitle || "❌ حدث خطأ", {
      description: errorMessage || "حدث خطأ غير متوقع. حاول مجدداً لاحقاً.",
    });
  }
};

/**
 * Show a warning toast
 */
export const showWarning = (title: string, description?: string) => {
  warningHaptic();
  toast.warning(`⚠️ ${title}`, {
    description,
  });
};

/**
 * Show a success toast
 */
export const showSuccess = (title: string, description?: string) => {
  toast.success(`✅ ${title}`, {
    description,
  });
};

/**
 * Show an info toast
 */
export const showInfo = (title: string, description?: string) => {
  toast.info(`ℹ️ ${title}`, {
    description,
  });
};

// Pre-defined error messages for common scenarios
export const ErrorMessages = {
  INVALID_CREDENTIALS: () => showError("invalid login credentials"),
  EMAIL_NOT_CONFIRMED: () => showError("email not confirmed"),
  USER_EXISTS: () => showError("user already registered"),
  PASSWORDS_MISMATCH: () => showError("passwords do not match"),
  NETWORK_ERROR: () => showError("failed to fetch"),
  STUDENT_NOT_FOUND: () => showError("student not found"),
  ACCOUNT_NOT_APPROVED: () => showError("account not approved"),
  NOT_PARENT_ACCOUNT: () => showError("not a parent account"),
  NOT_TEACHER_ACCOUNT: () => showError("not a teacher account"),
  PERMISSION_DENIED: () => showError("permission denied"),
  REQUIRED_FIELDS: () => showError("required field"),
};
