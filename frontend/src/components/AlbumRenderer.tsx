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
      <div className="flex items-center gap-2 text-sm text-tg-blue-600 dark:text-tg-blue-400 mb-3 font-medium">
        {getAlbumIcon()}
        <span>Альбом ({albumPosts.length} элементов)</span>
      </div>
      
      <div className={`grid gap-2 ${
        albumPosts.length === 1 ? 'grid-cols-1' :
        albumPosts.length === 2 ? 'grid-cols-2' :
        albumPosts.length === 3 ? 'grid-cols-3' :
        albumPosts.length === 4 ? 'grid-cols-2' :
        'grid-cols-3'
      }`}>
        {albumPosts.slice(0, compact ? 4 : albumPosts.length).map((post, index) => (
          <div key={post.id} className="relative group">
            <MediaRenderer post={post} compact={true} />
            
            {/* Album position indicator */}
            <div className="absolute top-2 right-2 bg-tg-blue-600/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg">
              {index + 1}/{albumPosts.length}
            </div>
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-tg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none"></div>
          </div>
        ))}
        
        {/* Show more indicator */}
        {compact && albumPosts.length > 4 && (
          <div className="relative">
            <div className="aspect-square bg-tg-blue-50 dark:bg-tg-dark-700 rounded-xl flex items-center justify-center border-2 border-dashed border-tg-blue-200 dark:border-tg-dark-600">
              <div className="text-center">
                <div className="text-2xl font-bold text-tg-blue-500 mb-1">
                  +{albumPosts.length - 4}
                </div>
                <div className="text-xs text-tg-blue-600 dark:text-tg-blue-400">
                  ещё
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 