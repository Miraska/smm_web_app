import React, { useState } from 'react';
import { Shield, Trash2, Loader2, Palette } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { ThemeToggle } from '../../../components/ThemeToggle';
import { LightThemeDemo } from '../../../components/LightThemeDemo';
import axios from 'axios';

// Используем относительные пути
const API_BASE_URL = '';

export const SettingsPage: React.FC = () => {
  const { authStatus, logout } = useAuth();
  const [clearingServer, setClearingServer] = useState(false);
  const [clearMessage, setClearMessage] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);

  const handleClearServer = async () => {
    if (!confirm('Вы уверены? Это удалит ВСЕ данные с сервера:\n\n• Все посты из базы данных\n• Все отобранные посты\n• Все медиафайлы\n• Все папки с медиа\n\nЭто действие нельзя отменить!')) {
      return;
    }

    setClearingServer(true);
    setClearMessage(null);

    try {
      // 1. Очищаем медиафайлы
      console.log('🧹 Очищаем медиафайлы...');
      const cleanupResponse = await axios.post(`${API_BASE_URL}/api/cleanup-media`);
      
      // 2. Очищаем все посты из базы данных
      console.log('🗑️ Очищаем посты из базы данных...');
      const clearPostsResponse = await axios.delete(`${API_BASE_URL}/api/posts/clear-all`);
      
      console.log('✅ Сервер полностью очищен');
      console.log(`🗑️ Медиафайлы: ${cleanupResponse.data.message}`);
      console.log(`📊 Посты: ${clearPostsResponse.data.message}`);
      
      setClearMessage(`Сервер успешно очищен!\n\n📊 ${clearPostsResponse.data.message}\n🗑️ ${cleanupResponse.data.message}`);
      
    } catch (error) {
      console.error('❌ Ошибка при очистке сервера:', error);
      setClearMessage('Ошибка при очистке данных сервера. Проверьте консоль для подробностей.');
    } finally {
      setClearingServer(false);
      
      // Автоматически скрываем сообщение через 8 секунд
      setTimeout(() => setClearMessage(null), 8000);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Настройки
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Управляйте настройками приложения
        </p>
      </div>

      {/* Theme Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Внешний вид
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Тема приложения
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Переключение между светлой и темной темой
              </p>
            </div>
            
            <ThemeToggle size="md" />
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Демонстрация светлой темы
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Показать все улучшения интерфейса
              </p>
            </div>
            
            <button
              onClick={() => setShowDemo(!showDemo)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <Palette className="w-4 h-4" />
              <span>{showDemo ? 'Скрыть' : 'Показать'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Theme Demo */}
      {showDemo && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <LightThemeDemo />
        </div>
      )}

      {/* Account Settings */}
      {authStatus.authorized && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Аккаунт
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Shield className="w-5 h-5 text-green-500" strokeWidth={2} />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Telegram сессия
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Активное подключение к Telegram
                  </p>
                </div>
              </div>
              
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <span>Выйти</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Server Success/Error Message */}
      {clearMessage && (
        <div className={`rounded-xl p-4 shadow-lg ${
          clearMessage.includes('успешно') 
            ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`font-medium mb-2 ${
                clearMessage.includes('успешно') 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {clearMessage.includes('успешно') ? 'Очистка завершена' : 'Ошибка очистки'}
              </p>
              <pre className={`text-sm whitespace-pre-wrap ${
                clearMessage.includes('успешно') 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {clearMessage}
              </pre>
            </div>
            <button
              onClick={() => setClearMessage(null)}
              className={`ml-4 hover:opacity-70 ${
                clearMessage.includes('успешно') 
                  ? 'text-green-400' 
                  : 'text-red-400'
              }`}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Data Management */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Управление данными
        </h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Trash2 className="w-5 h-5 text-red-600" strokeWidth={2} />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Очистить сервер
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Удалить все данные с сервера
              </p>
            </div>
          </div>
          
          <button
            onClick={handleClearServer}
            disabled={clearingServer}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            {clearingServer ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Очищаем...</span>
              </>
            ) : (
              <span>Очистить</span>
            )}
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          О приложении
        </h3>
        
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <p><strong>Версия:</strong> 1.0.0</p>
          <p><strong>Разработчик:</strong> SMM Bot Team</p>
          <p><strong>Описание:</strong> Telegram бот для управления SMM контентом</p>
        </div>
      </div>
    </div>
  );
}; 