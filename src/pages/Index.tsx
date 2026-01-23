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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format } from "date-fns";
import { PostersCarousel } from "@/components/PostersCarousel";
import { formatDateWithWeekday } from "@/utils/formatters";
import { realtimeManager } from "@/utils/realtimeManager";
import { useAppVersion } from "@/hooks/useAppVersion";

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
      <motion.div 
        className="absolute top-16 left-0 right-0 z-20 bg-white/5 backdrop-blur-sm border-b border-white/10 py-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
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
      </motion.div>

      {/* Main Content */}
      <motion.div 
        className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8 pt-32"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo and Title */}
        <motion.div className="text-center mb-8" variants={headerVariants}>
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
          
          <motion.div variants={itemVariants}>
            <p className="text-2xl text-white/90 font-cairo mb-2">
              جسر التواصل بين المدرسة والبيت
            </p>
            <p className="text-lg text-white/80 font-cairo mb-3 max-w-3xl mx-auto leading-relaxed">
              منصة تعليمية متكاملة تربط بين الإدارة والمعلمين وأولياء الأمور لمتابعة شاملة للعملية التعليمية
            </p>
            <p className="text-lg text-white/70 font-ruqaa">
              المدرسة الابتدائية العربي التبسي
            </p>
          </motion.div>
        </motion.div>

        {/* Posters Carousel */}
        <motion.div variants={itemVariants} className="w-full">
          <PostersCarousel />
        </motion.div>

        {/* Cards Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl"
          variants={containerVariants}
        >
          {/* Parent Card */}
          <motion.div 
            onClick={() => handleCardClick("parent")}
            className={`group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-500 ${
              selectedUserType === "parent" 
                ? "scale-[1.02] ring-4 ring-emerald-400/60 shadow-[0_0_40px_rgba(16,185,129,0.4)]" 
                : "hover:scale-[1.02]"
            }`}
            variants={cardVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/90 via-teal-500/85 to-cyan-600/90 opacity-95" />
            
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
            </div>

            {/* Content */}
            <div className="relative p-8 flex flex-col items-center text-center space-y-5">
              {/* Badge */}
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                <span className="text-white text-xs font-bold font-cairo">للأولياء</span>
              </div>

              {/* Icon Container */}
              <div className="relative mt-4">
                <div className="absolute inset-0 bg-white/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 scale-150" />
                <div className="relative bg-white/20 backdrop-blur-md rounded-2xl p-6 group-hover:bg-white/30 transition-all duration-500 group-hover:rotate-3 group-hover:scale-110 border border-white/30">
                  <Users className="w-14 h-14 text-white drop-shadow-lg" strokeWidth={1.5} />
                </div>
              </div>
              
              {/* Text */}
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white font-cairo drop-shadow-md">أولياء الأمور</h2>
                <p className="text-white/90 font-cairo text-sm leading-relaxed max-w-[200px]">
                  تابع مستوى أبنائك الدراسي والحضور والواجبات
                </p>
              </div>

              {/* Features List */}
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                <span className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-xs font-cairo">متابعة الحضور</span>
                <span className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-xs font-cairo">الواجبات</span>
                <span className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-xs font-cairo">التواصل</span>
              </div>

              {/* CTA Button */}
              <div className={`mt-4 transition-all duration-300 ${selectedUserType === "parent" ? "opacity-100 scale-100" : "opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100"}`}>
                <div className="bg-white/25 backdrop-blur-sm rounded-full px-6 py-2.5 border border-white/40 flex items-center gap-2">
                  <span className="text-white font-bold font-cairo text-sm">الدخول الآن</span>
                  <ArrowRight className="w-4 h-4 text-white rotate-180" />
                </div>
              </div>

              {/* Selected Indicator */}
              {selectedUserType === "parent" && (
                <motion.div 
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-white rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </div>
          </motion.div>

          {/* Teacher Card */}
          <motion.div 
            onClick={() => handleCardClick("teacher")}
            className={`group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-500 ${
              selectedUserType === "teacher" 
                ? "scale-[1.02] ring-4 ring-violet-400/60 shadow-[0_0_40px_rgba(139,92,246,0.4)]" 
                : "hover:scale-[1.02]"
            }`}
            variants={cardVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/90 via-purple-500/85 to-fuchsia-600/90 opacity-95" />
            
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 -translate-x-1/2" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full translate-y-1/2 translate-x-1/2" />
            </div>

            {/* Content */}
            <div className="relative p-8 flex flex-col items-center text-center space-y-5">
              {/* Badge */}
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                <span className="text-white text-xs font-bold font-cairo">للمعلمين</span>
              </div>

              {/* Icon Container */}
              <div className="relative mt-4">
                <div className="absolute inset-0 bg-white/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 scale-150" />
                <div className="relative bg-white/20 backdrop-blur-md rounded-2xl p-6 group-hover:bg-white/30 transition-all duration-500 group-hover:rotate-3 group-hover:scale-110 border border-white/30">
                  <GraduationCap className="w-14 h-14 text-white drop-shadow-lg" strokeWidth={1.5} />
                </div>
              </div>
              
              {/* Text */}
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white font-cairo drop-shadow-md">المعلمين</h2>
                <p className="text-white/90 font-cairo text-sm leading-relaxed max-w-[200px]">
                  إدارة الأقسام والتلاميذ والتواصل مع الأولياء
                </p>
              </div>

              {/* Features List */}
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                <span className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-xs font-cairo">تسجيل الحضور</span>
                <span className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-xs font-cairo">الواجبات</span>
                <span className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-xs font-cairo">المراسلة</span>
              </div>

              {/* CTA Button */}
              <div className={`mt-4 transition-all duration-300 ${selectedUserType === "teacher" ? "opacity-100 scale-100" : "opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100"}`}>
                <div className="bg-white/25 backdrop-blur-sm rounded-full px-6 py-2.5 border border-white/40 flex items-center gap-2">
                  <span className="text-white font-bold font-cairo text-sm">الدخول الآن</span>
                  <ArrowRight className="w-4 h-4 text-white rotate-180" />
                </div>
              </div>

              {/* Selected Indicator */}
              {selectedUserType === "teacher" && (
                <motion.div 
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-white rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Admin Card - Separate section, only visible on web */}
        {!Capacitor.isNativePlatform() && (
          <motion.div 
            className="w-full max-w-4xl mt-6"
            variants={itemVariants}
          >
            <motion.div 
              onClick={() => handleCardClick("admin")}
              className={`group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-500 ${
                selectedUserType === "admin" 
                  ? "scale-[1.01] ring-4 ring-amber-400/60 shadow-[0_0_40px_rgba(245,158,11,0.4)]" 
                  : "hover:scale-[1.01]"
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/90 via-orange-500/85 to-rose-500/90 opacity-95" />
              
              {/* Pattern Overlay */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-1/4 w-32 h-32 bg-white rounded-full -translate-y-1/2" />
                <div className="absolute bottom-0 left-1/4 w-24 h-24 bg-white rounded-full translate-y-1/2" />
              </div>

              {/* Content - Horizontal Layout */}
              <div className="relative p-6 flex items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  {/* Icon */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/30 rounded-xl blur-lg scale-125" />
                    <div className="relative bg-white/20 backdrop-blur-md rounded-xl p-4 border border-white/30 group-hover:rotate-3 transition-all duration-300">
                      <Shield className="w-10 h-10 text-white drop-shadow-lg" strokeWidth={1.5} />
                    </div>
                  </div>
                  
                  {/* Text */}
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-white font-cairo drop-shadow-md">لوحة الإدارة</h2>
                      <span className="bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5 text-white text-[10px] font-bold font-cairo">للمشرفين</span>
                    </div>
                    <p className="text-white/90 font-cairo text-sm">
                      إدارة المستخدمين والإعلانات والتقارير
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <div className={`transition-all duration-300 ${selectedUserType === "admin" ? "opacity-100 scale-100" : "opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100"}`}>
                  <div className="bg-white/25 backdrop-blur-sm rounded-full px-5 py-2 border border-white/40 flex items-center gap-2">
                    <span className="text-white font-bold font-cairo text-sm">دخول</span>
                    <ArrowRight className="w-4 h-4 text-white rotate-180" />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}


        {/* Footer */}
        <motion.div className="mt-8 text-center" variants={itemVariants}>
          <p className="text-white/70 font-cairo text-lg">
            اختر نوع الحساب للدخول إلى المنصة
          </p>
        </motion.div>

        {/* Copyright */}
        <motion.div className="mt-8 text-center" variants={itemVariants}>
          <p className="text-white/60 font-cairo text-sm">
            جميع الحقوق محفوظة-العربي التبسي 2026©
          </p>
        </motion.div>
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
