import { Capacitor } from '@capacitor/core';

/**
 * تأثيرات الاهتزاز للتطبيق
 * يستخدم Capacitor Haptics على Android/iOS
 * ويستخدم Web Vibration API كبديل
 */

// التحقق من دعم الاهتزاز
const isHapticsAvailable = () => {
  return Capacitor.isNativePlatform();
};

// التحقق من دعم Web Vibration API
const isWebVibrationAvailable = () => {
  return 'vibrate' in navigator;
};

// تحميل مكتبة Haptics بشكل ديناميكي
let HapticsModule: any = null;

const loadHaptics = async () => {
  if (HapticsModule) return HapticsModule;
  
  if (Capacitor.isNativePlatform()) {
    try {
      const module = await import('@capacitor/haptics');
      HapticsModule = module;
      return HapticsModule;
    } catch (error) {
      console.warn('Haptics plugin not available:', error);
      return null;
    }
  }
  return null;
};

// اهتزاز خفيف - للنقرات العادية
export const lightHaptic = async () => {
  if (isHapticsAvailable()) {
    try {
      const haptics = await loadHaptics();
      if (haptics) {
        await haptics.Haptics.impact({ style: haptics.ImpactStyle.Light });
        console.log('Light haptic triggered (native)');
        return;
      }
    } catch (error) {
      console.log('Native haptics failed, trying web fallback');
    }
  }
  
  // Web fallback
  if (isWebVibrationAvailable()) {
    navigator.vibrate(10);
    console.log('Light haptic triggered (web)');
  }
};

// اهتزاز متوسط - للإجراءات المهمة
export const mediumHaptic = async () => {
  if (isHapticsAvailable()) {
    try {
      const haptics = await loadHaptics();
      if (haptics) {
        await haptics.Haptics.impact({ style: haptics.ImpactStyle.Medium });
        console.log('Medium haptic triggered (native)');
        return;
      }
    } catch (error) {
      console.log('Native haptics failed, trying web fallback');
    }
  }
  
  // Web fallback
  if (isWebVibrationAvailable()) {
    navigator.vibrate(30);
    console.log('Medium haptic triggered (web)');
  }
};

// اهتزاز قوي - للتأكيدات والإشعارات
export const heavyHaptic = async () => {
  if (isHapticsAvailable()) {
    try {
      const haptics = await loadHaptics();
      if (haptics) {
        await haptics.Haptics.impact({ style: haptics.ImpactStyle.Heavy });
        console.log('Heavy haptic triggered (native)');
        return;
      }
    } catch (error) {
      console.log('Native haptics failed, trying web fallback');
    }
  }
  
  // Web fallback - longer vibration for notifications
  if (isWebVibrationAvailable()) {
    navigator.vibrate([50, 30, 50]);
    console.log('Heavy haptic triggered (web)');
  }
};

// اهتزاز نجاح
export const successHaptic = async () => {
  if (isHapticsAvailable()) {
    try {
      const haptics = await loadHaptics();
      if (haptics) {
        await haptics.Haptics.notification({ type: haptics.NotificationType.Success });
        console.log('Success haptic triggered (native)');
        return;
      }
    } catch (error) {
      console.log('Native haptics failed, trying web fallback');
    }
  }
  
  // Web fallback
  if (isWebVibrationAvailable()) {
    navigator.vibrate([30, 50, 100]);
    console.log('Success haptic triggered (web)');
  }
};

// اهتزاز تحذير
export const warningHaptic = async () => {
  if (isHapticsAvailable()) {
    try {
      const haptics = await loadHaptics();
      if (haptics) {
        await haptics.Haptics.notification({ type: haptics.NotificationType.Warning });
        console.log('Warning haptic triggered (native)');
        return;
      }
    } catch (error) {
      console.log('Native haptics failed, trying web fallback');
    }
  }
  
  // Web fallback
  if (isWebVibrationAvailable()) {
    navigator.vibrate([50, 30, 50, 30, 50]);
    console.log('Warning haptic triggered (web)');
  }
};

// اهتزاز خطأ
export const errorHaptic = async () => {
  if (isHapticsAvailable()) {
    try {
      const haptics = await loadHaptics();
      if (haptics) {
        await haptics.Haptics.notification({ type: haptics.NotificationType.Error });
        console.log('Error haptic triggered (native)');
        return;
      }
    } catch (error) {
      console.log('Native haptics failed, trying web fallback');
    }
  }
  
  // Web fallback
  if (isWebVibrationAvailable()) {
    navigator.vibrate([100, 50, 100, 50, 100]);
    console.log('Error haptic triggered (web)');
  }
};

// اهتزاز اختيار - للقوائم والتبديل
export const selectionHaptic = async () => {
  if (isHapticsAvailable()) {
    try {
      const haptics = await loadHaptics();
      if (haptics) {
        await haptics.Haptics.selectionStart();
        await haptics.Haptics.selectionEnd();
        console.log('Selection haptic triggered (native)');
        return;
      }
    } catch (error) {
      console.log('Native haptics failed, trying web fallback');
    }
  }
  
  // Web fallback
  if (isWebVibrationAvailable()) {
    navigator.vibrate(5);
    console.log('Selection haptic triggered (web)');
  }
};

// اهتزاز إشعار قوي - للإشعارات المهمة
export const notificationHaptic = async () => {
  if (isHapticsAvailable()) {
    try {
      const haptics = await loadHaptics();
      if (haptics) {
        // Triple heavy impact for notifications
        await haptics.Haptics.impact({ style: haptics.ImpactStyle.Heavy });
        await new Promise(resolve => setTimeout(resolve, 100));
        await haptics.Haptics.impact({ style: haptics.ImpactStyle.Heavy });
        await new Promise(resolve => setTimeout(resolve, 100));
        await haptics.Haptics.impact({ style: haptics.ImpactStyle.Heavy });
        console.log('Notification haptic triggered (native)');
        return;
      }
    } catch (error) {
      console.log('Native haptics failed, trying web fallback');
    }
  }
  
  // Web fallback - strong pattern for notifications
  if (isWebVibrationAvailable()) {
    navigator.vibrate([100, 50, 100, 50, 100]);
    console.log('Notification haptic triggered (web)');
  }
};
