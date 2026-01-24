import { toast } from 'sonner';
import { playNotificationSound } from './pushNotifications';
import { heavyHaptic, warningHaptic } from './haptics';
import { showLocalNotification, isLocalNotificationsSupported } from './localNotifications';

// School schedule configuration
const SCHOOL_SCHEDULE = {
  // Days: 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday
  schoolDays: [0, 1, 2, 3, 4], // Sunday to Thursday
  
  // Regular schedule (Sunday, Monday, Wednesday)
  regularSchedule: {
    morning: { start: '08:00', end: '11:15' },
    afternoon: { start: '13:00', end: '15:00' },
  },
  
  // Tuesday schedule (morning only - no afternoon)
  tuesdaySchedule: {
    morning: { start: '08:00', end: '11:15' },
    afternoon: null, // No afternoon session on Tuesday
  },
  
  // Thursday schedule (different afternoon time)
  thursdaySchedule: {
    morning: { start: '08:00', end: '11:15' },
    afternoon: { start: '13:00', end: '14:30' },
  },
  
  // Minutes before to notify
  notifyMinutesBefore: 5,
  
  // Notification display duration in milliseconds
  notificationDuration: 8000,
};

interface ScheduleTime {
  time: string;
  type: 'start' | 'end';
  session: 'morning' | 'afternoon';
}

// Get schedule for a specific day
const getScheduleForDay = (dayOfWeek: number): ScheduleTime[] => {
  if (!SCHOOL_SCHEDULE.schoolDays.includes(dayOfWeek)) {
    return [];
  }
  
  let schedule;
  
  if (dayOfWeek === 2) {
    // Tuesday - morning only
    schedule = SCHOOL_SCHEDULE.tuesdaySchedule;
  } else if (dayOfWeek === 4) {
    // Thursday - different afternoon time
    schedule = SCHOOL_SCHEDULE.thursdaySchedule;
  } else {
    // Sunday, Monday, Wednesday - regular schedule
    schedule = SCHOOL_SCHEDULE.regularSchedule;
  }
  
  const times: ScheduleTime[] = [
    { time: schedule.morning.start, type: 'start', session: 'morning' },
    { time: schedule.morning.end, type: 'end', session: 'morning' },
  ];
  
  // Add afternoon session if it exists
  if (schedule.afternoon) {
    times.push(
      { time: schedule.afternoon.start, type: 'start', session: 'afternoon' },
      { time: schedule.afternoon.end, type: 'end', session: 'afternoon' }
    );
  }
  
  return times;
};

// Convert time string to minutes since midnight
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Get current time in minutes since midnight
const getCurrentTimeInMinutes = (): number => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

// Track which notifications have been shown today
let notifiedTimes: Set<string> = new Set();
let lastCheckedDate: string = '';

// Reset notifications at midnight
const resetNotificationsIfNewDay = () => {
  const today = new Date().toDateString();
  if (today !== lastCheckedDate) {
    notifiedTimes = new Set();
    lastCheckedDate = today;
  }
};

// Check and trigger notifications
const checkScheduleNotifications = () => {
  resetNotificationsIfNewDay();
  
  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentMinutes = getCurrentTimeInMinutes();
  
  const todaySchedule = getScheduleForDay(dayOfWeek);
  
  todaySchedule.forEach((scheduleItem) => {
    const targetMinutes = timeToMinutes(scheduleItem.time);
    const notifyAtMinutes = targetMinutes - SCHOOL_SCHEDULE.notifyMinutesBefore;
    
    // Create unique key for this notification
    const notificationKey = `${scheduleItem.session}-${scheduleItem.type}-${scheduleItem.time}`;
    
    // Check if we're at the notification time (within 1 minute window)
    if (currentMinutes === notifyAtMinutes && !notifiedTimes.has(notificationKey)) {
      notifiedTimes.add(notificationKey);
      triggerNotification(scheduleItem);
    }
  });
};

// Trigger the notification with sound, haptics, and visual banner
const triggerNotification = async (scheduleItem: ScheduleTime) => {
  const sessionName = scheduleItem.session === 'morning' ? 'الفترة الصباحية' : 'الفترة المسائية';
  const actionName = scheduleItem.type === 'start' ? 'بداية' : 'نهاية';
  const actionEmoji = scheduleItem.type === 'start' ? '🏫' : '🏠';
  
  const title = `${actionEmoji} تذكير - ${actionName} ${sessionName}`;
  const message = scheduleItem.type === 'start' 
    ? `باقي 5 دقائق على بداية ${sessionName} (${scheduleItem.time})`
    : `باقي 5 دقائق على نهاية ${sessionName} (${scheduleItem.time})`;
  
  // Play notification sound
  playNotificationSound();
  
  // Trigger haptic feedback
  try {
    if (scheduleItem.type === 'start') {
      await heavyHaptic();
    } else {
      await warningHaptic();
    }
  } catch (e) {
    console.log('Haptic feedback not available');
  }
  
  // CRITICAL: Show native local notification for background alerts (works even when app is closed)
  if (isLocalNotificationsSupported()) {
    await showLocalNotification(
      title,
      message,
      {
        channelId: 'announcements',
        id: Date.now() % 100000, // Unique ID
      }
    );
    console.log('Native local notification sent for school schedule');
  }
  
  // Show toast notification with custom styling and duration (for when app is open)
  toast.info(title, {
    description: message,
    duration: SCHOOL_SCHEDULE.notificationDuration,
    icon: '⏰',
    className: 'school-schedule-toast',
    style: {
      background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.8) 100%)',
      color: 'white',
      border: 'none',
      boxShadow: '0 10px 40px -10px hsl(var(--primary)/0.5)',
    },
  });
  
  // Show browser notification if permitted (for PWA/web)
  showBrowserNotification(title, message);
  
  // Dispatch custom event for the app to show a sliding banner
  window.dispatchEvent(new CustomEvent('school-schedule-alert', {
    detail: {
      title,
      message,
      type: scheduleItem.type,
      session: scheduleItem.session,
      time: scheduleItem.time,
    }
  }));
  
  console.log('School schedule notification:', title, message);
};

// Show browser notification
const showBrowserNotification = (title: string, body: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'school-schedule-notification',
      requireInteraction: true,
    });
  }
};

// Interval reference for cleanup
let checkInterval: NodeJS.Timeout | null = null;

// Start the schedule notification system
export const startSchoolScheduleNotifications = () => {
  // Check immediately
  checkScheduleNotifications();
  
  // Check every 30 seconds for more accuracy
  checkInterval = setInterval(checkScheduleNotifications, 30000);
  
  console.log('School schedule notification system started');
  
  return () => {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
    console.log('School schedule notification system stopped');
  };
};

// Get today's schedule for display
export const getTodaySchedule = (): { session: string; start: string; end: string }[] => {
  const dayOfWeek = new Date().getDay();
  
  if (!SCHOOL_SCHEDULE.schoolDays.includes(dayOfWeek)) {
    return [];
  }
  
  let schedule;
  
  if (dayOfWeek === 2) {
    schedule = SCHOOL_SCHEDULE.tuesdaySchedule;
  } else if (dayOfWeek === 4) {
    schedule = SCHOOL_SCHEDULE.thursdaySchedule;
  } else {
    schedule = SCHOOL_SCHEDULE.regularSchedule;
  }
  
  const result = [
    { session: 'الفترة الصباحية', start: schedule.morning.start, end: schedule.morning.end },
  ];
  
  if (schedule.afternoon) {
    result.push({ session: 'الفترة المسائية', start: schedule.afternoon.start, end: schedule.afternoon.end });
  }
  
  return result;
};

// Get next notification time
export const getNextNotificationTime = (): string | null => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentMinutes = getCurrentTimeInMinutes();
  
  const todaySchedule = getScheduleForDay(dayOfWeek);
  
  for (const scheduleItem of todaySchedule) {
    const targetMinutes = timeToMinutes(scheduleItem.time);
    const notifyAtMinutes = targetMinutes - SCHOOL_SCHEDULE.notifyMinutesBefore;
    
    if (notifyAtMinutes > currentMinutes) {
      const hours = Math.floor(notifyAtMinutes / 60);
      const mins = notifyAtMinutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
  }
  
  return null;
};
