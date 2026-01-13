import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export const BackButtonHandler = () => {
  const location = useLocation();
  const locationRef = useRef(location.pathname + location.hash);

  // تحديث المرجع عند تغير المسار أو الـ hash
  useEffect(() => {
    locationRef.current = location.pathname + location.hash;
  }, [location.pathname, location.hash]);

  const handleBackButton = useCallback(() => {
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;
    
    // قائمة الصفحات الرئيسية
    const mainPages = [
      '/',
      '/dashboard/parent',
      '/dashboard/teacher',
      '/dashboard/admin'
    ];
    
    // إذا كان هناك hash، استخدم history.back للرجوع
    if (currentHash) {
      console.log('BackButton: Has hash, going back');
      window.history.back();
      return;
    }
    
    // إذا كنا في صفحة رئيسية بدون hash
    if (mainPages.includes(currentPath)) {
      // تحقق إذا كان هناك تاريخ للرجوع إليه
      // نستخدم sessionStorage لتتبع ما إذا كان المستخدم قادم من صفحة أخرى
      const hasRealHistory = sessionStorage.getItem('navigation_depth');
      const depth = hasRealHistory ? parseInt(hasRealHistory, 10) : 0;
      
      if (depth > 0) {
        console.log('BackButton: Has history depth, going back');
        window.history.back();
      } else {
        console.log('BackButton: No history, exiting app');
        CapacitorApp.exitApp();
      }
    } else {
      // في أي صفحة أخرى، ارجع للصفحة السابقة
      console.log('BackButton: Other page, going back');
      window.history.back();
    }
  }, []);

  useEffect(() => {
    // فقط في التطبيق الأصلي (Native App)
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let listener: { remove: () => Promise<void> } | null = null;

    const setupListener = async () => {
      listener = await CapacitorApp.addListener('backButton', handleBackButton);
    };

    setupListener();

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [handleBackButton]);

  // تتبع عمق التنقل
  useEffect(() => {
    const currentDepth = sessionStorage.getItem('navigation_depth');
    const depth = currentDepth ? parseInt(currentDepth, 10) : 0;
    
    // زيادة العمق عند التنقل
    const handlePopState = () => {
      const newDepth = Math.max(0, depth - 1);
      sessionStorage.setItem('navigation_depth', newDepth.toString());
    };
    
    // تحديث العمق عند الذهاب لصفحة جديدة
    sessionStorage.setItem('navigation_depth', (depth + 1).toString());
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [location.pathname]);

  return null;
};
