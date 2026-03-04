import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ThemeContextType {
  isLoading: boolean;
  isRamadanMode: boolean;
  toggleRamadanMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isRamadanMode, setIsRamadanMode] = useState(() => {
    const saved = localStorage.getItem('ramadan_mode');
    return saved === 'true';
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch global setting from database
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const { data } = await supabase
          .from('theme_settings')
          .select('is_active')
          .eq('theme_name', 'ramadan')
          .maybeSingle();

        const active = data?.is_active ?? false;
        setIsRamadanMode(active);
        localStorage.setItem('ramadan_mode', String(active));
      } catch (e) {
        console.log('Error fetching theme:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTheme();

    // Listen for realtime changes
    const channel = supabase
      .channel('theme-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'theme_settings',
      }, (payload: any) => {
        const row = payload.new;
        if (row?.theme_name === 'ramadan') {
          setIsRamadanMode(row.is_active ?? false);
          localStorage.setItem('ramadan_mode', String(row.is_active ?? false));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
    localStorage.setItem('ramadan_mode', String(newValue));

    // Upsert in database
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
