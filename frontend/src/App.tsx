import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Radio, 
  FileText, 
  Star, 
  Smartphone, 
  Send, 
  Key, 
  Lock, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Loader2,
  MessageSquare,
  Settings,
  Moon,
  Sun,
  Check,
  X,
  Heart,
  List
} from 'lucide-react';
import { rewrite } from './api';
import PostsList from './components/PostsList';
import PostEditor from './components/PostEditor';
import ChannelSelect from './components/ChannelSelect';
import axios from 'axios';
import PostCard from './components/PostCard';

declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        MainButton: {
          show: () => void;
          hide: () => void;
          setText: (text: string) => void;
          onClick: (fn: () => void) => void;
        };
      };
    };
  }
}

const API_BASE_URL = 'http://localhost:8000';

// Типы для пропсов компонентов
interface AuthorizationTabProps {
  isAuthorized: boolean;
  setIsAuthorized: (value: boolean) => void;
  checkAuthStatus: () => void;
}

interface SourcesTabProps {
  isAuthorized: boolean;
  sources: any[];
  channels: any[];
  setChannels: (value: any[]) => void;
  loadSources: () => void;
  loadPosts: () => void;
}

interface PostsTabProps {
  posts: any[];
  loadPosts: () => void;
  loadSelectedPosts: () => void;
}

interface SelectedPostsTabProps {
  selectedPosts: any[];
  loadSelectedPosts: () => void;
  loadPosts: () => void;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('authorization');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [sources, setSources] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Инициализация Telegram Web App
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
    
    // Проверяем статус авторизации и загружаем данные
    checkAuthStatus();
    loadSources();
    loadPosts();
    loadSelectedPosts();

    // Проверяем системную тему
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/telegram/status`);
      setIsAuthorized(response.data.authorized);
    } catch (error) {
      console.error('Ошибка проверки авторизации:', error);
      setIsAuthorized(false);
    }
  };

  const loadSources = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/sources`);
      setSources(response.data);
    } catch (error) {
      console.error('Ошибка загрузки источников:', error);
    }
  };

  const loadPosts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/posts`);
      setPosts(response.data);
    } catch (error) {
      console.error('Ошибка загрузки постов:', error);
    }
  };

  const loadSelectedPosts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/selected-posts`);
      setSelectedPosts(response.data);
    } catch (error) {
      console.error('Ошибка загрузки отобранных постов:', error);
    }
  };

  async function handleRewrite(text: string) {
    setLoading(true);
    const res = await rewrite(text, 1024);
    setLoading(false);
  }

  const tabs = [
    { 
      id: 'authorization', 
      name: 'Авторизация', 
      icon: Shield,
      color: 'text-tg-blue-600',
      bgColor: 'bg-tg-blue-50 dark:bg-tg-blue-900/20'
    },
    { 
      id: 'sources', 
      name: 'Источники', 
      icon: Radio,
      color: 'text-tg-green',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    { 
      id: 'posts', 
      name: 'Все посты', 
      icon: FileText,
      color: 'text-tg-yellow',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
    },
    { 
      id: 'selected', 
      name: 'Отобранные', 
      icon: Star,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-tg-blue-50 via-white to-tg-blue-100 dark:from-tg-dark-900 dark:via-tg-dark-800 dark:to-tg-dark-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-tg-dark-800/80 backdrop-blur-lg shadow-tg-lg border-b border-tg-gray-200/50 dark:border-tg-dark-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-tg-blue-500 to-tg-blue-600 rounded-tg flex items-center justify-center shadow-tg-md">
                <MessageSquare className="w-7 h-7 text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-tg-blue-600 to-tg-blue-800 dark:from-tg-blue-400 dark:to-tg-blue-300 bg-clip-text text-transparent">
                  SMM Bot
                </h1>
                <p className="text-sm text-tg-gray-600 dark:text-tg-gray-400">
                  Управление контентом каналов
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-tg hover:bg-tg-gray-100 dark:hover:bg-tg-dark-700 transition-colors"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-tg-yellow" />
                ) : (
                  <Moon className="w-5 h-5 text-tg-gray-600" />
                )}
              </button>

              {/* Status indicator */}
              <div className="flex items-center space-x-3 px-4 py-2 rounded-tg bg-white/50 dark:bg-tg-dark-700/50 border border-tg-gray-200/50 dark:border-tg-dark-600/50">
                <div className="relative">
                  <div className={`w-3 h-3 rounded-full ${isAuthorized ? 'bg-tg-green' : 'bg-tg-red'}`}></div>
                  {isAuthorized && (
                    <div className="absolute inset-0 w-3 h-3 bg-tg-green rounded-full"></div>
                  )}
                </div>
                <span className={`text-sm font-medium ${isAuthorized ? 'text-tg-green' : 'text-tg-red'}`}>
                  {isAuthorized ? 'Подключен' : 'Не подключен'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-white/70 dark:bg-tg-dark-800/70 backdrop-blur-lg rounded-tg-lg shadow-tg-lg mb-8 overflow-hidden border border-tg-gray-200/30 dark:border-tg-dark-700/30">
          <nav className="flex" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-all duration-300 relative group ${
                    isActive
                      ? `border-tg-blue-500 text-tg-blue-700 dark:text-tg-blue-400 ${tab.bgColor}`
                      : 'border-transparent text-tg-gray-600 dark:text-tg-gray-400 hover:text-tg-gray-800 dark:hover:text-tg-gray-200 hover:border-tg-gray-300 dark:hover:border-tg-dark-600 hover:bg-tg-gray-50/50 dark:hover:bg-tg-dark-700/50'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-1">
                    <Icon className={`w-5 h-5 ${isActive ? tab.color : ''}`} />
                    <span>{tab.name}</span>
                  </div>
                  
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-tg-blue-500 to-tg-blue-600 transform scale-x-100 transition-transform duration-300"></div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white/70 dark:bg-tg-dark-800/70 backdrop-blur-lg rounded-tg-lg shadow-tg-lg border border-tg-gray-200/30 dark:border-tg-dark-700/30 min-h-[600px] animate-fade-in">
          <div className="p-8">
            {activeTab === 'authorization' && (
              <AuthorizationTab 
                isAuthorized={isAuthorized}
                setIsAuthorized={setIsAuthorized}
                checkAuthStatus={checkAuthStatus}
              />
            )}
            {activeTab === 'sources' && (
              <SourcesTab 
                isAuthorized={isAuthorized}
                sources={sources}
                channels={channels}
                setChannels={setChannels}
                loadSources={loadSources}
                loadPosts={loadPosts}
              />
            )}
            {activeTab === 'posts' && (
              <PostsTab 
                posts={posts}
                loadPosts={loadPosts}
                loadSelectedPosts={loadSelectedPosts}
              />
            )}
            {activeTab === 'selected' && (
              <SelectedPostsTab 
                selectedPosts={selectedPosts}
                loadSelectedPosts={loadSelectedPosts}
                loadPosts={loadPosts}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Компонент авторизации
function AuthorizationTab({ isAuthorized, setIsAuthorized, checkAuthStatus }: AuthorizationTabProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [password, setPassword] = useState('');
  const [phoneCodeHash, setPhoneCodeHash] = useState('');
  const [step, setStep] = useState('phone'); // phone, code, password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendCode = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/telegram/send-code`, {
        phone_number: phoneNumber
      });
      setPhoneCodeHash(response.data.phone_code_hash);
      setStep('code');
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Ошибка отправки кода');
    }
    setLoading(false);
  };

  const verifyCode = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/telegram/verify-code`, {
        phone_number: phoneNumber,
        phone_code: phoneCode,
        phone_code_hash: phoneCodeHash
      });
      
      if (response.data.status === 'need_password') {
        setStep('password');
      } else {
        setIsAuthorized(true);
        checkAuthStatus();
      }
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Ошибка верификации кода');
    }
    setLoading(false);
  };

  const verifyPassword = async () => {
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_BASE_URL}/api/telegram/verify-password`, {
        password: password
      });
      setIsAuthorized(true);
      checkAuthStatus();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Ошибка верификации пароля');
    }
    setLoading(false);
  };

  if (isAuthorized) {
    return (
      <div className="text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-tg-green to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-tg-dark-800 dark:text-black mb-2">
          Авторизация выполнена
        </h2>
        <p className="text-tg-gray-600 dark:text-tg-gray-400 mb-6">
          Вы успешно подключены к Telegram API
        </p>
        <div className="inline-flex items-center px-4 py-2 bg-tg-green/10 text-tg-green rounded-tg border border-tg-green/20">
          <div className="w-2 h-2 bg-tg-green rounded-full mr-2 animate-pulse"></div>
          <span className="text-sm font-medium">Активное соединение</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-tg-blue-500 to-tg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-tg-lg">
          <Shield className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-tg-dark-800 dark:text-white">
          Авторизация в Telegram
        </h2>
        <p className="text-tg-gray-600 dark:text-tg-gray-400 mt-2">
          Войдите в свой аккаунт для доступа к каналам
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-tg-red/10 border border-tg-red/20 rounded-tg animate-scale-in">
          <div className="flex">
            <div className="w-5 h-5 bg-tg-red rounded-full flex items-center justify-center mt-0.5 mr-3">
              <span className="text-white text-xs">!</span>
            </div>
            <div>
              <p className="text-tg-red font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {step === 'phone' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-tg-dark-700 dark:text-tg-gray-300 mb-2">
                <Smartphone className="w-4 h-4 inline mr-2" />
                Номер телефона
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+7 900 123 45 67"
                className="tg-input w-full p-4 rounded-tg border border-tg-gray-200 dark:border-tg-dark-700 bg-white dark:bg-tg-dark-800 text-tg-dark-800 dark:text-white placeholder-tg-gray-400"
              />
              <p className="text-xs text-tg-gray-500 dark:text-tg-gray-400 mt-1">
                Введите номер в международном формате
              </p>
            </div>
            <button
              onClick={sendCode}
              disabled={!phoneNumber || loading}
              className="tg-button w-full p-4 bg-gradient-to-r from-tg-blue-500 to-tg-blue-600 text-white rounded-tg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-tg-blue-600 hover:to-tg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-tg-md"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Отправляем код...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Send className="w-5 h-5 mr-2" />
                  Отправить код
                </div>
              )}
            </button>
          </div>
        )}

        {step === 'code' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-tg-dark-700 dark:text-tg-gray-300 mb-2">
                <Key className="w-4 h-4 inline mr-2" />
                Код подтверждения
              </label>
              <input
                type="text"
                value={phoneCode}
                onChange={(e) => setPhoneCode(e.target.value)}
                placeholder="12345"
                className="tg-input w-full p-4 rounded-tg border border-tg-gray-200 dark:border-tg-dark-700 bg-white dark:bg-tg-dark-800 text-tg-dark-800 dark:text-white placeholder-tg-gray-400 text-center text-lg font-mono tracking-widest"
              />
              <p className="text-xs text-tg-gray-500 dark:text-tg-gray-400 mt-1">
                Введите код из сообщения Telegram
              </p>
            </div>
            <button
              onClick={verifyCode}
              disabled={!phoneCode || loading}
              className="tg-button w-full p-4 bg-gradient-to-r from-tg-blue-500 to-tg-blue-600 text-white rounded-tg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-tg-blue-600 hover:to-tg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-tg-md"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Проверяем код...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Check className="w-5 h-5 mr-2" />
                  Подтвердить
                </div>
              )}
            </button>
          </div>
        )}

        {step === 'password' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-tg-dark-700 dark:text-tg-gray-300 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Пароль двухфакторной аутентификации
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                className="tg-input w-full p-4 rounded-tg border border-tg-gray-200 dark:border-tg-dark-700 bg-white dark:bg-tg-dark-800 text-tg-dark-800 dark:text-white placeholder-tg-gray-400"
              />
              <p className="text-xs text-tg-gray-500 dark:text-tg-gray-400 mt-1">
                Введите пароль для завершения авторизации
              </p>
            </div>
            <button
              onClick={verifyPassword}
              disabled={!password || loading}
              className="tg-button w-full p-4 bg-gradient-to-r from-tg-blue-500 to-tg-blue-600 text-white rounded-tg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-tg-blue-600 hover:to-tg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-tg-md"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Авторизуемся...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Войти
                </div>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Steps indicator */}
      <div className="mt-8 flex justify-center space-x-2">
        {['phone', 'code', 'password'].map((stepName, index) => {
          const currentIndex = ['phone', 'code', 'password'].indexOf(step);
          const stepIndex = index;
          
          return (
            <div
              key={stepName}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                stepIndex <= currentIndex 
                  ? 'bg-tg-blue-500' 
                  : 'bg-tg-gray-300 dark:bg-tg-dark-600'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

// Компонент управления источниками
function SourcesTab({ isAuthorized, sources, channels, setChannels, loadSources, loadPosts }: SourcesTabProps) {
  const [loading, setLoading] = useState(false);
  const [showChannels, setShowChannels] = useState(false);

  const loadChannels = async () => {
    if (!isAuthorized) {
      alert('Сначала авторизуйтесь в Telegram');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/telegram/channels`);
      setChannels(response.data.channels || []);
      setShowChannels(true);
    } catch (error: any) {
      console.error('Ошибка загрузки каналов:', error);
      alert('Ошибка загрузки каналов');
    }
    setLoading(false);
  };

  const addSource = async (channel: any) => {
    try {
      await axios.post(`${API_BASE_URL}/api/sources`, {
        channel_id: channel.id,
        channel_name: channel.title,
        channel_username: channel.username
      });
      loadSources();
      alert('Канал добавлен!');
    } catch (error: any) {
      console.error('Ошибка добавления канала:', error);
      alert('Ошибка добавления канала');
    }
  };

  const removeSource = async (sourceId: number) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/sources/${sourceId}`);
      loadSources();
    } catch (error: any) {
      console.error('Ошибка удаления источника:', error);
      alert('Ошибка удаления источника');
    }
  };

  const parseAllSources = async () => {
    if (!isAuthorized) {
      alert('Сначала авторизуйтесь в Telegram');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/parse`);
      alert(`Парсинг завершен! Добавлено ${response.data.total_new_posts} новых постов`);
      loadPosts();
    } catch (error: any) {
      console.error('Ошибка парсинга:', error);
      alert('Ошибка парсинга');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Источники</h2>
          <p className="text-gray-600">Управляйте каналами для парсинга контента</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={loadChannels}
            disabled={loading || !isAuthorized}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <svg className="w-4 h-4 mr-2" width={24} height={24} fill="none" stroke="black" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Обновить каналы
          </button>
          
          <button
            onClick={parseAllSources}
            disabled={loading || !isAuthorized || sources.length === 0}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-black rounded-lg text-sm font-medium hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Парсинг...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" width={24} height={24} fill="none" stroke="black" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Парсить все источники
              </>
            )}
          </button>
        </div>
      </div>

      {/* Current Sources */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Текущие источники</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {sources.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" width={24} height={24} fill="none" stroke="black" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-gray-500">Нет добавленных источников</p>
              <p className="text-sm text-gray-400 mt-1">Добавьте каналы для парсинга контента</p>
            </div>
          ) : (
            sources.map((source: any) => (
              <div key={source.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" width={24} height={24} fill="none" stroke="black" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0V3a1 1 0 011-1h8a1 1 0 011 1v1M6 7h12v11a2 2 0 01-2 2H8a2 2 0 01-2-2V7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{source.channel_name}</h4>
                    <p className="text-sm text-gray-500">
                      {source.channel_username ? `@${source.channel_username}` : `ID: ${source.channel_id}`}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => removeSource(source.id)}
                  className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                >
                  <svg className="w-5 h-5" width={24} height={24} fill="none" stroke="black" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Available Channels */}
      {showChannels && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Доступные каналы</h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-200">
            {channels.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-gray-500">Нет доступных каналов</p>
              </div>
            ) : (
              channels.map((channel: any) => {
                const isAdded = sources.some((source: any) => source.channel_id === channel.id);
                
                return (
                  <div key={channel.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-black" width={24} height={24} fill="none" stroke="black" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0V3a1 1 0 011-1h8a1 1 0 011 1v1M6 7h12v11a2 2 0 01-2 2H8a2 2 0 01-2-2V7z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{channel.title}</h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{channel.username ? `@${channel.username}` : `ID: ${channel.id}`}</span>
                          {channel.members_count && (
                            <>
                              <span>•</span>
                              <span>{channel.members_count.toLocaleString()} участников</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => addSource(channel)}
                      disabled={isAdded}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isAdded
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-black hover:bg-blue-700 transform hover:scale-[1.02]'
                      }`}
                    >
                      {isAdded ? 'Добавлен' : 'Добавить'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Компонент для работы с отобранными постами
function SelectedPostsTab({ selectedPosts, loadSelectedPosts, loadPosts }: SelectedPostsTabProps) {
  const [viewMode, setViewMode] = useState<'list' | 'telegram'>('list');

  const removeSelectedPost = async (selectedPostId: number) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/selected-posts/${selectedPostId}`);
      loadSelectedPosts();
    } catch (error: any) {
      console.error('Ошибка удаления отобранного поста:', error);
      alert('Ошибка удаления отобранного поста');
    }
  };

  // Конвертируем selectedPosts в формат постов для PostCard
  const convertSelectedPostsToPostFormat = (selectedPosts: any[]) => {
    return selectedPosts.map(selectedPost => ({
      ...selectedPost.post, // Используем оригинальный пост
      id: selectedPost.post?.id || selectedPost.id,
      text: selectedPost.edited_text || selectedPost.original_text,
      html: selectedPost.edited_text || selectedPost.original_text,
      selected_post_id: selectedPost.id, // Добавляем ID отобранного поста для удаления
      selected_at: selectedPost.selected_at,
      status: selectedPost.status,
      notes: selectedPost.notes
    }));
  };

  const handleRemovePost = (post: any) => {
    if (post.selected_post_id) {
      removeSelectedPost(post.selected_post_id);
    }
  };

  const convertedPosts = convertSelectedPostsToPostFormat(selectedPosts);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-tg-purple-600 to-tg-purple-800 dark:from-tg-purple-400 dark:to-tg-purple-300 bg-clip-text text-transparent">
            Отобранные посты
          </h2>
          <p className="text-tg-gray-600 dark:text-tg-gray-400">
            Полное отображение выбранного контента с возможностью редактирования
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex rounded-xl overflow-hidden border border-tg-purple-100 dark:border-tg-purple-700 bg-tg-purple-50 dark:bg-tg-purple-900/20">
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 transition-colors flex items-center gap-2 ${
                viewMode === 'list'
                  ? 'bg-tg-purple-500 text-white shadow-tg-md'
                  : 'text-tg-purple-700 dark:text-tg-purple-300 hover:bg-tg-purple-100 dark:hover:bg-tg-purple-800'
              }`}
              title="Режим списка"
            >
              <List className="w-5 h-5" />
              <span className="text-sm font-medium">Список</span>
            </button>
            <button
              onClick={() => setViewMode('telegram')}
              className={`p-3 transition-colors flex items-center gap-2 ${
                viewMode === 'telegram'
                  ? 'bg-tg-purple-500 text-black shadow-tg-md'
                  : 'text-tg-purple-700 dark:text-tg-purple-300 hover:bg-tg-purple-100 dark:hover:bg-tg-purple-800'
              }`}
              title="Telegram-стиль"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-sm font-medium">Telegram</span>
            </button>
          </div>
          
          <button
            onClick={loadSelectedPosts}
            className="tg-button inline-flex items-center px-6 py-3 bg-gradient-to-r from-tg-purple-500 to-tg-purple-600 text-black rounded-tg font-medium hover:from-tg-purple-600 hover:to-tg-purple-700 transform hover:scale-105 transition-all duration-200 shadow-tg-md"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Обновить
          </button>
        </div>
      </div>

      {/* Selected Posts */}
      {convertedPosts.length > 0 ? (
        <div className="space-y-6">
          {convertedPosts.map((post, index) => (
            <div
              key={post.selected_post_id || post.id || index}
              className="relative animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Status badge */}
              <div className="absolute top-4 right-4 z-20">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  post.status === 'draft' ? 'bg-tg-gray-200 dark:bg-tg-gray-700 text-tg-gray-700 dark:text-tg-gray-300' :
                  post.status === 'ready' ? 'bg-tg-green-200 dark:bg-tg-green-900/30 text-tg-green-700 dark:text-tg-green-300' :
                  'bg-tg-blue-200 dark:bg-tg-blue-900/30 text-tg-blue-700 dark:text-tg-blue-300'
                }`}>
                  {post.status === 'draft' ? 'Черновик' :
                   post.status === 'ready' ? 'Готов к публикации' : 'Опубликован'}
                </span>
              </div>

              {/* Remove button */}
              <div className="absolute top-4 right-24 z-20">
                <button
                  onClick={() => handleRemovePost(post)}
                  className="p-2 bg-tg-red-500 hover:bg-tg-red-600 text-black rounded-full transition-colors shadow-tg-md"
                  title="Удалить из отобранных"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Selection metadata */}
              <div className="mb-4 p-4 bg-tg-purple-50 dark:bg-tg-purple-900/20 rounded-xl border border-tg-purple-200 dark:border-tg-purple-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-tg-purple-700 dark:text-tg-purple-300">
                    📋 Отобран: {new Date(post.selected_at).toLocaleString('ru-RU')}
                  </span>
                  {post.notes && (
                    <span className="text-tg-gray-600 dark:text-tg-gray-400 italic">
                      💬 {post.notes}
                    </span>
                  )}
                </div>
              </div>

              {/* Post card with full content */}
              <PostCard
                post={post}
                onSelect={() => {}} // Не нужно для отобранных постов
                isSelected={false}
                showDebug={false}
                viewMode={viewMode} // Используем выбранный режим
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 bg-tg-purple-50 dark:bg-tg-dark-700 rounded-full flex items-center justify-center">
            <Heart className="w-10 h-10 text-tg-purple-400" />
          </div>
          <h3 className="text-2xl font-bold text-tg-purple-900 dark:text-black mb-2">
            Нет отобранных постов
          </h3>
          <p className="text-tg-purple-600 dark:text-tg-purple-300">
            Перейдите во вкладку "Все посты" и выберите контент для отбора
          </p>
        </div>
      )}
    </div>
  );
}

// Компонент для просмотра всех постов
function PostsTab({ posts, loadPosts, loadSelectedPosts }: PostsTabProps) {
  const [loading, setLoading] = useState(false);

  const selectPost = async (post: any) => {
    try {
      await axios.post(`${API_BASE_URL}/api/posts/select`, {
        post_id: post.id
      });
      loadPosts();
      loadSelectedPosts();
      // Показываем уведомление об успехе
    } catch (error: any) {
      console.error('Ошибка отбора поста:', error);
      // Показываем уведомление об ошибке
    }
  };

  const refreshPosts = async () => {
    setLoading(true);
    await loadPosts();
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-tg-blue-600 to-tg-blue-800 dark:from-tg-blue-400 dark:to-tg-blue-300 bg-clip-text text-transparent">
            Все посты из источников
          </h2>
          <p className="text-tg-gray-600 dark:text-tg-gray-400">
            Просматривайте превьюшки и отбирайте контент для публикации
          </p>
        </div>
        
        <button
          onClick={refreshPosts}
          disabled={loading}
          className="tg-button inline-flex items-center px-6 py-3 bg-gradient-to-r from-tg-blue-500 to-tg-blue-600 text-black rounded-tg font-medium hover:from-tg-blue-600 hover:to-tg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-tg-md"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Обновляем...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Обновить
            </>
          )}
        </button>
      </div>

      {/* Posts List - всегда в компактном режиме для превьюшек */}
      <PostsList 
        posts={posts}
        onSelectPost={selectPost}
        showSelection={true}
        forceViewMode="list" // Принудительно список для превьюшек
      />
    </div>
  );
}