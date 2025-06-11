import React from 'react';
import { Images, Video, Music, FileText } from 'lucide-react';
import MediaRenderer from './MediaRenderer';

interface Props { 
  posts: any[];
  compact?: boolean;
}

export default function AlbumRenderer({ posts, compact = false }: Props) {
  if (!posts.length) return null;

  const albumPosts = posts.filter(p => p.album_id).sort((a, b) => a.album_position - b.album_position);
  
  if (albumPosts.length === 0) return null;

  const getAlbumIcon = () => {
    const types = albumPosts.map(p => p.media_type);
    if (types.includes('video')) return <Video className="w-4 h-4" />;
    if (types.includes('photo')) return <Images className="w-4 h-4" />;
    if (types.includes('audio') || types.includes('voice')) return <Music className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className={`${compact ? '' : 'mt-4'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-tg-blue-600 dark:text-tg-blue-400 font-medium">
          {getAlbumIcon()}
          <span>Альбом</span>
          <div className="flex items-center space-x-1 bg-tg-blue-100 dark:bg-tg-blue-900/30 px-2 py-1 rounded-full ml-2">
            <span className="text-xs font-medium text-tg-blue-700 dark:text-tg-blue-300">
              {albumPosts.length} элемент{albumPosts.length === 1 ? '' : albumPosts.length < 5 ? 'а' : 'ов'}
            </span>
          </div>
        </div>
        {!compact && albumPosts.length > 4 && (
          <div className="text-xs text-tg-gray-500 dark:text-tg-gray-400">
            Показано {Math.min(4, albumPosts.length)} из {albumPosts.length}
          </div>
        )}
      </div>
      
      <div className={`grid gap-2 ${
        albumPosts.length === 1 ? 'grid-cols-1' :
        albumPosts.length === 2 ? 'grid-cols-2' :
        albumPosts.length === 3 ? 'grid-cols-3' :
        albumPosts.length === 4 ? 'grid-cols-2' :
        'grid-cols-3'
      }`}>
        {albumPosts.slice(0, compact ? 4 : albumPosts.length).map((post, index) => (
          <div key={post.id} className="album-grid-item relative group">
            <MediaRenderer post={post} compact={true} />
            
            {/* Album position indicator */}
            <div className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-tg-blue-600/90 backdrop-blur-sm text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg flex items-center space-x-1">
              <span className="font-medium">{index + 1}</span>
              <span className="hidden sm:inline text-tg-blue-200">/</span>
              <span className="hidden sm:inline font-medium">{albumPosts.length}</span>
            </div>
            
            {/* Progress indicator for mobile */}
            <div className="absolute bottom-1 left-1 right-1 sm:hidden">
              <div className="bg-black/20 backdrop-blur-sm rounded-full h-0.5 overflow-hidden">
                <div 
                  className="bg-tg-blue-400 h-full transition-all duration-300"
                  style={{ width: `${((index + 1) / albumPosts.length) * 100}%` }}
                />
              </div>
            </div>
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-tg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none"></div>
          </div>
        ))}
        
        {/* Show more indicator */}
        {compact && albumPosts.length > 4 && (
          <div className="relative group cursor-pointer">
            <div className="aspect-square bg-tg-blue-50 dark:bg-tg-dark-700 rounded-xl flex items-center justify-center border-2 border-dashed border-tg-blue-200 dark:border-tg-dark-600 hover:border-tg-blue-400 dark:hover:border-tg-blue-500 transition-colors">
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-tg-blue-500 mb-0.5 sm:mb-1">
                  +{albumPosts.length - 4}
                </div>
                <div className="text-xs text-tg-blue-600 dark:text-tg-blue-400">
                  ещё
                </div>
              </div>
            </div>
            {/* Tooltip */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              Показать все {albumPosts.length} элементов
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 