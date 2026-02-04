import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppTheme } from '../types';

interface ThemeContextType {
  theme: AppTheme;
  updateTheme: (updates: Partial<AppTheme>) => void;
}

const defaultTheme: AppTheme = {
  primaryColor: '#3b82f6', // Tailwind blue-500
  borderRadius: 'md',
};

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  updateTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

// Helper to generate palette
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<AppTheme>(defaultTheme);

  const updateTheme = (updates: Partial<AppTheme>) => {
    setTheme(prev => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    // Update CSS variables for Tailwind
    const rgb = hexToRgb(theme.primaryColor);
    if (rgb) {
       document.documentElement.style.setProperty('--brand-500', theme.primaryColor);
       // Simple lighten/darken logic simulation for 50-700
       document.documentElement.style.setProperty('--brand-50', `${theme.primaryColor}10`); 
       document.documentElement.style.setProperty('--brand-600', theme.primaryColor); 
    }
  }, [theme.primaryColor]);

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};