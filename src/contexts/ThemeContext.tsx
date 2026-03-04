import React, { createContext, useContext, useState, useEffect } from 'react';

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

  useEffect(() => {
    localStorage.setItem('ramadan_mode', String(isRamadanMode));
    if (isRamadanMode) {
      document.documentElement.classList.add('ramadan');
    } else {
      document.documentElement.classList.remove('ramadan');
    }
  }, [isRamadanMode]);

  const toggleRamadanMode = () => setIsRamadanMode(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isLoading: false, isRamadanMode, toggleRamadanMode }}>
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
