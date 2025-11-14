import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserCheck, Users, ArrowRight } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 animated-bg opacity-90" />

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-screen">
        <div className="max-w-4xl w-full">
          {/* Back Button */}
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            className="mb-8 text-white hover:bg-white/10 font-tajawal"
          >
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة للصفحة الرئيسية
          </Button>

          {/* Header */}
          <div className="text-center mb-12 fade-in">
            <h1 className="text-5xl font-bold text-white mb-4 font-cairo">
              تسجيل حساب جديد
            </h1>
            <p className="text-xl text-white/90 font-tajawal">
              اختر نوع الحساب الذي تريد إنشاءه
            </p>
          </div>

          {/* Registration Options */}
          <div className="grid md:grid-cols-2 gap-8 slide-in-up">
            {/* Teacher Registration */}
            <div className="glass-card p-10 rounded-3xl hover-lift hover-glow group">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 bg-gradient-secondary rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <UserCheck className="w-16 h-16 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4 font-cairo">المعلمين</h3>
                <p className="text-muted-foreground text-center mb-8 font-tajawal text-lg">
                  إنشاء حساب جديد للمعلمين
                </p>
                <ul className="text-right mb-8 space-y-2 w-full font-tajawal text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-secondary rounded-full"></div>
                    إدارة الحضور والغياب
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-secondary rounded-full"></div>
                    إدخال الدرجات والتقييمات
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-secondary rounded-full"></div>
                    التواصل مع أولياء الأمور
                  </li>
                </ul>
              <Button
                onClick={() => navigate("/register/teacher")}
                size="lg"
                type="button"
                className="w-full bg-gradient-secondary hover:opacity-90 text-white font-tajawal text-lg"
              >
                إنشاء حساب معلم
              </Button>
              </div>
            </div>

            {/* Parent Registration */}
            <div className="glass-card p-10 rounded-3xl hover-lift hover-glow group">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 bg-gradient-primary rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <Users className="w-16 h-16 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4 font-cairo">أولياء الأمور</h3>
                <p className="text-muted-foreground text-center mb-8 font-tajawal text-lg">
                  إنشاء حساب جديد لأولياء الأمور
                </p>
                <ul className="text-right mb-8 space-y-2 w-full font-tajawal text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-primary rounded-full"></div>
                    متابعة درجات الأبناء
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-primary rounded-full"></div>
                    متابعة الحضور والغياب
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-primary rounded-full"></div>
                    التواصل مع المعلمين
                  </li>
                </ul>
              <Button
                onClick={() => navigate("/register/parent")}
                size="lg"
                type="button"
                className="w-full bg-gradient-primary hover:opacity-90 text-white font-tajawal text-lg"
              >
                إنشاء حساب ولي أمر
              </Button>
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="text-center mt-12 glass-card p-6 rounded-2xl">
            <p className="text-white/80 font-tajawal">
              ⚠️ ملاحظة: سيتم مراجعة طلبك من قبل الإدارة قبل تفعيل الحساب
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
