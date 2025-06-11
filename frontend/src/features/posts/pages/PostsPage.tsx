import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Grid3X3, List, LayoutList, RefreshCw, AlertCircle, Loader2, FileText, CheckCircle, Zap, Download } from 'lucide-react';
import { usePosts } from '../../../hooks/usePosts';
import { useAuth } from '../../../hooks/useAuth';
import { useSelectedPosts } from '../../../hooks/useSelectedPosts';
import { PostCard } from '../components/PostCard';
import type { ViewMode } from '../../../types';

export const PostsPage: React.FC = () => {
  const { authStatus } = useAuth();
  const { 
    posts, 
    loading, 
    error, 
    hasMore, 
    total,
    loadPosts, 
    loadMorePosts,
    selectPost, 
    refreshPosts, 
    checkNewPosts,
    parseMorePosts,
    setError 
  } = usePosts();
  const { selectedPosts, loadSelectedPosts, addSelectedPost, removeSelectedPostLocal, isPostSelected: isPostSelectedHook } = useSelectedPosts();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [checkingNew, setCheckingNew] = useState(false);
  const [parsingMore, setParsingMore] = useState(false);
  const initialLoadDone = useRef(false);
  const checkNewDone = useRef(false);

  // Автоматическая загрузка постов только при первом монтировании
  useEffect(() => {
    if (authStatus.authorized && !initialLoadDone.current) {
      initialLoadDone.current = true;
      loadPosts(true);
    }
  }, [authStatus.authorized, loadPosts]);

  const handleCheckNew = useCallback(async (showNotification: boolean = true) => {
    // Предотвращаем множественные вызовы
    if (checkingNew) return;
    
    try {
      setCheckingNew(true);
      const response = await checkNewPosts();
      
      if (showNotification) {
        if (response.new_posts > 0) {
          setSuccessMessage(`Найдено ${response.new_posts} новых постов! Лента обновлена.`);
        } else {
          setSuccessMessage('Новых постов не найдено');
        }
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error) {
      // Ошибка уже обработана в хуке
    } finally {
      setCheckingNew(false);
    }
  }, [checkingNew, checkNewPosts, setSuccessMessage]);

  // Автоматическая проверка новых постов только один раз после загрузки
  useEffect(() => {
    if (authStatus.authorized && posts.length > 0 && !checkNewDone.current && initialLoadDone.current) {
      checkNewDone.current = true;
      handleCheckNew(false); // Тихая проверка без уведомлений
    }
  }, [authStatus.authorized, posts.length, handleCheckNew]);

  const isPostSelected = (post: any) => {
    return isPostSelectedHook(post.id);
  };

  const handleSelectPost = async (post: any) => {
    const isCurrentlySelected = isPostSelected(post);
    
    try {
      if (isCurrentlySelected) {
        // Если пост уже выбран, удаляем его из отобранных
        removeSelectedPostLocal(post.id);
        setSuccessMessage('Пост удален из отобранных');
      } else {
        // Оптимистичное обновление - добавляем пост локально сразу
        const optimisticSelectedPost = {
          id: Date.now(), // Временный ID
          post_id: post.id,
          post: post,
          original_text: post.text || '',
          edited_text: post.text || '',
          selected_at: new Date().toISOString(),
          status: 'draft' as const,
          notes: ''
        };
        addSelectedPost(optimisticSelectedPost);
      }
      
      const response = await selectPost(post);
      setSuccessMessage(response.message);
      
      // Если оптимистичное обновление было неточным, можем подкорректировать
      // await loadSelectedPosts(); // Закомментируем для лучшей производительности
      
      // Автоматически скрываем уведомление через 3 секунды
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      // В случае ошибки возвращаем исходное состояние
      await loadSelectedPosts();
      // Ошибка уже обработана в хуке
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadMorePosts();
    }
  };

  const handleParseMore = useCallback(async () => {
    if (parsingMore) return;
    
    // Сохраняем текущую позицию скролла
    const scrollPosition = window.scrollY;
    
    try {
      setParsingMore(true);
      const response = await parseMorePosts(5);
      
      if (response.new_posts > 0) {
        setSuccessMessage(`Найдено ${response.new_posts} новых постов! Добавлены в конец ленты.`);
        
        // Восстанавливаем позицию скролла после небольшой задержки
        setTimeout(() => {
          window.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          });
        }, 100);
      } else {
        setSuccessMessage('Новых постов не найдено');
      }
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      // Ошибка уже обработана в хуке
    } finally {
      setParsingMore(false);
    }
  }, [parsingMore, parseMorePosts, setSuccessMessage]);

  const getViewModeIcon = (mode: ViewMode) => {
    switch (mode) {
      case 'grid': return Grid3X3;
      case 'list': return List;
      // case 'compact': return LayoutList;
      case 'telegram': return FileText;
      default: return Grid3X3;
    }
  };

  const getGridClasses = () => {
    switch (viewMode) {
      case 'list':
        return 'grid grid-cols-1 gap-4';
      // case 'compact':
        // return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3';
      case 'telegram':
        return 'grid grid-cols-1 gap-6';
      default: // grid
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';
    }
  };

  if (!authStatus.authorized) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Требуется авторизация
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Авторизуйтесь в Telegram для просмотра постов
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">
            Посты {total > 0 && `(${total})`}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Просматривайте и выбирайте контент для публикации
          </p>
        </div>
        
        <div className="flex items-end gap-2 flex-col">
          {/* View Mode Selector */}
          <div className="flex items-center space-x-2">
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {(['grid', 'list', 'telegram'] as ViewMode[]).map((mode) => {
                const Icon = getViewModeIcon(mode);
                return (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === mode
                        ? 'bg-white dark:bg-gray-800 text-orange-600 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>

            <button
              onClick={refreshPosts}
              disabled={loading}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Check New Posts Button */}
          <button
            onClick={() => handleCheckNew(true)}
            disabled={checkingNew || loading}
            className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 ${checkingNew ? 'animate-pulse' : ''}`} />
            <span className="font-medium">
              {checkingNew ? 'Проверяем...' : 'Проверить'}
            </span>
          </button>
        </div>
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

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-600 font-medium">{successMessage}</p>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="ml-auto text-green-400 hover:text-green-600"
          >
            ×
          </button>
        </div>
      )}

      {/* Posts Grid */}
      {posts.length === 0 && !loading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Нет постов
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Добавьте источники и запустите парсинг для получения постов
          </p>
          <button
            onClick={handleParseMore}
            disabled={parsingMore}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
          >
            {parsingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Парсим...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Спарсить посты</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <>
          <div className={getGridClasses()}>
            {posts.map((post) => (
              <PostCard
                key={`${post.id}-${post.channel_id}-${post.message_id}`}
                post={post}
                onSelect={handleSelectPost}
                viewMode={viewMode}
                showSelection={true}
                isSelected={isPostSelected(post)}
                allPosts={posts}
              />
            ))}
          </div>

          {/* Load More & Parse More */}
          <div className="text-center py-8 space-y-4">
            {hasMore ? (
              // Показываем "Загрузить еще" пока есть посты в БД для загрузки
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Загрузка из БД...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Загрузить ещё из БД</span>
                  </>
                )}
              </button>
            ) : (
              // Показываем "Спарсить еще" когда все посты из БД загружены
              <div className="space-y-2">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Все посты из базы данных загружены
                </p>
                <button
                  onClick={handleParseMore}
                  disabled={parsingMore || loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
                >
                  {parsingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Парсим новые...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Спарсить ещё 5 постов</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Loading indicator */}
          {loading && posts.length === 0 && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-orange-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Загрузка постов...</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}; 