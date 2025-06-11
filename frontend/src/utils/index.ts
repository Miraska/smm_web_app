import { TEXT_LIMITS } from '../constants';
import type { ViewMode, Post } from '../types';
import { API_BASE_URL } from '../constants';

// Date formatting utilities
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes} мин назад`;
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)} ч назад`;
  } else {
    return `${Math.floor(diffInMinutes / 1440)} дн назад`;
  }
};

// Text utilities
export const stripHtml = (html: string): string => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

export const truncateText = (text: string, maxLength?: number, viewMode: ViewMode = 'grid'): string => {
  const defaultLength = 
    viewMode === 'compact' ? TEXT_LIMITS.POST_PREVIEW_COMPACT :
    viewMode === 'telegram' ? TEXT_LIMITS.POST_PREVIEW_TELEGRAM :
    TEXT_LIMITS.POST_PREVIEW;
    
  const length = maxLength || defaultLength;
  
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
};

// Number formatting
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Theme utilities
export const getStoredTheme = (): 'light' | 'dark' | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('smm-bot-theme') as 'light' | 'dark' | null;
};

export const setStoredTheme = (theme: 'light' | 'dark'): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('smm-bot-theme', theme);
};

export const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Validation utilities
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{9,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validateCode = (code: string): boolean => {
  // Коды Telegram могут быть от 4 до 6 цифр
  return /^\d{4,6}$/.test(code);
};

// DOM utilities
export const scrollToTop = (): void => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

// Array utilities
export const uniqueBy = <T>(array: T[], key: keyof T): T[] => {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Error handling
export const getErrorMessage = (error: any): string => {
  // Axios error with response
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail;
    
    // Специальные случаи для Telegram ошибок
    if (detail.includes('Не авторизован в Telegram')) {
      return 'Требуется авторизация в Telegram. Пройдите авторизацию заново.';
    }
    
    if (detail.includes('PhoneCodeInvalid') || detail.includes('Неверный код')) {
      return 'Неверный код подтверждения. Проверьте код и попробуйте еще раз.';
    }
    
    if (detail.includes('PhoneCodeExpired') || detail.includes('истёкший код')) {
      return 'Срок действия кода истек. Запросите новый код.';
    }
    
    if (detail.includes('SessionPasswordNeeded')) {
      return 'Требуется пароль двухфакторной аутентификации.';
    }
    
    return detail;
  }
  
  // Check for specific response data structure
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  // Axios error with custom message (set by interceptor)
  if (error.message) {
    return error.message;
  }
  
  // Network or other errors
  if (error.code === 'ERR_NETWORK') {
    return 'Ошибка сети. Проверьте подключение к интернету.';
  }
  
  if (error.code === 'ECONNABORTED') {
    return 'Превышено время ожидания. Попробуйте позже.';
  }
  
  // Generic error
  return error.toString() || 'Произошла неизвестная ошибка';
};

// Local storage helpers
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  },
};

// Backend health check
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${API_BASE_URL}/api/telegram/status`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn('Backend health check failed:', error);
    return false;
  }
}; 