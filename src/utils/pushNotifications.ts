import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

// Play notification sound
export const playNotificationSound = () => {
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
    
    // Create a more pleasant notification sound
    const oscillator1 = ctx.createOscillator();
    const oscillator2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(ctx.destination);

    // First tone
    oscillator1.frequency.value = 880; // A5
    oscillator1.type = 'sine';
    
    // Second tone (harmony)
    oscillator2.frequency.value = 1100; // C#6
    oscillator2.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    oscillator1.start(ctx.currentTime);
    oscillator2.start(ctx.currentTime + 0.1);
    oscillator1.stop(ctx.currentTime + 0.5);
    oscillator2.stop(ctx.currentTime + 0.6);
    
    console.log('Notification sound played');
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
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
  PushNotifications.addListener('registration', async () => {
    // Push registration success
    
    // Save the token to the user's profile or a separate table
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Store the token in user metadata or a separate table
        await supabase
          .from('profiles')
          .update({ 
            // You'll need to add a 'push_token' column to profiles table
            // For now, we'll store it in a way that won't break existing structure
          })
          .eq('id', user.id);
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
    
    // Handle navigation based on notification type
    if (data.type === 'message') {
      // Navigate to messages
      window.location.hash = '#messages';
    } else if (data.type === 'announcement') {
      // Navigate to announcements
      window.location.hash = '#announcements';
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
