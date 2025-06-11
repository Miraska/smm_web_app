import axios from 'axios';
import { API_BASE_URL, API_ROUTES } from '../constants';
import type {
  AuthStatus,
  AuthCodeRequest,
  AuthCodeResponse,
  AuthVerifyRequest,
  AuthPasswordRequest,
  Channel,
  Source,
  Post,
  SelectedPost,
  ApiResponse,
} from '../types';

// Retry utility function
const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 2,
  delay: number = 1000
): Promise<T> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Retry only on network/timeout errors, not on 4xx/5xx
      if (
        error.code === 'ECONNABORTED' || 
        error.code === 'ERR_NETWORK' ||
        error.message.includes('timeout') ||
        !error.response
      ) {
        console.warn(`Request failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Увеличиваем таймаут до 30 секунд
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth headers if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Handle unauthorized - clear local auth state
      console.warn('Unauthorized access, clearing auth state');
      localStorage.removeItem('auth_status');
      
      // Можно также отправить событие для обновления состояния авторизации
      window.dispatchEvent(new CustomEvent('auth-logout'));
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      // Handle timeout errors
      console.error('Request timeout - backend может быть недоступен');
      error.message = 'Сервер не отвечает. Проверьте подключение или попробуйте позже.';
    } else if (error.code === 'ERR_NETWORK' || !error.response) {
      // Handle network errors
      console.error('Network error - backend недоступен');
      error.message = 'Не удается подключиться к серверу. Проверьте, что backend запущен.';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  getStatus: (): Promise<AuthStatus> =>
    retryRequest(() => api.get(API_ROUTES.AUTH_STATUS).then(res => res.data)),

  sendCode: (data: AuthCodeRequest): Promise<AuthCodeResponse> =>
    api.post(API_ROUTES.AUTH_SEND_CODE, data).then(res => res.data),

  verifyCode: (data: AuthVerifyRequest): Promise<{ status: string }> =>
    api.post(API_ROUTES.AUTH_VERIFY_CODE, data).then(res => res.data),

  verifyPassword: (data: AuthPasswordRequest): Promise<{ status: string }> =>
    api.post(API_ROUTES.AUTH_VERIFY_PASSWORD, data).then(res => res.data),

  logout: (): Promise<void> =>
    api.post(API_ROUTES.AUTH_LOGOUT).then(() => {}),
};

// Sources API
export const sourcesApi = {
  getAll: (search?: string): Promise<Source[]> =>
    api.get(API_ROUTES.SOURCES, { params: search ? { search } : undefined }).then(res => res.data),

  add: (channel: Channel): Promise<Source> =>
    api.post(API_ROUTES.SOURCES, {
      channel_id: channel.id,
      channel_name: channel.title,
      channel_username: channel.username,
      channel_title: channel.title,
    }).then(res => res.data),

  remove: (id: number): Promise<{ message: string; details: any }> =>
    api.delete(`${API_ROUTES.SOURCES}/${id}`).then(res => res.data),

  parseAll: (): Promise<{ message: string }> =>
    api.post(`${API_ROUTES.SOURCES}/parse-all`).then(res => res.data),
};

// Channels API
export const channelsApi = {
  getAll: (search?: string): Promise<Channel[]> =>
    api.get(API_ROUTES.CHANNELS, { params: search ? { search } : undefined }).then(res => res.data.channels || []),
};

// Posts API
export const postsApi = {
  getAll: (params?: { page?: number; per_page?: number }): Promise<Post[]> =>
    api.get(API_ROUTES.POSTS, { params }).then(res => res.data),

  getPaginated: (params?: { 
    offset?: number; 
    limit?: number; 
  }): Promise<{
    posts: Post[];
    has_more: boolean;
    total: number;
    offset: number;
    limit: number;
    loaded_count: number;
  }> =>
    api.get(API_ROUTES.POSTS_PAGINATED, { params }).then(res => res.data),

  checkNew: (): Promise<{
    message: string;
    new_posts: number;
    parsed_channels: Array<{ channel_name: string; new_posts: number }>;
  }> =>
    api.post(API_ROUTES.POSTS_CHECK_NEW).then(res => res.data),

  select: (post: Post): Promise<{ message: string }> =>
    api.post(API_ROUTES.POSTS_SELECT, {
      post_id: post.id,
      notes: null,
    }).then(res => res.data),

  parseMore: (limit: number = 5): Promise<{
    message: string;
    new_posts: number;
    parsed_channels: Array<{ channel_name: string; new_posts: number }>;
  }> =>
    api.post(API_ROUTES.POSTS_PARSE_MORE, null, { params: { limit } }).then(res => res.data),
};

// Selected Posts API
export const selectedPostsApi = {
  getAll: (): Promise<SelectedPost[]> =>
    api.get(API_ROUTES.SELECTED_POSTS).then(res => res.data),

  remove: (id: number): Promise<void> =>
    api.delete(`${API_ROUTES.SELECTED_POSTS}/${id}`).then(() => {}),

  update: (id: number, data: Partial<SelectedPost>): Promise<SelectedPost> =>
    api.put(`${API_ROUTES.SELECTED_POSTS}/${id}`, data).then(res => res.data),
};

// Utilities API
export const utilsApi = {
  rewrite: (text: string, maxTokens: number = 1024): Promise<{ rewritten_text: string }> =>
    api.post(API_ROUTES.REWRITE, { text, max_tokens: maxTokens }).then(res => res.data),

  clearData: (): Promise<{ message: string }> =>
    api.post(API_ROUTES.CLEAR_DATA).then(res => res.data),
};

export default api; 