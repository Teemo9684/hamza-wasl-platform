import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, ArrowRight, Mail, Lock, User, Phone, Hash, Eye, EyeOff, Info, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { parentRegistrationSchema } from "@/lib/validations";
import { showError, showSuccess, showWarning } from "@/utils/errorMessages";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Password strength checker
const checkPasswordStrength = (password: string) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
  };
  
  const passedChecks = Object.values(checks).filter(Boolean).length;
  
  return {
    checks,
    strength: passedChecks === 4 ? 'strong' : passedChecks >= 2 ? 'medium' : 'weak',
    passedChecks,
  };
};

// Arabic error messages for registration (no error codes - user friendly)
const getArabicRegistrationError = (error: any): { title: string; description: string } => {
  const errorMessage = typeof error === 'string' ? error : error?.message || '';
  const errorLower = errorMessage.toLowerCase();

  // Zod validation errors
  if (error?.errors) {
    const zodError = error.errors[0];
    if (zodError?.path?.includes('email')) {
      return { title: "البريد الإلكتروني غير صحيح", description: "تأكد من كتابة البريد بالشكل الصحيح (مثال: name@email.com)" };
    }
    if (zodError?.path?.includes('password')) {
      return { 
        title: "كلمة المرور ضعيفة", 
        description: "كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على حرف كبير وحرف صغير ورقم" 
      };
    }
    if (zodError?.path?.includes('phone')) {
      return { title: "رقم الهاتف غير صحيح", description: "تأكد من إدخال رقم هاتف صحيح (10 أرقام على الأقل)" };
    }
    if (zodError?.path?.includes('full_name')) {
      return { title: "الاسم مطلوب", description: "يرجى إدخال الاسم الكامل" };
    }
    if (zodError?.path?.includes('national_school_id')) {
      return { title: "الرقم المدرسي غير صحيح", description: "الرقم المدرسي يجب أن يحتوي على أحرف وأرقام فقط" };
    }
    return { title: "بيانات غير مكتملة", description: "يرجى التحقق من جميع الحقول" };
  }

  // Supabase auth errors
  if (errorLower.includes('user already registered') || errorLower.includes('already been registered')) {
    return { 
      title: "البريد مسجل مسبقاً", 
      description: "هذا البريد الإلكتروني مستخدم بالفعل. جرب تسجيل الدخول أو استخدم بريد آخر" 
    };
  }
  if (errorLower.includes('invalid email')) {
    return { title: "البريد غير صالح", description: "تأكد من كتابة البريد الإلكتروني بالشكل الصحيح" };
  }
  if (errorLower.includes('password')) {
    return { 
      title: "كلمة المرور ضعيفة", 
      description: "كلمة المرور يجب أن تكون 8 أحرف على الأقل مع حرف كبير وصغير ورقم" 
    };
  }
  if (errorLower.includes('rate limit') || errorLower.includes('too many')) {
    return { 
      title: "انتظر قليلاً", 
      description: "لقد حاولت كثيراً. انتظر بضع دقائق ثم حاول مجدداً" 
    };
  }
  if (errorLower.includes('network') || errorLower.includes('fetch') || errorLower.includes('failed to fetch')) {
    return { 
      title: "خطأ في الاتصال", 
      description: "تحقق من اتصالك بالإنترنت وحاول مجدداً" 
    };
  }
  if (errorLower.includes('student not found') || errorLower.includes('التلميذ غير موجود')) {
    return { 
      title: "التلميذ غير موجود", 
      description: "لم يتم العثور على تلميذ بهذا الرقم المدرسي. تأكد من صحة الرقم أو تواصل مع إدارة المدرسة" 
    };
  }

  return { title: "حدث خطأ", description: "حدث خطأ غير متوقع. حاول مجدداً" };
};

const RegisterParent = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    nationalSchoolId: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Student validation state
  const [studentValidation, setStudentValidation] = useState<{
    isChecking: boolean;
    isValid: boolean | null;
    studentName: string | null;
    error: string | null;
  }>({
    isChecking: false,
    isValid: null,
    studentName: null,
    error: null,
  });

  const passwordStrength = checkPasswordStrength(formData.password);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  // Debounced student ID validation
  const validateStudentId = useCallback(async (schoolId: string) => {
    if (!schoolId || schoolId.length < 10) {
      setStudentValidation({
        isChecking: false,
        isValid: null,
        studentName: null,
        error: schoolId.length > 0 && schoolId.length < 10 ? "الرقم المدرسي يجب أن يكون 16 رقم" : null,
      });
      return;
    }

    setStudentValidation(prev => ({ ...prev, isChecking: true, error: null }));

    try {
      const { data: studentData, error: studentError } = await supabase
        .rpc('check_student_exists', { _national_school_id: schoolId.trim() });

      if (studentError) {
        setStudentValidation({
          isChecking: false,
          isValid: false,
          studentName: null,
          error: "حدث خطأ أثناء التحقق",
        });
        return;
      }

      if (!studentData || studentData.length === 0) {
        setStudentValidation({
          isChecking: false,
          isValid: false,
          studentName: null,
          error: "لم يتم العثور على تلميذ بهذا الرقم",
        });
      } else {
        setStudentValidation({
          isChecking: false,
          isValid: true,
          studentName: studentData[0].student_name,
          error: null,
        });
      }
    } catch (error) {
      setStudentValidation({
        isChecking: false,
        isValid: false,
        studentName: null,
        error: "حدث خطأ أثناء التحقق",
      });
    }
  }, []);

  // Debounce effect for student ID validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.nationalSchoolId) {
        validateStudentId(formData.nationalSchoolId);
      } else {
        setStudentValidation({
          isChecking: false,
          isValid: null,
          studentName: null,
          error: null,
        });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.nationalSchoolId, validateStudentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate form data
      const validatedData = parentRegistrationSchema.parse({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        national_school_id: formData.nationalSchoolId,
        password: formData.password,
      });

      if (formData.password !== formData.confirmPassword) {
        showError("passwords do not match");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
          },
          emailRedirectTo: `${window.location.origin}/dashboard/parent`,
        },
      });

      if (error) throw error;

      if (data.user) {
        // First check if the student exists using RPC function (bypasses RLS for new users)
        const { data: studentData, error: studentError } = await supabase
          .rpc('check_student_exists', { _national_school_id: formData.nationalSchoolId.trim() });

        if (studentError || !studentData || studentData.length === 0) {
          const errorInfo = getArabicRegistrationError("student not found");
          showError(errorInfo.title, errorInfo.description);
          setIsLoading(false);
          return;
        }

        const student = studentData[0];

        // Link parent to student using national school ID
        const { error: linkError } = await supabase.rpc('link_parent_to_student', {
          _parent_id: data.user.id,
          _national_school_id: formData.nationalSchoolId.trim(),
        });

        if (linkError) {
          const errorInfo = getArabicRegistrationError(linkError);
          showError(errorInfo.title, errorInfo.description);
          setIsLoading(false);
          return;
        }

        showSuccess("تم التسجيل بنجاح", `تم ربط حسابك بابنك "${student.student_name}" بنجاح. انتظر اعتماد حسابك من الإدارة.`);
        
        navigate("/login/parent");
      }
    } catch (error: any) {
      const errorInfo = getArabicRegistrationError(error);
      showError(errorInfo.title, errorInfo.description);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 animated-bg opacity-90" />

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-6 flex flex-col items-center justify-start min-h-screen pt-4">
        <div className="max-w-md w-full">
          {/* Back Button */}
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            className="mb-6 text-white hover:bg-white/10 font-cairo"
          >
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة للرئيسية
          </Button>

          {/* Registration Form */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl slide-in-up">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-3">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 font-cairo text-primary">
                تسجيل حساب ولي أمر
              </h1>
              <p className="text-foreground/70 text-center font-cairo text-sm">
                أنشئ حسابك لمتابعة أبنائك
              </p>
            </div>

            {/* Important Notice */}
            <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-amber-700 dark:text-amber-300 text-sm font-cairo">
                  <span className="font-semibold">تنبيه:</span> بعد التسجيل، يجب الانتظار حتى تتم الموافقة على حسابك من قبل الإدارة
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} autoComplete="on" className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="font-cairo text-foreground text-sm">
                  الاسم الكامل
                </Label>
                <div className="relative">
                  <User className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="مثال: محمد أحمد بن علي"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="pr-10 font-cairo h-10"
                    dir="rtl"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="font-cairo text-foreground text-sm">
                  البريد الإلكتروني
                </Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pr-10 font-cairo h-10 text-left"
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="font-cairo text-foreground text-sm">
                  رقم الهاتف
                </Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="tel"
                    type="tel"
                    autoComplete="tel"
                    placeholder="0555123456"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pr-10 font-cairo h-10 text-left"
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              {/* National School ID with Explanation */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label htmlFor="nationalSchoolId" className="font-cairo text-foreground text-sm">
                    الرقم المدرسي للتلميذ
                  </Label>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <button 
                        type="button" 
                        className="text-primary hover:text-primary/80 p-1 rounded-full hover:bg-primary/10 transition-colors"
                        onClick={(e) => e.preventDefault()}
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center" className="max-w-xs p-3 font-cairo text-right z-50">
                      <p className="text-sm leading-relaxed">
                        <span className="font-semibold text-primary">الرقم المدرسي</span> موجود في:
                        <br />• 📄 كشف النقاط
                        <br />• 📜 الشهادة المدرسية
                        <br />• 🏫 يمكنك طلبه من إدارة المدرسة
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <Hash className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="nationalSchoolId"
                    type="text"
                    placeholder="**************** (16 رقم)"
                    value={formData.nationalSchoolId}
                    onChange={(e) => setFormData({ ...formData, nationalSchoolId: e.target.value.replace(/\D/g, '') })}
                    className={`pr-10 pl-10 font-cairo h-10 text-left ${
                      studentValidation.isValid === true 
                        ? 'border-green-500 focus-visible:ring-green-500' 
                        : studentValidation.isValid === false 
                        ? 'border-red-500 focus-visible:ring-red-500' 
                        : ''
                    }`}
                    dir="ltr"
                    maxLength={16}
                    required
                  />
                  {/* Validation indicator */}
                  <div className="absolute left-3 top-2.5">
                    {studentValidation.isChecking ? (
                      <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                    ) : studentValidation.isValid === true ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : studentValidation.isValid === false ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : null}
                  </div>
                </div>
                
                {/* Validation message */}
                {studentValidation.isValid === true && studentValidation.studentName && (
                  <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <p className="text-green-700 dark:text-green-400 text-sm font-cairo">
                      تم العثور على: <span className="font-semibold">{studentValidation.studentName}</span>
                    </p>
                  </div>
                )}
                
                {studentValidation.error && (
                  <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <p className="text-red-700 dark:text-red-400 text-sm font-cairo">
                      {studentValidation.error}
                    </p>
                  </div>
                )}
                
                {/* Helper text - only show when no validation state */}
                {studentValidation.isValid === null && !studentValidation.error && (
                  <p className="text-xs text-muted-foreground font-cairo flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    موجود في كشف النقاط أو الشهادة المدرسية
                  </p>
                )}
              </div>

              {/* Password with visibility toggle */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="font-cairo text-foreground text-sm">
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="أدخل كلمة المرور"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pr-10 pl-10 font-cairo h-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                
                {/* Password strength indicator */}
                {formData.password && (
                  <div className="space-y-2 mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            passwordStrength.passedChecks >= level
                              ? passwordStrength.strength === 'strong'
                                ? 'bg-green-500'
                                : passwordStrength.strength === 'medium'
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                              : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs font-cairo">
                      <div className={`flex items-center gap-1 ${passwordStrength.checks.length ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {passwordStrength.checks.length ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        8 أحرف على الأقل
                      </div>
                      <div className={`flex items-center gap-1 ${passwordStrength.checks.uppercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {passwordStrength.checks.uppercase ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        حرف كبير (A-Z)
                      </div>
                      <div className={`flex items-center gap-1 ${passwordStrength.checks.lowercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {passwordStrength.checks.lowercase ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        حرف صغير (a-z)
                      </div>
                      <div className={`flex items-center gap-1 ${passwordStrength.checks.number ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {passwordStrength.checks.number ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        رقم (0-9)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password with visibility toggle */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="font-cairo text-foreground text-sm">
                  تأكيد كلمة المرور
                </Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="أعد كتابة كلمة المرور"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`pr-10 pl-10 font-cairo h-10 ${
                      formData.confirmPassword && (passwordsMatch ? 'border-green-500 focus-visible:ring-green-500' : 'border-red-500 focus-visible:ring-red-500')
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {formData.confirmPassword && (
                  <p className={`text-xs font-cairo flex items-center gap-1 ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                    {passwordsMatch ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        كلمتا المرور متطابقتان
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        كلمتا المرور غير متطابقتين
                      </>
                    )}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isLoading || !passwordsMatch || passwordStrength.strength === 'weak'}
                className="w-full bg-gradient-primary hover:opacity-90 text-white font-cairo text-lg mt-6 h-12"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    جاري التسجيل...
                  </span>
                ) : (
                  "إنشاء الحساب"
                )}
              </Button>

              <p className="text-center text-sm text-foreground/70 font-cairo pt-2">
                لديك حساب بالفعل؟{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login/parent")}
                  className="text-primary hover:underline font-semibold"
                >
                  تسجيل الدخول
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterParent;
