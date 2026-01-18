import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

/**
 * تأثيرات الاهتزاز للتطبيق
 */

// التحقق من دعم الاهتزاز
const isHapticsAvailable = () => {
  return Capacitor.isNativePlatform();
};

// اهتزاز خفيف - للنقرات العادية
export const lightHaptic = async () => {
  if (!isHapticsAvailable()) return;
  
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (error) {
    console.log('Haptics not available');
  }
};

// اهتزاز متوسط - للإجراءات المهمة
export const mediumHaptic = async () => {
  if (!isHapticsAvailable()) return;
  
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch (error) {
    console.log('Haptics not available');
  }
};

// اهتزاز قوي - للتأكيدات
export const heavyHaptic = async () => {
  if (!isHapticsAvailable()) return;
  
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch (error) {
    console.log('Haptics not available');
  }
};

// اهتزاز نجاح
export const successHaptic = async () => {
  if (!isHapticsAvailable()) return;
  
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch (error) {
    console.log('Haptics not available');
  }
};

// اهتزاز تحذير
export const warningHaptic = async () => {
  if (!isHapticsAvailable()) return;
  
  try {
    await Haptics.notification({ type: NotificationType.Warning });
  } catch (error) {
    console.log('Haptics not available');
  }
};

// اهتزاز خطأ
export const errorHaptic = async () => {
  if (!isHapticsAvailable()) return;
  
  try {
    await Haptics.notification({ type: NotificationType.Error });
  } catch (error) {
    console.log('Haptics not available');
  }
};

// اهتزاز اختيار - للقوائم والتبديل
export const selectionHaptic = async () => {
  if (!isHapticsAvailable()) return;
  
  try {
    await Haptics.selectionStart();
    await Haptics.selectionEnd();
  } catch (error) {
    console.log('Haptics not available');
  }
};
