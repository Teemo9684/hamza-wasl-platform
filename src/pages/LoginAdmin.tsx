import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowRight, Home } from "lucide-react";
import { toast } from "sonner";

const LoginAdmin = () => {
  const navigate = useNavigate();
  const [pinCode, setPinCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const ADMIN_PIN = "ADMIN2025@";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      if (!pinCode) {
        toast.error("يرجى إدخال الرقم السري");
        setIsLoading(false);
        return;
      }
      
      if (pinCode !== ADMIN_PIN) {
        toast.error("الرقم السري غير صحيح");
        setIsLoading(false);
        return;
      }
      
      toast.success("تم تسجيل الدخول بنجاح");
      navigate("/dashboard/admin");
      setIsLoading(false);
    }, 1000);
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
            <div className="mx-auto w-20 h-20 bg-accent rounded-full flex items-center justify-center mb-4">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-cairo">تسجيل دخول المدير</CardTitle>
            <CardDescription className="font-tajawal">
              أدخل الرقم السري للوصول إلى لوحة التحكم الإدارية
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pinCode" className="font-tajawal text-lg">الرقم السري</Label>
                <Input
                  id="pinCode"
                  type="password"
                  placeholder="أدخل الرقم السري للإدارة"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="font-tajawal text-lg h-12"
                  required
                  autoFocus
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-accent text-white font-tajawal"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "جاري التحميل..." : "تسجيل الدخول"}
                <ArrowRight className="mr-2 h-5 w-5" />
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginAdmin;
