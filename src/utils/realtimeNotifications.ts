import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Set up real-time listeners for notifications
export const setupRealtimeNotifications = async (userId: string, userRole: 'admin' | 'teacher' | 'parent') => {
  // Listen for new messages
  const messagesChannel = supabase
    .channel('user-notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${userId}`
      },
      (payload) => {
        console.log('New message notification:', payload);
        
        // Show notification
        toast.success('رسالة جديدة', {
          description: 'لديك رسالة جديدة من ولي أمر',
          duration: 5000,
        });

        // Play notification sound (optional)
        playNotificationSound();
      }
    )
    .subscribe();

  // Listen for new announcements (for all users)
  const announcementsChannel = supabase
    .channel('announcements-notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'news_ticker'
      },
      (payload) => {
        console.log('New announcement notification:', payload);
        
        const announcement = payload.new as any;
        if (announcement.is_active) {
          toast.info('إعلان جديد', {
            description: announcement.title,
            duration: 5000,
          });

          playNotificationSound();
        }
      }
    )
    .subscribe();

  // Return cleanup function
  return () => {
    supabase.removeChannel(messagesChannel);
    supabase.removeChannel(announcementsChannel);
  };
};

// Play notification sound
const playNotificationSound = () => {
  try {
    // Create a simple notification beep
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
};
