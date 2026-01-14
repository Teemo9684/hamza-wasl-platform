import { Capacitor } from '@capacitor/core';

// Dynamically import Badge to avoid issues on web
let Badge: any = null;

const loadBadge = async () => {
  if (Badge) return Badge;
  
  if (Capacitor.isNativePlatform()) {
    try {
      const module = await import('@capawesome/capacitor-badge');
      Badge = module.Badge;
      return Badge;
    } catch (error) {
      console.warn('Badge plugin not available:', error);
      return null;
    }
  }
  return null;
};

/**
 * Set the app icon badge count
 */
export const setAppBadge = async (count: number): Promise<void> => {
  try {
    const badge = await loadBadge();
    if (badge) {
      if (count > 0) {
        await badge.set({ count });
        console.log('App badge set to:', count);
      } else {
        await badge.clear();
        console.log('App badge cleared');
      }
    } else if ('setAppBadge' in navigator) {
      // Web fallback for PWA
      if (count > 0) {
        await (navigator as any).setAppBadge(count);
      } else {
        await (navigator as any).clearAppBadge();
      }
    }
  } catch (error) {
    console.warn('Failed to set app badge:', error);
  }
};

/**
 * Clear the app icon badge
 */
export const clearAppBadge = async (): Promise<void> => {
  try {
    const badge = await loadBadge();
    if (badge) {
      await badge.clear();
      console.log('App badge cleared');
    } else if ('clearAppBadge' in navigator) {
      await (navigator as any).clearAppBadge();
    }
  } catch (error) {
    console.warn('Failed to clear app badge:', error);
  }
};

/**
 * Get the current badge count
 */
export const getAppBadge = async (): Promise<number> => {
  try {
    const badge = await loadBadge();
    if (badge) {
      const result = await badge.get();
      return result.count || 0;
    }
  } catch (error) {
    console.warn('Failed to get app badge:', error);
  }
  return 0;
};

/**
 * Check if badge is supported
 */
export const isBadgeSupported = async (): Promise<boolean> => {
  try {
    const badge = await loadBadge();
    if (badge) {
      const result = await badge.isSupported();
      return result.isSupported;
    }
    return 'setAppBadge' in navigator;
  } catch (error) {
    return false;
  }
};
