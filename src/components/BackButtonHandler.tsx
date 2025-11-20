import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';

export const BackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleBackButton = async () => {
      // استمع لحدث زر الرجوع في الهاتف
      const listener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        // إذا كنا في الصفحة الرئيسية، اخرج من التطبيق
        if (location.pathname === '/' || !canGoBack) {
          CapacitorApp.exitApp();
        } else {
          // وإلا ارجع للصفحة السابقة
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
