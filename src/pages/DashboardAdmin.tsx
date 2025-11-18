import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Shield, Users, UserCheck, GraduationCap, Bell, BarChart3, Settings, Megaphone, MessageSquare, FileSpreadsheet } from "lucide-react";
import { NewsTickerManager } from "@/components/NewsTickerManager";
import { UserManagement } from "@/components/admin/UserManagement";
import { StudentManagement } from "@/components/admin/StudentManagement";
import { AnnouncementsManager } from "@/components/admin/AnnouncementsManager";
import { ReportsView } from "@/components/admin/ReportsView";
import { SettingsManager } from "@/components/admin/SettingsManager";
import { MessagesView } from "@/components/admin/MessagesView";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const DashboardAdmin = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [stats, setStats] = useState({
    parents: 0,
    teachers: 0,
    students: 0,
    pendingRequests: 0,
  });

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const { count: parentsCount } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "parent");

      const { count: teachersCount } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "teacher");

      const { count: studentsCount } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });

      setStats({
        parents: parentsCount || 0,
        teachers: teachersCount || 0,
        students: studentsCount || 0,
        pendingRequests: 0,
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

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
            <Button onClick={handleLogout} variant="ghost" className="font-cairo">
              <LogOut className="ml-2 h-4 w-4" />
              تسجيل الخروج
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2 font-cairo">مرحباً مدير المدرسة</h2>
            <p className="text-muted-foreground font-cairo">
              إدارة شاملة للمنصة التعليمية
            </p>
          </div>

          {activeSection ? (
            <div className="mb-8">
              <Button 
                onClick={() => setActiveSection(null)} 
                variant="ghost" 
                className="mb-4 font-cairo"
              >
                ← العودة إلى لوحة التحكم
              </Button>
              {activeSection === "news" && <NewsTickerManager />}
              {activeSection === "users" && <UserManagement />}
              {activeSection === "students" && <StudentManagement />}
              {activeSection === "announcements" && <AnnouncementsManager />}
              {activeSection === "reports" && <ReportsView />}
              {activeSection === "settings" && <SettingsManager />}
              {activeSection === "messages" && <MessagesView />}
            </div>
          ) : (
            <>
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
                <p className="text-3xl font-bold">{stats.parents}</p>
                <p className="text-sm text-muted-foreground font-cairo">مسجل</p>
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
                <p className="text-3xl font-bold">{stats.teachers}</p>
                <p className="text-sm text-muted-foreground font-cairo">معلم نشط</p>
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
                <p className="text-3xl font-bold">{stats.students}</p>
                <p className="text-sm text-muted-foreground font-cairo">تلميذ</p>
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
                <p className="text-3xl font-bold">{stats.pendingRequests}</p>
                <p className="text-sm text-muted-foreground font-cairo">بانتظار الموافقة</p>
              </CardContent>
            </Card>
          </div>

          {/* Management Sections */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="glass-card hover-lift hover-glow cursor-pointer" onClick={() => setActiveSection("news")}>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                    <Megaphone className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 font-cairo">الشريط الإخباري</h3>
                  <p className="text-sm text-muted-foreground font-cairo mb-4">
                    إدارة الأخبار والتنبيهات المدرسية
                  </p>
                  <Button className="w-full bg-gradient-primary text-white font-cairo">
                    إدارة
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift hover-glow cursor-pointer" onClick={() => setActiveSection("users")}>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 font-cairo">إدارة المستخدمين</h3>
                  <p className="text-sm text-muted-foreground font-cairo mb-4">
                    إدارة حسابات المعلمين وأولياء الأمور
                  </p>
                  <Button className="w-full bg-gradient-primary text-white font-cairo">
                    إدارة
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift hover-glow cursor-pointer" onClick={() => setActiveSection("students")}>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center mb-4">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 font-cairo">إدارة التلاميذ</h3>
                  <p className="text-sm text-muted-foreground font-tajawal mb-4">
                    إضافة وتعديل وحذف بيانات التلاميذ
                  </p>
                  <Button className="w-full bg-gradient-secondary text-white font-cairo">
                    إدارة
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift hover-glow cursor-pointer" onClick={() => navigate("/import/students")}>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-accent rounded-full flex items-center justify-center mb-4">
                    <FileSpreadsheet className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 font-cairo">استيراد من Excel</h3>
                  <p className="text-sm text-muted-foreground font-tajawal mb-4">
                    إضافة قوائم التلاميذ من ملف Excel
                  </p>
                  <Button className="w-full bg-gradient-accent text-white font-cairo">
                    استيراد
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift hover-glow cursor-pointer" onClick={() => setActiveSection("announcements")}>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 font-cairo">الإعلانات</h3>
                  <p className="text-sm text-muted-foreground font-tajawal mb-4">
                    نشر إعلانات للمعلمين وأولياء الأمور
                  </p>
                  <Button className="w-full bg-accent text-white font-cairo">
                    إدارة
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift hover-glow cursor-pointer" onClick={() => setActiveSection("reports")}>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 font-cairo">التقارير والإحصائيات</h3>
                  <p className="text-sm text-muted-foreground font-tajawal mb-4">
                    عرض تقارير الأداء والإحصائيات الشاملة
                  </p>
                  <Button variant="outline" className="w-full font-cairo">
                    عرض
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift hover-glow cursor-pointer" onClick={() => setActiveSection("settings")}>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 font-cairo">الإعدادات</h3>
                  <p className="text-sm text-muted-foreground font-tajawal mb-4">
                    إعدادات النظام والتخصيص
                  </p>
                  <Button variant="outline" className="w-full font-tajawal">
                    إعدادات
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift hover-glow cursor-pointer" onClick={() => setActiveSection("messages")}>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 font-cairo">الرسائل والاستفسارات</h3>
                  <p className="text-sm text-muted-foreground font-cairo mb-4">
                    عرض جميع الرسائل بين الأولياء والأساتذة
                  </p>
                  <Button className="w-full bg-gradient-primary text-white font-cairo">
                    عرض
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          </>
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardAdmin;
