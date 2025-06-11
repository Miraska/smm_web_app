import { useState, useCallback } from 'react';
import { postsApi } from '../services/api';
import { getErrorMessage } from '../utils';
import type { Post } from '../types';

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);

  const loadPosts = useCallback(async (reset: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentOffset = reset ? 0 : offset;
      
      const response = await postsApi.getPaginated({
        offset: currentOffset,
        limit: 10,
      });

      if (reset) {
        setPosts(response.posts);
        setOffset(response.posts.length);
      } else {
        setPosts(prev => [...prev, ...response.posts]);
        setOffset(prev => prev + response.posts.length);
      }
      
      setHasMore(response.has_more);
      setTotal(response.total);
      
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [offset]);

  const loadMorePosts = useCallback(async () => {
    // Проверяем состояние перед загрузкой
    if (loading || !hasMore) return;
    await loadPosts(false);
  }, [loadPosts, loading, hasMore]);

  const refreshPosts = useCallback(async () => {
    setOffset(0);
    await loadPosts(true);
  }, [loadPosts]);

  const checkNewPosts = useCallback(async () => {
    try {
      setError(null);
      const response = await postsApi.checkNew();
      
      if (response.new_posts > 0) {
        // Если найдены новые посты, обновляем ленту
        await refreshPosts();
      }
      
      return response;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      throw error;
    }
  }, [refreshPosts]);

  const selectPost = useCallback(async (post: Post) => {
    try {
      const response = await postsApi.select(post);
      console.log('✅ Пост добавлен в избранное:', response.message);
      return response;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      console.error('❌ Ошибка при добавлении в избранное:', errorMessage);
      throw error;
    }
  }, []);

  const parseMorePosts = useCallback(async (limit: number = 5) => {
    try {
      setError(null);
      const response = await postsApi.parseMore(limit);
      
      if (response.new_posts > 0) {
        // Если найдены новые посты, загружаем их без сброса скролла
        // Загружаем посты с текущего offset (добавляем в конец)
        try {
          setLoading(true);
          const newPostsResponse = await postsApi.getPaginated({
            offset: offset,
            limit: response.new_posts + 5, // Загружаем чуть больше для надежности
          });

          // Добавляем новые посты в конец списка
          setPosts(prev => [...prev, ...newPostsResponse.posts]);
          setOffset(prev => prev + newPostsResponse.posts.length);
          setHasMore(newPostsResponse.has_more);
          setTotal(newPostsResponse.total);
        } catch (loadError) {
          // Если не удалось загрузить новые посты, делаем полный refresh
          console.warn('Не удалось загрузить новые посты, обновляем ленту полностью');
          await refreshPosts();
        } finally {
          setLoading(false);
        }
      }
      
      return response;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      throw error;
    }
  }, [offset, refreshPosts]);

  return {
    posts,
    loading,
    error,
    hasMore,
    total,
    loadPosts,
    loadMorePosts,
    refreshPosts,
    checkNewPosts,
    selectPost,
    parseMorePosts,
    setError,
  };
}; 