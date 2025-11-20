import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { initializePushNotifications, isPushNotificationsAvailable } from "@/utils/pushNotifications";
import { setupRealtimeNotifications } from "@/utils/realtimeNotifications";
import { supabase } from "@/integrations/supabase/client";
import SplashScreen from "@/components/SplashScreen";
import Index from "./pages/Index";
import Register from "./pages/Register";
import RegisterParent from "./pages/RegisterParent";
import RegisterTeacher from "./pages/RegisterTeacher";
import LoginParent from "./pages/LoginParent";
import LoginTeacher from "./pages/LoginTeacher";
import LoginAdmin from "./pages/LoginAdmin";
import DashboardParent from "./pages/DashboardParent";
import DashboardTeacher from "./pages/DashboardTeacher";
import DashboardAdmin from "./pages/DashboardAdmin";
import InstallApp from "./pages/InstallApp";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // معالجة زر الرجوع في الهاتف
    const handlePopState = (event: PopStateEvent) => {
      // إذا كنا في الصفحة الرئيسية، لا نفعل شيء (سيخرج من التطبيق)
      if (window.location.pathname === '/') {
        return;
      }
      // في أي صفحة أخرى، يتم الرجوع بشكل طبيعي
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    // Initialize push notifications if available (native app)
    if (isPushNotificationsAvailable()) {
      initializePushNotifications();
    }

    // Set up real-time notifications for authenticated users
    let cleanupRealtime: (() => void) | undefined;

    const initializeNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Get user role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (roleData) {
          cleanupRealtime = await setupRealtimeNotifications(user.id, roleData.role);
        }
      }
    };

    initializeNotifications();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Defer Supabase calls with setTimeout to prevent deadlock
        setTimeout(async () => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (roleData) {
            cleanupRealtime = await setupRealtimeNotifications(session.user.id, roleData.role);
          }
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        // Clean up on sign out
        cleanupRealtime?.();
      }
    });

    return () => {
      subscription.unsubscribe();
      cleanupRealtime?.();
    };
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register/parent" element={<RegisterParent />} />
          <Route path="/register/teacher" element={<RegisterTeacher />} />
          <Route path="/login/parent" element={<LoginParent />} />
          <Route path="/login/teacher" element={<LoginTeacher />} />
          <Route path="/login/admin" element={<LoginAdmin />} />
          <Route 
            path="/dashboard/parent" 
            element={
              <ProtectedRoute requiredRole="parent">
                <DashboardParent />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/teacher" 
            element={
              <ProtectedRoute requiredRole="teacher">
                <DashboardTeacher />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/admin" 
            element={
              <ProtectedRoute requiredRole="admin">
                <DashboardAdmin />
              </ProtectedRoute>
            } 
          />
          <Route path="/install" element={<InstallApp />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;
