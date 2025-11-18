import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/contexts/ThemeContext";
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
import ImportStudents from "./pages/ImportStudents";
import InstallApp from "./pages/InstallApp";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

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
          <Route 
            path="/import/students" 
            element={
              <ProtectedRoute requiredRole="admin">
                <ImportStudents />
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
