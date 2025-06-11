import React from 'react';
import { Star, Eye, MessageCircle, Heart, Calendar, Hash, User, Grid3X3 } from 'lucide-react';
import { formatDate, formatNumber, stripHtml, truncateText } from '../../../utils';
import MediaRenderer from '../../../components/MediaRenderer';
import type { Post, ViewMode } from '../../../types';

interface PostCardProps {
  post: Post;
  onSelect: (post: Post) => void;
  viewMode?: ViewMode;
  showSelection?: boolean;
  isSelected?: boolean;
  allPosts?: Post[]; // Для поддержки альбомов
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onSelect,
  viewMode = 'grid',
  showSelection = true,
  isSelected = false,
  allPosts = [],
}) => {
  const displayText = post.html ? stripHtml(post.html) : post.text || '';
  const truncatedText = truncateText(displayText, undefined, viewMode);

  const handleSelect = () => {
    if (showSelection) {
      onSelect(post);
    }
  };

  const getCardClasses = () => {
    const base = "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-lg";
    
    if (viewMode === 'list') {
      return `${base} rounded-lg p-3 flex items-start space-x-3`; // Горизонтальная компоновка для списка
    }
    if (viewMode === 'compact') {
      return `${base} rounded-xl p-3`;
    }
    if (viewMode === 'telegram') {
      return `${base} rounded-2xl p-6 shadow-sm hover:shadow-xl`; // Больше похоже на Telegram
    }
    return `${base} rounded-xl p-4`; // grid
  };

  // Определяем нужно ли показывать медиа в зависимости от режима
  const shouldShowMedia = viewMode !== 'list' && post.media_type && post.media_url;

  // Режим списка - горизонтальная компоновка
  if (viewMode === 'list') {
    return (
      <div className={getCardClasses()}>
        {/* Левая часть - аватар канала */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <Hash className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        {/* Центральная часть - контент */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center space-x-2 mb-1">
            <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
              {post.channel_title || post.channel_name}
            </p>
            {post.channel_username && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                @{post.channel_username}
              </p>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              • {formatDate(post.date || post.post_date || '')}
            </span>
          </div>

          {/* Content */}
          {truncatedText && (
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-2 line-clamp-2">
              {truncatedText}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            {post.views && (
              <div className="flex items-center space-x-1">
                <Eye className="w-3 h-3" />
                <span>{formatNumber(post.views)}</span>
              </div>
            )}
            
            {post.reactions && (
              <div className="flex items-center space-x-1">
                <Heart className="w-3 h-3" />
                <span>{formatNumber(post.reactions)}</span>
              </div>
            )}

            {post.comments && (
              <div className="flex items-center space-x-1">
                <MessageCircle className="w-3 h-3" />
                <span>{formatNumber(post.comments)}</span>
              </div>
            )}

            {post.album_id && (
              <div className="flex items-center space-x-1">
                <Grid3X3 className="w-3 h-3" />
                <span>Альбом</span>
              </div>
            )}
          </div>
        </div>

        {/* Правая часть - медиа превью и кнопка выбора */}
        <div className="flex-shrink-0 flex items-center space-x-2">
          {/* Медиа превью */}
          {/* {post.media_type && post.media_url && (
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
              <MediaRenderer 
                post={post} 
                compact={true}
                allPosts={allPosts}
              />
            </div>
          )} */}

          {/* Кнопка выбора */}
          {showSelection && (
            <button
              onClick={handleSelect}
              className={`p-2 rounded-lg transition-all duration-200 transform ${
                isSelected
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 shadow-md scale-105'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-yellow-600 hover:scale-105'
              }`}
            >
              <Star className={`w-4 h-4 transition-all duration-200 ${
                isSelected 
                  ? 'fill-yellow-500 text-yellow-600 drop-shadow-sm' 
                  : 'hover:fill-yellow-200'
              }`} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Остальные режимы - вертикальная компоновка
  return (
    <div className={getCardClasses()}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <Hash className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white text-sm">
              {post.channel_title || post.channel_name}
            </p>
            {post.channel_username && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                @{post.channel_username}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Индикатор альбома */}
          {post.album_id && (
            <div className="flex items-center space-x-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md">
              <Grid3X3 className="w-3 h-3 text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">
                {post.album_position || 1}/{post.album_total || 1}
              </span>
            </div>
          )}

          {/* Кнопка выбора */}
          {showSelection && (
            <button
              onClick={handleSelect}
              className={`p-2 rounded-lg transition-all duration-200 transform ${
                isSelected
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 shadow-md scale-105'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-yellow-600 hover:scale-105'
              }`}
            >
              <Star className={`w-4 h-4 transition-all duration-200 ${
                isSelected 
                  ? 'fill-yellow-500 text-yellow-600 drop-shadow-sm' 
                  : 'hover:fill-yellow-200'
              }`} />
            </button>
          )}
        </div>
      </div>

      {/* Media - показываем только если не режим списка */}
      {shouldShowMedia && (
        <div className="mb-3">
          <MediaRenderer 
            post={post} 
            compact={viewMode === 'compact' || viewMode === 'grid'}
            allPosts={allPosts}
          />
        </div>
      )}

      {/* Content */}
      {truncatedText && (
        <div className="mb-3">
          <p className={`text-gray-700 dark:text-gray-300 leading-relaxed ${
            viewMode === 'telegram' ? 'text-base' : 'text-sm'
          }`}>
            {truncatedText}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-4">
          {post.views && (
            <div className="flex items-center space-x-1">
              <Eye className="w-3 h-3" />
              <span>{formatNumber(post.views)}</span>
            </div>
          )}
          
          {post.reactions && (
            <div className="flex items-center space-x-1">
              <Heart className="w-3 h-3" />
              <span>{formatNumber(post.reactions)}</span>
            </div>
          )}

          {post.comments && (
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-3 h-3" />
              <span>{formatNumber(post.comments)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(post.date || post.post_date || '')}</span>
        </div>
      </div>
    </div>
  );
}; 