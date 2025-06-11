import { useThemeContext } from '../contexts/ThemeContext';
import type { Theme } from '../types';

export const useTheme = () => {
  const context = useThemeContext();
  
  // Дополнительные утилиты для работы с темой
  const getThemeClasses = (lightClass: string, darkClass: string) => {
    return context.isDark ? darkClass : lightClass;
  };
  
  const getThemeValue = <T>(lightValue: T, darkValue: T): T => {
    return context.isDark ? darkValue : lightValue;
  };
  
  const isSystemTheme = () => {
    const storedTheme = localStorage.getItem('smm-bot-theme');
    return !storedTheme;
  };
  
  const resetToSystemTheme = () => {
    localStorage.removeItem('smm-bot-theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    context.setTheme(systemTheme);
  };

  return {
    ...context,
    getThemeClasses,
    getThemeValue,
    isSystemTheme,
    resetToSystemTheme,
  };
}; 