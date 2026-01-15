import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Shield, Users, UserCheck, GraduationCap, Bell, BarChart3, Settings, Megaphone, MessageSquare, Home, Send, Calendar, FileText, Image } from "lucide-react";
import { NewsTickerManager } from "@/components/NewsTickerManager";
import { UserManagement } from "@/components/admin/UserManagement";
import { StudentManagement } from "@/components/admin/StudentManagement";
import { AnnouncementsManager } from "@/components/admin/AnnouncementsManager";
import { ReportsView } from "@/components/admin/ReportsView";
import { SettingsManager } from "@/components/admin/SettingsManager";
import { MessagesView } from "@/components/admin/MessagesView";
import { GroupMessaging } from "@/components/admin/GroupMessaging";
import { ScheduleManager } from "@/components/admin/ScheduleManager";
import { DocumentRequestsManager } from "@/components/admin/DocumentRequestsManager";
import { PostersManager } from "@/components/admin/PostersManager";
import { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence } from "framer-motion";
import { AnimatedSection } from "@/components/AnimatedSection";
import { toast } from "sonner";
import { playNotificationSound } from "@/utils/pushNotifications";
import { BottomNav, adminNavItems } from "@/components/BottomNav";
import { FloatingNotificationBadge, NotificationType } from "@/components/FloatingNotificationBadge";
import { realtimeManager } from "@/utils/realtimeManager";

const DashboardAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // استخراج القسم من الـ URL hash
  const getSectionFromHash = () => {
    const hash = location.hash.replace('#', '');
    return hash || null;
  };
  
  const [activeSection, setActiveSection] = useState<string | null>(getSectionFromHash());
  const [stats, setStats] = useState({
    parents: 0,
    teachers: 0,
    students: 0,
    pendingRequests: 0,
    pendingDocuments: 0,
    unreadMessages: 0,
  });
  const scrollPositionRef = useRef<number>(0);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());

  // تحديث القسم عند تغير الـ hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setActiveSection(hash || null);
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // مزامنة القسم مع الـ hash
  useEffect(() => {
    const currentHash = location.hash.replace('#', '');
    if (activeSection && activeSection !== currentHash) {
      // لا تفعل شيء - الـ hash سيتم تحديثه في handleOpenSection
    } else if (!activeSection && currentHash) {
      setActiveSection(currentHash);
    }
  }, [location.hash]);

  useEffect(() => {
    fetchStatistics();
  }, []);

  // Real-time notifications for new document requests using realtimeManager
  useEffect(() => {
    console.log('Setting up realtime subscription for admin document requests via realtimeManager');

    const handleDocumentChange = async (payload: any) => {
      console.log('Admin document change received:', payload);
      
      // Handle REFRESH event
      if (payload.eventType === 'REFRESH') {
        console.log('Refreshing admin documents data...');
        const { count } = await supabase
          .from("document_requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");
        
        setStats(prev => ({
          ...prev,
          pendingDocuments: count || 0
        }));
        return;
      }

      // Handle INSERT event
      if (payload.eventType === 'INSERT') {
        playNotificationSound('document');
        toast.info('طلب وثيقة جديد', {
          description: 'تم استلام طلب وثيقة جديد',
          duration: 5000,
        });
        // Re-show document notifications when new request arrives
        setDismissedNotifications(prev => {
          const newSet = new Set(prev);
          newSet.delete('document');
          return newSet;
        });
        setStats(prev => ({
          ...prev,
          pendingDocuments: prev.pendingDocuments + 1
        }));
      }
    };

    const cleanup = realtimeManager.subscribe(
      'admin-document-requests',
      'document_requests',
      handleDocumentChange
    );

    return () => {
      console.log('Cleaning up admin document requests subscription');
      cleanup();
    };
  }, []);

  // Real-time notifications for new user registrations using realtimeManager
  useEffect(() => {
    console.log('Setting up realtime subscription for admin user registrations via realtimeManager');

    const handleProfileChange = async (payload: any) => {
      console.log('Admin profile change received:', payload);
      
      // Handle REFRESH event
      if (payload.eventType === 'REFRESH') {
        console.log('Refreshing admin profiles data...');
        const { count } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("is_approved", false);
        
        setStats(prev => ({
          ...prev,
          pendingRequests: count || 0
        }));
        return;
      }

      // Handle INSERT event
      if (payload.eventType === 'INSERT') {
        const newProfile = payload.new as any;
        if (!newProfile.is_approved) {
          playNotificationSound('user');
          toast.info('تسجيل مستخدم جديد', {
            description: `${newProfile.full_name} في انتظار الموافقة`,
            duration: 5000,
          });
          // Re-show user notifications when new registration arrives
          setDismissedNotifications(prev => {
            const newSet = new Set(prev);
            newSet.delete('user');
            return newSet;
          });
          setStats(prev => ({
            ...prev,
            pendingRequests: prev.pendingRequests + 1
          }));
        }
      }
    };

    const cleanup = realtimeManager.subscribe(
      'admin-user-registrations',
      'profiles',
      handleProfileChange
    );

    // الإدارة تراقب الرسائل فقط وليست طرفاً فيها
    // لذا لا نُظهر إشعارات للرسائل الجديدة (هي بين المعلمين والأولياء)

    return () => {
      console.log('Cleaning up admin user registrations subscription');
      cleanup();
    };
  }, []);

  useLayoutEffect(() => {
    if (activeSection === null && scrollPositionRef.current > 0) {
      // Restore scroll position immediately
      window.scrollTo(0, scrollPositionRef.current);
      scrollPositionRef.current = 0;
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

      const { count: pendingDocsCount } = await supabase
        .from("document_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // الإدارة تراقب الرسائل فقط ولا تستلمها، لذا لا نحتاج لحساب الرسائل غير المقروءة
      // تظهر كل الرسائل في قسم إدارة الرسائل بدون إشعارات وهمية

      setStats({
        parents: parentsCount || 0,
        teachers: teachersCount || 0,
        students: studentsCount || 0,
        pendingRequests: pendingCount || 0,
        pendingDocuments: pendingDocsCount || 0,
        unreadMessages: 0, // الإدارة تراقب الرسائل فقط
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error fetching statistics:", error);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleBackToDashboard = () => {
    // إزالة الـ hash والرجوع للصفحة الرئيسية
    window.history.pushState(null, '', window.location.pathname);
    setActiveSection(null);
  };

  const handleOpenSection = (section: string) => {
    // Save current scroll position before opening section
    scrollPositionRef.current = window.scrollY;
    // إضافة الـ hash للـ URL لتمكين زر الرجوع
    window.history.pushState(null, '', `#${section}`);
    setActiveSection(section);
    
    // تصفير الإشعارات عند زيارة القسم المعني وإخفاء الإشعارات العائمة
    if (section === "users") {
      setStats(prev => ({ ...prev, pendingRequests: 0 }));
      setDismissedNotifications(prev => new Set([...prev, 'user']));
    } else if (section === "documentRequests") {
      setStats(prev => ({ ...prev, pendingDocuments: 0 }));
      setDismissedNotifications(prev => new Set([...prev, 'document']));
    } else if (section === "messages") {
      setStats(prev => ({ ...prev, unreadMessages: 0 }));
      setDismissedNotifications(prev => new Set([...prev, 'message']));
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-clip scroll-smooth">
      <div className="absolute inset-0 animated-bg opacity-10 pointer-events-none" />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/85 border-b shadow-sm safe-area-top">
          <div className="container mx-auto px-3 md:px-4 py-3 md:py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-accent flex-shrink-0" />
              <h1 className="text-lg md:text-2xl font-bold font-cairo truncate">لوحة التحكم</h1>
            </div>
            <Button 
              onClick={handleLogout} 
              variant="ghost" 
              className="font-cairo h-10 px-3 text-sm active:scale-95 touch-feedback"
              size="sm"
            >
              <LogOut className="ml-1.5 h-4 w-4" />
              <span className="hidden sm:inline">تسجيل الخروج</span>
              <span className="sm:hidden">خروج</span>
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-3 md:px-4 py-4 md:py-8 pb-28">
          <div className="mb-6 md:mb-8">
            <h2 className="text-xl md:text-3xl font-bold mb-1 md:mb-2 font-cairo">مرحباً مديرة المدرسة</h2>
            <p className="text-sm md:text-base text-muted-foreground font-cairo">
              إدارة شاملة للمنصة التعليمية
            </p>
          </div>

          {activeSection ? (
            <AnimatePresence mode="wait">
              <AnimatedSection key={activeSection}>
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
                  {activeSection === "documentRequests" && <DocumentRequestsManager />}
                  {activeSection === "posters" && <PostersManager />}
                </div>
              </AnimatedSection>
            </AnimatePresence>
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

            <Card className="glass-card hover-lift hover-glow cursor-pointer relative" onClick={() => handleOpenSection("users")}>
              {stats.pendingRequests > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white animate-pulse">
                  {stats.pendingRequests}
                </Badge>
              )}
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
                  <Button className="w-full bg-gradient-primary text-white font-cairo">
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

            <Card className="glass-card hover-lift hover-glow cursor-pointer relative" onClick={() => handleOpenSection("documentRequests")}>
              {stats.pendingDocuments > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white animate-pulse">
                  {stats.pendingDocuments}
                </Badge>
              )}
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 font-cairo">طلبات الوثائق</h3>
                  <p className="text-sm text-muted-foreground font-cairo mb-4">
                    إدارة طلبات الوثائق الإدارية من أولياء الأمور
                  </p>
                  <Button className="w-full bg-gradient-primary text-white font-cairo">
                    إدارة
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift hover-glow cursor-pointer" onClick={() => handleOpenSection("posters")}>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center mb-4">
                    <Image className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 font-cairo">الملصقات</h3>
                  <p className="text-sm text-muted-foreground font-cairo mb-4">
                    إدارة ملصقات وإعلانات المدرسة المصورة
                  </p>
                  <Button className="w-full bg-gradient-secondary text-white font-cairo">
                    إدارة
                  </Button>
                </div>
              </CardContent>
            </Card>
            </div>
            </>
          )}
        </main>
        
        <FloatingNotificationBadge 
          notifications={[
            { 
              type: 'document' as NotificationType, 
              count: dismissedNotifications.has('document') ? 0 : stats.pendingDocuments, 
              onClick: () => handleOpenSection('documentRequests') 
            },
            { 
              type: 'message' as NotificationType, 
              count: dismissedNotifications.has('message') ? 0 : stats.unreadMessages, 
              onClick: () => handleOpenSection('messages') 
            },
          ]}
        />
        <BottomNav 
          items={adminNavItems} 
          activeSection={activeSection || "home"}
          onNavigate={(section) => {
            if (section === "home") {
              handleBackToDashboard();
            } else {
              handleOpenSection(section);
            }
          }}
          notifications={{
            users: stats.pendingRequests,
            reports: stats.pendingDocuments,
            messages: stats.unreadMessages,
          }}
        />
      </div>
    </div>
  );
};

export default DashboardAdmin;
