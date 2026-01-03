import { toast } from 'sonner';
import { playNotificationSound } from './pushNotifications';

// School schedule configuration
const SCHOOL_SCHEDULE = {
  // Days: 0 = Sunday, 1 = Monday, ..., 4 = Thursday
  schoolDays: [0, 1, 2, 3, 4], // Sunday to Thursday
  
  // Regular schedule (Sunday to Wednesday)
  regularSchedule: {
    morning: { start: '08:00', end: '11:15' },
    afternoon: { start: '13:00', end: '15:00' },
  },
  
  // Thursday schedule (different afternoon)
  thursdaySchedule: {
    morning: { start: '08:00', end: '11:15' },
    afternoon: { start: '13:00', end: '14:30' },
  },
  
  // Minutes before to notify
  notifyMinutesBefore: 5,
};

interface ScheduleTime {
  time: string;
  type: 'start' | 'end';
  session: 'morning' | 'afternoon';
}

// Get schedule times for a specific day
const getScheduleForDay = (dayOfWeek: number): ScheduleTime[] => {
  if (!SCHOOL_SCHEDULE.schoolDays.includes(dayOfWeek)) {
    return [];
  }
  
  const schedule = dayOfWeek === 4 
    ? SCHOOL_SCHEDULE.thursdaySchedule 
    : SCHOOL_SCHEDULE.regularSchedule;
  
  return [
    { time: schedule.morning.start, type: 'start', session: 'morning' },
    { time: schedule.morning.end, type: 'end', session: 'morning' },
    { time: schedule.afternoon.start, type: 'start', session: 'afternoon' },
    { time: schedule.afternoon.end, type: 'end', session: 'afternoon' },
  ];
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

// Trigger the notification
const triggerNotification = (scheduleItem: ScheduleTime) => {
  const sessionName = scheduleItem.session === 'morning' ? 'الفترة الصباحية' : 'الفترة المسائية';
  const actionName = scheduleItem.type === 'start' ? 'بداية' : 'نهاية';
  
  const title = `⏰ تذكير - ${actionName} ${sessionName}`;
  const message = scheduleItem.type === 'start' 
    ? `باقي 5 دقائق على بداية ${sessionName} (${scheduleItem.time})`
    : `باقي 5 دقائق على نهاية ${sessionName} (${scheduleItem.time})`;
  
  // Play notification sound
  playNotificationSound();
  
  // Show toast notification
  toast.info(title, {
    description: message,
    duration: 10000,
    icon: '🔔',
  });
  
  // Show browser notification if permitted
  showBrowserNotification(title, message);
  
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
  
  const schedule = dayOfWeek === 4 
    ? SCHOOL_SCHEDULE.thursdaySchedule 
    : SCHOOL_SCHEDULE.regularSchedule;
  
  return [
    { session: 'الفترة الصباحية', start: schedule.morning.start, end: schedule.morning.end },
    { session: 'الفترة المسائية', start: schedule.afternoon.start, end: schedule.afternoon.end },
  ];
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
