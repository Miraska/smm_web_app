import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { selectedPostsApi } from '../services/api';
import { getErrorMessage } from '../utils';
import type { SelectedPost } from '../types';

interface SelectedPostsContextType {
  selectedPosts: SelectedPost[];
  loading: boolean;
  error: string | null;
  loadSelectedPosts: () => Promise<void>;
  removeSelectedPost: (id: number) => Promise<void>;
  updateSelectedPost: (id: number, data: Partial<SelectedPost>) => Promise<SelectedPost>;
  addSelectedPost: (selectedPost: SelectedPost) => void;
  removeSelectedPostLocal: (postId: number) => void;
  isPostSelected: (postId: number) => boolean;
  setError: (error: string | null) => void;
}

const SelectedPostsContext = createContext<SelectedPostsContextType | null>(null);

interface SelectedPostsProviderProps {
  children: ReactNode;
}

export const SelectedPostsProvider: React.FC<SelectedPostsProviderProps> = ({ children }) => {
  const [selectedPosts, setSelectedPosts] = useState<SelectedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSelectedPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await selectedPostsApi.getAll();
      setSelectedPosts(response);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const removeSelectedPost = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      await selectedPostsApi.remove(id);
      setSelectedPosts(prev => prev.filter(post => post.id !== id));
    } catch (error) {
      setError(getErrorMessage(error));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSelectedPost = useCallback(async (id: number, data: Partial<SelectedPost>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedPost = await selectedPostsApi.update(id, data);
      setSelectedPosts(prev => 
        prev.map(post => post.id === id ? updatedPost : post)
      );
      return updatedPost;
    } catch (error) {
      setError(getErrorMessage(error));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const addSelectedPost = useCallback((selectedPost: SelectedPost) => {
    setSelectedPosts(prev => [...prev, selectedPost]);
  }, []);

  const removeSelectedPostLocal = useCallback((postId: number) => {
    setSelectedPosts(prev => prev.filter(post => post.post_id !== postId));
  }, []);

  const isPostSelected = useCallback((postId: number) => {
    return selectedPosts.some(selected => selected.post_id === postId);
  }, [selectedPosts]);

  // Загружаем отобранные посты при монтировании
  useEffect(() => {
    loadSelectedPosts();
  }, [loadSelectedPosts]);

  const value: SelectedPostsContextType = {
    selectedPosts,
    loading,
    error,
    loadSelectedPosts,
    removeSelectedPost,
    updateSelectedPost,
    addSelectedPost,
    removeSelectedPostLocal,
    isPostSelected,
    setError,
  };

  return (
    <SelectedPostsContext.Provider value={value}>
      {children}
    </SelectedPostsContext.Provider>
  );
};

export const useSelectedPosts = (): SelectedPostsContextType => {
  const context = useContext(SelectedPostsContext);
  if (!context) {
    throw new Error('useSelectedPosts must be used within a SelectedPostsProvider');
  }
  return context;
}; 