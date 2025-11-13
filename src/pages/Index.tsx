import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, UserCheck, Shield, BookOpen, Award, TrendingUp } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [logoText, setLogoText] = useState("همزة وصل");

  // Toggle logo text between "همزة وصل" and "العربي التبسي"
  useEffect(() => {
    const interval = setInterval(() => {
      setLogoText((prev) => (prev === "همزة وصل" ? "العربي التبسي" : "همزة وصل"));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const newsItems = [
    "🎉 مرحباً بكم في العام الدراسي الجديد",
    "📚 تم إضافة منهج جديد للسنة الخامسة",
    "⭐ تهانينا للطلاب المتفوقين",
    "📝 موعد الامتحانات النهائية: 15 يونيو",
    "🏆 فوز مدرستنا بالمركز الأول في المسابقة الوطنية",
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 animated-bg opacity-90" />
      
      {/* Floating Particles Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* News Ticker */}
      <div className="relative z-10 bg-primary text-primary-foreground py-2 overflow-hidden">
        <div className="ticker-animation whitespace-nowrap">
          <span className="inline-block px-8 text-sm font-tajawal">
            {newsItems.join(" • ")}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Logo Section - Isolated with more spacing */}
        <div className="text-center mb-20 fade-in">
          <div className="inline-flex items-center justify-center mb-6">
            <GraduationCap className="w-24 h-24 text-white drop-shadow-lg" />
          </div>
          <div className="glass-card inline-block px-12 py-8 rounded-3xl mb-6">
            <h1 className="text-7xl font-bold text-white mb-4 drop-shadow-lg font-cairo">
              {logoText}
            </h1>
            <div className="h-1 w-32 bg-gradient-primary mx-auto mb-4 rounded-full"></div>
            <p className="text-2xl text-white/90 font-tajawal">
              المدرسة الابتدائية العربي التبسي
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 slide-in-up">
          <div className="glass-card p-6 rounded-2xl hover-lift">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-xl mb-4 mx-auto">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2 font-cairo">متابعة تعليمية</h3>
            <p className="text-muted-foreground text-center font-tajawal">
              تابع درجات وحضور التلاميذ بسهولة
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl hover-lift">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-secondary rounded-xl mb-4 mx-auto">
              <Award className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2 font-cairo">إدارة فعالة</h3>
            <p className="text-muted-foreground text-center font-tajawal">
              نظام متكامل لإدارة المدرسة
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl hover-lift">
            <div className="flex items-center justify-center w-16 h-16 bg-accent rounded-xl mb-4 mx-auto">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2 font-cairo">تقارير شاملة</h3>
            <p className="text-muted-foreground text-center font-tajawal">
              احصائيات وتقارير تفصيلية
            </p>
          </div>
        </div>

        {/* Login Cards */}
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-8">
            <h2 className="text-3xl font-bold text-white text-center font-cairo">
              اختر نوع الحساب
            </h2>
            <Button
              onClick={() => navigate("/register")}
              size="lg"
              variant="outline"
              className="bg-white/10 text-white border-white/30 hover:bg-white/20 font-tajawal"
            >
              تسجيل حساب جديد
            </Button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 slide-in-up">
            {/* Parents Login */}
            <div className="glass-card p-8 rounded-3xl hover-lift hover-glow group">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 font-cairo">أولياء الأمور</h3>
                <p className="text-muted-foreground text-center mb-6 font-tajawal text-sm">
                  تابع تقدم أبنائك الدراسي
                </p>
                <Button
                  onClick={() => navigate("/login/parent")}
                  size="lg"
                  className="w-full bg-gradient-primary hover:opacity-90 text-white font-tajawal"
                >
                  تسجيل الدخول
                </Button>
              </div>
            </div>

            {/* Teachers Login */}
            <div className="glass-card p-8 rounded-3xl hover-lift hover-glow group">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-gradient-secondary rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <UserCheck className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 font-cairo">المعلمين</h3>
                <p className="text-muted-foreground text-center mb-6 font-tajawal text-sm">
                  إدارة الصفوف والطلاب
                </p>
                <Button
                  onClick={() => navigate("/login/teacher")}
                  size="lg"
                  className="w-full bg-gradient-secondary hover:opacity-90 text-white font-tajawal"
                >
                  تسجيل الدخول
                </Button>
              </div>
            </div>

            {/* Admin Login */}
            <div className="glass-card p-8 rounded-3xl hover-lift hover-glow group">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 font-cairo">الإدارة</h3>
                <p className="text-muted-foreground text-center mb-6 font-tajawal text-sm">
                  إدارة كاملة للمنصة
                </p>
                <Button
                  onClick={() => navigate("/login/admin")}
                  size="lg"
                  className="w-full bg-accent hover:opacity-90 text-white font-tajawal"
                >
                  تسجيل الدخول
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-white/80">
          <p className="font-tajawal text-sm">
            © 2024 همزة وصل - المدرسة الابتدائية العربي التبسي
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
