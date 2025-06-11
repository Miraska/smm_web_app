import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  size = 'md', 
  showLabel = false,
  className = ''
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={toggleTheme}
        className={`
          ${sizeClasses[size]}
          relative rounded-full border-2 border-gray-200 dark:border-gray-600
          bg-white dark:bg-gray-800
          hover:bg-gray-50 dark:hover:bg-gray-700
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
          transition-all duration-300 ease-in-out
          shadow-lg hover:shadow-xl
          group
        `}
        title={isDark ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
        aria-label={isDark ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Sun Icon */}
          <Sun 
            className={`
              ${iconSizes[size]}
              absolute text-yellow-500 dark:text-yellow-400
              transform transition-all duration-300 ease-in-out
              ${isDark 
                ? 'opacity-0 scale-75 rotate-90' 
                : 'opacity-100 scale-100 rotate-0'
              }
            `}
          />
          
          {/* Moon Icon */}
          <Moon 
            className={`
              ${iconSizes[size]}
              absolute text-gray-600 dark:text-blue-400
              transform transition-all duration-300 ease-in-out
              ${isDark 
                ? 'opacity-100 scale-100 rotate-0' 
                : 'opacity-0 scale-75 -rotate-90'
              }
            `}
          />
        </div>
        
        {/* Пульсация при наведении */}
        <div className="absolute inset-0 rounded-full bg-blue-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
      </button>
{/*       
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isDark ? 'Темная' : 'Светлая'}
        </span>
      )} */}
    </div>
  );
}; 