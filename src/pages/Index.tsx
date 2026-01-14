import { useNavigate } from "react-router-dom";
import { Users, GraduationCap, Shield, ArrowRight, Clock, Calendar } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format } from "date-fns";
import { PostersCarousel } from "@/components/PostersCarousel";
import { formatDateWithWeekday } from "@/utils/formatters";
import { realtimeManager } from "@/utils/realtimeManager";
import { UpdateNotificationBanner } from "@/components/UpdateNotificationBanner";
import { useAppVersion } from "@/hooks/useAppVersion";

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
  const [selectedUserType, setSelectedUserType] = useState<UserType>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
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
    <div className="min-h-screen w-full relative overflow-hidden pt-[env(safe-area-inset-top)]">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 animated-gradient-bg" />

      {/* News Ticker */}
      {newsItems.length > 0 && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-white/10 backdrop-blur-md border-b border-white/20 overflow-hidden animate-[slideDown_0.5s_ease-out]">
          <div className="ticker-animation py-3 inline-flex min-w-max items-center gap-8 whitespace-nowrap">
            {/* Repeat items 3 times for seamless scrolling */}
            {[...Array(3)].map((_, repeatIndex) => (
              newsItems.map((item, itemIndex) => (
                <div key={`${repeatIndex}-${item.id}`} className="flex items-center gap-8">
                  <span className="text-white font-cairo flex items-center gap-2">
                    <span className={`${item.badge_color} text-white px-3 py-1 rounded-full text-sm font-bold`}>
                      {item.icon_type}
                    </span>
                    {item.content}
                  </span>
                  
                  {/* Logo separator */}
                  <div className="relative h-8 w-12 flex-shrink-0">
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-sm font-bold text-white/80 font-ruqaa leading-[0.8]">
                        {itemIndex % 2 === 0 ? (
                          <>
                            <div>همزة</div>
                            <div>وصل</div>
                          </>
                        ) : (
                          <>
                            <div>العربي</div>
                            <div>التبسي</div>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ))}
          </div>
        </div>
      )}

      {/* Date and Time Display - Below News Ticker */}
      <div className="absolute top-16 left-0 right-0 z-20 bg-white/5 backdrop-blur-sm border-b border-white/10 py-2">
        <div className="flex justify-center items-center gap-6 text-white/90 font-cairo text-sm">
          {/* Date */}
          <div className="font-medium">
            {formatDateWithWeekday(currentTime)}
          </div>
          
          {/* Separator */}
          <div className="w-px h-4 bg-white/30"></div>
          
          {/* Time */}
          <div className="font-mono font-medium" dir="ltr">
            {format(currentTime, "HH:mm:ss")}
          </div>
        </div>
      </div>

      {/* Update Notification Banner - Below Date/Time */}
      <div className="absolute top-[6.5rem] left-0 right-0 z-20">
        <UpdateNotificationBanner />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8 pt-32">
        {/* Logo and Title */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="relative h-48 mb-6">
            {/* همزة وصل */}
            <div className="absolute inset-0 flex flex-col items-center justify-center magic-rotate-1">
              <h1 className="text-6xl font-bold text-white font-ruqaa leading-[0.9]">
                <div>همزة</div>
                <div>وصل</div>
              </h1>
            </div>
            
            {/* العربي التبسي */}
            <div className="absolute inset-0 flex flex-col items-center justify-center magic-rotate-2">
              <h1 className="text-6xl font-bold text-white font-ruqaa leading-[0.9]">
                <div>العربي</div>
                <div>التبسي</div>
              </h1>
            </div>
          </div>
          
          <div>
            <p className="text-2xl text-white/90 font-cairo mb-2">
              جسر التواصل بين المدرسة والبيت
            </p>
            <p className="text-lg text-white/80 font-cairo mb-3 max-w-3xl mx-auto leading-relaxed">
              منصة تعليمية متكاملة تربط بين الإدارة والمعلمين وأولياء الأمور لمتابعة شاملة للعملية التعليمية
            </p>
            <p className="text-lg text-white/70 font-ruqaa">
              المدرسة الابتدائية العربي التبسي
            </p>
          </div>
        </div>

        {/* Posters Carousel */}
        <PostersCarousel />

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
          {/* Parent Card */}
          <div 
            onClick={() => handleCardClick("parent")}
            className={`group relative backdrop-blur-lg rounded-3xl p-8 cursor-pointer transition-all duration-500 hover:scale-105 border animate-fade-in ${
              selectedUserType === "parent" 
                ? "bg-white/25 border-white/60 scale-105 ring-2 ring-white/50 shadow-[0_0_30px_rgba(255,255,255,0.3)]" 
                : "bg-white/10 hover:bg-white/20 border-white/20 hover:border-white/40"
            }`}
            style={{ animationDelay: "0.1s" }}
          >
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Icon Container */}
              <div className="relative icon-float">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 icon-pulse" />
                <div className="relative bg-white/20 backdrop-blur-sm rounded-full p-8 group-hover:bg-white/30 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110">
                  <Users className="w-16 h-16 text-white" strokeWidth={1.5} />
                </div>
              </div>
              
              {/* Text */}
              <div>
                <h2 className="text-3xl font-bold text-white mb-2 font-cairo">أولياء الأمور</h2>
                <p className="text-white/80 font-cairo">تابع مستوى أبنائك الدراسي</p>
              </div>

              {/* Arrow Icon */}
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:-translate-x-2">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Teacher Card */}
          <div 
            onClick={() => handleCardClick("teacher")}
            className={`group relative backdrop-blur-lg rounded-3xl p-8 cursor-pointer transition-all duration-500 hover:scale-105 border animate-fade-in ${
              selectedUserType === "teacher" 
                ? "bg-white/25 border-white/60 scale-105 ring-2 ring-white/50 shadow-[0_0_30px_rgba(255,255,255,0.3)]" 
                : "bg-white/10 hover:bg-white/20 border-white/20 hover:border-white/40"
            }`}
            style={{ animationDelay: "0.2s" }}
          >
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Icon Container */}
              <div className="relative icon-float" style={{ animationDelay: "0.5s" }}>
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 icon-pulse" />
                <div className="relative bg-white/20 backdrop-blur-sm rounded-full p-8 group-hover:bg-white/30 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110">
                  <GraduationCap className="w-16 h-16 text-white" strokeWidth={1.5} />
                </div>
              </div>
              
              {/* Text */}
              <div>
                <h2 className="text-3xl font-bold text-white mb-2 font-cairo">المعلمين</h2>
                <p className="text-white/80 font-cairo">إدارة الأقسام والتلاميذ</p>
              </div>

              {/* Arrow Icon */}
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:-translate-x-2">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Admin Card */}
          <div 
            onClick={() => handleCardClick("admin")}
            className={`group relative backdrop-blur-lg rounded-3xl p-8 cursor-pointer transition-all duration-500 hover:scale-105 border animate-fade-in ${
              selectedUserType === "admin" 
                ? "bg-white/25 border-white/60 scale-105 ring-2 ring-white/50 shadow-[0_0_30px_rgba(255,255,255,0.3)]" 
                : "bg-white/10 hover:bg-white/20 border-white/20 hover:border-white/40"
            }`}
            style={{ animationDelay: "0.3s" }}
          >
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Icon Container */}
              <div className="relative icon-float" style={{ animationDelay: "1s" }}>
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 icon-pulse" />
                <div className="relative bg-white/20 backdrop-blur-sm rounded-full p-8 group-hover:bg-white/30 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110">
                  <Shield className="w-16 h-16 text-white" strokeWidth={1.5} />
                </div>
              </div>
              
              {/* Text */}
              <div>
                <h2 className="text-3xl font-bold text-white mb-2 font-cairo">الإدارة</h2>
                <p className="text-white/80 font-cairo">لوحة التحكم الإدارية</p>
              </div>

              {/* Arrow Icon */}
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:-translate-x-2">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>


        {/* Footer */}
        <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <p className="text-white/70 font-cairo text-lg">
            اختر نوع الحساب للدخول إلى المنصة
          </p>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: "0.5s" }}>
          <p className="text-white/60 font-cairo text-sm">
            جميع الحقوق محفوظة-العربي التبسي 2026©
          </p>
        </div>
      </div>

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
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>إعادة تعيين كلمة المرور</DialogTitle>
                          <DialogDescription>
                            أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="reset-email">البريد الإلكتروني</Label>
                            <Input
                              id="reset-email"
                              type="email"
                              placeholder="example@email.com"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                            />
                          </div>
                          <Button 
                            onClick={handleResetPassword} 
                            disabled={isResetting}
                            className="w-full"
                          >
                            {isResetting ? "جاري الإرسال..." : "إرسال رابط إعادة التعيين"}
                          </Button>
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
    </div>
  );
};

export default Index;
