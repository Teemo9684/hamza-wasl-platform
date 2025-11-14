import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, ArrowRight, Mail, Lock, User, BookOpen, GraduationCap } from "lucide-react";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // For foreign languages, gradeLevel is not required
    const isGradeLevelRequired = formData.subject !== "فرنسية" && formData.subject !== "إنجليزية";
    
    if (!formData.fullName || !formData.email || !formData.subject || !formData.password || 
        (isGradeLevelRequired && !formData.gradeLevel)) {
      toast({
        title: "خطأ",
        description: "الرجاء ملء جميع الحقول",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمتا المرور غير متطابقتين",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "خطأ",
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }

    // Simulate registration
    toast({
      title: "تم إرسال الطلب بنجاح",
      description: "سيتم مراجعة طلبك من قبل الإدارة وسيتم إشعارك عند الموافقة",
    });

    setTimeout(() => {
      navigate("/");
    }, 2000);
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
            className="mb-8 text-white hover:bg-white/10 font-tajawal"
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
              <h1 className="text-3xl font-bold text-center mb-2 font-cairo">
                تسجيل حساب معلم
              </h1>
              <p className="text-muted-foreground text-center font-tajawal text-sm">
                أدخل بياناتك لإنشاء حساب جديد
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="font-tajawal">
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
                    className="pr-10 font-tajawal"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="font-tajawal">
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
                    className="pr-10 font-tajawal"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="font-tajawal">
                  المادة
                </Label>
                <div className="relative">
                  <BookOpen className="absolute right-3 top-3 h-5 w-5 text-muted-foreground z-10 pointer-events-none" />
                  <Select 
                    value={formData.subject} 
                    onValueChange={(value) => setFormData({ ...formData, subject: value, gradeLevel: "" })}
                  >
                    <SelectTrigger className="pr-10 font-tajawal" dir="rtl">
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
                  <Label htmlFor="gradeLevel" className="font-tajawal">
                    القسم
                  </Label>
                  <div className="relative">
                    <GraduationCap className="absolute right-3 top-3 h-5 w-5 text-muted-foreground z-10 pointer-events-none" />
                    <Select 
                      value={formData.gradeLevel} 
                      onValueChange={(value) => setFormData({ ...formData, gradeLevel: value })}
                      disabled={!formData.subject}
                    >
                      <SelectTrigger className="pr-10 font-tajawal" dir="rtl">
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
                    <p className="text-xs text-muted-foreground font-tajawal">
                      الرجاء اختيار المادة أولاً
                    </p>
                  )}
                </div>
              )}

              {isForeignLanguage && (
                <div className="space-y-2">
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm font-tajawal text-foreground">
                      سيتم تسجيلك تلقائياً لتدريس المستويات الثلاثة: السنة الثالثة، السنة الرابعة، والسنة الخامسة
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="font-tajawal">
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
                <Label htmlFor="confirmPassword" className="font-tajawal">
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
                className="w-full bg-gradient-secondary hover:opacity-90 text-white font-tajawal text-lg"
              >
                إنشاء الحساب
              </Button>

              <p className="text-center text-sm text-muted-foreground font-tajawal">
                لديك حساب بالفعل؟{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login/teacher")}
                  className="text-white hover:underline"
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
