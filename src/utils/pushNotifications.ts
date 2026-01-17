import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Store the current token for re-registration
let currentPushToken: string | null = null;

// Get platform info
const getPlatform = (): string => {
  if (Capacitor.isNativePlatform()) {
    return Capacitor.getPlatform(); // 'ios' or 'android'
  }
  return 'web';
};

// Get device name
const getDeviceName = (): string => {
  const userAgent = navigator.userAgent;
  if (/android/i.test(userAgent)) {
    return 'Android Device';
  } else if (/iPad|iPhone|iPod/.test(userAgent)) {
    return 'iOS Device';
  }
  return 'Unknown Device';
};

// Audio context singleton for notification sounds
let audioContext: AudioContext | null = null;
let isAudioUnlocked = false;
let audioUnlockAttempts = 0;
const MAX_UNLOCK_ATTEMPTS = 3;

// Initialize audio context (call after user interaction)
const getAudioContext = (): AudioContext | null => {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('AudioContext created, state:', audioContext.state);
    } catch (error) {
      console.error('Failed to create AudioContext:', error);
      return null;
    }
  }
  
  // Resume if suspended - this is critical for iOS and Android
  if (audioContext.state === 'suspended') {
    audioContext.resume().then(() => {
      console.log('AudioContext resumed from suspended state');
    }).catch(err => {
      console.warn('Failed to resume AudioContext:', err);
    });
  }
  
  return audioContext;
};

// Unlock audio on first user interaction - more aggressive unlocking
export const unlockAudio = async () => {
  if (isAudioUnlocked && audioContext?.state === 'running') return;
  
  audioUnlockAttempts++;
  console.log(`Attempting to unlock audio (attempt ${audioUnlockAttempts})...`);
  
  const ctx = getAudioContext();
  if (ctx) {
    try {
      // First, try to resume if suspended
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      
      // Create a silent buffer to unlock audio
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      
      // Wait a moment to ensure audio is unlocked
      await new Promise(resolve => setTimeout(resolve, 50));
      
      if (ctx.state === 'running') {
        isAudioUnlocked = true;
        console.log('Audio successfully unlocked, state:', ctx.state);
      } else {
        console.warn('Audio unlock attempted but state is:', ctx.state);
      }
    } catch (error) {
      console.warn('Error during audio unlock:', error);
    }
  }
};

// Force unlock audio - call this on critical user interactions
export const forceUnlockAudio = async () => {
  isAudioUnlocked = false;
  audioContext = null;
  audioUnlockAttempts = 0;
  await unlockAudio();
};

// نوع الإشعار
export type NotificationType = 'default' | 'user' | 'document' | 'message' | 'attendance' | 'homework' | 'announcement';

// Play notification sound based on type
export const playNotificationSound = async (type: NotificationType = 'default') => {
  try {
    // Ensure audio is unlocked first
    if (!isAudioUnlocked) {
      console.log('Audio not unlocked, attempting to unlock...');
      await unlockAudio();
    }
    
    const ctx = getAudioContext();
    if (!ctx) {
      console.warn('AudioContext not available for sound:', type);
      return;
    }

    // Resume context if needed - critical for playing sounds
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
        console.log('AudioContext resumed for notification sound');
      } catch (e) {
        console.warn('Failed to resume AudioContext:', e);
        return;
      }
    }
    
    // Double check state before playing
    if (ctx.state !== 'running') {
      console.warn('AudioContext not running, state:', ctx.state);
      return;
    }
    
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);

    switch (type) {
      case 'user':
        // صوت تسجيل مستخدم جديد - نغمة ترحيبية صاعدة
        playUserNotificationSound(ctx, gainNode);
        break;
      case 'document':
        // صوت طلب وثيقة - نغمة رسمية
        playDocumentNotificationSound(ctx, gainNode);
        break;
      case 'message':
        // صوت رسالة جديدة - نغمة خفيفة
        playMessageNotificationSound(ctx, gainNode);
        break;
      case 'attendance':
        // صوت تسجيل الحضور - نغمة تأكيدية
        playAttendanceNotificationSound(ctx, gainNode);
        break;
      case 'homework':
        // صوت واجب جديد - نغمة تنبيهية
        playHomeworkNotificationSound(ctx, gainNode);
        break;
      case 'announcement':
        // صوت إعلان جديد - نغمة مميزة
        playAnnouncementNotificationSound(ctx, gainNode);
        break;
      default:
        // الصوت الافتراضي
        playDefaultNotificationSound(ctx, gainNode);
    }
    
    console.log('Notification sound played:', type);
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
};

// صوت افتراضي
const playDefaultNotificationSound = (ctx: AudioContext, gainNode: GainNode) => {
  const oscillator1 = ctx.createOscillator();
  const oscillator2 = ctx.createOscillator();

  oscillator1.connect(gainNode);
  oscillator2.connect(gainNode);

  oscillator1.frequency.value = 880; // A5
  oscillator1.type = 'sine';
  
  oscillator2.frequency.value = 1100; // C#6
  oscillator2.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

  oscillator1.start(ctx.currentTime);
  oscillator2.start(ctx.currentTime + 0.1);
  oscillator1.stop(ctx.currentTime + 0.5);
  oscillator2.stop(ctx.currentTime + 0.6);
};

// صوت تسجيل مستخدم جديد - نغمة ترحيبية صاعدة (Do-Mi-Sol)
const playUserNotificationSound = (ctx: AudioContext, gainNode: GainNode) => {
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  const duration = 0.15;
  
  notes.forEach((freq, index) => {
    const oscillator = ctx.createOscillator();
    const noteGain = ctx.createGain();
    
    oscillator.connect(noteGain);
    noteGain.connect(gainNode);
    
    oscillator.frequency.value = freq;
    oscillator.type = 'sine';
    
    const startTime = ctx.currentTime + (index * duration);
    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
    noteGain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  });
};

// صوت طلب وثيقة - نغمتين رسميتين
const playDocumentNotificationSound = (ctx: AudioContext, gainNode: GainNode) => {
  const oscillator1 = ctx.createOscillator();
  const oscillator2 = ctx.createOscillator();
  
  oscillator1.connect(gainNode);
  oscillator2.connect(gainNode);
  
  // نغمة أولى منخفضة
  oscillator1.frequency.value = 440; // A4
  oscillator1.type = 'triangle';
  
  // نغمة ثانية أعلى
  oscillator2.frequency.value = 554.37; // C#5
  oscillator2.type = 'triangle';
  
  gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
  
  oscillator1.start(ctx.currentTime);
  oscillator1.stop(ctx.currentTime + 0.2);
  
  oscillator2.start(ctx.currentTime + 0.2);
  oscillator2.stop(ctx.currentTime + 0.4);
};

// صوت رسالة جديدة - نغمة خفيفة وسريعة
const playMessageNotificationSound = (ctx: AudioContext, gainNode: GainNode) => {
  const oscillator1 = ctx.createOscillator();
  const oscillator2 = ctx.createOscillator();
  
  oscillator1.connect(gainNode);
  oscillator2.connect(gainNode);
  
  // نغمة عالية سريعة
  oscillator1.frequency.value = 987.77; // B5
  oscillator1.type = 'sine';
  
  oscillator2.frequency.value = 1174.66; // D6
  oscillator2.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
  
  oscillator1.start(ctx.currentTime);
  oscillator1.stop(ctx.currentTime + 0.12);
  
  oscillator2.start(ctx.currentTime + 0.08);
  oscillator2.stop(ctx.currentTime + 0.25);
};

// صوت تسجيل الحضور - نغمة تأكيدية قصيرة
const playAttendanceNotificationSound = (ctx: AudioContext, gainNode: GainNode) => {
  const oscillator = ctx.createOscillator();
  
  oscillator.connect(gainNode);
  
  // نغمة تأكيد سريعة
  oscillator.frequency.value = 698.46; // F5
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.2);
};

// صوت واجب جديد - نغمة تنبيهية متوسطة
const playHomeworkNotificationSound = (ctx: AudioContext, gainNode: GainNode) => {
  const notes = [659.25, 783.99]; // E5, G5
  const duration = 0.12;
  
  notes.forEach((freq, index) => {
    const oscillator = ctx.createOscillator();
    const noteGain = ctx.createGain();
    
    oscillator.connect(noteGain);
    noteGain.connect(gainNode);
    
    oscillator.frequency.value = freq;
    oscillator.type = 'triangle';
    
    const startTime = ctx.currentTime + (index * duration);
    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(0.22, startTime + 0.02);
    noteGain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  });
};

// صوت إعلان جديد - نغمة مميزة
const playAnnouncementNotificationSound = (ctx: AudioContext, gainNode: GainNode) => {
  const oscillator1 = ctx.createOscillator();
  const oscillator2 = ctx.createOscillator();
  
  oscillator1.connect(gainNode);
  oscillator2.connect(gainNode);
  
  // نغمة أولى
  oscillator1.frequency.value = 830.61; // G#5
  oscillator1.type = 'sine';
  
  // نغمة ثانية أعلى
  oscillator2.frequency.value = 1046.50; // C6
  oscillator2.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
  
  oscillator1.start(ctx.currentTime);
  oscillator1.stop(ctx.currentTime + 0.15);
  
  oscillator2.start(ctx.currentTime + 0.12);
  oscillator2.stop(ctx.currentTime + 0.35);
};

export const initializePushNotifications = async () => {
  try {
    // Request permission immediately
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
      // Request permissions immediately without waiting
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('Push notification permission not granted');
      return false;
    }

    // Register with Apple / Google to receive push via APNS/FCM
    await PushNotifications.register();

    // Set up listeners
    setupPushNotificationListeners();
    
    // Push notifications initialized successfully
    return true;
  } catch (error) {
    console.error('Error initializing push notifications:', error);
    return false;
  }
};

const setupPushNotificationListeners = () => {
  // Called when registration is successful
  PushNotifications.addListener('registration', async (token) => {
    console.log('Push registration success, token:', token.value);
    currentPushToken = token.value;
    
    // Save the token to the push_tokens table
    await saveTokenToDatabase(token.value);
  });

  // Called when registration fails
  PushNotifications.addListener('registrationError', (error) => {
    console.error('Error on registration: ' + JSON.stringify(error));
    toast.error('فشل تسجيل الإشعارات');
  });

  // Called when a notification is received (app in foreground)
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    // Push notification received
    console.log('Push notification received in foreground:', notification);
    
    // Play notification sound
    playNotificationSound('message');
    
    // Show toast notification
    toast.success(notification.title || 'إشعار جديد', {
      description: notification.body,
      duration: 5000,
    });
  });

  // Called when user taps on a notification
  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    // Push notification action performed
    console.log('Push notification tapped:', notification);
    
    const data = notification.notification.data;
    
    // Handle navigation based on notification type using history API
    // This maintains proper navigation stack for Capacitor
    if (data?.type === 'message') {
      // Navigate to messages section
      window.history.pushState(null, '', '#messages');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } else if (data?.type === 'announcement') {
      // Navigate to announcements section
      window.history.pushState(null, '', '#announcements');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
  });
};

// Save token to database
const saveTokenToDatabase = async (token: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No user logged in, token will be saved on login');
      return false;
    }

    if (!token) {
      console.log('No token to save');
      return false;
    }

    // Upsert token (insert or update based on token)
    const { error } = await supabase
      .from('push_tokens')
      .upsert({
        user_id: user.id,
        token: token,
        platform: getPlatform(),
        device_name: getDeviceName(),
        last_used_at: new Date().toISOString()
      }, {
        onConflict: 'token'
      });

    if (error) {
      console.error('Error saving push token:', error);
      return false;
    }

    console.log('Push token saved successfully for user:', user.id);
    return true;
  } catch (error) {
    console.error('Error saving push token:', error);
    return false;
  }
};

// Re-register push token when user logs in
export const registerPushTokenForUser = async () => {
  if (!isPushNotificationsAvailable()) {
    return false;
  }

  // If we already have a token, try to save it
  if (currentPushToken) {
    return await saveTokenToDatabase(currentPushToken);
  }

  // Otherwise, try to re-register
  try {
    await PushNotifications.register();
    return true;
  } catch (error) {
    console.error('Error re-registering push token:', error);
    return false;
  }
};

export const removePushNotificationListeners = async () => {
  await PushNotifications.removeAllListeners();
};

// Function to check if push notifications are supported (native only)
export const isPushNotificationsAvailable = (): boolean => {
  return Capacitor.isNativePlatform();
};

// Function to get current notification badges
export const getNotificationBadge = async () => {
  try {
    const deliveredNotifications = await PushNotifications.getDeliveredNotifications();
    return deliveredNotifications.notifications.length;
  } catch (error) {
    console.error('Error getting notification badge:', error);
    return 0;
  }
};

// Function to clear all notifications
export const clearAllNotifications = async () => {
  try {
    await PushNotifications.removeAllDeliveredNotifications();
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
};
