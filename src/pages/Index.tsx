import { useNavigate } from "react-router-dom";
import { Users, GraduationCap, Shield, ArrowRight, Clock, Calendar } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format } from "date-fns";
import { PostersCarousel } from "@/components/PostersCarousel";
import { formatDateWithWeekday } from "@/utils/formatters";
import { realtimeManager } from "@/utils/realtimeManager";
import { useAppVersion } from "@/hooks/useAppVersion";
import { ThemeDecorations, ThemeBanner } from "@/components/ThemeDecorations";

// Stagger animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 80,
      damping: 12,
    },
  },
} as const;

const headerVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 20,
      delay: 0.05,
    },
  },
} as const;

interface NewsItem {
  id: string;
  title: string;
  content: string;
  icon_type: string;
  badge_color: string;
  is_active: boolean;
}

type UserType = "parent" | "teacher" | "admin" | null;

const Index = () => {
  const navigate = useNavigate();
  const { version: appVersion } = useAppVersion();
  const [isInstalled, setIsInstalled] = useState(false);
  // Editor preview runs inside an iframe (or on preview hosts); the parent app may report
  // display-mode standalone, which would wrongly hide the admin card.
  const isEditorPreview = (() => {
    try {
      const host = window.location.hostname;
      return (
        window.self !== window.top ||
        host.includes("id-preview--") ||
        host.endsWith("lovableproject.com") ||
        host === "localhost"
      );
    } catch {
      return true;
    }
  })();
  const [selectedUserType, setSelectedUserType] = useState<UserType>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showTeacherWarning, setShowTeacherWarning] = useState(false);
  const loginSectionRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Check if app is installed (running in standalone mode)
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isIOSStandalone);
    };

    checkInstalled();
  }, []);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);

  const fetchNewsItems = useCallback(async () => {
    const { data } = await supabase
      .from("news_ticker")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (data) {
      console.log('Index: Fetched', data.length, 'news items');
      setNewsItems(data);
    }
  }, []);

  useEffect(() => {
    fetchNewsItems();
    
    // Re-fetch news items when auth state changes (e.g., after logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchNewsItems();
    });

    // Subscribe using realtimeManager for better reconnection handling
    const cleanup = realtimeManager.subscribe(
      'index-news-ticker',
      'news_ticker',
      (payload) => {
        console.log('Index: News ticker realtime update received', payload);
        fetchNewsItems();
      }
    );

    return () => {
      subscription.unsubscribe();
      cleanup();
    };
  }, [fetchNewsItems]);

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);


  const handleCardClick = (userType: UserType) => {
    setSelectedUserType(userType);
    setEmail("");
    setPassword("");
    setRememberMe(false);
    
    // Load saved email for this user type (not password for security)
    if (userType && userType !== "admin") {
      const savedEmail = localStorage.getItem(`${userType}_email`);
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
      // Clean up any old stored passwords
      localStorage.removeItem(`${userType}_password`);
    }
    
    setTimeout(() => {
      loginSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleBackToTop = () => {
    setIsExiting(true);
    
    // After exit animation, scroll to top and hide section
    setTimeout(() => {
      setSelectedUserType(null);
      setIsExiting(false);
      // Scroll to top after hiding the section
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      });
    }, 400);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedUserType === "admin") {
      // For admin login, use a fixed email
      const ADMIN_EMAIL = "admin@arbit.local";
      
      if (!password) {
        toast.error("الرجاء إدخال كلمة المرور");
        return;
      }

      setIsLoading(true);

      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password: password.trim(),
        });

        if (authError) {
          toast.error("كلمة المرور غير صحيحة");
          setIsLoading(false);
          return;
        }

        if (authData.user) {
          const { data: roleData, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", authData.user.id)
            .eq("role", "admin")
            .maybeSingle();

          if (roleError || !roleData) {
            await supabase.auth.signOut();
            toast.error("ليس لديك صلاحية المسؤول");
            setIsLoading(false);
            return;
          }

          toast.success("تم تسجيل الدخول بنجاح");
          navigate("/dashboard/admin");
        }
      } catch (error: any) {
        console.error("Admin login error:", error);
        toast.error("حدث خطأ في تسجيل الدخول");
      } finally {
        setIsLoading(false);
      }
      return;
    }
    
    // For parent/teacher login
    const loginEmail = email;
    
    if (!loginEmail || !password) {
      toast.error("الرجاء إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: password.trim(),
      });

      if (error) throw error;

      if (data.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_approved')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw profileError;

        if (!profileData.is_approved) {
          toast.error("حسابك قيد المراجعة من قبل الإدارة. الرجاء الانتظار حتى يتم اعتماد حسابك.");
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }
        
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .eq('role', selectedUserType)
          .maybeSingle();

        if (roleError) throw roleError;

        if (!roleData) {
          const roleNames = {
            parent: "ولي أمر",
            teacher: "معلم",
            admin: "إداري"
          };
          toast.error(`هذا الحساب ليس حساب ${roleNames[selectedUserType!]}`);
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }

        // Handle remember me (save email only, never password)
        if (rememberMe && selectedUserType) {
          localStorage.setItem(`${selectedUserType}_email`, loginEmail);
        } else if (selectedUserType) {
          localStorage.removeItem(`${selectedUserType}_email`);
        }

        toast.success("تم تسجيل الدخول بنجاح");
        
        setTimeout(() => {
          navigate(`/dashboard/${selectedUserType}`, { replace: true });
        }, 100);
      }
    } catch (error: any) {
      if (error.message?.includes("Invalid login credentials")) {
        toast.error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      } else if (error.message?.includes("Email not confirmed")) {
        toast.error("الرجاء تأكيد بريدك الإلكتروني أولاً");
      } else {
        toast.error(error.message || "خطأ في تسجيل الدخول");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      toast.error("الرجاء إدخال البريد الإلكتروني");
      return;
    }

    setIsResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/login/${selectedUserType}`,
      });

      if (error) throw error;

      toast.success("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني");
      setIsResetDialogOpen(false);
      setResetEmail("");
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ في إرسال رابط إعادة التعيين");
    } finally {
      setIsResetting(false);
    }
  };

  const getUserTypeInfo = () => {
    switch (selectedUserType) {
      case "parent":
        return {
          icon: Users,
          title: "تسجيل دخول ولي الأمر",
          description: "أدخل بياناتك للوصول إلى حساب ولي الأمر",
          gradient: "bg-gradient-primary",
          registerPath: "/register/parent"
        };
      case "teacher":
        return {
          icon: GraduationCap,
          title: "تسجيل دخول المعلم",
          description: "أدخل بياناتك للوصول إلى حساب المعلم",
          gradient: "bg-gradient-secondary",
          registerPath: "/register/teacher"
        };
      case "admin":
        return {
          icon: Shield,
          title: "تسجيل دخول الإدارة",
          description: "أدخل بياناتك للوصول إلى لوحة التحكم الإدارية",
          gradient: "bg-gradient-accent",
          registerPath: "/register"
        };
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden ed-bg pt-[env(safe-area-inset-top)]">
      <div className="absolute inset-0 ed-pattern pointer-events-none" />
      <ThemeDecorations />

      {/* News Ticker */}
      {newsItems.length > 0 && (
        <div className="relative z-20 ed-card border-x-0 border-t-0 overflow-hidden">
          <div className="ticker-animation py-2.5 inline-flex min-w-max items-center gap-8 whitespace-nowrap">
            {[...Array(3)].map((_, repeatIndex) => (
              newsItems.map((item) => (
                <div key={`${repeatIndex}-${item.id}`} className="flex items-center gap-8">
                  <span className="ed-text font-cairo text-sm flex items-center gap-2">
                    <span className={`${item.badge_color} text-white px-2.5 py-0.5 rounded-full text-xs font-bold`}>
                      {item.icon_type}
                    </span>
                    {item.content}
                  </span>
                  <span className="ed-gold text-lg">✦</span>
                </div>
              ))
            ))}
          </div>
        </div>
      )}

      <motion.div
        className="relative z-10 min-h-screen flex flex-col items-center px-4 pb-10 pt-6 md:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="w-full max-w-5xl">
          {/* Masthead */}
          <motion.div variants={itemVariants} className="flex items-center justify-between ed-muted font-cairo text-xs mb-6">
            <span>{formatDateWithWeekday(currentTime)}</span>
            <span className="font-mono ed-gold" dir="ltr">{format(currentTime, "HH:mm:ss")}</span>
          </motion.div>

          {/* Hero editorial */}
          <motion.div variants={headerVariants} className="text-center mb-8">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full ed-chip text-[11px] font-cairo mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--ed-emerald))] animate-pulse" />
              المدرسة الابتدائية العربي التبسي
            </span>
            <div className="relative h-36 md:h-44">
              <div className="absolute inset-0 flex items-center justify-center magic-rotate-1">
                <h1 className="text-7xl md:text-8xl font-bold ed-text font-ruqaa leading-[0.9]">همزة وصل</h1>
              </div>
              <div className="absolute inset-0 flex items-center justify-center magic-rotate-2">
                <h1 className="text-7xl md:text-8xl font-bold ed-gold font-ruqaa leading-[0.9]">العربي التبسي</h1>
              </div>
            </div>
            <div className="ed-rule w-40 mx-auto my-4" />
            <p className="text-xl md:text-2xl font-bold ed-text font-cairo">جسر التواصل بين المدرسة والبيت</p>
            <p className="text-sm ed-muted font-cairo mt-2 max-w-md mx-auto leading-relaxed">
              منصة تعليمية متكاملة تربط بين الإدارة والمعلمين وأولياء الأمور لمتابعة شاملة للعملية التعليمية
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-6 rounded-[1.75rem] overflow-hidden">
            <ThemeBanner />
            <PostersCarousel />
          </motion.div>

          <motion.div variants={itemVariants} className="flex items-center gap-3 mb-4">
            <span className="ed-gold font-cairo text-xs font-bold tracking-wide">بوابات الدخول</span>
            <div className="flex-1 h-px bg-[hsl(var(--ed-line))]" />
          </motion.div>

          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3" variants={containerVariants}>
            {/* Parent feature */}
            <motion.div
              onClick={() => handleCardClick("parent")}
              variants={cardVariants}
              whileTap={{ scale: 0.98 }}
              whileHover={{ y: -4 }}
              className={`col-span-2 md:row-span-2 relative overflow-hidden rounded-[1.75rem] p-6 cursor-pointer ed-card-feature ${selectedUserType === "parent" ? "ring-2 ring-[hsl(var(--ed-gold))]" : ""}`}
            >
              <span className="absolute -left-4 -bottom-10 font-ruqaa text-[9rem] leading-none ed-text opacity-10 select-none">أ</span>
              <div className="relative flex flex-col justify-between gap-10 min-h-[220px]">
                <div className="flex items-start justify-between">
                  <div className="rounded-2xl p-3.5 bg-[hsl(var(--ed-sand)/0.15)] icon-float">
                    <Users className="w-9 h-9 ed-text" strokeWidth={1.6} />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[hsl(var(--ed-ink)/0.3)] ed-text text-[11px] font-cairo">الأكثر استخداماً</span>
                </div>
                <div>
                  <span className="ed-gold font-mono text-xs">01</span>
                  <h2 className="text-3xl font-bold ed-text font-cairo mb-1">أولياء الأمور</h2>
                  <p className="ed-text opacity-80 font-cairo text-sm mb-4">تابع الواجبات والحضور والرسائل لحظة بلحظة</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {["الواجبات", "الحضور", "الرسائل", "الجدول"].map((t) => (
                        <span key={t} className="px-2.5 py-1 rounded-lg bg-[hsl(var(--ed-ink)/0.25)] ed-text text-[11px] font-cairo">{t}</span>
                      ))}
                    </div>
                    <span className="w-10 h-10 rounded-full bg-[hsl(var(--ed-sand))] flex items-center justify-center shrink-0">
                      <ArrowRight className="w-5 h-5 rotate-180 text-[hsl(var(--ed-ink))]" />
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Teacher */}
            <motion.div
              onClick={() => setShowTeacherWarning(true)}
              variants={cardVariants}
              whileTap={{ scale: 0.98 }}
              whileHover={{ y: -4 }}
              className={`col-span-1 md:col-span-2 rounded-[1.75rem] p-5 cursor-pointer ed-card ${selectedUserType === "teacher" ? "ring-2 ring-[hsl(var(--ed-gold))]" : ""}`}
            >
              <div className="flex flex-col justify-between gap-6 min-h-[150px]">
                <div className="flex justify-between items-start">
                  <div className="rounded-xl p-2.5 ed-icon"><GraduationCap className="w-7 h-7" strokeWidth={1.6} /></div>
                  <span className="ed-gold font-mono text-xs">02</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold ed-text font-cairo">المعلمين</h2>
                  <p className="ed-muted font-cairo text-xs">إدارة الأقسام والتلاميذ</p>
                </div>
              </div>
            </motion.div>

            {/* Admin */}
            {(isEditorPreview || (!Capacitor.isNativePlatform() && !isInstalled)) ? (
              <motion.div
                onClick={() => handleCardClick("admin")}
                variants={cardVariants}
                whileTap={{ scale: 0.98 }}
                whileHover={{ y: -4 }}
                className={`col-span-1 md:col-span-2 rounded-[1.75rem] p-5 cursor-pointer ed-card ${selectedUserType === "admin" ? "ring-2 ring-[hsl(var(--ed-gold))]" : ""}`}
              >
                <div className="flex flex-col justify-between gap-6 min-h-[150px]">
                  <div className="flex justify-between items-start">
                    <div className="rounded-xl p-2.5 ed-icon"><Shield className="w-7 h-7" strokeWidth={1.6} /></div>
                    <span className="ed-gold font-mono text-xs">03</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold ed-text font-cairo">الإدارة</h2>
                    <p className="ed-muted font-cairo text-xs">لوحة التحكم الإدارية</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div variants={cardVariants} className="col-span-1 md:col-span-2 rounded-[1.75rem] p-5 ed-card flex flex-col justify-center items-center text-center min-h-[150px]">
                <p className="text-4xl font-bold ed-gold font-ruqaa">همزة وصل</p>
                <p className="ed-muted font-cairo text-xs mt-2">تواصل أسهل وأسرع</p>
              </motion.div>
            )}
          </motion.div>

          <motion.div className="mt-10 text-center" variants={itemVariants}>
            <div className="ed-rule w-24 mx-auto mb-3" />
            <p className="ed-muted font-cairo text-xs">جميع الحقوق محفوظة-العربي التبسي 2026©</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Login Section */}
      {selectedUserType && (
        <div ref={loginSectionRef} className="relative z-10 min-h-screen flex items-center justify-center p-8">
          <div className={`w-full max-w-md transition-all duration-500 ${isExiting ? 'opacity-0 scale-90 translate-y-10' : 'slide-in-up'}`}>
            <Button
              variant="ghost"
              onClick={handleBackToTop}
              className="mb-4 text-white hover:bg-white/10"
              disabled={isExiting}
            >
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              العودة للأعلى
            </Button>

            <Card className="glass-card border-none shadow-2xl">
              <CardHeader className="text-center">
                {(() => {
                  const userInfo = getUserTypeInfo();
                  const IconComponent = userInfo?.icon;
                  return (
                    <>
                      <div className={`mx-auto w-20 h-20 ${userInfo?.gradient} rounded-full flex items-center justify-center mb-4`}>
                        {IconComponent && <IconComponent className="w-10 h-10 text-white" />}
                      </div>
                      <CardTitle className="text-3xl font-cairo">{userInfo?.title}</CardTitle>
                      <CardDescription className="font-cairo">
                        {userInfo?.description}
                      </CardDescription>
                    </>
                  );
                })()}
              </CardHeader>
              
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  {selectedUserType !== "admin" && (
                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-cairo">البريد الإلكتروني</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="font-cairo"
                        required
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="font-cairo">كلمة المرور</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="font-cairo"
                      required
                    />
                  </div>

                  {selectedUserType !== "admin" && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id="rememberMe"
                          checked={rememberMe}
                          onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        />
                        <Label htmlFor="rememberMe" className="font-cairo text-sm cursor-pointer">
                          تذكرني
                        </Label>
                      </div>
                      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="link" className="text-sm text-primary p-0 h-auto">
                            نسيت كلمة المرور؟
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-sm">
                          <DialogHeader className="text-center">
                            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                              </svg>
                            </div>
                            <DialogTitle className="text-xl font-cairo">استرجاع كلمة المرور</DialogTitle>
                            <DialogDescription className="font-cairo text-center">
                              أدخل بريدك الإلكتروني المسجل وسنرسل لك رابط لإعادة تعيين كلمة المرور خلال دقائق
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="reset-email" className="font-cairo">البريد الإلكتروني</Label>
                              <Input
                                id="reset-email"
                                type="email"
                                placeholder="example@email.com"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                className="text-center"
                                autoComplete="email"
                              />
                            </div>
                            <Button 
                              onClick={handleResetPassword} 
                              disabled={isResetting || !resetEmail}
                              className="w-full font-cairo"
                              size="lg"
                            >
                              {isResetting ? (
                                <>
                                  <svg className="animate-spin ml-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  جاري الإرسال...
                                </>
                              ) : (
                                <>
                                  إرسال رابط الاسترجاع
                                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                </>
                              )}
                            </Button>
                            <p className="text-xs text-muted-foreground text-center font-cairo">
                              تحقق من صندوق البريد الوارد والرسائل غير المرغوب فيها
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="flex flex-col space-y-4">
                  <Button
                    type="submit"
                    className={`w-full ${getUserTypeInfo()?.gradient} text-white font-cairo`}
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? "جاري التحميل..." : "تسجيل الدخول"}
                    <ArrowRight className="mr-2 h-5 w-5" />
                  </Button>
                  
                  {selectedUserType !== "admin" && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => navigate(getUserTypeInfo()?.registerPath || "")}
                      className="w-full font-cairo"
                    >
                      ليس لديك حساب؟{" "}
                      <span className="text-purple-500 animate-pulse font-bold">سجل الآن</span>
                    </Button>
                  )}
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      )}
      
      {/* App Version Display */}
      <div className="fixed bottom-4 left-4 z-50 text-white/50 text-xs font-mono">
        v{appVersion}
      </div>

      {/* Teacher Warning Dialog */}
      <AlertDialog open={showTeacherWarning} onOpenChange={setShowTeacherWarning}>
        <AlertDialogContent className="max-w-md border-destructive/50 bg-background" dir="rtl">
          <AlertDialogHeader>
            <div className="flex justify-center mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-destructive rounded-full blur-lg animate-pulse opacity-50" />
                <div className="relative bg-destructive/10 rounded-full p-4 border-2 border-destructive">
                  <GraduationCap className="w-10 h-10 text-destructive" />
                </div>
              </div>
            </div>
            <AlertDialogTitle className="text-center text-xl font-cairo text-destructive">
              ⚠️ تنبيه
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center font-cairo text-base leading-relaxed space-y-2">
              <p className="font-bold text-foreground">هذا القسم مخصص حصرياً للطاقم التربوي</p>
              <p>التسجيل والدخول في هذا القسم مسموح فقط للمعلمين والأساتذة المعتمدين من إدارة المدرسة.</p>
              <p className="text-destructive font-semibold">إذا كنت ولي أمر، يرجى استخدام قسم "أولياء الأمور".</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-3 sm:flex-col">
            <AlertDialogAction 
              onClick={() => {
                setShowTeacherWarning(false);
                handleCardClick("teacher");
              }}
              className="w-full bg-destructive hover:bg-destructive/90 font-cairo text-base py-3"
            >
              أنا معلم، متابعة
            </AlertDialogAction>
            <AlertDialogCancel className="w-full font-cairo text-base py-3 mt-0 sm:mt-0">
              رجوع
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
