import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserCheck, ArrowRight, Home } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const LoginTeacher = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!email || !password) {
      toast.error("الرجاء إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Teacher login attempt for:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        console.error("Login error:", error.message);
        throw error;
      }

      if (data.user) {
        console.log("User authenticated, checking teacher role...");
        
        // Check if user has teacher role
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .eq('role', 'teacher')
          .maybeSingle();

        if (roleError) {
          console.error("Role check error:", roleError);
          throw roleError;
        }

        if (!roleData) {
          console.log("User does not have teacher role");
          toast.error("هذا الحساب ليس حساب معلم");
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }

        console.log("Teacher role confirmed, navigating to dashboard...");
        toast.success("تم تسجيل الدخول بنجاح");
        
        // Use setTimeout to ensure toast is shown before navigation
        setTimeout(() => {
          navigate("/dashboard/teacher");
        }, 100);
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      
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
        redirectTo: `${window.location.origin}/login/teacher`,
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

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 animated-bg opacity-90" />
      
      <div className="relative z-10 w-full max-w-md slide-in-up">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4 text-white hover:bg-white/10"
        >
          <Home className="ml-2 h-4 w-4" />
          العودة للرئيسية
        </Button>

        <Card className="glass-card border-none shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-secondary rounded-full flex items-center justify-center mb-4">
              <UserCheck className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-cairo">تسجيل دخول المعلم</CardTitle>
            <CardDescription className="font-cairo">
              أدخل بياناتك للوصول إلى حساب المعلم
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
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

              <div className="flex justify-end">
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
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-gradient-secondary text-white font-cairo"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "جاري التحميل..." : "تسجيل الدخول"}
                <ArrowRight className="mr-2 h-5 w-5" />
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate("/register/teacher")}
                className="w-full font-cairo"
              >
                ليس لديك حساب؟ سجل الآن
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginTeacher;
