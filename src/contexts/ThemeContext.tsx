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
        console.log('Fetching active theme from database...');
        
        const { data, error } = await supabase
          .from('theme_settings')
          .select('theme_name')
          .eq('is_active', true)
          .maybeSingle();

        console.log('Theme query result:', { data, error });

        if (error) {
          console.error('Error fetching theme:', error);
          applyTheme(themes.default);
          setIsLoading(false);
          return;
        }

        if (data && data.theme_name && themes[data.theme_name]) {
          console.log('Found active theme:', data.theme_name);
          setCurrentTheme(themes[data.theme_name]);
          applyTheme(themes[data.theme_name]);
        } else {
          console.log('No active theme found, using default');
          applyTheme(themes.default);
        }
      } catch (error) {
        console.error('Error in fetchActiveTheme:', error);
        applyTheme(themes.default);
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
          console.log('Theme update received:', payload);
          if (payload.new.is_active && themes[payload.new.theme_name]) {
            console.log('Applying new theme:', payload.new.theme_name);
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
    
    console.log('Applying theme:', theme.name);
    
    // Apply color variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      // Convert camelCase to kebab-case (e.g., primaryLight -> primary-light)
      const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      const varName = `--${cssVar}`;
      root.style.setProperty(varName, value);
      console.log(`Set ${varName} to ${value}`);
    });

    // Apply gradients if available
    if (theme.gradients) {
      Object.entries(theme.gradients).forEach(([key, value]) => {
        const varName = `--gradient-${key}`;
        root.style.setProperty(varName, value);
        console.log(`Set ${varName}`);
      });
    }
    
    console.log('Theme applied successfully');
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