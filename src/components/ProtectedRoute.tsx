import { useEffect, useState, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";
import { showError } from "@/utils/errorMessages";

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
        showError("permission denied");
        setIsAuthorized(false);
      } else {
        const authorized = !!roleData;
        setIsAuthorized(authorized);
        
        // Cache the result
        authCache.set(cacheKey, { isAuthorized: authorized, timestamp: Date.now() });
        
        if (!roleData) {
          showError("not authorized");
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Auth check error:", error);
      }
      setIsAuthorized(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Block admin access on native app - redirect to home
  if (isAdminBlockedOnNative) {
    return <Navigate to="/" replace />;
  }

  // No loading indicator - render nothing briefly for smooth transition
  if (isLoading) {
    return null;
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
