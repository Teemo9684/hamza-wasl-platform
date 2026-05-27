import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Shield, Users, UserCheck, GraduationCap, Bell, BarChart3, Settings, Megaphone, MessageSquare, Home, Calendar, FileText, Image, CloudDownload, Sparkles, Trophy, ArrowUp } from "lucide-react";
import { NewsTickerManager } from "@/components/NewsTickerManager";
import { UserManagement } from "@/components/admin/UserManagement";
import { StudentManagement } from "@/components/admin/StudentManagement";
import { AnnouncementsManager } from "@/components/admin/AnnouncementsManager";
import { ReportsView } from "@/components/admin/ReportsView";
import { SettingsManager } from "@/components/admin/SettingsManager";
import { MessagesView } from "@/components/admin/MessagesView";

import { ScheduleManager } from "@/components/admin/ScheduleManager";
import { DocumentRequestsManager } from "@/components/admin/DocumentRequestsManager";
import { PostersManager } from "@/components/admin/PostersManager";
import { QuickOTADeploy } from "@/components/admin/QuickOTADeploy";
import { ResultsCountdownManager } from "@/components/admin/ResultsCountdownManager";
import { GradePromotionManager } from "@/components/admin/GradePromotionManager";
import { EndOfYearManager } from "@/components/admin/EndOfYearManager";
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
    linkedParents: 0,
    totalMessages: 0,
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

  // التمرير للأعلى عند الدخول للصفحة
  useEffect(() => {
    window.scrollTo(0, 0);
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
      // جلب جميع الإحصائيات بشكل متوازٍ لتحسين الأداء
      const [
        parentsResult,
        teachersResult,
        studentsResult,
        pendingResult,
        pendingDocsResult,
        linkedParentsResult,
        messagesResult
      ] = await Promise.all([
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "parent"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
        supabase.from("students").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_approved", false),
        supabase.from("document_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("parent_students").select("parent_id", { count: "exact", head: true }),
        supabase.from("messages").select("*", { count: "exact", head: true })
      ]);

      setStats({
        parents: parentsResult.count || 0,
        teachers: teachersResult.count || 0,
        students: studentsResult.count || 0,
        pendingRequests: pendingResult.count || 0,
        pendingDocuments: pendingDocsResult.count || 0,
        unreadMessages: 0,
        linkedParents: linkedParentsResult.count || 0,
        totalMessages: messagesResult.count || 0,
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
        <main className="container mx-auto px-3 md:px-4 py-4 md:py-8 pb-36 md:pb-40">
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
                  {activeSection === "ota" && <QuickOTADeploy />}
                  {activeSection === "schedule" && <ScheduleManager />}
                  {activeSection === "documentRequests" && <DocumentRequestsManager />}
                  {activeSection === "posters" && <PostersManager />}
                  {activeSection === "resultsCountdown" && <ResultsCountdownManager />}
                  {activeSection === "gradePromotion" && <GradePromotionManager />}
                  {activeSection === "endOfYear" && <EndOfYearManager />}
                </div>
              </AnimatedSection>
            </AnimatePresence>
          ) : (
            <>
              {/* Statistics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                <Card className="glass-card hover-lift">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 font-cairo text-sm md:text-base">
                      <GraduationCap className="w-5 h-5 text-accent" />
                      التلاميذ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl md:text-3xl font-bold">{stats.students}</p>
                    <p className="text-xs md:text-sm text-muted-foreground font-cairo">تلميذ مسجل</p>
                  </CardContent>
                </Card>

                <Card className="glass-card hover-lift">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 font-cairo text-sm md:text-base">
                      <UserCheck className="w-5 h-5 text-secondary" />
                      المعلمين
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl md:text-3xl font-bold">{stats.teachers}</p>
                    <p className="text-xs md:text-sm text-muted-foreground font-cairo">
                      {stats.students > 0 && stats.teachers > 0 
                        ? `نسبة 1:${Math.round(stats.students / stats.teachers)}`
                        : 'معلم نشط'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass-card hover-lift">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 font-cairo text-sm md:text-base">
                      <Users className="w-5 h-5 text-primary" />
                      أولياء الأمور
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl md:text-3xl font-bold">{stats.parents}</p>
                    <p className="text-xs md:text-sm text-muted-foreground font-cairo">
                      {stats.linkedParents > 0 
                        ? `${stats.linkedParents} مرتبط بتلاميذ`
                        : 'مسجل'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass-card hover-lift relative">
                  {stats.pendingRequests > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-red-500 text-white animate-pulse text-xs">
                      {stats.pendingRequests}
                    </Badge>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 font-cairo text-sm md:text-base">
                      <Bell className="w-5 h-5 text-orange-500" />
                      طلبات معلقة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl md:text-3xl font-bold">{stats.pendingRequests}</p>
                    <p className="text-xs md:text-sm text-muted-foreground font-cairo">بانتظار الموافقة</p>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
                <Card className="glass-card hover-lift relative">
                  {stats.pendingDocuments > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-orange-500 text-white animate-pulse text-xs">
                      {stats.pendingDocuments}
                    </Badge>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 font-cairo text-sm md:text-base">
                      <FileText className="w-5 h-5 text-blue-500" />
                      طلبات الوثائق
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl md:text-3xl font-bold">{stats.pendingDocuments}</p>
                    <p className="text-xs md:text-sm text-muted-foreground font-cairo">وثيقة معلقة</p>
                  </CardContent>
                </Card>

                <Card className="glass-card hover-lift">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 font-cairo text-sm md:text-base">
                      <MessageSquare className="w-5 h-5 text-green-500" />
                      الرسائل
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl md:text-3xl font-bold">{stats.totalMessages}</p>
                    <p className="text-xs md:text-sm text-muted-foreground font-cairo">إجمالي الرسائل</p>
                  </CardContent>
                </Card>

                <Card className="glass-card hover-lift col-span-2 lg:col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 font-cairo text-sm md:text-base">
                      <BarChart3 className="w-5 h-5 text-purple-500" />
                      نسبة الارتباط
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl md:text-3xl font-bold">
                      {stats.students > 0 
                        ? `${Math.round((stats.linkedParents / stats.students) * 100)}%`
                        : '0%'}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground font-cairo">أولياء مرتبطين بتلاميذ</p>
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
                  <h3 className="text-xl font-bold mb-2 font-cairo">الإعلانات والرسائل الجماعية</h3>
                  <p className="text-sm text-muted-foreground font-tajawal mb-4">
                    إرسال إعلانات ورسائل للمعلمين وأولياء الأمور
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

            <Card className="glass-card hover-lift hover-glow cursor-pointer" onClick={() => handleOpenSection("resultsCountdown")}>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 font-cairo">عد تنازلي للنتائج</h3>
                  <p className="text-sm text-muted-foreground font-cairo mb-4">
                    تحكم في تاريخ النتائج والصورة المعروضة عند الإعلان
                  </p>
                  <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-cairo">
                    إدارة
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift hover-glow cursor-pointer" onClick={() => handleOpenSection("gradePromotion")}>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mb-4">
                    <ArrowUp className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 font-cairo">ترقية نهاية السنة</h3>
                  <p className="text-sm text-muted-foreground font-cairo mb-4">
                    نقل جميع التلاميذ إلى المستوى الأعلى وتخريج السنة الخامسة
                  </p>
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-cairo">
                    بدء الترقية
                  </Button>
                </div>
              </CardContent>
            </Card>






            <Card className="glass-card hover-lift hover-glow cursor-pointer" onClick={() => handleOpenSection("ota")}>

              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                    <CloudDownload className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 font-cairo">نشر تحديث OTA تلقائي</h3>
                  <p className="text-sm text-muted-foreground font-cairo mb-4">
                    أسهل وأنجح طريقة لتحديث تطبيق الأندرويد مباشرة من GitHub
                  </p>
                  <Button className="w-full bg-gradient-primary text-white font-cairo">
                    نشر تحديث الآن
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
              type: 'user' as NotificationType, 
              count: dismissedNotifications.has('user') ? 0 : stats.pendingRequests, 
              onClick: () => handleOpenSection('users') 
            },
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
            documentRequests: stats.pendingDocuments,
            messages: stats.unreadMessages,
          }}
          scrollable={true}
        />
      </div>
    </div>
  );
};

export default DashboardAdmin;
