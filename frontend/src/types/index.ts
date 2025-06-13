// Base types
export interface BaseEntity {
  id: number;
  created_at?: string;
  updated_at?: string;
}

// Post types
export interface Post extends BaseEntity {
  channel_id: string; // Backend использует string ID
  channel_name?: string;
  channel_title?: string;
  channel_username?: string;
  message_id: number;
  text?: string;
  html?: string;
  media_type?: 'photo' | 'video' | 'document' | 'audio' | 'voice' | 'animation';
  media_url?: string;
  media_path?: string;
  file_id?: string;
  views?: number;
  reactions?: number;
  comments?: number;
  post_date?: string;
  date?: string;
  album_id?: string;
  album_position?: number;
  album_total?: number;
  selected?: boolean;
  status?: 'draft' | 'scheduled' | 'published';
  notes?: string;
}

// Selected Post types
export interface SelectedPost extends BaseEntity {
  post_id: number;
  post?: Post;
  original_text: string;
  edited_text?: string;
  selected_at: string;
  status: 'draft' | 'scheduled' | 'published';
  notes?: string;
}

// Channel types
export interface Channel {
  id: string; // Backend возвращает string ID
  title: string;
  username?: string;
  members_count?: number;
  access_hash?: string;
  type?: 'channel' | 'supergroup' | 'chat';
  is_creator?: boolean;
  is_admin?: boolean;
  can_send_messages?: boolean;
}

// Source types
export interface Source extends BaseEntity {
  channel_id: string; // Backend использует string ID
  channel_name: string;
  channel_username?: string;
  channel_title?: string;
  is_active: boolean;
  added_at?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

// UI types
export type ViewMode = 'grid' | 'list' | 'compact' | 'telegram';
export type Theme = 'light' | 'dark';
export type TabId = 'sources' | 'feed' | 'selected' | 'settings';

// Props types
export interface TabProps {
  id: TabId;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}

// Auth types
export interface AuthStatus {
  authorized: boolean;
  user_id?: number;
  phone_number?: string;
  username?: string;
}

export interface AuthCodeRequest {
  phone_number: string;
}

export interface AuthCodeResponse {
  phone_code_hash: string;
  status: 'code_sent' | 'need_password';
}

export interface AuthVerifyRequest {
  phone_number: string;
  phone_code: string;
  phone_code_hash: string;
}

export interface AuthPasswordRequest {
  password: string;
}

// Telegram WebApp types
export interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  MainButton: {
    show: () => void;
    hide: () => void;
    setText: (text: string) => void;
    onClick: (fn: () => void) => void;
  };
}

// Settings types
export interface EditingSettings {
  prompt: string;
  auto_apply: boolean;
  preserve_formatting: boolean;
  openrouter_api_key?: string;
  selected_model?: string;
}

// Telegram Channel types
export interface TelegramChannel {
  id: string;
  title: string;
  username?: string;
  participants_count?: number;
  is_admin: boolean;
  can_post_messages: boolean;
  access_hash?: string;
}

// Scheduled Post types  
export interface ScheduledPost extends BaseEntity {
  selected_post_id: number;
  selected_post?: SelectedPost;
  channel_id: string;
  channel_title?: string;
  scheduled_time: string;
  status: 'pending' | 'published' | 'failed' | 'cancelled';
  message_id?: number;
  error_message?: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
} 