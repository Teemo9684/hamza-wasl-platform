import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getItem, setItem } from '@/utils/nativeStorage';

interface ThemeContextType {
  isLoading: boolean;
  isRamadanMode: boolean;
  toggleRamadanMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const RAMADAN_CACHE_KEY = 'ramadan_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isRamadanMode, setIsRamadanMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load cached value from native storage first, then fetch from DB
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      // 1. Load cached value immediately (survives OTA updates on Android)
      try {
        const cached = await getItem(RAMADAN_CACHE_KEY);
        if (!cancelled && cached === 'true') {
          setIsRamadanMode(true);
          document.documentElement.classList.add('ramadan');
        }
      } catch (e) {
        console.log('Error loading cached theme:', e);
      }

      // 2. Fetch authoritative value from database
      try {
        const { data, error } = await supabase
          .from('theme_settings')
          .select('is_active')
          .eq('theme_name', 'ramadan')
          .maybeSingle();

        // Only update if we got a real response (not network error or null)
        if (!cancelled && !error && data !== null) {
          const active = data.is_active ?? false;
          setIsRamadanMode(active);
          await setItem(RAMADAN_CACHE_KEY, String(active));
          console.log('[ThemeContext] DB value:', active);
        } else if (error) {
          console.log('[ThemeContext] DB fetch error, keeping cached value:', error.message);
        }
      } catch (e) {
        console.log('[ThemeContext] Network error, keeping cached value:', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    init();

    // Listen for realtime changes
    const channel = supabase
      .channel('theme-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'theme_settings',
      }, async (payload: any) => {
        const row = payload.new;
        if (row?.theme_name === 'ramadan') {
          const active = row.is_active ?? false;
          setIsRamadanMode(active);
          await setItem(RAMADAN_CACHE_KEY, String(active));
        }
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

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
    await setItem(RAMADAN_CACHE_KEY, String(newValue));

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
