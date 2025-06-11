import React, { useState, useEffect } from 'react';
import { Play, Download, FileText, Music, Mic, ChevronLeft, ChevronRight, Grid3X3 } from 'lucide-react';

interface Props { 
  post: any;
  compact?: boolean; // Для компактного отображения в карточках постов
  allPosts?: any[]; // Все посты для группировки альбомов
}

// Компонент для отображения альбома
interface AlbumRendererProps {
  albumPosts: any[];
  compact?: boolean;
}

const AlbumRenderer: React.FC<AlbumRendererProps> = ({ albumPosts, compact = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');
  
  const sortedPosts = albumPosts.sort((a, b) => (a.album_position || 0) - (b.album_position || 0));
  
  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % sortedPosts.length);
  };
  
  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + sortedPosts.length) % sortedPosts.length);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${kb.toFixed(1)} KB`;
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMediaUrl = (post: any) => {
    if (!post.media_url || !post.channel_id) return '';
    const filename = post.media_url.split('/').pop();
    return `http://localhost:8000/media/${post.channel_id}/${filename}`;
  };

  const renderSingleMedia = (post: any, index?: number) => {
    const mediaUrl = getMediaUrl(post);
    const maxHeight = compact ? 'max-h-48' : 'max-h-96';

    return (
      <div key={index} className="relative">
        {post.media_type === 'photo' && (
          <img
            src={mediaUrl}
            alt={`Album item ${index ? index + 1 : ''}`}
            className={`w-full ${maxHeight} object-cover`}
            style={{ maxWidth: post.media_width ? `${post.media_width}px` : '100%' }}
            onError={(e) => {
              console.error('Failed to load image:', mediaUrl);
              e.currentTarget.style.display = 'none';
            }}
          />
        )}

        {post.media_type === 'video' && (
          <video
            controls
            className={`w-full ${maxHeight}`}
            style={{ maxWidth: post.media_width ? `${post.media_width}px` : '100%' }}
          >
            <source src={mediaUrl} type="video/mp4" />
            Ваш браузер не поддерживает видео.
          </video>
        )}

        {post.media_type === 'animation' && (
          <img
            src={mediaUrl}
            alt="GIF animation"
            className={`w-full ${maxHeight} object-cover`}
          />
        )}

        {/* Overlay с info */}
        {!compact && (
          <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg">
            {post.media_width && post.media_height && `${post.media_width}×${post.media_height}`}
            {post.media_size && ` • ${formatFileSize(post.media_size)}`}
            {post.media_duration && ` • ${formatDuration(post.media_duration)}`}
          </div>
        )}
      </div>
    );
  };

  if (viewMode === 'grid' && !compact) {
    return (
      <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Grid3X3 className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Альбом ({sortedPosts.length} {sortedPosts.length === 1 ? 'элемент' : sortedPosts.length < 5 ? 'элемента' : 'элементов'})
            </span>
          </div>
          <button
            onClick={() => setViewMode('carousel')}
            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
          >
            Карусель
          </button>
        </div>
        
        {/* Grid */}
        <div className={`grid ${sortedPosts.length === 1 ? 'grid-cols-1' : sortedPosts.length === 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-1`}>
          {sortedPosts.slice(0, 9).map((post, index) => (
            <div key={post.id} className="aspect-square">
              {renderSingleMedia(post, index)}
            </div>
          ))}
          {sortedPosts.length > 9 && (
            <div className="aspect-square bg-black/20 flex items-center justify-center text-white font-semibold">
              +{sortedPosts.length - 9}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Carousel mode
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Header */}
      {!compact && (
        <div className="album-header px-3 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Grid3X3 className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Альбом
              </span>
            </div>
            <div className="album-counter">
              {currentIndex + 1} из {sortedPosts.length}
            </div>
          </div>
          <button
            onClick={() => setViewMode('grid')}
            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            Сетка
          </button>
        </div>
      )}
      
      {/* Carousel */}
      <div className="relative">
        {renderSingleMedia(sortedPosts[currentIndex])}
        
        {/* Navigation */}
        {sortedPosts.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="album-nav-button absolute top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 rounded-full transition-colors touch-optimized"
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={nextSlide}
              className="album-nav-button absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 rounded-full transition-colors touch-optimized"
            >
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </>
        )}
        
        {/* Position indicator for compact mode */}
        {sortedPosts.length > 1 && compact && (
          <div className="album-position-indicator absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
            <Grid3X3 className="w-3 h-3" />
            <span className="font-medium">{currentIndex + 1}/{sortedPosts.length}</span>
          </div>
        )}
        
        {/* Dots indicator */}
        {sortedPosts.length > 1 && !compact && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 album-dots-container">
            <div className="flex space-x-1">
              {sortedPosts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`album-dot w-2 h-2 rounded-full transition-colors touch-optimized ${
                    index === currentIndex ? 'album-dot active' : 'album-dot inactive'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Progress bar for mobile */}
        {sortedPosts.length > 1 && compact && (
          <div className="absolute bottom-2 left-2 right-2">
            <div className="album-progress-track h-1">
              <div 
                className="album-progress-bar h-full"
                style={{ width: `${((currentIndex + 1) / sortedPosts.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function MediaRenderer({ post, compact = false, allPosts = [] }: Props) {
  // Если у поста есть album_id, попробуем найти все элементы альбома
  const albumPosts = post.album_id && allPosts.length > 0
    ? allPosts.filter(p => p.album_id === post.album_id && p.media_type && p.media_url)
    : [];

  // Если это альбом и мы нашли другие элементы, показываем весь альбом
  if (albumPosts.length > 1) {
    return <AlbumRenderer albumPosts={albumPosts} compact={compact} />;
  }

  // Иначе показываем одиночное медиа
  if (!post.media_type || !post.media_url) {
    return null;
  }

  const { media_type, media_url, media_width, media_height, media_duration, media_filename, media_size, channel_id } = post;
  
  // Функция для форматирования размера файла
  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${kb.toFixed(1)} KB`;
  };

  // Функция для форматирования длительности
  const formatDuration = (seconds: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Получаем правильный URL для медиа файла
  const getMediaUrl = () => {
    if (!media_url || !channel_id) return '';
    
    // Извлекаем имя файла из URL
    const filename = media_url.split('/').pop();
    
    // Возвращаем URL через эндпоинт сервера
    return `http://localhost:8000/media/${channel_id}/${filename}`;
  };

  const mediaUrl = getMediaUrl();
  const maxHeight = compact ? 'max-h-48' : 'max-h-96';

  return (
    <div className={`rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 ${compact ? '' : 'mt-3'}`}>
      {media_type === 'photo' && (
        <div className="relative">
          <img
            src={mediaUrl}
            alt="Post media"
            className={`w-full ${maxHeight} object-cover`}
            style={{ maxWidth: media_width ? `${media_width}px` : '100%' }}
            onError={(e) => {
              console.error('Failed to load image:', mediaUrl);
              e.currentTarget.style.display = 'none';
              // Показываем placeholder
              const placeholder = document.createElement('div');
              placeholder.className = `w-full ${maxHeight} bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500`;
              placeholder.innerHTML = '<div class="text-center"><div class="text-2xl mb-2">📷</div><div class="text-sm">Изображение недоступно</div></div>';
              e.currentTarget.parentNode?.appendChild(placeholder);
            }}
          />
          {!compact && (
            <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg">
              {media_width && media_height && `${media_width}×${media_height}`}
              {media_size && ` • ${formatFileSize(media_size)}`}
            </div>
          )}
        </div>
      )}

      {media_type === 'video' && (
        <div className="relative">
          <video
            controls
            className={`w-full ${maxHeight}`}
            style={{ maxWidth: media_width ? `${media_width}px` : '100%' }}
          >
            <source src={mediaUrl} type="video/mp4" />
            Ваш браузер не поддерживает видео.
          </video>
          {!compact && (
            <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
              <Play className="w-3 h-3" />
              {media_duration && formatDuration(media_duration)}
              {media_width && media_height && ` • ${media_width}×${media_height}`}
              {media_size && ` • ${formatFileSize(media_size)}`}
            </div>
          )}
        </div>
      )}

      {media_type === 'animation' && (
        <div className="relative">
          <img
            src={mediaUrl}
            alt="GIF animation"
            className={`w-full ${maxHeight} object-cover`}
          />
          <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg">
            GIF
          </div>
        </div>
      )}

      {media_type === 'voice' && (
        <div className="bg-blue-50 dark:bg-gray-700 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <audio controls className="w-full">
                <source src={mediaUrl} type="audio/ogg" />
                Ваш браузер не поддерживает аудио.
              </audio>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Голосовое сообщение {media_duration && `• ${formatDuration(media_duration)}`}
                {media_size && ` • ${formatFileSize(media_size)}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {media_type === 'audio' && (
        <div className="bg-blue-50 dark:bg-gray-700 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <audio controls className="w-full">
                <source src={mediaUrl} />
                Ваш браузер не поддерживает аудио.
              </audio>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {media_filename} {media_duration && `• ${formatDuration(media_duration)}`}
                {media_size && ` • ${formatFileSize(media_size)}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {media_type === 'document' && (
        <div className="bg-blue-50 dark:bg-gray-700 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <a
                href={mediaUrl}
                download={media_filename}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium truncate block"
                title={media_filename}
              >
                {media_filename}
              </a>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Документ {media_size && `• ${formatFileSize(media_size)}`}
              </p>
            </div>
            <button className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-gray-600 transition-colors">
              <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </button>
          </div>
        </div>
      )}

      {media_type === 'sticker' && (
        <div className="flex justify-center bg-blue-50 dark:bg-gray-700 p-4">
          <img
            src={mediaUrl}
            alt="Sticker"
            className="max-w-32 max-h-32"
          />
        </div>
      )}
    </div>
  );
}