import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

export type ThemeName = 'ramadan' | 'eid-fitr' | 'eid-adha' | 'mawlid' | 'independence' | null;

export const THEME_OPTIONS: { name: ThemeName; label: string; icon: string; description: string; cssClass: string }[] = [
  { name: 'ramadan', label: 'رمضان', icon: '☪', description: 'خلفية ليلية مع زخارف رمضانية', cssClass: 'ramadan' },
  { name: 'eid-fitr', label: 'عيد الفطر', icon: '🎉', description: 'ألوان مبهجة واحتفالية', cssClass: 'eid-fitr' },
  { name: 'eid-adha', label: 'عيد الأضحى', icon: '🐑', description: 'زخارف إسلامية دافئة', cssClass: 'eid-adha' },
  { name: 'mawlid', label: 'المولد النبوي', icon: '🕌', description: 'أجواء روحانية هادئة', cssClass: 'mawlid' },
  { name: 'independence', label: 'عيد الاستقلال', icon: '🇩🇿', description: 'ألوان العلم الجزائري', cssClass: 'independence' },
];

interface ThemeContextType {
  isLoading: boolean;
  activeTheme: ThemeName;
  setActiveTheme: (theme: ThemeName) => void;
  // Backwards compat
  isRamadanMode: boolean;
  toggleRamadanMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_CACHE_KEY = 'active_theme';

const getCachedTheme = (): ThemeName => {
  try {
    const v = localStorage.getItem(THEME_CACHE_KEY);
    if (v && v !== 'null') return v as ThemeName;
    // Legacy support
    if (localStorage.getItem('ramadan_mode_active') === 'true') return 'ramadan';
    return null;
  } catch {
    return null;
  }
};

const setCachedTheme = (value: ThemeName) => {
  try {
    localStorage.setItem(THEME_CACHE_KEY, String(value));
    // Legacy cleanup
    localStorage.removeItem('ramadan_mode_active');
  } catch {}
  if (Capacitor.isNativePlatform()) {
    import('@/utils/nativeStorage').then(({ setItem }) => {
      setItem(THEME_CACHE_KEY, String(value)).catch(() => {});
    }).catch(() => {});
  }
};

const ALL_THEME_CLASSES = THEME_OPTIONS.map(t => t.cssClass);

const applyThemeClass = (theme: ThemeName) => {
  ALL_THEME_CLASSES.forEach(cls => document.documentElement.classList.remove(cls));
  if (theme) {
    const opt = THEME_OPTIONS.find(t => t.name === theme);
    if (opt) document.documentElement.classList.add(opt.cssClass);
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTheme, setActiveThemeState] = useState<ThemeName>(() => getCachedTheme());
  const [isLoading, setIsLoading] = useState(true);

  // Apply class immediately
  useEffect(() => { applyThemeClass(activeTheme); }, []);

  // Fetch all theme_settings from DB and find the active one
  useEffect(() => {
    let cancelled = false;
    let retryTimeout: ReturnType<typeof setTimeout>;

    const fetchTheme = async (attempt = 0) => {
      try {
        const { data, error } = await supabase
          .from('theme_settings')
          .select('theme_name, is_active')
          .eq('is_active', true)
          .maybeSingle();

        if (cancelled) return;

        if (!error && data !== null) {
          const name = data.theme_name as ThemeName;
          setActiveThemeState(name);
          setCachedTheme(name);
        } else if (!error && data === null) {
          // No active theme
          setActiveThemeState(null);
          setCachedTheme(null);
        } else if (error && attempt < 3) {
          retryTimeout = setTimeout(() => fetchTheme(attempt + 1), 2000 * (attempt + 1));
        }
      } catch {
        if (attempt < 3) retryTimeout = setTimeout(() => fetchTheme(attempt + 1), 2000 * (attempt + 1));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchTheme();

    const channel = supabase
      .channel('theme-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'theme_settings' }, (payload: any) => {
        const row = payload.new;
        if (row?.is_active) {
          setActiveThemeState(row.theme_name as ThemeName);
          setCachedTheme(row.theme_name as ThemeName);
        } else if (payload.eventType === 'UPDATE' && !row?.is_active) {
          // If the currently active theme was deactivated
          setActiveThemeState(prev => prev === row?.theme_name ? null : prev);
        }
      })
      .subscribe();

    return () => {
      cancelled = true;
      clearTimeout(retryTimeout);
      supabase.removeChannel(channel);
    };
  }, []);

  // Sync DOM
  useEffect(() => { applyThemeClass(activeTheme); }, [activeTheme]);

  const setActiveTheme = useCallback(async (theme: ThemeName) => {
    const prev = activeTheme;
    setActiveThemeState(theme);
    setCachedTheme(theme);

    // Deactivate previous
    if (prev) {
      await supabase
        .from('theme_settings')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('theme_name', prev);
    }

    if (theme) {
      const { data: existing } = await supabase
        .from('theme_settings')
        .select('id')
        .eq('theme_name', theme)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('theme_settings')
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('theme_settings')
          .insert({ theme_name: theme, is_active: true });
      }
    }
  }, [activeTheme]);

  const toggleRamadanMode = useCallback(() => {
    setActiveTheme(activeTheme === 'ramadan' ? null : 'ramadan');
  }, [activeTheme, setActiveTheme]);

  return (
    <ThemeContext.Provider value={{
      isLoading,
      activeTheme,
      setActiveTheme,
      isRamadanMode: activeTheme === 'ramadan',
      toggleRamadanMode,
    }}>
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
