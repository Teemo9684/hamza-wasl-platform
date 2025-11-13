import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Shield, Users, UserCheck, GraduationCap, Bell, BarChart3, Settings } from "lucide-react";

const DashboardAdmin = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 animated-bg opacity-10" />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="glass-card border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-accent" />
              <h1 className="text-2xl font-bold font-cairo">لوحة التحكم الإدارية</h1>
            </div>
            <Button onClick={handleLogout} variant="ghost" className="font-tajawal">
              <LogOut className="ml-2 h-4 w-4" />
              تسجيل الخروج
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2 font-cairo">مرحباً مدير المدرسة</h2>
            <p className="text-muted-foreground font-tajawal">
              إدارة شاملة للمنصة التعليمية
            </p>
          </div>

          {/* Statistics */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo">
                  <Users className="w-5 h-5 text-primary" />
                  أولياء الأمور
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">125</p>
                <p className="text-sm text-muted-foreground font-tajawal">مسجل</p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo">
                  <UserCheck className="w-5 h-5 text-secondary" />
                  المعلمين
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">18</p>
                <p className="text-sm text-muted-foreground font-tajawal">معلم نشط</p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo">
                  <GraduationCap className="w-5 h-5 text-accent" />
                  التلاميذ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">342</p>
                <p className="text-sm text-muted-foreground font-tajawal">تلميذ</p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo">
                  <Bell className="w-5 h-5 text-primary" />
                  طلبات قيد الانتظار
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">7</p>
                <p className="text-sm text-muted-foreground font-tajawal">طلب جديد</p>
              </CardContent>
            </Card>
          </div>

          {/* Management Sections */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="glass-card hover-lift hover-glow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 font-cairo">إدارة المستخدمين</h3>
                  <p className="text-sm text-muted-foreground font-tajawal mb-4">
                    اعتماد، رفض وإدارة حسابات المستخدمين
                  </p>
                  <Button className="w-full bg-gradient-primary text-white font-tajawal">
                    إدارة
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift hover-glow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center mb-4">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 font-cairo">إدارة التلاميذ</h3>
                  <p className="text-sm text-muted-foreground font-tajawal mb-4">
                    تصنيف وإدارة التلاميذ حسب الفصول
                  </p>
                  <Button className="w-full bg-gradient-secondary text-white font-tajawal">
                    إدارة
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift hover-glow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 font-cairo">الإعلانات</h3>
                  <p className="text-sm text-muted-foreground font-tajawal mb-4">
                    نظام إعلانات متقدم مع أولويات
                  </p>
                  <Button className="w-full bg-accent text-white font-tajawal">
                    إدارة
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift hover-glow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 font-cairo">التقارير والإحصائيات</h3>
                  <p className="text-sm text-muted-foreground font-tajawal mb-4">
                    تقارير تفاعلية وإحصائيات شاملة
                  </p>
                  <Button variant="outline" className="w-full font-tajawal">
                    عرض
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift hover-glow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 font-cairo">الإعدادات</h3>
                  <p className="text-sm text-muted-foreground font-tajawal mb-4">
                    إعدادات النظام والصلاحيات
                  </p>
                  <Button variant="outline" className="w-full font-tajawal">
                    إعدادات
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardAdmin;
