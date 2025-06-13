import React, { useState, useEffect } from 'react';
import { Shield, Trash2, Loader2, Palette, Bot, Save, Wand2, Radio, Settings, Key } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { ThemeToggle } from '../../../components/ThemeToggle';
import { LightThemeDemo } from '../../../components/LightThemeDemo';
import type { TelegramChannel } from '../../../types';
import axios from 'axios';

// Используем относительные пути
const API_BASE_URL = '';

export const SettingsPage: React.FC = () => {
  const { authStatus, logout } = useAuth();
  const [clearingServer, setClearingServer] = useState(false);
  const [clearMessage, setClearMessage] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState('');
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [promptMessage, setPromptMessage] = useState<string | null>(null);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'ai' | 'channels'>('general');
  const [channels, setChannels] = useState<TelegramChannel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [openrouterApiKey, setOpenrouterApiKey] = useState('');
  const [savingApiKey, setSavingApiKey] = useState(false);

  // Загрузка настроек при инициализации
  useEffect(() => {
    loadEditingSettings();
  }, []);

  // Загрузка каналов при переходе на вкладку каналов
  useEffect(() => {
    if (activeSettingsTab === 'channels') {
      loadChannels();
    }
  }, [activeSettingsTab]);

  const loadEditingSettings = async () => {
    try {
      // Пока используем заглушку, позже здесь будет API вызов
      const defaultPrompt = 'Переписать текст, сделав его более продающим и интересным для читателей. Сохранить основную идею и важную информацию.';
      setEditingPrompt(defaultPrompt);
      
      // Загрузка API ключа OpenRouter
      const savedApiKey = localStorage.getItem('openrouter_api_key') || '';
      setOpenrouterApiKey(savedApiKey);
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
    }
  };

  const loadChannels = async () => {
    try {
      setLoadingChannels(true);
      
      // API вызов для загрузки каналов где пользователь админ
      // Пока используем заглушку
      const mockChannels: TelegramChannel[] = [
        {
          id: '-1001234567890',
          title: 'Мой канал',
          username: 'my_channel',
          participants_count: 1500,
          is_admin: true,
          can_post_messages: true,
        },
        {
          id: '-1001234567891',
          title: 'Тестовый канал',
          username: 'test_channel',
          participants_count: 500,
          is_admin: true,
          can_post_messages: true,
        },
        {
          id: '-1001234567892',
          title: 'SMM канал',
          participants_count: 2500,
          is_admin: true,
          can_post_messages: true,
        }
      ];
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setChannels(mockChannels);
    } catch (error) {
      console.error('Ошибка загрузки каналов:', error);
    } finally {
      setLoadingChannels(false);
    }
  };

  const handleSaveApiKey = async () => {
    try {
      setSavingApiKey(true);
      
      // Сохранение в localStorage и отправка на сервер
      localStorage.setItem('openrouter_api_key', openrouterApiKey);
      
      // Здесь будет API вызов для сохранения на сервере
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPromptMessage('API ключ OpenRouter успешно сохранен!');
      setTimeout(() => setPromptMessage(null), 3000);
      
    } catch (error) {
      console.error('Ошибка сохранения API ключа:', error);
      setPromptMessage('Ошибка при сохранении API ключа');
      setTimeout(() => setPromptMessage(null), 3000);
    } finally {
      setSavingApiKey(false);
    }
  };

  const handleSavePrompt = async () => {
    try {
      setSavingPrompt(true);
      
      // Здесь будет API вызов для сохранения промта
      // Пока используем заглушку
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPromptMessage('Настройки редактирования успешно сохранены!');
      setTimeout(() => setPromptMessage(null), 3000);
      
    } catch (error) {
      console.error('Ошибка сохранения промта:', error);
      setPromptMessage('Ошибка при сохранении настроек');
      setTimeout(() => setPromptMessage(null), 3000);
    } finally {
      setSavingPrompt(false);
    }
  };

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

  const settingsTabs = [
    { id: 'general' as const, name: 'Общие', icon: Settings },
    { id: 'ai' as const, name: 'ИИ', icon: Bot },
    { id: 'channels' as const, name: 'Каналы', icon: Radio },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Настройки
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Управляйте настройками приложения
        </p>
      </div>

      {/* Settings Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {settingsTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSettingsTab(tab.id)}
                className={`flex-1 min-w-0 px-3 sm:px-4 py-3 text-center transition-colors whitespace-nowrap ${
                  activeSettingsTab === tab.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="font-medium text-xs sm:text-sm truncate">{tab.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeSettingsTab === 'general' && (
        <>
          {/* Theme Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Внешний вид
            </h3>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                    Тема приложения
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Переключение между светлой и темной темой
                  </p>
                </div>
                
                <div className="shrink-0">
                  <ThemeToggle size="md" />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-gray-200 dark:border-gray-700 gap-3 sm:gap-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                    Демонстрация светлой темы
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Показать все улучшения интерфейса
                  </p>
                </div>
                
                <button
                  onClick={() => setShowDemo(!showDemo)}
                  className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm sm:text-base shrink-0"
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
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Аккаунт
              </h3>
              
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg shrink-0">
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                        Telegram сессия
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Активное подключение к Telegram
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={logout}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base shrink-0"
                  >
                    <span>Выйти</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Data Management */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Управление данными
            </h3>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg shrink-0">
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                    Очистить сервер
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Удалить все данные с сервера
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleClearServer}
                disabled={clearingServer}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base shrink-0"
              >
                {clearingServer ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>{clearingServer ? 'Очистка...' : 'Очистить'}</span>
              </button>
            </div>
          </div>

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

          {/* App Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              О приложении
            </h3>
            
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p><strong>Версия:</strong> 1.0.0</p>
              <p><strong>Разработчик:</strong> SMM Bot Team</p>
              <p><strong>Описание:</strong> Telegram бот для управления SMM контентом</p>
            </div>
          </div>
        </>
      )}

      {activeSettingsTab === 'ai' && (
        <>
          {/* OpenRouter API Key */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
              <Key className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <span className="truncate">API ключ OpenRouter</span>
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API ключ
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Получите ключ на <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">openrouter.ai</a>
                </p>
                <input
                  type="password"
                  value={openrouterApiKey}
                  onChange={(e) => setOpenrouterApiKey(e.target.value)}
                  className="w-full p-2 sm:p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="sk-or-v1-..."
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleSaveApiKey}
                  disabled={savingApiKey || !openrouterApiKey.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm sm:text-base"
                >
                  {savingApiKey ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{savingApiKey ? 'Сохранение...' : 'Сохранить'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* AI Editing Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              <span className="truncate">Настройки ИИ редактирования</span>
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Промт для редактирования постов
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Опишите, как ИИ должен обрабатывать тексты постов при редактировании
                </p>
                <textarea
                  value={editingPrompt}
                  onChange={(e) => setEditingPrompt(e.target.value)}
                  className="w-full h-24 sm:h-32 p-3 sm:p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Введите инструкции для ИИ по обработке текстов постов..."
                />
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-gray-200 dark:border-gray-700 gap-3 sm:gap-0">
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <Wand2 className="w-4 h-4 shrink-0" />
                  <span>Промт будет использоваться при автоматической обработке</span>
                </div>
                
                <button
                  onClick={handleSavePrompt}
                  disabled={savingPrompt || !editingPrompt.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm sm:text-base shrink-0"
                >
                  {savingPrompt ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{savingPrompt ? 'Сохранение...' : 'Сохранить'}</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {activeSettingsTab === 'channels' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <span className="truncate">Telegram каналы</span>
          </h3>
          
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
            Список каналов, где вы являетесь администратором и можете публиковать посты
          </p>

          {loadingChannels ? (
            <div className="flex items-center justify-center py-6 sm:py-8">
              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 animate-spin mr-3" />
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Загрузка каналов...</span>
            </div>
          ) : channels.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <Radio className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Нет доступных каналов
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                У вас нет каналов, где вы являетесь администратором
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-gray-200 dark:border-gray-600 rounded-lg gap-3 sm:gap-0"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center shrink-0">
                      <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                        {channel.title}
                      </h4>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {channel.username && (
                          <span className="truncate">@{channel.username}</span>
                        )}
                        {channel.participants_count && (
                          <span className="hidden sm:inline">•</span>
                        )}
                        {channel.participants_count && (
                          <span>{channel.participants_count.toLocaleString()} подписчиков</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 text-xs rounded-full">
                      Админ
                    </span>
                    {channel.can_post_messages && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-xs rounded-full">
                        Может публиковать
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Success/Error Message */}
      {promptMessage && (
        <div className={`rounded-xl p-4 shadow-lg ${
          promptMessage.includes('успешно') 
            ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <p className={`font-medium ${
              promptMessage.includes('успешно') 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {promptMessage}
            </p>
            <button
              onClick={() => setPromptMessage(null)}
              className={`hover:opacity-70 ${
                promptMessage.includes('успешно') 
                  ? 'text-green-400' 
                  : 'text-red-400'
              }`}
            >
              ×
            </button>
          </div>
        </div>
      )}

    </div>
  );
}; 