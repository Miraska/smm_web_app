import React from 'react';
import { Clock, Eye, Heart, MessageCircle, Share2, Play, Image as ImageIcon, File, ExternalLink, User } from 'lucide-react';
import MediaRenderer from './MediaRenderer';
import AlbumRenderer from './AlbumRenderer';
import MediaDebugInfo from './MediaDebugInfo';

interface Props { 
  post: any; 
  onSelect: () => void;
  isSelected?: boolean;
  albumPosts?: any[]; // Дополнительные посты альбома
  showDebug?: boolean; // Для отладки медиа
  viewMode?: 'grid' | 'list' | 'compact' | 'telegram'; // Режим отображения
}

export default function PostCard({ 
  post, 
  onSelect, 
  isSelected = false, 
  albumPosts = [], 
  showDebug = false,
  viewMode = 'grid'
}: Props) {
  const formatDate = (dateString: string) => {
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

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'photo':
        return <ImageIcon className="w-4 h-4 text-tg-blue-500" />;
      case 'video':
        return <Play className="w-4 h-4 text-tg-blue-500" />;
      case 'document':
        return <File className="w-4 h-4 text-tg-blue-500" />;
      default:
        return null;
    }
  };

  const stripHtml = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  const truncateText = (text: string, maxLength?: number) => {
    const defaultLength = viewMode === 'compact' ? 100 : viewMode === 'telegram' ? 500 : 200;
    const length = maxLength || defaultLength;
    
    if (text.length <= length) return text;
    return text.slice(0, length) + '...';
  };

  // Проверяем, является ли этот пост частью альбома
  const hasAlbum = albumPosts.length > 0 || post.album_id;

  // Стили в зависимости от режима отображения
  const getCardClasses = () => {
    const baseClasses = `
      bg-white dark:bg-tg-dark-800
      border border-tg-blue-100 dark:border-tg-dark-700
      hover:shadow-tg-xl hover:border-tg-blue-400 dark:hover:border-tg-blue-700
      transition-all duration-300
      cursor-pointer group relative overflow-hidden
      animate-fade-in
      ${isSelected ? 'ring-2 ring-tg-blue-500 border-tg-blue-500' : ''}
    `;

    switch (viewMode) {
      case 'compact':
        return baseClasses + ' rounded-xl shadow-tg p-4';
      case 'list':
        return baseClasses + ' rounded-xl shadow-tg-md';
      case 'telegram':
        return baseClasses + ' rounded-2xl shadow-tg-lg';
      default: // grid
        return baseClasses + ' rounded-2xl shadow-tg-lg';
    }
  };

  const getLayoutClasses = () => {
    switch (viewMode) {
      case 'compact':
        return 'flex gap-4 items-start';
      case 'list':
        return 'flex gap-6 p-6';
      case 'telegram':
        return 'p-6 space-y-4';
      default: // grid
        return '';
    }
  };

  // Компактный режим
  if (viewMode === 'compact') {
    return (
      <div className={getCardClasses()} onClick={onSelect}>
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-5 h-5 bg-tg-blue-500 rounded-full flex items-center justify-center z-10">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        )}

        <div className={getLayoutClasses()}>
          {/* Media thumbnail */}
          {post.media_type && (
            <div className="flex-shrink-0 w-16 h-16 bg-tg-gray-100 dark:bg-tg-dark-600 rounded-lg flex items-center justify-center overflow-hidden">
              {post.media_type && <MediaRenderer post={post} compact={true} />}
              {!post.media_type && getMediaIcon(post.media_type)}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-tg-blue-500 to-tg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">
                    {(post.channel_name || post.channel_title)?.charAt(0) || 'T'}
                  </span>
                </div>
                <span className="text-sm font-medium text-tg-blue-700 dark:text-tg-blue-300 truncate">
                  {post.channel_name || post.channel_title || 'Telegram Channel'}
                </span>
              </div>
              <span className="text-xs text-tg-gray-500 flex-shrink-0">
                {formatDate(post.post_date || post.date || new Date().toISOString())}
              </span>
            </div>

            <p className="text-sm text-tg-dark-700 dark:text-tg-gray-200 line-clamp-2">
              {truncateText(stripHtml(post.html || post.text || ''))}
            </p>

            <div className="flex items-center gap-3 mt-2 text-xs text-tg-gray-500">
              {post.views && (
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>{post.views}</span>
                </div>
              )}
              {post.reactions && (
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  <span>{post.reactions}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {showDebug && post.media_type && <MediaDebugInfo post={post} />}
      </div>
    );
  }

  // Список режим
  if (viewMode === 'list') {
    return (
      <div className={getCardClasses()}>
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-4 right-4 w-6 h-6 bg-tg-blue-500 rounded-full flex items-center justify-center z-10">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
        )}

        <div className={getLayoutClasses()} onClick={onSelect}>
          {/* Left content */}
          <div className="flex-1 space-y-4">
            {/* Channel info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-tg-blue-500 to-tg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg font-semibold">
                    {(post.channel_name || post.channel_title)?.charAt(0) || 'T'}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-tg-blue-700 dark:text-tg-blue-300">
                    {post.channel_name || post.channel_title || 'Telegram Channel'}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-tg-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(post.post_date || post.date || new Date().toISOString())}</span>
                    {post.message_id && (
                      <>
                        <span>•</span>
                        <span>ID: {post.message_id}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {[
                  { icon: Eye, value: post.views, label: 'просмотров' },
                  { icon: Heart, value: post.reactions, label: 'реакций' },
                  { icon: MessageCircle, value: post.comments, label: 'комментариев' }
                ].map(({ icon: Icon, value, label }) => value && (
                  <div key={label} className="flex items-center gap-1 text-tg-gray-500 text-sm">
                    <Icon className="w-4 h-4" />
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Post content */}
            <div>
              <p className="text-tg-dark-700 dark:text-tg-gray-200 leading-relaxed">
                {truncateText(stripHtml(post.html || post.text || ''))}
              </p>
            </div>

            {showDebug && post.media_type && <MediaDebugInfo post={post} />}
          </div>

          {/* Right media */}
          {(post.media_type || hasAlbum) && (
            <div className="flex-shrink-0 w-48">
              {hasAlbum ? (
                <AlbumRenderer posts={albumPosts.length > 0 ? albumPosts : [post]} compact={true} />
              ) : (
                <MediaRenderer post={post} compact={true} />
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Telegram-стиль режим - как в реальном Telegram
  if (viewMode === 'telegram') {
    return (
      <div className="bg-white dark:bg-tg-dark-800 rounded-2xl shadow-tg-lg border border-tg-blue-100 dark:border-tg-dark-700 overflow-hidden transition-all duration-300 hover:shadow-tg-xl hover:border-tg-blue-400 dark:hover:border-tg-blue-700 cursor-pointer group animate-fade-in">
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-4 right-4 w-8 h-8 bg-tg-blue-500 rounded-full flex items-center justify-center z-20 shadow-tg-md">
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
        )}

        <div onClick={onSelect}>
          {/* Channel Header */}
          <div className="p-4 border-b border-tg-gray-100 dark:border-tg-dark-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-tg-blue-500 to-tg-purple-500 rounded-full flex items-center justify-center shadow-tg-md">
                <span className="text-white text-lg font-bold">
                  {(post.channel_name || post.channel_title)?.charAt(0) || 'T'}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-tg-blue-700 dark:text-tg-blue-300 text-lg">
                  {post.channel_name || post.channel_title || 'Telegram Channel'}
                </h3>
                <div className="flex items-center gap-2 text-sm text-tg-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(post.post_date || post.date || new Date().toISOString())}</span>
                  {post.views && (
                    <>
                      <span>•</span>
                      <Eye className="w-4 h-4" />
                      <span>{post.views.toLocaleString()}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Media Section - показываем все медиа в полном размере */}
          {post.media_type && (
            <div className="relative">
              <MediaRenderer post={post} compact={false} />
              {post.media_type && (
                <div className="absolute top-4 left-4 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 shadow-tg-md">
                  {getMediaIcon(post.media_type)}
                  <span className="text-white text-sm font-medium capitalize">
                    {post.media_type}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Album handling */}
          {hasAlbum && (
            <div className="p-0">
              <AlbumRenderer posts={albumPosts.length > 0 ? albumPosts : [post]} compact={false} />
            </div>
          )}

          {/* Text Content */}
          {(post.html || post.text) && (
            <div className="p-6">
              <div 
                className="text-tg-dark-700 dark:text-tg-gray-200 leading-relaxed text-base"
                dangerouslySetInnerHTML={{ 
                  __html: post.html || post.text.replace(/\n/g, '<br>') 
                }}
              />
            </div>
          )}

          {/* Interaction Bar */}
          <div className="p-4 border-t border-tg-gray-100 dark:border-tg-dark-700 bg-tg-gray-50 dark:bg-tg-dark-700/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 text-tg-gray-500">
                {post.reactions && (
                  <div className="flex items-center gap-2 hover:text-tg-red-500 transition-colors cursor-pointer">
                    <Heart className="w-5 h-5" />
                    <span className="font-medium">{post.reactions}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 hover:text-tg-blue-500 transition-colors cursor-pointer">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">Поделиться</span>
                </div>
              </div>

              {/* Message ID */}
              {post.message_id && (
                <span className="text-xs text-tg-gray-400 bg-tg-gray-100 dark:bg-tg-dark-600 px-2 py-1 rounded-full">
                  #{post.message_id}
                </span>
              )}
            </div>
          </div>
        </div>

        {showDebug && post.media_type && <MediaDebugInfo post={post} />}
      </div>
    );
  }

  // Остальные режимы остаются без изменений
  return (
    <div
      className={getCardClasses()}
      onClick={onSelect}
      style={{ minHeight: viewMode === 'telegram' ? 280 : 220 }}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-tg-blue-500 rounded-full flex items-center justify-center z-10 shadow-tg-md">
          <div className="w-3 h-3 bg-white rounded-full"></div>
        </div>
      )}

      {/* Media preview */}
      {post.media_type && !hasAlbum && (
        <div className="relative">
          <MediaRenderer post={post} compact={viewMode !== 'telegram'} />
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-tg-blue-600/80 backdrop-blur-sm rounded-full px-2 py-1 shadow-tg-md">
            {getMediaIcon(post.media_type)}
            <span className="text-white text-xs font-medium">
              {post.media_type === 'photo' ? 'Фото' : 
               post.media_type === 'video' ? 'Видео' : 
               post.media_type === 'audio' ? 'Аудио' :
               post.media_type === 'voice' ? 'Голос' :
               post.media_type === 'document' ? 'Файл' :
               post.media_type === 'sticker' ? 'Стикер' :
               post.media_type === 'animation' ? 'GIF' : 'Медиа'}
            </span>
          </div>
        </div>
      )}

      {/* Album preview */}
      {hasAlbum && (
        <div className="p-3">
          <AlbumRenderer posts={albumPosts.length > 0 ? albumPosts : [post]} compact={viewMode !== 'telegram'} />
        </div>
      )}

      {/* Content */}
      <div className={`p-5 space-y-${viewMode === 'telegram' ? '4' : '3'}`}>
        {/* Channel info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-tg-blue-500 to-tg-purple-500 rounded-full flex items-center justify-center shadow-tg">
              <span className="text-white text-base font-semibold">
                {(post.channel_name || post.channel_title)?.charAt(0) || 'T'}
              </span>
            </div>
            <div>
              <p className="font-bold text-tg-blue-700 dark:text-tg-blue-300 text-sm">
                {post.channel_name || post.channel_title || 'Telegram Channel'}
              </p>
              {viewMode === 'telegram' && post.channel_username && (
                <p className="text-xs text-tg-blue-500 dark:text-tg-blue-400">
                  @{post.channel_username}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 text-tg-gray-500 text-xs">
            <Clock className="w-3 h-3" />
            <span>{formatDate(post.post_date || post.date || new Date().toISOString())}</span>
          </div>
        </div>

        {/* Post text */}
        <div className="space-y-2">
          <p className="text-tg-dark-700 dark:text-tg-gray-200 leading-relaxed text-base font-medium">
            {truncateText(stripHtml(post.html || post.text || ''))}
          </p>
          
          {viewMode === 'telegram' && (post.html || post.text) && (post.html || post.text).length > 500 && (
            <button className="text-tg-blue-500 text-sm hover:text-tg-blue-600 flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              Читать полностью
            </button>
          )}
        </div>

        {/* Additional metadata for detailed view */}
        {viewMode === 'telegram' && (
          <div className="flex flex-wrap gap-2 text-xs">
            {post.message_id && (
              <span className="px-2 py-1 bg-tg-gray-100 dark:bg-tg-dark-700 text-tg-gray-600 dark:text-tg-gray-400 rounded">
                ID: {post.message_id}
              </span>
            )}
            {post.album_id && (
              <span className="px-2 py-1 bg-tg-blue-100 dark:bg-tg-blue-900/30 text-tg-blue-600 dark:text-tg-blue-400 rounded">
                Альбом
              </span>
            )}
            {(post.text || post.html) && (
              <span className="px-2 py-1 bg-tg-purple-100 dark:bg-tg-purple-900/30 text-tg-purple-600 dark:text-tg-purple-400 rounded">
                {(post.text || post.html || '').length} символов
              </span>
            )}
          </div>
        )}

        {/* Debug info */}
        {showDebug && post.media_type && (
          <MediaDebugInfo post={post} />
        )}

        {/* Stats and actions */}
        <div className="flex items-center justify-between pt-2 border-t border-tg-gray-100 dark:border-tg-dark-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-tg-gray-500 text-xs">
              <Eye className="w-3 h-3" />
              <span>{post.views || '0'}</span>
            </div>
            {post.reactions && (
              <div className="flex items-center gap-1 text-tg-gray-500 text-xs">
                <Heart className="w-3 h-3" />
                <span>{post.reactions}</span>
              </div>
            )}
            {post.comments && (
              <div className="flex items-center gap-1 text-tg-gray-500 text-xs">
                <MessageCircle className="w-3 h-3" />
                <span>{post.comments}</span>
              </div>
            )}
          </div>
          
          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-tg-blue-50 dark:hover:bg-tg-dark-700 rounded-full">
            <Share2 className="w-3 h-3 text-tg-blue-500" />
          </button>
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-tg-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
    </div>
  );
}