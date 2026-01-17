import { Capacitor } from "@capacitor/core";

// Native storage utilities for persistent data on mobile apps
// Uses Capacitor Preferences for native platforms (more persistent than localStorage)

let Preferences: typeof import("@capacitor/preferences").Preferences | null = null;

// Initialize Preferences dynamically
const initPreferences = async () => {
  if (Capacitor.isNativePlatform() && !Preferences) {
    try {
      const module = await import("@capacitor/preferences");
      Preferences = module.Preferences;
    } catch (e) {
      console.log("Preferences plugin not available:", e);
    }
  }
};

// Initialize on module load
initPreferences();

/**
 * Set a value in persistent storage
 * Uses Capacitor Preferences on native, localStorage on web
 */
export const setItem = async (key: string, value: string): Promise<void> => {
  if (Capacitor.isNativePlatform() && Preferences) {
    await Preferences.set({ key, value });
  } else {
    localStorage.setItem(key, value);
  }
};

/**
 * Get a value from persistent storage
 * Uses Capacitor Preferences on native, localStorage on web
 */
export const getItem = async (key: string): Promise<string | null> => {
  if (Capacitor.isNativePlatform() && Preferences) {
    const { value } = await Preferences.get({ key });
    return value;
  } else {
    return localStorage.getItem(key);
  }
};

/**
 * Remove a value from persistent storage
 * Uses Capacitor Preferences on native, localStorage on web
 */
export const removeItem = async (key: string): Promise<void> => {
  if (Capacitor.isNativePlatform() && Preferences) {
    await Preferences.remove({ key });
  } else {
    localStorage.removeItem(key);
  }
};

/**
 * Clear all values from persistent storage
 */
export const clear = async (): Promise<void> => {
  if (Capacitor.isNativePlatform() && Preferences) {
    await Preferences.clear();
  } else {
    localStorage.clear();
  }
};

// Supabase auth token storage keys
const SUPABASE_AUTH_TOKEN_KEY = "sb-caeltaubipulyrdyqsjn-auth-token";

/**
 * Save Supabase session to native storage for persistence
 */
export const saveSupabaseSession = async (session: any): Promise<void> => {
  if (!session) return;
  
  try {
    const sessionData = JSON.stringify(session);
    await setItem(SUPABASE_AUTH_TOKEN_KEY, sessionData);
    console.log("Session saved to native storage");
  } catch (e) {
    console.error("Failed to save session:", e);
  }
};

/**
 * Load Supabase session from native storage
 */
export const loadSupabaseSession = async (): Promise<any | null> => {
  try {
    const sessionData = await getItem(SUPABASE_AUTH_TOKEN_KEY);
    if (sessionData) {
      return JSON.parse(sessionData);
    }
  } catch (e) {
    console.error("Failed to load session:", e);
  }
  return null;
};

/**
 * Clear Supabase session from native storage
 */
export const clearSupabaseSession = async (): Promise<void> => {
  try {
    await removeItem(SUPABASE_AUTH_TOKEN_KEY);
    console.log("Session cleared from native storage");
  } catch (e) {
    console.error("Failed to clear session:", e);
  }
};
