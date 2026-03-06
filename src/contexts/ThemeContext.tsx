import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ThemeContextType {
  isLoading: boolean;
  isRamadanMode: boolean;
  toggleRamadanMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const RAMADAN_CACHE_KEY = 'ramadan_mode_active';

// Synchronous localStorage read for instant UI on both PWA and Android WebView
const getCachedRamadan = (): boolean => {
  try {
    return localStorage.getItem(RAMADAN_CACHE_KEY) === 'true';
  } catch {
    return false;
  }
};

const setCachedRamadan = (value: boolean) => {
  try {
    localStorage.setItem(RAMADAN_CACHE_KEY, String(value));
  } catch {
    // ignore
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize from localStorage synchronously - works on both PWA and Android WebView
  const [isRamadanMode, setIsRamadanMode] = useState(() => getCachedRamadan());
  const [isLoading, setIsLoading] = useState(true);

  // Apply class immediately based on initial state
  useEffect(() => {
    if (isRamadanMode) {
      document.documentElement.classList.add('ramadan');
    }
  }, []);

  // Fetch from DB and subscribe to realtime - same pattern as posters
  useEffect(() => {
    let cancelled = false;
    let retryTimeout: ReturnType<typeof setTimeout>;

    const fetchTheme = async (attempt = 0) => {
      try {
        const { data, error } = await supabase
          .from('theme_settings')
          .select('is_active')
          .eq('theme_name', 'ramadan')
          .maybeSingle();

        if (cancelled) return;

        if (!error && data !== null) {
          const active = data.is_active ?? false;
          setIsRamadanMode(active);
          setCachedRamadan(active);
          console.log('[ThemeContext] DB value:', active);
        } else if (error) {
          console.log('[ThemeContext] DB error:', error.message);
          // Retry up to 3 times with delay (handles Android cold start)
          if (attempt < 3) {
            retryTimeout = setTimeout(() => fetchTheme(attempt + 1), 2000 * (attempt + 1));
          }
        }
      } catch (e) {
        console.log('[ThemeContext] Network error:', e);
        if (attempt < 3) {
          retryTimeout = setTimeout(() => fetchTheme(attempt + 1), 2000 * (attempt + 1));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchTheme();

    // Realtime subscription - same as posters pattern
    const channel = supabase
      .channel('theme-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'theme_settings',
      }, (payload: any) => {
        const row = payload.new;
        if (row?.theme_name === 'ramadan') {
          const active = row.is_active ?? false;
          setIsRamadanMode(active);
          setCachedRamadan(active);
          console.log('[ThemeContext] Realtime update:', active);
        }
      })
      .subscribe();

    return () => {
      cancelled = true;
      clearTimeout(retryTimeout);
      supabase.removeChannel(channel);
    };
  }, []);

  // Sync DOM class with state
  useEffect(() => {
    if (isRamadanMode) {
      document.documentElement.classList.add('ramadan');
    } else {
      document.documentElement.classList.remove('ramadan');
    }
  }, [isRamadanMode]);

  const toggleRamadanMode = useCallback(async () => {
    const newValue = !isRamadanMode;
    setIsRamadanMode(newValue);
    setCachedRamadan(newValue);

    const { data: existing } = await supabase
      .from('theme_settings')
      .select('id')
      .eq('theme_name', 'ramadan')
      .maybeSingle();

    if (existing) {
      await supabase
        .from('theme_settings')
        .update({ is_active: newValue, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('theme_settings')
        .insert({ theme_name: 'ramadan', is_active: newValue });
    }
  }, [isRamadanMode]);

  return (
    <ThemeContext.Provider value={{ isLoading, isRamadanMode, toggleRamadanMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
