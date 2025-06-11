// API Configuration
export const API_BASE_URL = 'http://localhost:8000';

// Routes
export const API_ROUTES = {
  // Auth
  AUTH_STATUS: '/api/telegram/status',
  AUTH_SEND_CODE: '/api/telegram/send-code',
  AUTH_VERIFY_CODE: '/api/telegram/verify-code',
  AUTH_VERIFY_PASSWORD: '/api/telegram/verify-password',
  AUTH_LOGOUT: '/api/telegram/logout',
  
  // Sources
  SOURCES: '/api/sources',
  CHANNELS: '/api/telegram/channels',
  
  // Posts
  POSTS: '/api/posts',
  POSTS_PAGINATED: '/api/posts/paginated',
  POSTS_CHECK_NEW: '/api/posts/check-new',
  POSTS_PARSE_MORE: '/api/posts/parse-more',
  POSTS_SELECT: '/api/posts/select',
  SELECTED_POSTS: '/api/selected-posts',
  
  // Utilities
  REWRITE: '/api/rewrite',
  CLEAR_DATA: '/api/clear-data',
} as const;

// UI Constants
export const VIEW_MODES = ['grid', 'list', 'compact', 'telegram'] as const;

export const TABS = [
  {
    id: 'sources' as const,
    name: 'Источники',
    color: 'text-tg-green',
    bgColor: 'bg-green-50 dark:bg-green-900/20'
  },
  {
    id: 'feed' as const,
    name: 'Посты',
    color: 'text-tg-orange',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20'
  },
  {
    id: 'selected' as const,
    name: 'Отобранные',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20'
  },
  {
    id: 'settings' as const,
    name: 'Настройки',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20'
  }
];

// Animation & Transition
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Theme
export const THEME_STORAGE_KEY = 'smm-bot-theme';

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const INFINITE_SCROLL_THRESHOLD = 0.8;

// Text limits
export const TEXT_LIMITS = {
  POST_PREVIEW: 200,
  POST_PREVIEW_COMPACT: 100,
  POST_PREVIEW_TELEGRAM: 500,
  CHANNEL_NAME: 50,
} as const;

// Validation
export const VALIDATION = {
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 15,
  CODE_LENGTH: 5,
  PASSWORD_MIN_LENGTH: 1,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Ошибка сети. Проверьте подключение к интернету.',
  UNAUTHORIZED: 'Необходима авторизация.',
  INVALID_PHONE: 'Неверный формат номера телефона.',
  INVALID_CODE: 'Неверный код подтверждения.',
  INVALID_PASSWORD: 'Неверный пароль.',
  GENERIC_ERROR: 'Произошла ошибка. Попробуйте еще раз.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  AUTH_SUCCESS: 'Авторизация выполнена успешно!',
  CODE_SENT: 'Код отправлен на ваш номер.',
  POST_SELECTED: 'Пост добавлен в отобранные.',
  POST_REMOVED: 'Пост удален.',
  DATA_CLEARED: 'Данные очищены.',
} as const; 