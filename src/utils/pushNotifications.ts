import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

// Initialize audio context (call after user interaction)
const getAudioContext = (): AudioContext | null => {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.error('Failed to create AudioContext:', error);
      return null;
    }
  }
  
  // Resume if suspended
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  return audioContext;
};

// Unlock audio on first user interaction
export const unlockAudio = () => {
  if (isAudioUnlocked) return;
  
  const ctx = getAudioContext();
  if (ctx) {
    // Create a silent buffer to unlock audio
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    isAudioUnlocked = true;
    // Audio unlocked
  }
};

// نوع الإشعار
export type NotificationType = 'default' | 'user' | 'document' | 'message';

// Play notification sound based on type
export const playNotificationSound = (type: NotificationType = 'default') => {
  try {
    const ctx = getAudioContext();
    if (!ctx) {
      console.warn('AudioContext not available');
      return;
    }

    // Resume context if needed
    if (ctx.state === 'suspended') {
      ctx.resume();
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
    
    // Save the token to the push_tokens table
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && token.value) {
        // Check if token already exists
        const { data: existingToken } = await supabase
          .from('push_tokens')
          .select('id')
          .eq('user_id', user.id)
          .eq('token', token.value)
          .single();

        if (!existingToken) {
          // Insert new token
          await supabase
            .from('push_tokens')
            .upsert({
              user_id: user.id,
              token: token.value,
              platform: getPlatform(),
              device_name: getDeviceName(),
              last_used_at: new Date().toISOString()
            }, {
              onConflict: 'token'
            });
          console.log('Push token saved successfully');
        } else {
          // Update last used time
          await supabase
            .from('push_tokens')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', existingToken.id);
        }
      }
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  });

  // Called when registration fails
  PushNotifications.addListener('registrationError', (error) => {
    console.error('Error on registration: ' + JSON.stringify(error));
    toast.error('فشل تسجيل الإشعارات');
  });

  // Called when a notification is received (app in foreground)
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    // Push notification received
    
    // Play notification sound
    playNotificationSound();
    
    // Show toast notification
    toast.success(notification.title || 'إشعار جديد', {
      description: notification.body,
      duration: 5000,
    });
  });

  // Called when user taps on a notification
  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    // Push notification action performed
    
    const data = notification.notification.data;
    
    // Handle navigation based on notification type using history API
    // This maintains proper navigation stack for Capacitor
    if (data.type === 'message') {
      // Navigate to messages section
      window.history.pushState(null, '', '#messages');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } else if (data.type === 'announcement') {
      // Navigate to announcements section
      window.history.pushState(null, '', '#announcements');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
  });
};

export const removePushNotificationListeners = async () => {
  await PushNotifications.removeAllListeners();
};

// Function to check if push notifications are supported
export const isPushNotificationsAvailable = () => {
  return 'PushNotifications' in window;
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
