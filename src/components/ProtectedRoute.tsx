import { useEffect, useState, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { motion, AnimatePresence } from "framer-motion";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: "admin" | "teacher" | "parent";
}

// Cache for auth results to prevent multiple loading states
const authCache = new Map<string, { isAuthorized: boolean; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const location = useLocation();
  const hasChecked = useRef(false);
  
  // Check if admin access is blocked on native app
  const isAdminBlockedOnNative = requiredRole === "admin" && Capacitor.isNativePlatform();

  useEffect(() => {
    // Skip auth check if admin is blocked on native
    if (isAdminBlockedOnNative) {
      setIsLoading(false);
      return;
    }
    
    // Prevent double checks
    if (hasChecked.current) return;
    hasChecked.current = true;
    
    checkAuth();
  }, [requiredRole, isAdminBlockedOnNative]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      // Check cache first
      const cacheKey = `${session.user.id}-${requiredRole}`;
      const cached = authCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setIsAuthorized(cached.isAuthorized);
        setIsLoading(false);
        if (cached.isAuthorized) {
          // Show content immediately for cached auth
          requestAnimationFrame(() => setShowContent(true));
        }
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
        if (import.meta.env.DEV) {
          console.error("Error checking role:", error);
        }
        toast.error("حدث خطأ في التحقق من الصلاحيات");
        setIsAuthorized(false);
      } else {
        const authorized = !!roleData;
        setIsAuthorized(authorized);
        
        // Cache the result
        authCache.set(cacheKey, { isAuthorized: authorized, timestamp: Date.now() });
        
        if (!roleData) {
          toast.error("ليس لديك صلاحية للوصول إلى هذه الصفحة");
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Auth check error:", error);
      }
      setIsAuthorized(false);
    } finally {
      setIsLoading(false);
      // Delay showing content for smooth transition
      requestAnimationFrame(() => setShowContent(true));
    }
  };

  // Block admin access on native app - redirect to home
  if (isAdminBlockedOnNative) {
    return <Navigate to="/" replace />;
  }

  // Show minimal skeleton instead of spinner for faster perceived loading
  if (isLoading) {
    return (
      <motion.div 
        className="min-h-screen bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        {/* Minimal skeleton that matches dashboard layout */}
        <div className="flex h-screen">
          {/* Sidebar skeleton */}
          <div className="hidden md:block w-64 bg-muted/30 animate-pulse" />
          {/* Main content skeleton */}
          <div className="flex-1 p-4 space-y-4">
            <div className="h-8 w-48 bg-muted/30 rounded animate-pulse" />
            <div className="h-32 bg-muted/20 rounded-lg animate-pulse" />
          </div>
        </div>
      </motion.div>
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

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="protected-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: showContent ? 1 : 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
