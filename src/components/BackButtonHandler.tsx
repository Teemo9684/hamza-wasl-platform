import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export const BackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // فقط في التطبيق الأصلي (Native App)
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const handleBackButton = async () => {
      // استمع لحدث زر الرجوع في الهاتف
      const listener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        const currentPath = location.pathname;
        
        // قائمة الصفحات الرئيسية التي عند الضغط على زر الرجوع منها يخرج من التطبيق
        const mainPages = [
          '/',
          '/dashboard/parent',
          '/dashboard/teacher',
          '/dashboard/admin'
        ];
        
        // إذا كنا في صفحة رئيسية ولا توجد صفحة سابقة، اخرج من التطبيق
        if (mainPages.includes(currentPath) && !canGoBack) {
          CapacitorApp.exitApp();
        } 
        // إذا كنا في صفحة رئيسية ولكن هناك صفحة سابقة، ارجع للصفحة السابقة
        else if (mainPages.includes(currentPath) && canGoBack) {
          navigate(-1);
        }
        // في أي صفحة أخرى، ارجع للصفحة السابقة
        else {
          navigate(-1);
        }
      });

      return listener;
    };

    let listenerPromise = handleBackButton();

    return () => {
      listenerPromise.then(listener => listener.remove());
    };
  }, [navigate, location]);

  return null;
};
