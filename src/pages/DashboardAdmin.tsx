import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Shield, Users, UserCheck, GraduationCap, Bell, BarChart3, Settings, Megaphone, MessageSquare, Home, Send, Calendar } from "lucide-react";
import { NewsTickerManager } from "@/components/NewsTickerManager";
import { UserManagement } from "@/components/admin/UserManagement";
import { StudentManagement } from "@/components/admin/StudentManagement";
import { AnnouncementsManager } from "@/components/admin/AnnouncementsManager";
import { ReportsView } from "@/components/admin/ReportsView";
import { SettingsManager } from "@/components/admin/SettingsManager";
import { MessagesView } from "@/components/admin/MessagesView";
import { GroupMessaging } from "@/components/admin/GroupMessaging";
import { ScheduleManager } from "@/components/admin/ScheduleManager";
import { useState, useEffect, useRef } from "react";
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
  const scrollPositionRef = useRef<number>(0);

  useEffect(() => {
    fetchStatistics();
  }, []);

  useEffect(() => {
    // Restore scroll position when returning to dashboard
    if (activeSection === null && scrollPositionRef.current > 0) {
      window.scrollTo(0, scrollPositionRef.current);
      scrollPositionRef.current = 0; // Reset after restoring
    } else if (activeSection !== null) {
      // Scroll to top when opening a section
      window.scrollTo(0, 0);
    }
  }, [activeSection]);

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

      const { count: pendingCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_approved", false);

      setStats({
        parents: parentsCount || 0,
        teachers: teachersCount || 0,
        students: studentsCount || 0,
        pendingRequests: pendingCount || 0,
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error fetching statistics:", error);
      }
    }
  };

  const handleLogout = () => {
    navigate("/");
  };

  const handleBackToDashboard = () => {
    setActiveSection(null);
  };

  const handleOpenSection = (section: string) => {
    // Save current scroll position before opening section
    scrollPositionRef.current = window.scrollY;
    setActiveSection(section);
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
                onClick={handleBackToDashboard} 
                variant="ghost" 
                className="mb-4 font-cairo"
              >
                <Home className="ml-2 h-4 w-4" />
                العودة إلى لوحة التحكم
              </Button>
              {activeSection === "news" && <NewsTickerManager />}
              {activeSection === "users" && <UserManagement />}
              {activeSection === "students" && <StudentManagement />}
              {activeSection === "announcements" && <AnnouncementsManager />}
              {activeSection === "reports" && <ReportsView />}
              {activeSection === "settings" && <SettingsManager />}
              {activeSection === "messages" && <MessagesView />}
              {activeSection === "groupMessages" && <GroupMessaging />}
              {activeSection === "schedule" && <ScheduleManager />}
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
            <Card className="glass-card hover-lift hover-glow cursor-pointer" onClick={() => handleOpenSection("news")}>
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

            <Card className="glass-card hover-lift hover-glow cursor-pointer" onClick={() => handleOpenSection("users")}>
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

            <Card className="glass-card hover-lift hover-glow cursor-pointer" onClick={() => handleOpenSection("students")}>
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

            <Card className="glass-card hover-lift hover-glow cursor-pointer" onClick={() => handleOpenSection("announcements")}>
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

            <Card className="glass-card hover-lift hover-glow cursor-pointer" onClick={() => handleOpenSection("reports")}>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 font-cairo">التقارير والإحصائيات</h3>
                  <p className="text-sm text-muted-foreground font-cairo mb-4">
                    عرض تقارير الأداء والإحصائيات الشاملة
                  </p>
                  <Button className="w-full bg-gradient-primary text-white font-cairo">
                    عرض التقارير
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift hover-glow cursor-pointer" onClick={() => handleOpenSection("settings")}>
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

            <Card className="glass-card hover-lift hover-glow cursor-pointer" onClick={() => handleOpenSection("messages")}>
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

            <Card className="glass-card hover-lift hover-glow cursor-pointer" onClick={() => handleOpenSection("groupMessages")}>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center mb-4">
                    <Send className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 font-cairo">رسائل جماعية</h3>
                  <p className="text-sm text-muted-foreground font-cairo mb-4">
                    إرسال رسالة واحدة لمجموعة من أولياء الأمور
                  </p>
                  <Button className="w-full bg-gradient-secondary text-white font-cairo">
                    إرسال
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift hover-glow cursor-pointer" onClick={() => handleOpenSection("schedule")}>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4">
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 font-cairo">جدول الحصص</h3>
                  <p className="text-sm text-muted-foreground font-cairo mb-4">
                    إدارة جداول الحصص الأسبوعية لكل الأقسام
                  </p>
                  <Button className="w-full bg-accent text-white font-cairo">
                    إدارة
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
