import React, { useState, useEffect } from 'react';
import { AppLayout } from '../layouts/AppLayout';
import { Navigation } from '../layouts/Navigation';
import { AuthPage } from '../features/auth/pages/AuthPage';
import { SourcesPage } from '../features/sources/pages/SourcesPage';
import { PostsPage } from '../features/posts/pages/PostsPage';
import { SelectedPostsPage } from '../features/posts/pages/SelectedPostsPage';
import { SettingsPage } from '../features/settings/pages/SettingsPage';
import { useAuth } from '../hooks/useAuth';
import { checkBackendHealth } from '../utils';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import type { TabId } from '../types';

export const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('sources');
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const { authStatus, initializing, error } = useAuth();

  // Initialize Telegram Web App
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  // Check backend health
  useEffect(() => {
    const checkHealth = async () => {
      const isHealthy = await checkBackendHealth();
      setBackendAvailable(isHealthy);
    };

    checkHealth();
    
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
    // Показываем загрузку во время инициализации
    if (initializing) {
      return (
        <div className="flex items-center justify-center min-h-screen-safe px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Проверка авторизации...</p>
          </div>
        </div>
      );
    }

    // Показываем ошибку подключения к backend
    if (backendAvailable === false) {
      return (
        <div className="flex items-center justify-center min-h-screen-safe p-4">
          <div className="text-center max-w-sm sm:max-w-md">
            <WifiOff className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Сервер недоступен
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
              Не удается подключиться к серверу. Проверьте, что backend запущен.
            </p>
            <button
              onClick={async () => {
                const isHealthy = await checkBackendHealth();
                setBackendAvailable(isHealthy);
              }}
              className="mobile-button bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Проверить снова
            </button>
          </div>
        </div>
      );
    }

    // Если не авторизован, показываем страницу авторизации
    if (!authStatus.authorized) {
      return <AuthPage />;
    }

    // Если авторизован, показываем соответствующую вкладку
    switch (activeTab) {
      case 'sources':
        return <SourcesPage />;
      case 'feed':
        return <PostsPage />;
      case 'selected':
        return <SelectedPostsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <SourcesPage />;
    }
  };

  return (
    <>
      <AppLayout>
        {/* Backend status indicator */}
        {/* {backendAvailable !== null && (
          <div className="fixed top-4 right-4 z-50 mb-4">
            {backendAvailable ? (
              <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm flex items-center space-x-2">
                <Wifi className="w-4 h-4" />
                <span>Подключено</span>
              </div>
            ) : (
              <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-3 py-1 rounded-full text-sm flex items-center space-x-2">
                <WifiOff className="w-4 h-4" />
                <span>Нет подключения</span>
              </div>
            )}
          </div>
        )} */}

        {/* Error notification */}
        {error && (
          <div className="fixed top-16 left-4 right-4 sm:left-auto sm:right-4 z-50 max-w-sm sm:max-w-md">
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4 flex items-start space-x-2 sm:space-x-3">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-red-600 font-medium text-sm sm:text-base">Ошибка</p>
                <p className="text-red-700 dark:text-red-300 text-xs sm:text-sm break-words">{error}</p>
              </div>
            </div>
          </div>
        )}

        {renderContent()}
      </AppLayout>
      {authStatus.authorized && !initializing && backendAvailable && (
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      )}
    </>
  );
}; 