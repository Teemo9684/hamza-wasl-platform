import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowRight, Home, Settings } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";


const LoginAdmin = () => {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  
  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();
        
        if (roleData) {
          navigate("/dashboard/admin", { replace: true });
        }
      }
    };
    checkSession();
  }, [navigate]);
  
  const handleSetupAdmin = async () => {
    setIsSettingUp(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-admin');
      
      if (error) {
        console.error('Setup error:', error);
        toast.error("حدث خطأ في إعداد حساب المسؤول");
        return;
      }

      toast.success(data.message || "تم إعداد حساب المسؤول بنجاح");
    } catch (error) {
      console.error('Setup admin error:', error);
      toast.error("حدث خطأ في إعداد حساب المسؤول");
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من الرقم السري
    if (!pin || pin.trim().length === 0) {
      toast.error("الرجاء إدخال الرقم السري");
      return;
    }

    setIsLoading(true);

    try {
      // استدعاء edge function للتحقق من كلمة المرور والحصول على البريد الإلكتروني
      const { data: loginData, error: loginError } = await supabase.functions.invoke('admin-login', {
        body: { password: pin.trim() }
      });

      if (loginError || !loginData?.success) {
        toast.error("الرقم السري غير صحيح");
        setIsLoading(false);
        return;
      }

      // تسجيل الدخول باستخدام البريد الإلكتروني المرجع
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: pin.trim(),
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error("لم يتم العثور على المستخدم");
      }

      // التحقق من صلاحية المسؤول
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleError) {
        throw roleError;
      }

      if (!roleData) {
        await supabase.auth.signOut();
        toast.error("ليس لديك صلاحية المسؤول");
        setIsLoading(false);
        return;
      }

      toast.success("تم تسجيل الدخول بنجاح");
      navigate("/dashboard/admin", { replace: true });
    } catch (error: any) {
      if (error.message?.includes("Invalid login credentials")) {
        toast.error("الرقم السري غير صحيح");
      } else if (error.message?.includes("Email not confirmed")) {
        toast.error("الرجاء تأكيد بريدك الإلكتروني أولاً");
      } else {
        toast.error("حدث خطأ في تسجيل الدخول");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 animated-bg opacity-90" />
      
      <div className="relative z-10 w-full max-w-md slide-in-up">
        <Button
          variant="ghost"
          onClick={handleBackToHome}
          className="mb-4 text-white hover:bg-white/10"
        >
          <Home className="ml-2 h-4 w-4" />
          العودة للرئيسية
        </Button>

        <Card className="glass-card border-none shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-accent rounded-full flex items-center justify-center mb-4">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-cairo">تسجيل دخول المدير</CardTitle>
            <CardDescription className="font-cairo">
              أدخل الرقم السري للوصول إلى لوحة التحكم الإدارية
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin" className="font-cairo text-lg">الرقم السري</Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="أدخل الرقم السري"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="font-cairo text-lg h-12"
                  required
                  autoFocus
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-accent text-white font-cairo"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "جاري التحميل..." : "تسجيل الدخول"}
                <ArrowRight className="mr-2 h-5 w-5" />
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full font-cairo"
                size="lg"
                disabled={isSettingUp}
                onClick={handleSetupAdmin}
              >
                {isSettingUp ? "جاري الإعداد..." : "إعداد حساب المسؤول"}
                <Settings className="mr-2 h-5 w-5" />
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginAdmin;
