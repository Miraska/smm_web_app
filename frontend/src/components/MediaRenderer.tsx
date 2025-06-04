import React from 'react';
import { Play, Download, FileText, Music, Mic, Image as ImageIcon } from 'lucide-react';

interface Props { 
  post: any;
  compact?: boolean; // Для компактного отображения в карточках постов
}

export default function MediaRenderer({ post, compact = false }: Props) {
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
    <div className={`rounded-xl overflow-hidden border border-tg-blue-100 dark:border-tg-dark-700 ${compact ? '' : 'mt-3'}`}>
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
              placeholder.className = `w-full ${maxHeight} bg-tg-gray-200 dark:bg-tg-dark-600 flex items-center justify-center text-tg-gray-500`;
              placeholder.innerHTML = '<div class="text-center"><div class="text-2xl mb-2">📷</div><div class="text-sm">Изображение недоступно</div></div>';
              e.currentTarget.parentNode?.appendChild(placeholder);
            }}
          />
          {!compact && (
            <div className="absolute bottom-2 right-2 bg-tg-blue-600/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg">
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
            <div className="absolute bottom-2 right-2 bg-tg-blue-600/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
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
          <div className="absolute top-2 left-2 bg-tg-blue-600/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg">
            GIF
          </div>
        </div>
      )}

      {media_type === 'voice' && (
        <div className="bg-tg-blue-50 dark:bg-tg-dark-700 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-tg-blue-500 rounded-full flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <audio controls className="w-full">
                <source src={mediaUrl} type="audio/ogg" />
                Ваш браузер не поддерживает аудио.
              </audio>
              <p className="text-xs text-tg-gray-600 dark:text-tg-gray-400 mt-1">
                Голосовое сообщение {media_duration && `• ${formatDuration(media_duration)}`}
                {media_size && ` • ${formatFileSize(media_size)}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {media_type === 'audio' && (
        <div className="bg-tg-blue-50 dark:bg-tg-dark-700 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-tg-purple-500 rounded-full flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <audio controls className="w-full">
                <source src={mediaUrl} />
                Ваш браузер не поддерживает аудио.
              </audio>
              <p className="text-xs text-tg-gray-600 dark:text-tg-gray-400 mt-1">
                {media_filename} {media_duration && `• ${formatDuration(media_duration)}`}
                {media_size && ` • ${formatFileSize(media_size)}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {media_type === 'document' && (
        <div className="bg-tg-blue-50 dark:bg-tg-dark-700 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-tg-gray-500 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <a
                href={mediaUrl}
                download={media_filename}
                className="text-tg-blue-600 hover:text-tg-blue-800 dark:text-tg-blue-400 dark:hover:text-tg-blue-300 font-medium truncate block"
                title={media_filename}
              >
                {media_filename}
              </a>
              <p className="text-xs text-tg-gray-600 dark:text-tg-gray-400">
                Документ {media_size && `• ${formatFileSize(media_size)}`}
              </p>
            </div>
            <button className="p-2 rounded-lg hover:bg-tg-blue-100 dark:hover:bg-tg-dark-600 transition-colors">
              <Download className="w-4 h-4 text-tg-blue-600 dark:text-tg-blue-400" />
            </button>
          </div>
        </div>
      )}

      {media_type === 'sticker' && (
        <div className="flex justify-center bg-tg-blue-50 dark:bg-tg-dark-700 p-4">
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