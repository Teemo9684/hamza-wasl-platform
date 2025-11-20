import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, ArrowRight, Mail, Lock, User, BookOpen, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { teacherRegistrationSchema } from "@/lib/validations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RegisterTeacher = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    subject: "",
    gradeLevel: "",
    password: "",
    confirmPassword: "",
  });

  // Define available grades for Arabic only
  const allGrades = ["التحضيري", "السنة الأولى", "السنة الثانية", "السنة الثالثة", "السنة الرابعة", "السنة الخامسة"];
  
  // Check if subject is foreign language
  const isForeignLanguage = formData.subject === "فرنسية" || formData.subject === "إنجليزية";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate form data
      const validatedData = teacherRegistrationSchema.parse({
        full_name: formData.fullName,
        email: formData.email,
        subject: formData.subject,
        grade_level: isForeignLanguage ? "جميع المستويات" : formData.gradeLevel,
        password: formData.password,
      });

      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "خطأ",
          description: "كلمتا المرور غير متطابقتين",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          data: {
            full_name: validatedData.full_name,
            subject: validatedData.subject,
            grade_level: validatedData.grade_level,
          },
          emailRedirectTo: `${window.location.origin}/dashboard/teacher`,
        },
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "تم التسجيل بنجاح",
          description: "يرجى الانتظار حتى يتم اعتماد حسابك من قبل الإدارة قبل تسجيل الدخول",
        });
        
        navigate("/login/teacher");
      }
    } catch (error: any) {
      toast({
        title: "خطأ في التسجيل",
        description: error.errors?.[0]?.message || error.message || "حدث خطأ أثناء التسجيل",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 animated-bg opacity-90" />

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-screen">
        <div className="max-w-md w-full">
          {/* Back Button */}
          <Button
            onClick={() => navigate("/register")}
            variant="ghost"
            className="mb-8 text-white hover:bg-white/10 font-cairo"
          >
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة
          </Button>

          {/* Registration Form */}
          <div className="glass-card p-8 rounded-3xl slide-in-up">
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 bg-gradient-secondary rounded-full flex items-center justify-center mb-4">
                <UserCheck className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-center mb-2 font-cairo text-secondary">
                تسجيل حساب معلم
              </h1>
              <p className="text-foreground/80 text-center font-cairo text-sm">
                أدخل بياناتك لإنشاء حساب جديد
              </p>
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-700 dark:text-yellow-300 text-center text-sm font-cairo font-medium">
                  تنبيه: بعد التسجيل، يجب الانتظار حتى تتم الموافقة على حسابك من قبل الإدارة قبل أن تتمكن من تسجيل الدخول
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="font-cairo text-foreground">
                  الاسم الكامل
                </Label>
                <div className="relative">
                  <User className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="أدخل الاسم الكامل"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="pr-10 font-cairo"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="font-cairo text-foreground">
                  البريد الإلكتروني
                </Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@school.dz"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pr-10 font-cairo"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="font-cairo text-foreground">
                  المادة
                </Label>
                <div className="relative">
                  <BookOpen className="absolute right-3 top-3 h-5 w-5 text-muted-foreground z-10 pointer-events-none" />
                  <Select 
                    value={formData.subject} 
                    onValueChange={(value) => setFormData({ ...formData, subject: value, gradeLevel: "" })}
                  >
                    <SelectTrigger className="pr-10 font-cairo" dir="rtl">
                      <SelectValue placeholder="اختر المادة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="عربية">اللغة العربية</SelectItem>
                      <SelectItem value="فرنسية">اللغة الفرنسية</SelectItem>
                      <SelectItem value="إنجليزية">اللغة الإنجليزية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!isForeignLanguage && (
                <div className="space-y-2">
                  <Label htmlFor="gradeLevel" className="font-cairo text-foreground">
                    القسم
                  </Label>
                  <div className="relative">
                    <GraduationCap className="absolute right-3 top-3 h-5 w-5 text-muted-foreground z-10 pointer-events-none" />
                    <Select
                      value={formData.gradeLevel}
                      onValueChange={(value) => setFormData({ ...formData, gradeLevel: value })}
                      disabled={!formData.subject}
                    >
                      <SelectTrigger className="pr-10 font-cairo" dir="rtl">
                        <SelectValue placeholder="اختر القسم" />
                      </SelectTrigger>
                      <SelectContent>
                        {allGrades.map((grade) => (
                          <SelectItem key={grade} value={grade}>
                            {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!formData.subject && (
                    <p className="text-xs text-foreground/60 font-cairo">
                      الرجاء اختيار المادة أولاً
                    </p>
                  )}
                </div>
              )}

              {isForeignLanguage && (
                <div className="space-y-2">
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm font-cairo text-foreground">
                      سيتم تسجيلك تلقائياً لتدريس المستويات الثلاثة: السنة الثالثة، السنة الرابعة، والسنة الخامسة
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="font-tajawal text-foreground">
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pr-10 font-tajawal"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="font-tajawal text-foreground">
                  تأكيد كلمة المرور
                </Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pr-10 font-tajawal"
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-secondary hover:opacity-90 text-white font-cairo text-lg"
              >
                إنشاء الحساب
              </Button>

              <p className="text-center text-sm text-foreground/70 font-cairo">
                لديك حساب بالفعل؟{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login/teacher")}
                  className="text-secondary hover:underline font-semibold"
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

export default RegisterTeacher;
