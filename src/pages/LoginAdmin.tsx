import { APP_VERSION } from "@/config/version";
import { APP_AUDIENCE } from "@/config/appAudience";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowRight, Home, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess, showWarning, ErrorMessages } from "@/utils/errorMessages";


const LoginAdmin = () => {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [diagnostic, setDiagnostic] = useState("");
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
        showError("حدث خطأ في إعداد حساب المسؤول");
        return;
      }

      showSuccess("تم إعداد حساب المسؤول", data.message || "تم إعداد الحساب بنجاح");
    } catch (error) {
      console.error('Setup admin error:', error);
      showError("حدث خطأ في إعداد حساب المسؤول");
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // تسمح للمسؤول بالدخول دائماً (المسؤول لا يتأثر بوضع العطلة)
    // يمكن للمسؤول الدخول لتعطيل وضع العطلة
    
    // التحقق من الرقم السري
    if (!pin || pin.trim().length === 0) {
      showWarning("حقل مطلوب", "الرجاء إدخال الرقم السري");
      return;
    }

    setIsLoading(true);
    setDiagnostic("");
    let stage = "AUTH";

    try {
      // Verify the existing administrator account directly via Supabase Auth.
      // Authorization still requires the server-side admin role below.
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: "admin@arbit.local",
        password: pin,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error("لم يتم العثور على المستخدم");
      }

      stage = "ROLE";
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
        setDiagnostic("ROLE / ADMIN_ROLE_MISSING");
        ErrorMessages.PERMISSION_DENIED();
        setIsLoading(false);
        return;
      }

      stage = "SESSION";
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session) throw new Error("SESSION_MISSING");
      showSuccess("تم تسجيل الدخول بنجاح", "مرحباً بك في لوحة التحكم");
      navigate("/dashboard/admin", { replace: true });
    } catch (error: any) {
      const rawCode = typeof error?.code === "string" ? error.code : "";
      const code = /^[a-zA-Z0-9_]{1,80}$/.test(rawCode) ? rawCode : (error?.name === "AuthRetryableFetchError" || error instanceof TypeError ? "NETWORK_ERROR" : "UNKNOWN");
      const status = typeof error?.status === "number" ? ` / HTTP ${error.status}` : "";
      setDiagnostic(`${stage} / ${code}${status}`);
      showError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    // Don't sign out when going back to home - preserve session
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
          
          <form onSubmit={handleLogin} autoComplete="on">
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin" className="font-cairo text-lg">الرقم السري</Label>
                <Input
                  id="pin"
                  name="password"
                  type="password"
                  autoComplete="current-password"
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
              
              {APP_AUDIENCE !== "admin" && <Button
                type="button"
                variant="outline"
                className="w-full font-cairo"
                size="lg"
                disabled={isSettingUp}
                onClick={handleSetupAdmin}
              >
                {isSettingUp ? "جاري الإعداد..." : "إعداد حساب المسؤول"}
                <Settings className="mr-2 h-5 w-5" />
              </Button>}
              {APP_AUDIENCE === "admin" && <div className="w-full text-center text-xs text-muted-foreground space-y-2" dir="ltr">
                <p>Admin v{APP_VERSION}</p>
                {diagnostic && <p role="alert" className="p-3 rounded border border-destructive text-destructive break-all select-all font-mono">{diagnostic}</p>}
              </div>}
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginAdmin;
