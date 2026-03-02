import { useNavigate } from "react-router-dom";
import { Users, GraduationCap, Shield, ArrowRight, LogIn } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { realtimeManager } from "@/utils/realtimeManager";
import { useAppVersion } from "@/hooks/useAppVersion";

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
  const [showTeacherWarning, setShowTeacherWarning] = useState(false);
  const loginSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isIOSStandalone);
    };
    checkInstalled();
  }, []);

  const handleCardClick = (userType: UserType) => {
    if (userType === "teacher") {
      setShowTeacherWarning(true);
      return;
    }
    openLoginFor(userType);
  };

  const openLoginFor = (userType: UserType) => {
    setSelectedUserType(userType);
    setEmail("");
    setPassword("");
    setRememberMe(false);
    
    if (userType && userType !== "admin") {
      const savedEmail = localStorage.getItem(`${userType}_email`);
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
      localStorage.removeItem(`${userType}_password`);
    }
    
    setTimeout(() => {
      loginSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleBackToTop = () => {
    setIsExiting(true);
    setTimeout(() => {
      setSelectedUserType(null);
      setIsExiting(false);
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
          registerPath: "/register/parent"
        };
      case "teacher":
        return {
          icon: GraduationCap,
          title: "تسجيل دخول المعلم",
          description: "أدخل بياناتك للوصول إلى حساب المعلم",
          registerPath: "/register/teacher"
        };
      case "admin":
        return {
          icon: Shield,
          title: "تسجيل دخول الإدارة",
          description: "أدخل بياناتك للوصول إلى لوحة التحكم الإدارية",
          registerPath: "/register"
        };
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full bg-background" dir="rtl">
      {/* Official Header Bar */}
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-sm font-cairo opacity-90 mb-1">
            الجمهورية الجزائرية الديمقراطية الشعبية
          </p>
          <p className="text-sm font-cairo opacity-90 mb-1">
            وزارة التربية الوطنية
          </p>
          <p className="text-xs font-cairo opacity-75 mb-4">
            مديرية التربية لولاية خنشلة
          </p>
          <div className="w-16 h-px bg-primary-foreground/30 mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold font-cairo">
            منصة همزة وصل
          </h1>
          <p className="text-sm font-cairo opacity-80 mt-2">
            المدرسة الابتدائية العربي التبسي
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Section Title */}
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-bold font-cairo text-foreground">
            اختر صفة الدخول إلى المنصة
          </h2>
          <div className="w-20 h-0.5 bg-primary mx-auto mt-3" />
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Parent Card */}
          <Card 
            className="cursor-pointer transition-shadow duration-200 hover:shadow-md border border-border bg-card"
            onClick={() => handleCardClick("parent")}
          >
            <CardHeader className="text-center pb-3">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-xl font-cairo text-foreground">أولياء الأمور</CardTitle>
            </CardHeader>
            <CardContent className="text-center pb-4">
              <p className="text-sm text-muted-foreground font-cairo leading-relaxed">
                متابعة المسار الدراسي للتلميذ والتواصل مع المعلم
              </p>
            </CardContent>
            <CardFooter className="justify-center pb-6">
              <Button className="font-cairo bg-primary text-primary-foreground hover:bg-primary/90">
                <LogIn className="ml-2 h-4 w-4" />
                دخول / تسجيل
              </Button>
            </CardFooter>
          </Card>

          {/* Teacher Card */}
          <Card 
            className="cursor-pointer transition-shadow duration-200 hover:shadow-md border border-border bg-card"
            onClick={() => handleCardClick("teacher")}
          >
            <CardHeader className="text-center pb-3">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-xl font-cairo text-foreground">المعلمون</CardTitle>
            </CardHeader>
            <CardContent className="text-center pb-4">
              <p className="text-sm text-muted-foreground font-cairo leading-relaxed">
                إدارة الأقسام والتواصل التربوي
              </p>
            </CardContent>
            <CardFooter className="justify-center pb-6">
              <Button className="font-cairo bg-primary text-primary-foreground hover:bg-primary/90">
                <LogIn className="ml-2 h-4 w-4" />
                دخول / تسجيل
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Admin Card - Only on web */}
        {!Capacitor.isNativePlatform() && !isInstalled && (
          <div className="max-w-sm mx-auto mt-6">
            <Card 
              className="cursor-pointer transition-shadow duration-200 hover:shadow-md border border-border bg-card"
              onClick={() => openLoginFor("admin")}
            >
              <CardHeader className="text-center pb-3">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg font-cairo text-foreground">الإدارة</CardTitle>
              </CardHeader>
              <CardContent className="text-center pb-4">
                <p className="text-xs text-muted-foreground font-cairo">
                  لوحة التحكم الإدارية
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Teacher Warning Dialog */}
      <Dialog open={showTeacherWarning} onOpenChange={setShowTeacherWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center mb-3">
              <Shield className="w-7 h-7 text-destructive" />
            </div>
            <DialogTitle className="text-lg font-cairo text-foreground">
              تنبيه — قسم المعلمين
            </DialogTitle>
            <DialogDescription className="font-cairo text-sm leading-relaxed mt-2">
              تسجيل حساب المعلمين متاح فقط للطاقم التربوي المعتمد من إدارة المدرسة.
              <br /><br />
              إذا كنت ولي أمر، يرجى استخدام قسم "أولياء الأمور" لإنشاء حسابك.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button 
              className="w-full font-cairo bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                setShowTeacherWarning(false);
                openLoginFor("teacher");
              }}
            >
              أنا معلم، متابعة تسجيل الدخول
            </Button>
            <Button 
              variant="outline"
              className="w-full font-cairo"
              onClick={() => {
                setShowTeacherWarning(false);
                openLoginFor("parent");
              }}
            >
              أنا ولي أمر، الذهاب لقسم الأولياء
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Login Section */}
      {selectedUserType && (
        <div ref={loginSectionRef} className="min-h-screen flex items-center justify-center p-6 bg-muted/50">
          <div className={`w-full max-w-md transition-all duration-400 ${isExiting ? 'opacity-0 scale-95 translate-y-5' : 'animate-fadeInScale'}`}>
            <Button
              variant="ghost"
              onClick={handleBackToTop}
              className="mb-4 text-foreground hover:bg-accent/10 font-cairo"
              disabled={isExiting}
            >
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              العودة للأعلى
            </Button>

            <Card className="border border-border shadow-sm">
              <CardHeader className="text-center">
                {(() => {
                  const userInfo = getUserTypeInfo();
                  const IconComponent = userInfo?.icon;
                  return (
                    <>
                      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                        {IconComponent && <IconComponent className="w-8 h-8 text-primary" />}
                      </div>
                      <CardTitle className="text-2xl font-cairo">{userInfo?.title}</CardTitle>
                      <CardDescription className="font-cairo text-sm">
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
                      <Label htmlFor="email" className="font-cairo text-foreground">البريد الإلكتروني</Label>
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
                    <Label htmlFor="password" className="font-cairo text-foreground">كلمة المرور</Label>
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
                          <Button type="button" variant="link" className="text-sm text-primary p-0 h-auto font-cairo">
                            نسيت كلمة المرور؟
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-sm">
                          <DialogHeader className="text-center">
                            <DialogTitle className="text-xl font-cairo">استرجاع كلمة المرور</DialogTitle>
                            <DialogDescription className="font-cairo text-center text-sm">
                              أدخل بريدك الإلكتروني المسجل وسنرسل لك رابط لإعادة تعيين كلمة المرور
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
                              className="w-full font-cairo bg-primary text-primary-foreground"
                              size="lg"
                            >
                              {isResetting ? "جاري الإرسال..." : "إرسال رابط الاسترجاع"}
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
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-cairo"
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
                      className="w-full font-cairo text-sm"
                    >
                      ليس لديك حساب؟{" "}
                      <span className="text-primary font-bold mr-1">سجل الآن</span>
                    </Button>
                  )}
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-4 text-center">
        <p className="text-xs font-cairo opacity-70">
          جميع الحقوق محفوظة — المدرسة الابتدائية العربي التبسي © 2026
        </p>
        <p className="text-xs font-cairo opacity-50 mt-1">
          v{appVersion}
        </p>
      </footer>
    </div>
  );
};

export default Index;
