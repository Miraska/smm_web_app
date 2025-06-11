import React, { useState, useEffect } from 'react';
import { MessageSquare, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ThemeToggle } from '../components/ThemeToggle';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { authStatus } = useAuth();
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);

  // Проверка доступности backend
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('http://localhost:8000/api/telegram/status', {
          method: 'GET',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        setBackendAvailable(response.ok);
      } catch (error) {
        setBackendAvailable(false);
      }
    };

    checkBackendStatus();
    
    // Проверяем статус каждые 30 секунд
    const interval = setInterval(checkBackendStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen-mobile from-tg-blue-50 via-white to-tg-blue-100 dark:from-tg-dark-900 dark:via-tg-dark-800 dark:to-tg-dark-900 transition-colors duration-300 safe-area-inset with-fixed-navigation navigation-smooth-scroll">
      {/* Header */}
      <header className="bg-gray-200 dark:bg-gray-600 shadow-tg-lg border-b border-tg-gray-200/50 dark:border-tg-dark-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2 sm:py-3">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-tg-blue-500 to-tg-blue-600 rounded-tg flex items-center justify-center shadow-tg-md">
                <MessageSquare className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-tg-blue-800 dark:text-tg-blue-400">
                  SMM App
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-3">
              {/* Backend status indicator */}
              {backendAvailable !== null && (
                <div className="hidden sm:block">
                  {backendAvailable ? (
                    <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2">
                      <Wifi className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Подключено</span>
                    </div>
                  ) : (
                    <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2">
                      <WifiOff className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Нет подключения</span>
                    </div>
                  )}
                </div>
              )}

              {/* Dark mode toggle */}
              <ThemeToggle size="sm" />

              {/* Status indicator */}
              {/* <div className="flex items-center space-x-2 px-3 py-2 rounded-tg bg-white/50 dark:bg-tg-dark-700/50 border border-tg-gray-200/50 dark:border-tg-dark-600/50">
                <div className={`w-2 h-2 rounded-full ${authStatus.authorized ? 'bg-tg-green' : 'bg-tg-red'}`}></div>
                <span className={`text-xs font-medium ${authStatus.authorized ? 'text-tg-green' : 'text-tg-red'}`}>
                  {authStatus.authorized ? 'Подключен' : 'Не подключен'}
                </span>
              </div> */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-1 sm:px-4 lg:px-8 py-3 sm:py-6">
        <div className="rounded-lg sm:rounded-xl light-theme-glass dark:bg-gray-600/70 shadow-tg-lg content-area animate-fade-in scroll-container-mobile">
          <div className="p-3 sm:p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}; 