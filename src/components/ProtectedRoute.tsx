import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: "admin" | "teacher" | "parent";
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [requiredRole]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      // Check user role
      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", requiredRole)
        .maybeSingle();

      if (error) {
        console.error("Error checking role:", error);
        toast.error("حدث خطأ في التحقق من الصلاحيات");
        setIsAuthorized(false);
      } else {
        setIsAuthorized(!!roleData);
        if (!roleData) {
          toast.error("ليس لديك صلاحية للوصول إلى هذه الصفحة");
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setIsAuthorized(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    const loginPath = requiredRole === "admin" 
      ? "/login/admin" 
      : requiredRole === "teacher"
      ? "/login/teacher"
      : "/login/parent";
    
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
