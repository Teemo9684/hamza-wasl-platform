import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export const BackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location.pathname);

  // تحديث المرجع عند تغير المسار
  useEffect(() => {
    locationRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    // فقط في التطبيق الأصلي (Native App)
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let listener: { remove: () => Promise<void> } | null = null;

    const setupListener = async () => {
      listener = await CapacitorApp.addListener('backButton', () => {
        const currentPath = locationRef.current;
        
        // قائمة الصفحات الرئيسية التي عند الضغط على زر الرجوع منها يخرج من التطبيق
        const mainPages = [
          '/',
          '/dashboard/parent',
          '/dashboard/teacher',
          '/dashboard/admin'
        ];
        
        // التحقق من وجود سجل في التاريخ
        const hasHistory = window.history.length > 1;
        
        // إذا كنا في صفحة رئيسية ولا يوجد تاريخ، اخرج من التطبيق
        if (mainPages.includes(currentPath) && !hasHistory) {
          CapacitorApp.exitApp();
        } else {
          // استخدم history.back() للعودة للصفحة السابقة الفعلية
          window.history.back();
        }
      });
    };

    setupListener();

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [navigate]);

  return null;
};
