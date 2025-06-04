import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Grid3X3, List, SortAsc, SortDesc, Bug, Calendar, Hash, 
  User, Eye, MessageCircle, Heart, Clock, MoreHorizontal, ChevronDown,
  X, RotateCcw, BookmarkPlus, Columns, Rows3, Grid2X2, Newspaper,
  LayoutList, MessageSquare
} from 'lucide-react';
import PostCard from './PostCard';

interface Props { 
  posts: any[]; 
  onSelectPost: (post: any) => void;
  selectedPosts?: any[];
  showSelection?: boolean;
  forceViewMode?: ViewMode;
}

type ViewMode = 'list' | 'telegram' | 'grid' | 'compact';
type SortBy = 'date' | 'views' | 'reactions' | 'title' | 'text_length' | 'message_id';
type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year';

export default function PostsList({ posts, onSelectPost, selectedPosts = [], showSelection = false, forceViewMode }: Props) {
  // Основные состояния
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState<'all' | 'text' | 'channel'>('all');
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Фильтры по реакциям и просмотрам
  const [minViews, setMinViews] = useState<number | null>(null);
  const [minReactions, setMinReactions] = useState<number | null>(null);
  const [textLengthRange, setTextLengthRange] = useState<[number, number]>([0, 10000]);

  // Используем forceViewMode если он задан, иначе internalViewMode
  const viewMode = forceViewMode || internalViewMode;

  // Загружаем настройки из localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('postsListSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setInternalViewMode(settings.viewMode || 'grid');
        setSortBy(settings.sortBy || 'date');
        setSortOrder(settings.sortOrder || 'desc');
        setDateFilter(settings.dateFilter || 'all');
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  // Сохраняем настройки в localStorage
  useEffect(() => {
    if (!forceViewMode) { // Не сохраняем forceViewMode
      const settings = {
        viewMode: internalViewMode,
        sortBy,
        sortOrder,
        dateFilter
      };
      localStorage.setItem('postsListSettings', JSON.stringify(settings));
    }
  }, [internalViewMode, sortBy, sortOrder, dateFilter, forceViewMode]);

  // Получаем уникальные каналы
  const availableChannels = useMemo(() => {
    const channels = [...new Set(posts.map(p => p.channel_name || p.channel_title))].filter(Boolean);
    return channels.sort();
  }, [posts]);

  // Основная логика фильтрации и сортировки
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts.filter(post => {
      // Поиск по тексту
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const textMatch = (post.text || '').toLowerCase().includes(searchLower) ||
                         (post.html || '').toLowerCase().includes(searchLower);
        const channelMatch = (post.channel_name || '').toLowerCase().includes(searchLower) ||
                            (post.channel_title || '').toLowerCase().includes(searchLower);
        
        if (searchField === 'text' && !textMatch) return false;
        if (searchField === 'channel' && !channelMatch) return false;
        if (searchField === 'all' && !textMatch && !channelMatch) return false;
      }

      // Фильтр по датам
      if (dateFilter !== 'all') {
        const postDate = new Date(post.post_date || post.date);
        const now = new Date();
        const dayMs = 24 * 60 * 60 * 1000;
        
        switch (dateFilter) {
          case 'today':
            if (now.getTime() - postDate.getTime() > dayMs) return false;
            break;
          case 'week':
            if (now.getTime() - postDate.getTime() > 7 * dayMs) return false;
            break;
          case 'month':
            if (now.getTime() - postDate.getTime() > 30 * dayMs) return false;
            break;
          case 'year':
            if (now.getTime() - postDate.getTime() > 365 * dayMs) return false;
            break;
        }
      }

      // Фильтр по каналам
      if (selectedChannels.length > 0) {
        const postChannel = post.channel_name || post.channel_title;
        if (!selectedChannels.includes(postChannel)) return false;
      }

      // Фильтр по просмотрам
      if (minViews !== null && (post.views || 0) < minViews) return false;

      // Фильтр по реакциям
      if (minReactions !== null && (post.reactions || 0) < minReactions) return false;

      // Фильтр по длине текста
      const textLength = (post.text || post.html || '').length;
      if (textLength < textLengthRange[0] || textLength > textLengthRange[1]) return false;

      return true;
    });

    // Сортировка
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          const dateA = new Date(a.post_date || a.date || 0).getTime();
          const dateB = new Date(b.post_date || b.date || 0).getTime();
          comparison = dateA - dateB;
          break;
        case 'views':
          comparison = (a.views || 0) - (b.views || 0);
          break;
        case 'reactions':
          comparison = (a.reactions || 0) - (b.reactions || 0);
          break;
        case 'title':
          const titleA = (a.channel_name || a.channel_title || '').toLowerCase();
          const titleB = (b.channel_name || b.channel_title || '').toLowerCase();
          comparison = titleA.localeCompare(titleB);
          break;
        case 'text_length':
          const lengthA = (a.text || a.html || '').length;
          const lengthB = (b.text || b.html || '').length;
          comparison = lengthA - lengthB;
          break;
        case 'message_id':
          comparison = (a.message_id || 0) - (b.message_id || 0);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [posts, searchTerm, searchField, sortBy, sortOrder, dateFilter, selectedChannels, minViews, minReactions, textLengthRange]);

  const isPostSelected = (post: any) => {
    return selectedPosts.some(selected => selected.id === post.id);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSearchField('all');
    setDateFilter('all');
    setSelectedChannels([]);
    setMinViews(null);
    setMinReactions(null);
    setTextLengthRange([0, 10000]);
  };

  const toggleChannelFilter = (channel: string) => {
    setSelectedChannels(prev => 
      prev.includes(channel) 
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const getViewModeIcon = (mode: ViewMode) => {
    switch (mode) {
      case 'grid': return <Grid3X3 className="w-5 h-5" />;
      case 'list': return <LayoutList className="w-5 h-5" />;
      case 'compact': return <Rows3 className="w-5 h-5" />;
      case 'telegram': return <MessageSquare className="w-5 h-5" />;
    }
  };

  const getViewModeClasses = () => {
    switch (viewMode) {
      case 'grid': 
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
      case 'list': 
        return 'space-y-6';
      case 'compact': 
        return 'grid grid-cols-1 lg:grid-cols-2 gap-4';
      case 'telegram': 
        return 'space-y-4';
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок с быстрыми действиями */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-tg-blue-600 to-tg-blue-800 dark:from-tg-blue-400 dark:to-tg-blue-300 bg-clip-text">
            Посты
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex items-center px-3 py-1 bg-tg-blue-100 dark:bg-tg-blue-900/30 text-tg-blue-700 dark:text-tg-blue-300 rounded-full text-sm font-medium">
              Всего: {posts.length}
            </span>
            <span className="inline-flex items-center px-3 py-1 bg-tg-green-100 dark:bg-tg-green-900/30 text-tg-green-700 dark:text-tg-green-300 rounded-full text-sm font-medium">
              Найдено: {filteredAndSortedPosts.length}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={resetFilters}
            className="cursor-pointer flex items-center gap-2 px-3 py-2 text-sm bg-tg-gray-100 dark:bg-tg-dark-700 text-tg-gray-700 dark:text-tg-gray-300 rounded-xl hover:bg-tg-gray-200 dark:hover:bg-tg-dark-600 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Сбросить
          </button>
          
          {showSelection && selectedPosts.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-tg-purple-100 dark:bg-tg-purple-900/30 text-tg-purple-700 dark:text-tg-purple-300 rounded-xl">
              <BookmarkPlus className="w-4 h-4" />
              Выбрано: {selectedPosts.length}
            </div>
          )}
        </div>
      </div>

      {/* Панель поиска и фильтров */}
      <div className="bg-white dark:bg-tg-dark-800 rounded-2xl shadow-tg-lg border border-tg-blue-100 dark:border-tg-dark-700">
        <div className="p-6 space-y-6">
          {/* Поиск */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-tg-blue-400" />
              <input
                style={{ outline: 'none', border: '2px solid black' }}
                type="text"
                placeholder="Поиск по постам..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-tg-blue-100 dark:border-tg-dark-700 bg-tg-blue-50 dark:bg-tg-dark-700 text-tg-dark-800 dark:text-white placeholder-tg-blue-400 focus:border-tg-blue-500 focus:ring-2 focus:ring-tg-blue-500/20"
              />
            </div>
            
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value as any)}
              className="px-4 py-3 rounded-xl border border-tg-blue-100 dark:border-tg-dark-700 bg-tg-blue-50 dark:bg-tg-dark-700 text-tg-blue-700 dark:text-tg-blue-200 focus:border-tg-blue-500 focus:ring-2 focus:ring-tg-blue-500/20"
            >
              <option value="all">Везде</option>
              <option value="text">По тексту</option>
              <option value="channel">По каналу</option>
            </select>
          </div>

          {/* Основные фильтры */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Фильтр по датам */}
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-tg-blue-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="px-3 py-2 rounded-xl border border-tg-blue-100 dark:border-tg-dark-700 bg-tg-blue-50 dark:bg-tg-dark-700 text-tg-blue-700 dark:text-tg-blue-200 text-sm focus:border-tg-blue-500"
              >
                <option value="all">Все даты</option>
                <option value="today">Сегодня</option>
                <option value="week">Неделя</option>
                <option value="month">Месяц</option>
                <option value="year">Год</option>
              </select>
            </div>

            {/* Расширенные фильтры */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 border ${
                showAdvancedFilters
                  ? 'bg-tg-blue-500 text-white border-tg-blue-500 shadow-tg-md'
                  : 'bg-white dark:bg-tg-dark-700 text-tg-gray-700 dark:text-tg-gray-300 border-tg-gray-200 dark:border-tg-dark-600 hover:bg-tg-blue-50 dark:hover:bg-tg-dark-600 hover:border-tg-blue-300 dark:hover:border-tg-blue-600'
              }`}
            >
              <MoreHorizontal className="w-4 h-4" />
              <span className="font-medium">Больше фильтров</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Расширенные фильтры */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-tg-gray-50 dark:bg-tg-dark-700 rounded-xl">
              {/* Фильтр по каналам */}
              <div>
                <label className="block text-sm font-medium text-tg-gray-700 dark:text-tg-gray-300 mb-2">
                  Каналы ({selectedChannels.length} из {availableChannels.length})
                </label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {availableChannels.map(channel => (
                    <label key={channel} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedChannels.includes(channel)}
                        onChange={() => toggleChannelFilter(channel)}
                        className="mr-2 rounded text-tg-blue-500"
                      />
                      <span className="text-sm text-tg-gray-700 dark:text-tg-gray-300 truncate">
                        {channel}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Фильтр по просмотрам */}
              <div>
                <label className="block text-sm font-medium text-tg-gray-700 dark:text-tg-gray-300 mb-2">
                  Минимум просмотров
                </label>
                <input
                  type="number"
                  value={minViews || ''}
                  onChange={(e) => setMinViews(e.target.value ? Number(e.target.value) : null)}
                  placeholder="Любое количество"
                  className="w-full px-3 py-2 rounded-lg border border-tg-gray-200 dark:border-tg-dark-600 bg-white dark:bg-tg-dark-600 text-sm"
                />
              </div>

              {/* Фильтр по реакциям */}
              <div>
                <label className="block text-sm font-medium text-tg-gray-700 dark:text-tg-gray-300 mb-2">
                  Минимум реакций
                </label>
                <input
                  type="number"
                  value={minReactions || ''}
                  onChange={(e) => setMinReactions(e.target.value ? Number(e.target.value) : null)}
                  placeholder="Любое количество"
                  className="w-full px-3 py-2 rounded-lg border border-tg-gray-200 dark:border-tg-dark-600 bg-white dark:bg-tg-dark-600 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Панель управления */}
        <div className="flex items-center justify-between p-4 border-t border-tg-gray-100 dark:border-tg-dark-700">
          <div className="flex items-center gap-4">
            {/* Сортировка */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="px-3 py-2 rounded-xl border border-tg-blue-100 dark:border-tg-dark-700 bg-tg-blue-50 dark:bg-tg-dark-700 text-tg-blue-700 dark:text-tg-blue-200 text-sm"
              >
                <option value="date">По дате</option>
                <option value="views">По просмотрам</option>
                <option value="reactions">По реакциям</option>
                <option value="title">По каналу</option>
                <option value="text_length">По длине текста</option>
                <option value="message_id">По ID сообщения</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 rounded-xl hover:bg-tg-blue-100 dark:hover:bg-tg-dark-600 transition-colors"
                title={sortOrder === 'asc' ? 'По возрастанию' : 'По убыванию'}
              >
                {sortOrder === 'asc' ? 
                  <SortAsc className="w-5 h-5 text-tg-blue-400" /> : 
                  <SortDesc className="w-5 h-5 text-tg-blue-400" />
                }
              </button>
            </div>

            {/* Отладка */}
            <button
              onClick={() => setShowDebug(!showDebug)}
              className={`p-2 rounded-xl transition-colors ${
                showDebug
                  ? 'bg-tg-yellow-500 text-white'
                  : 'text-tg-gray-500 hover:bg-tg-gray-100 dark:hover:bg-tg-dark-600'
              }`}
              title="Отладка медиа"
            >
              <Bug className="w-5 h-5" />
            </button>
          </div>

          {/* Режимы отображения */}
          {!forceViewMode && (
            <div className="flex rounded-xl overflow-hidden border border-tg-blue-100 dark:border-tg-dark-700 bg-tg-blue-50 dark:bg-tg-dark-700">
              {(['grid', 'list', 'compact', 'telegram'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setInternalViewMode(mode)}
                  className={`p-2 transition-colors ${
                    viewMode === mode
                      ? 'bg-tg-blue-500 text-white'
                      : 'text-tg-blue-700 dark:text-tg-blue-200 hover:bg-tg-blue-100 dark:hover:bg-tg-dark-600'
                  }`}
                  title={
                    mode === 'grid' ? 'Сетка' :
                    mode === 'list' ? 'Список' :
                    mode === 'compact' ? 'Компактно' : 'Telegram-style'
                  }
                >
                  {getViewModeIcon(mode)}
                </button>
              ))}
            </div>
          )}
          
          {/* Индикатор принудительного режима */}
          {forceViewMode && (
            <div className="px-3 py-2 bg-tg-purple-100 dark:bg-tg-purple-900/30 text-tg-purple-700 dark:text-tg-purple-300 rounded-xl text-sm font-medium">
              Режим: {
                forceViewMode === 'grid' ? 'Сетка' :
                forceViewMode === 'list' ? 'Список' :
                forceViewMode === 'compact' ? 'Компактно' : 'Telegram-style'
              }
            </div>
          )}
        </div>
      </div>

      {/* Активные фильтры */}
      {(selectedChannels.length > 0 || minViews || minReactions || dateFilter !== 'all') && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-tg-gray-600 dark:text-tg-gray-400">Активные фильтры:</span>
          
          {selectedChannels.map(channel => (
            <span key={channel} className="inline-flex items-center gap-1 px-2 py-1 bg-tg-blue-100 dark:bg-tg-blue-900/30 text-tg-blue-700 dark:text-tg-blue-300 rounded-lg text-xs">
              <User className="w-3 h-3" />
              {channel}
              <button onClick={() => toggleChannelFilter(channel)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          
          {minViews && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-tg-green-100 dark:bg-tg-green-900/30 text-tg-green-700 dark:text-tg-green-300 rounded-lg text-xs">
              <Eye className="w-3 h-3" />
              ≥{minViews} просмотров
              <button onClick={() => setMinViews(null)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {minReactions && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-tg-red-100 dark:bg-tg-red-900/30 text-tg-red-700 dark:text-tg-red-300 rounded-lg text-xs">
              <Heart className="w-3 h-3" />
              ≥{minReactions} реакций
              <button onClick={() => setMinReactions(null)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Результаты */}
      {filteredAndSortedPosts.length > 0 ? (
        <div className={getViewModeClasses()}>
          {filteredAndSortedPosts.map((post, index) => (
            <div
              key={post.id || index}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.02}s` }}
            >
              <PostCard
                post={post}
                onSelect={() => onSelectPost(post)}
                isSelected={showSelection && isPostSelected(post)}
                showDebug={showDebug}
                viewMode={viewMode}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 bg-tg-blue-50 dark:bg-tg-dark-700 rounded-full flex items-center justify-center">
            <Search className="w-10 h-10 text-tg-blue-400" />
          </div>
          <h3 className="text-2xl font-bold text-tg-blue-900 dark:text-white mb-2">
            Посты не найдены
          </h3>
          <p className="text-tg-blue-600 dark:text-tg-blue-300">
            Попробуйте изменить параметры поиска или фильтры
          </p>
          <button
            onClick={resetFilters}
            className="mt-4 px-4 py-2 bg-tg-blue-500 text-white rounded-xl hover:bg-tg-blue-600 transition-colors"
          >
            Сбросить все фильтры
          </button>
        </div>
      )}

      {/* Отладочная информация */}
      {showDebug && (
        <div className="text-sm text-tg-gray-600 dark:text-tg-gray-400 bg-tg-yellow-50 dark:bg-tg-yellow-900/20 p-4 rounded-xl">
          🐛 <strong>Отладка:</strong> Показано {filteredAndSortedPosts.length} из {posts.length} постов | 
          Режим: {viewMode} | Сортировка: {sortBy} ({sortOrder}) | 
          Дата: {dateFilter}
        </div>
      )}
    </div>
  );
}