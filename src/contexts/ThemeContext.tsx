import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { themes, ThemeColors } from '@/lib/themes';

interface ThemeContextType {
  currentTheme: ThemeColors;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeColors>(themes.default);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActiveTheme = async () => {
      try {
        const { data, error } = await supabase
          .from('theme_settings')
          .select('theme_name')
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('Error fetching theme:', error);
          return;
        }

        if (data && themes[data.theme_name]) {
          setCurrentTheme(themes[data.theme_name]);
          applyTheme(themes[data.theme_name]);
        }
      } catch (error) {
        console.error('Error in fetchActiveTheme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveTheme();

    // Subscribe to theme changes
    const channel = supabase
      .channel('theme_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'theme_settings',
        },
        (payload) => {
          if (payload.new.is_active && themes[payload.new.theme_name]) {
            setCurrentTheme(themes[payload.new.theme_name]);
            applyTheme(themes[payload.new.theme_name]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const applyTheme = (theme: ThemeColors) => {
    const root = document.documentElement;
    
    // Apply color variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      root.style.setProperty(`--${cssVar}`, value);
    });

    // Apply gradients if available
    if (theme.gradients) {
      Object.entries(theme.gradients).forEach(([key, value]) => {
        root.style.setProperty(`--gradient-${key}`, value);
      });
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, isLoading }}>
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