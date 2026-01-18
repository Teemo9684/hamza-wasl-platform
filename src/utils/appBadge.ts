import { Capacitor } from '@capacitor/core';

// Dynamically import Badge to avoid issues on web
let Badge: any = null;

const loadBadge = async () => {
  if (Badge) return Badge;
  
  if (Capacitor.isNativePlatform()) {
    try {
      const module = await import('@capawesome/capacitor-badge');
      Badge = module.Badge;
      console.log('Badge plugin loaded successfully');
      return Badge;
    } catch (error) {
      console.warn('Badge plugin not available:', error);
      return null;
    }
  }
  return null;
};

/**
 * Set the app icon badge count (works on both native and PWA)
 */
export const setAppBadge = async (count: number): Promise<void> => {
  console.log('[AppBadge] Setting badge to:', count);
  
  try {
    // Try native badge first
    const badge = await loadBadge();
    if (badge) {
      if (count > 0) {
        await badge.set({ count });
        console.log('[AppBadge] Native badge set to:', count);
      } else {
        await badge.clear();
        console.log('[AppBadge] Native badge cleared');
      }
      return;
    }
  } catch (error) {
    console.warn('[AppBadge] Native badge failed:', error);
  }
  
  // PWA Badge API fallback
  await setPWABadge(count);
};

/**
 * Set PWA app badge (for web browsers that support it)
 */
export const setPWABadge = async (count: number): Promise<boolean> => {
  try {
    // Check for Badging API support
    if ('setAppBadge' in navigator) {
      if (count > 0) {
        await (navigator as any).setAppBadge(count);
        console.log('[AppBadge] PWA badge set to:', count);
      } else {
        await (navigator as any).clearAppBadge();
        console.log('[AppBadge] PWA badge cleared');
      }
      return true;
    }
    
    // Fallback for older browsers - try experimental API
    if ('ExperimentalBadge' in window) {
      const ExperimentalBadge = (window as any).ExperimentalBadge;
      if (count > 0) {
        await ExperimentalBadge.set(count);
        console.log('[AppBadge] Experimental PWA badge set to:', count);
      } else {
        await ExperimentalBadge.clear();
        console.log('[AppBadge] Experimental PWA badge cleared');
      }
      return true;
    }
    
    console.log('[AppBadge] PWA badge API not supported in this browser');
    return false;
  } catch (error) {
    console.warn('[AppBadge] Failed to set PWA badge:', error);
    return false;
  }
};

/**
 * Clear the app icon badge
 */
export const clearAppBadge = async (): Promise<void> => {
  await setAppBadge(0);
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
    console.warn('[AppBadge] Failed to get badge count:', error);
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
    return 'setAppBadge' in navigator || 'ExperimentalBadge' in window;
  } catch (error) {
    return false;
  }
};
