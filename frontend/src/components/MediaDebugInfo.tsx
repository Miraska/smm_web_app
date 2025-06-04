import React, { useState } from 'react';
import { Bug, ExternalLink, AlertTriangle } from 'lucide-react';

interface Props {
  post: any;
}

export default function MediaDebugInfo({ post }: Props) {
  const [showDebug, setShowDebug] = useState(false);

  if (!post.media_type || !post.media_url) {
    return null;
  }

  const { media_type, media_url, channel_id, message_id, media_filename } = post;
  
  // Формируем URL для медиа файла
  const getMediaUrl = () => {
    if (!media_url || !channel_id) return '';
    const filename = media_url.split('/').pop();
    return `http://localhost:8000/media/${channel_id}/${filename}`;
  };

  const mediaUrl = getMediaUrl();
  
  // Проверяем доступность файла
  const checkMediaAvailability = async () => {
    try {
      const response = await fetch(mediaUrl, { method: 'HEAD' });
      return {
        available: response.ok,
        status: response.status,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length')
      };
    } catch (error) {
      return {
        available: false,
        error: error.message
      };
    }
  };

  const [fileInfo, setFileInfo] = useState<any>(null);

  const handleCheck = async () => {
    const info = await checkMediaAvailability();
    setFileInfo(info);
  };

  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        className="inline-flex items-center gap-1 text-xs text-tg-gray-500 hover:text-tg-blue-500 transition-colors"
      >
        <Bug className="w-3 h-3" />
        Debug Media
      </button>
    );
  }

  return (
    <div className="mt-2 p-3 bg-tg-gray-50 dark:bg-tg-dark-700 rounded-lg border border-tg-gray-200 dark:border-tg-dark-600">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1 text-xs font-medium text-tg-gray-700 dark:text-tg-gray-300">
          <AlertTriangle className="w-3 h-3" />
          Media Debug Info
        </div>
        <button
          onClick={() => setShowDebug(false)}
          className="text-xs text-tg-gray-500 hover:text-tg-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-1 text-xs text-tg-gray-600 dark:text-tg-gray-400">
        <div><strong>Type:</strong> {media_type}</div>
        <div><strong>Channel ID:</strong> {channel_id}</div>
        <div><strong>Message ID:</strong> {message_id}</div>
        <div><strong>Original URL:</strong> {media_url}</div>
        <div><strong>Server URL:</strong> {mediaUrl}</div>
        {media_filename && <div><strong>Filename:</strong> {media_filename}</div>}
      </div>

      <div className="mt-2 flex gap-2">
        <button
          onClick={handleCheck}
          className="px-2 py-1 text-xs bg-tg-blue-500 text-white rounded hover:bg-tg-blue-600 transition-colors"
        >
          Check File
        </button>
        <a
          href={mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-tg-gray-200 dark:bg-tg-dark-600 text-tg-gray-700 dark:text-tg-gray-300 rounded hover:bg-tg-gray-300 dark:hover:bg-tg-dark-500 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Open Direct
        </a>
      </div>

      {fileInfo && (
        <div className="mt-2 p-2 bg-tg-gray-100 dark:bg-tg-dark-600 rounded text-xs">
          <div><strong>Available:</strong> {fileInfo.available ? '✅ Yes' : '❌ No'}</div>
          {fileInfo.status && <div><strong>Status:</strong> {fileInfo.status}</div>}
          {fileInfo.contentType && <div><strong>Content-Type:</strong> {fileInfo.contentType}</div>}
          {fileInfo.contentLength && <div><strong>Size:</strong> {fileInfo.contentLength} bytes</div>}
          {fileInfo.error && <div className="text-tg-red"><strong>Error:</strong> {fileInfo.error}</div>}
        </div>
      )}
    </div>
  );
} 