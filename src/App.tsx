import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import PageTransition from "@/components/PageTransition";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { initializePushNotifications, isPushNotificationsAvailable, unlockAudio, registerPushTokenForUser } from "@/utils/pushNotifications";
import { setupRealtimeNotifications, requestBrowserNotificationPermission } from "@/utils/realtimeNotifications";
import { startSchoolScheduleNotifications } from "@/utils/schoolScheduleNotifications";
import { supabase } from "@/integrations/supabase/client";
import { BackButtonHandler } from "@/components/BackButtonHandler";
import { LiveUpdateChecker } from "@/components/LiveUpdateChecker";
import { SchoolScheduleAlert } from "@/components/SchoolScheduleAlert";
import { useSessionPersistence } from "@/hooks/useSessionPersistence";
import SplashScreen from "@/components/SplashScreen";
import Index from "./pages/Index";
import Register from "./pages/Register";
import RegisterParent from "./pages/RegisterParent";
import RegisterTeacher from "./pages/RegisterTeacher";
import LoginParent from "./pages/LoginParent";
import LoginTeacher from "./pages/LoginTeacher";
import LoginAdmin from "./pages/LoginAdmin";
import DashboardAdmin from "./pages/DashboardAdmin";
import InstallApp from "./pages/InstallApp";
import NotFound from "./pages/NotFound";

// Dashboard Layouts
import { ParentDashboardLayout } from "./components/ParentDashboardLayout";
import { TeacherDashboardLayout } from "./components/TeacherDashboardLayout";

// Parent page content components
import { ParentOverviewContent } from "./pages/parent/ParentOverviewPage";
import { ParentAttendanceContent } from "./pages/parent/ParentAttendancePage";
import { ParentHomeworkContent } from "./pages/parent/ParentHomeworkPage";
import { ParentScheduleContent } from "./pages/parent/ParentSchedulePage";
import { ParentMessagesContent } from "./pages/parent/ParentMessagesPage";
import { ParentDocumentRequestsContent } from "./pages/parent/ParentDocumentRequestsPage";
import { ParentSettingsContent } from "./pages/parent/ParentSettingsPage";

// Teacher page content components
import { TeacherOverviewContent } from "./pages/teacher/TeacherOverviewPage";
import { TeacherAttendanceContent } from "./pages/teacher/TeacherAttendancePage";
import { TeacherHomeworkContent } from "./pages/teacher/TeacherHomeworkPage";
import { TeacherMessagesContent } from "./pages/teacher/TeacherMessagesPage";
import { TeacherGroupMessagesContent } from "./pages/teacher/TeacherGroupMessagesPage";

const queryClient = new QueryClient();

// Animated Routes Component
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <Routes location={location}>
      <Route path="/" element={<PageTransition><Index /></PageTransition>} />
      <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
      <Route path="/register/parent" element={<PageTransition><RegisterParent /></PageTransition>} />
      <Route path="/register/teacher" element={<PageTransition><RegisterTeacher /></PageTransition>} />
      <Route path="/login/parent" element={<PageTransition><LoginParent /></PageTransition>} />
      <Route path="/login/teacher" element={<PageTransition><LoginTeacher /></PageTransition>} />
      <Route path="/login/admin" element={<PageTransition><LoginAdmin /></PageTransition>} />
      
      {/* Parent Dashboard with shared layout */}
      <Route path="/dashboard/parent" element={<ProtectedRoute requiredRole="parent"><ParentDashboardLayout /></ProtectedRoute>}>
        <Route index element={<ParentOverviewContent />} />
        <Route path="overview" element={<ParentOverviewContent />} />
        <Route path="attendance" element={<ParentAttendanceContent />} />
        <Route path="homework" element={<ParentHomeworkContent />} />
        <Route path="schedule" element={<ParentScheduleContent />} />
        <Route path="messages" element={<ParentMessagesContent />} />
        <Route path="documents" element={<ParentDocumentRequestsContent />} />
        <Route path="settings" element={<ParentSettingsContent />} />
      </Route>
      
      {/* Teacher Dashboard with shared layout */}
      <Route path="/dashboard/teacher" element={<ProtectedRoute requiredRole="teacher"><TeacherDashboardLayout /></ProtectedRoute>}>
        <Route index element={<TeacherOverviewContent />} />
        <Route path="overview" element={<TeacherOverviewContent />} />
        <Route path="attendance" element={<TeacherAttendanceContent />} />
        <Route path="homework" element={<TeacherHomeworkContent />} />
        <Route path="messages" element={<TeacherMessagesContent />} />
        <Route path="groupMessages" element={<TeacherGroupMessagesContent />} />
      </Route>
      
      {/* Admin Dashboard */}
      <Route path="/dashboard/admin" element={<ProtectedRoute requiredRole="admin"><DashboardAdmin /></ProtectedRoute>} />
      
      <Route path="/install" element={<PageTransition><InstallApp /></PageTransition>} />
      <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
    </Routes>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Ensure session persistence on native platforms
  useSessionPersistence();

  useEffect(() => {
    // Trigger entrance animation immediately after splash finishes
    if (!showSplash) {
      // Use requestAnimationFrame for smoother transition
      requestAnimationFrame(() => setIsLoaded(true));
    }
  }, [showSplash]);

  useEffect(() => {
    const handleUserInteraction = () => {
      unlockAudio();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    if (isPushNotificationsAvailable()) {
      initializePushNotifications();
    }

    requestBrowserNotificationPermission();
    const cleanupScheduleNotifications = startSchoolScheduleNotifications();
    let cleanupRealtime: (() => void) | undefined;

    const initializeNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setTimeout(async () => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (roleData) {
            cleanupRealtime = await setupRealtimeNotifications(session.user.id, roleData.role);
          }

          if (isPushNotificationsAvailable()) {
            await registerPushTokenForUser();
          }
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        cleanupRealtime?.();
      }
    });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      subscription.unsubscribe();
      cleanupRealtime?.();
      cleanupScheduleNotifications();
    };
  }, []);

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ 
          opacity: isLoaded ? 1 : 0, 
          scale: isLoaded ? 1 : 0.98 
        }}
        transition={{ 
          duration: 0.5, 
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
        className="min-h-screen"
      >
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <NotificationProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <SchoolScheduleAlert />
                <BrowserRouter>
                  <BackButtonHandler />
                  <LiveUpdateChecker autoCheck={true} checkInterval={30 * 60 * 1000} />
                  <AnimatedRoutes />
                </BrowserRouter>
              </TooltipProvider>
            </NotificationProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </motion.div>
    </AnimatePresence>
  );
};

export default App;
