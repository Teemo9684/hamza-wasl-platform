import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, UserCheck, Users, ClipboardList, BookOpen, Calendar } from "lucide-react";

const DashboardTeacher = () => {
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
              <UserCheck className="w-8 h-8 text-secondary" />
              <h1 className="text-2xl font-bold font-cairo">لوحة تحكم المعلم</h1>
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
            <h2 className="text-3xl font-bold mb-2 font-cairo">مرحباً أستاذ/ة</h2>
            <p className="text-muted-foreground font-tajawal">
              إدارة صفوفك والطلاب
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo">
                  <Users className="w-5 h-5 text-primary" />
                  الطلاب
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">45</p>
                <p className="text-sm text-muted-foreground font-tajawal">عدد الطلاب</p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo">
                  <BookOpen className="w-5 h-5 text-secondary" />
                  الصفوف
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">3</p>
                <p className="text-sm text-muted-foreground font-tajawal">عدد الصفوف</p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo">
                  <ClipboardList className="w-5 h-5 text-accent" />
                  الحضور
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">42</p>
                <p className="text-sm text-muted-foreground font-tajawal">اليوم</p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo">
                  <Calendar className="w-5 h-5 text-primary" />
                  الواجبات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">12</p>
                <p className="text-sm text-muted-foreground font-tajawal">قيد المراجعة</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h3 className="text-2xl font-bold mb-4 font-cairo">إجراءات سريعة</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                size="lg"
                className="w-full bg-gradient-primary text-white font-tajawal h-20"
              >
                <ClipboardList className="ml-2 h-6 w-6" />
                تسجيل الحضور
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full font-tajawal h-20"
              >
                <BookOpen className="ml-2 h-6 w-6" />
                إدخال الدرجات
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full font-tajawal h-20"
              >
                <Users className="ml-2 h-6 w-6" />
                إدارة الطلاب
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardTeacher;
