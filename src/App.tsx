import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { initializePushNotifications, isPushNotificationsAvailable, unlockAudio, registerPushTokenForUser } from "@/utils/pushNotifications";
import { setupRealtimeNotifications, requestBrowserNotificationPermission } from "@/utils/realtimeNotifications";
import { startSchoolScheduleNotifications } from "@/utils/schoolScheduleNotifications";
import { supabase } from "@/integrations/supabase/client";
import { BackButtonHandler } from "@/components/BackButtonHandler";
import { LiveUpdateChecker } from "@/components/LiveUpdateChecker";
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

// Parent pages
import ParentOverviewPage from "./pages/parent/ParentOverviewPage";
import ParentAttendancePage from "./pages/parent/ParentAttendancePage";
import ParentHomeworkPage from "./pages/parent/ParentHomeworkPage";
import ParentSchedulePage from "./pages/parent/ParentSchedulePage";
import ParentMessagesPage from "./pages/parent/ParentMessagesPage";
import ParentSettingsPage from "./pages/parent/ParentSettingsPage";

// Teacher pages
import TeacherOverviewPage from "./pages/teacher/TeacherOverviewPage";
import TeacherAttendancePage from "./pages/teacher/TeacherAttendancePage";
import TeacherHomeworkPage from "./pages/teacher/TeacherHomeworkPage";
import TeacherMessagesPage from "./pages/teacher/TeacherMessagesPage";
import TeacherGroupMessagesPage from "./pages/teacher/TeacherGroupMessagesPage";

const queryClient = new QueryClient();

const App = () => {

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

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <BackButtonHandler />
              <LiveUpdateChecker autoCheck={true} checkInterval={30 * 60 * 1000} />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/register" element={<Register />} />
                <Route path="/register/parent" element={<RegisterParent />} />
                <Route path="/register/teacher" element={<RegisterTeacher />} />
                <Route path="/login/parent" element={<LoginParent />} />
                <Route path="/login/teacher" element={<LoginTeacher />} />
                <Route path="/login/admin" element={<LoginAdmin />} />
                
                {/* Parent Dashboard Routes */}
                <Route path="/dashboard/parent" element={<ProtectedRoute requiredRole="parent"><ParentOverviewPage /></ProtectedRoute>} />
                <Route path="/dashboard/parent/overview" element={<ProtectedRoute requiredRole="parent"><ParentOverviewPage /></ProtectedRoute>} />
                <Route path="/dashboard/parent/attendance" element={<ProtectedRoute requiredRole="parent"><ParentAttendancePage /></ProtectedRoute>} />
                <Route path="/dashboard/parent/homework" element={<ProtectedRoute requiredRole="parent"><ParentHomeworkPage /></ProtectedRoute>} />
                <Route path="/dashboard/parent/schedule" element={<ProtectedRoute requiredRole="parent"><ParentSchedulePage /></ProtectedRoute>} />
                <Route path="/dashboard/parent/messages" element={<ProtectedRoute requiredRole="parent"><ParentMessagesPage /></ProtectedRoute>} />
                <Route path="/dashboard/parent/settings" element={<ProtectedRoute requiredRole="parent"><ParentSettingsPage /></ProtectedRoute>} />
                
                {/* Teacher Dashboard Routes */}
                <Route path="/dashboard/teacher" element={<ProtectedRoute requiredRole="teacher"><TeacherOverviewPage /></ProtectedRoute>} />
                <Route path="/dashboard/teacher/overview" element={<ProtectedRoute requiredRole="teacher"><TeacherOverviewPage /></ProtectedRoute>} />
                <Route path="/dashboard/teacher/attendance" element={<ProtectedRoute requiredRole="teacher"><TeacherAttendancePage /></ProtectedRoute>} />
                <Route path="/dashboard/teacher/homework" element={<ProtectedRoute requiredRole="teacher"><TeacherHomeworkPage /></ProtectedRoute>} />
                <Route path="/dashboard/teacher/messages" element={<ProtectedRoute requiredRole="teacher"><TeacherMessagesPage /></ProtectedRoute>} />
                <Route path="/dashboard/teacher/groupMessages" element={<ProtectedRoute requiredRole="teacher"><TeacherGroupMessagesPage /></ProtectedRoute>} />
                
                {/* Admin Dashboard */}
                <Route path="/dashboard/admin" element={<ProtectedRoute requiredRole="admin"><DashboardAdmin /></ProtectedRoute>} />
                
                <Route path="/install" element={<InstallApp />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </NotificationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
