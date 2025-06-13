import React, { useState } from 'react';
import { Star, Trash2, RefreshCw, AlertCircle, Edit3, Loader2, Calendar, Eye, MessageCircle, Heart, Grid3X3 } from 'lucide-react';
import { useSelectedPosts } from '../../../contexts/SelectedPostsContext';
import { useAuth } from '../../../hooks/useAuth';
import { formatDate, formatNumber, stripHtml, truncateText } from '../../../utils';
import MediaRenderer from '../../../components/MediaRenderer';
import { PostEditPage } from './PostEditPage';
import type { SelectedPost } from '../../../types';

export const SelectedPostsPage: React.FC = () => {
  const { authStatus } = useAuth();
  const { 
    selectedPosts, 
    loading, 
    error, 
    loadSelectedPosts, 
    removeSelectedPost, 
    updateSelectedPost,
    setError 
  } = useSelectedPosts();
  
  const [editingPost, setEditingPost] = useState<SelectedPost | null>(null);
  const [editedText, setEditedText] = useState('');
  const [editingPostId, setEditingPostId] = useState<number | null>(null);

  const handleEdit = (post: SelectedPost) => {
    setEditingPost(post);
    setEditedText(post.edited_text || post.original_text);
  };

  const handleAdvancedEdit = (post: SelectedPost) => {
    setEditingPostId(post.id);
  };

  const handleSaveAdvancedEdit = async (editedText: string, notes?: string) => {
    if (!editingPostId) return;
    
    try {
      await updateSelectedPost(editingPostId, { 
        edited_text: editedText,
        notes: notes 
      });
      setEditingPostId(null);
    } catch (error) {
      // Ошибка уже обработана в хуке
    }
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;
    
    try {
      await updateSelectedPost(editingPost.id, { edited_text: editedText });
      setEditingPost(null);
      setEditedText('');
    } catch (error) {
      // Ошибка уже обработана в хуке
    }
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setEditedText('');
  };

  const handleRemove = async (id: number) => {
    if (!confirm('Удалить этот пост из отобранных?')) return;
    
    try {
      await removeSelectedPost(id);
    } catch (error) {
      // Ошибка уже обработана в хуке
    }
  };

  if (!authStatus.authorized) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Star className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Требуется авторизация
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Авторизуйтесь в Telegram для просмотра отобранных постов
        </p>
      </div>
    );
  }

  // Показать страницу редактирования, если выбран пост
  if (editingPostId) {
    const postToEdit = selectedPosts.find(post => post.id === editingPostId);
    if (postToEdit) {
      return (
        <PostEditPage
          selectedPost={postToEdit}
          onBack={() => setEditingPostId(null)}
          onSave={handleSaveAdvancedEdit}
        />
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">
            Отобранные посты
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Управляйте выбранным контентом ({selectedPosts.length})
          </p>
        </div>
        
        <button
          onClick={loadSelectedPosts}
          disabled={loading}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-600 font-medium">Ошибка</p>
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            ×
          </button>
        </div>
      )}

      {/* Selected Posts List */}
      {selectedPosts.length === 0 && !loading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Нет отобранных постов
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Выберите посты в ленте для добавления в избранное
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {selectedPosts.map((selectedPost) => {
            const post = selectedPost.post;
            const displayText = selectedPost.edited_text || selectedPost.original_text;
            const isEditing = editingPost?.id === selectedPost.id;
            
            return (
              <div key={selectedPost.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                      <Star className="w-5 h-5 text-purple-600 fill-current" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {post?.channel_title || post?.channel_name || 'Неизвестный канал'}
                      </h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>Отобрано: {formatDate(selectedPost.selected_at)}</span>
                        {post?.album_id && (
                          <div className="flex items-center space-x-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md">
                            <Grid3X3 className="w-3 h-3 text-blue-600" />
                            <span className="text-xs text-blue-600 font-medium">
                              Альбом {post.album_position || 1}/{post.album_total || 1}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAdvancedEdit(selectedPost)}
                      disabled={loading}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Расширенное редактирование"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemove(selectedPost.id)}
                      disabled={loading}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                {isEditing ? (
                  <div className="space-y-4">
                    <textarea
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-h-32"
                      placeholder="Редактировать текст..."
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
                      >
                        Отмена
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        {loading ? 'Сохранение...' : 'Сохранить'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Media */}
                    {post?.media_type && post?.media_url && (
                      <div className="mb-4">
                        <MediaRenderer 
                          post={post} 
                          compact={false}
                          allPosts={selectedPosts.map(sp => sp.post).filter(Boolean)}
                        />
                      </div>
                    )}

                    {displayText && (
                      <div className="mb-4">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                          {displayText}
                        </p>
                        {selectedPost.edited_text && (
                          <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                            ✏️ Текст отредактирован
                          </div>
                        )}
                      </div>
                    )}

                    {/* Original post stats */}
                    {post && (
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex items-center space-x-4">
                          {post.views && (
                            <div className="flex items-center space-x-1">
                              <Eye className="w-4 h-4" />
                              <span>{formatNumber(post.views)}</span>
                            </div>
                          )}
                          
                          {post.reactions && (
                            <div className="flex items-center space-x-1">
                              <Heart className="w-4 h-4" />
                              <span>{formatNumber(post.reactions)}</span>
                            </div>
                          )}

                          {post.comments && (
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="w-4 h-4" />
                              <span>{formatNumber(post.comments)}</span>
                            </div>
                          )}
                        </div>

                        {post.date && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(post.date)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Status */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedPost.status === 'published' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                        : selectedPost.status === 'scheduled'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600'
                    }`}>
                      {selectedPost.status === 'published' ? 'Опубликовано' :
                       selectedPost.status === 'scheduled' ? 'Запланировано' : 'Черновик'}
                    </span>
                  </div>

                  {selectedPost.notes && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      📝 Есть заметки
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Loading indicator */}
      {loading && selectedPosts.length === 0 && (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Загрузка отобранных постов...</p>
        </div>
      )}
    </div>
  );
}; 