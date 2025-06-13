import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { SelectedPost } from '../types';

interface SelectedPostsContextType {
  selectedPosts: SelectedPost[];
  setSelectedPosts: React.Dispatch<React.SetStateAction<SelectedPost[]>>;
  addSelectedPost: (post: SelectedPost) => void;
  removeSelectedPost: (postId: number) => void;
  updateSelectedPost: (postId: number, updates: Partial<SelectedPost>) => void;
  getSelectedPostsCount: () => number;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  loadSelectedPosts: () => Promise<void>;
}

const SelectedPostsContext = createContext<SelectedPostsContextType | undefined>(undefined);

interface SelectedPostsProviderProps {
  children: ReactNode;
}

export const SelectedPostsProvider: React.FC<SelectedPostsProviderProps> = ({ children }) => {
  const [selectedPosts, setSelectedPosts] = useState<SelectedPost[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSelectedPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/selected-posts');
      if (response.ok) {
        const data = await response.json();
        setSelectedPosts(data.selected_posts || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки отобранных постов:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSelectedPost = (post: SelectedPost) => {
    setSelectedPosts(prev => {
      const exists = prev.find(p => p.id === post.id);
      if (exists) return prev;
      return [...prev, post];
    });
  };

  const removeSelectedPost = (postId: number) => {
    setSelectedPosts(prev => prev.filter(post => post.id !== postId));
  };

  const updateSelectedPost = (postId: number, updates: Partial<SelectedPost>) => {
    setSelectedPosts(prev => prev.map(post => 
      post.id === postId ? { ...post, ...updates } : post
    ));
  };

  const getSelectedPostsCount = () => selectedPosts.length;

  useEffect(() => {
    loadSelectedPosts();
  }, []);

  const value: SelectedPostsContextType = {
    selectedPosts,
    setSelectedPosts,
    addSelectedPost,
    removeSelectedPost,
    updateSelectedPost,
    getSelectedPostsCount,
    loading,
    setLoading,
    loadSelectedPosts,
  };

  return (
    <SelectedPostsContext.Provider value={value}>
      {children}
    </SelectedPostsContext.Provider>
  );
};

export const useSelectedPosts = (): SelectedPostsContextType => {
  const context = useContext(SelectedPostsContext);
  if (context === undefined) {
    throw new Error('useSelectedPosts must be used within a SelectedPostsProvider');
  }
  return context;
}; 