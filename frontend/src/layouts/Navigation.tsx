import React from 'react';
import { Radio, FileText, Star, Settings } from 'lucide-react';
import { useSelectedPosts } from '../contexts/SelectedPostsContext';
import type { TabId } from '../types';

interface NavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs = [
  { 
    id: 'sources' as const, 
    name: 'Источники', 
    icon: Radio,
    color: 'text-tg-green',
    bgColor: 'bg-green-50 dark:bg-green-900/20'
  },
  { 
    id: 'feed' as const, 
    name: 'Посты', 
    icon: FileText,
    color: 'text-tg-orange',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20'
  },
  { 
    id: 'selected' as const, 
    name: 'Отобранные', 
    icon: Star,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20'
  },
  { 
    id: 'settings' as const, 
    name: 'Настройки', 
    icon: Settings,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20'
  }
];

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const { selectedPosts } = useSelectedPosts();
  
  return (
    <nav className="navigation-fixed dark:bg-gray-600/90 border-t border-tg-gray-200/50 dark:border-tg-dark-700/50 shadow-lg">
      {/* Верхняя декоративная линия */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
      
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex-1 py-2 sm:py-3 px-1 sm:px-2 text-center transition-all duration-300 relative touch-optimized ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                <div className="flex flex-col items-center space-y-0.5 sm:space-y-1 relative">
                  <div className="relative">
                    <Icon 
                      className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive ? 'scale-110' : 'scale-100'} transition-transform duration-200 ${
                        tab.id === 'selected' && isActive && selectedPosts.length > 0 ? 'fill-current' : ''
                      }`} 
                      strokeWidth={2}
                    />
                    {/* Индикатор количества выбранных постов */}
                    {tab.id === 'selected' && selectedPosts.length > 0 && (
                      <div className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 bg-yellow-500 text-white text-xs rounded-full min-w-4 h-4 sm:min-w-5 sm:h-5 flex items-center justify-center px-1 font-bold shadow-lg animate-pulse">
                        {selectedPosts.length > 99 ? '99+' : selectedPosts.length}
                      </div>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-medium leading-tight">{tab.name}</span>
                </div>
                
                {isActive && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-6 sm:w-8 h-0.5 sm:h-1 bg-gradient-to-r from-tg-blue-500 to-tg-blue-600 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}; 