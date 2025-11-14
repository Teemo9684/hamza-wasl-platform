import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Users, ArrowRight, Mail, Lock, User, Phone, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const RegisterParent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    nationalSchoolId: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.phone || !formData.nationalSchoolId || !formData.password) {
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

    try {
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
        // Link parent to student using national school ID
        const { error: linkError } = await supabase.rpc('link_parent_to_student', {
          _parent_id: data.user.id,
          _national_school_id: formData.nationalSchoolId,
        });

        if (linkError) {
          toast({
            title: "خطأ",
            description: "رقم التعريف المدرسي غير صحيح أو التلميذ غير موجود",
            variant: "destructive",
          });
          return;
        }

        // Insert user role
        await supabase.from('user_roles').insert({
          user_id: data.user.id,
          role: 'parent',
        });

        toast({
          title: "تم التسجيل بنجاح",
          description: "تم ربط حسابك بابنك بنجاح",
        });
        
        navigate("/dashboard/parent");
      }
    } catch (error: any) {
      toast({
        title: "خطأ في التسجيل",
        description: error.message || "حدث خطأ أثناء التسجيل",
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
            className="mb-8 text-white hover:bg-white/10 font-tajawal"
          >
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة
          </Button>

          {/* Registration Form */}
          <div className="glass-card p-8 rounded-3xl slide-in-up">
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-center mb-2 font-cairo">
                تسجيل حساب ولي أمر
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
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pr-10 font-tajawal"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="font-tajawal">
                  رقم الهاتف
                </Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0555 123456"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pr-10 font-tajawal"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationalSchoolId" className="font-tajawal">
                  الرقم الوطني المدرسي
                </Label>
                <div className="relative">
                  <Hash className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="nationalSchoolId"
                    type="text"
                    placeholder="أدخل الرقم الوطني المدرسي"
                    value={formData.nationalSchoolId}
                    onChange={(e) => setFormData({ ...formData, nationalSchoolId: e.target.value })}
                    className="pr-10 font-tajawal"
                    dir="ltr"
                  />
                </div>
              </div>

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
                className="w-full bg-gradient-primary hover:opacity-90 text-white font-tajawal text-lg"
              >
                إنشاء الحساب
              </Button>

              <p className="text-center text-sm text-muted-foreground font-tajawal">
                لديك حساب بالفعل؟{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login/parent")}
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

export default RegisterParent;
