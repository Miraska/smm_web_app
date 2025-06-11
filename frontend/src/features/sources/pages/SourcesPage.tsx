import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw, Radio, Users, Hash, AlertCircle, CheckCircle, Info, Search, X } from 'lucide-react';
import { useSources } from '../../../hooks/useSources';
import { useAuth } from '../../../hooks/useAuth';
import { formatNumber } from '../../../utils';
import type { Channel } from '../../../types';
import { AuthPage } from '../../auth/pages/AuthPage';

export const SourcesPage: React.FC = () => {
  const { authStatus } = useAuth();
  const [parsing, setParsing] = useState(false);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [removeSuccess, setRemoveSuccess] = useState<any>(null);
  const [searchSources, setSearchSources] = useState('');
  const [searchChannels, setSearchChannels] = useState('');
  const [addingChannelIds, setAddingChannelIds] = useState<Set<number>>(new Set());
  const [searchLoading, setSearchLoading] = useState(false);

  const {
    sources,
    channels,
    loading,
    error,
    addSource,
    removeSource,
    parseAllSources,
    loadSources,
    setError,
    loadChannels
  } = useSources();

  // Начальная загрузка источников при монтировании
  useEffect(() => {
    loadSources();
  }, []);

  // Автоматический поиск с задержкой для источников
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadSources(searchSources || undefined);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchSources, loadSources]);

  // Автоматический поиск с задержкой для каналов
  useEffect(() => {
    if (searchChannels) {
      const debounceTimer = setTimeout(() => {
        setSearchLoading(true);
        loadChannels(searchChannels).finally(() => setSearchLoading(false));
      }, 300);

      return () => clearTimeout(debounceTimer);
    }
  }, [searchChannels, loadChannels]);

  if (!authStatus.authorized) {
    return <AuthPage />;
  }

  const handleAddSource = async (channel: Channel) => {
    const channelId = typeof channel.id === 'string' ? parseInt(channel.id) : channel.id;
    setAddingChannelIds(prev => new Set(prev.add(channelId)));
    try {
      const newSource = await addSource(channel);
      
      // Автоматически запускаем быстрый парсинг для нового источника
      try {
        const response = await fetch(`http://localhost:8000/api/sources/parse-new/${channel.id}`, {
          method: 'POST'
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Автопарсинг для ${channel.title}: ${data.message}`);
        }
      } catch (parseError) {
        console.warn('⚠️ Ошибка автопарсинга:', parseError);
        // Не показываем ошибку пользователю, так как канал уже добавлен
      }
    } catch (error) {
      // Ошибка уже обработана в хуке
    } finally {
      setAddingChannelIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(channelId);
        return newSet;
      });
    }
  };

  const handleRemoveSource = async (id: number, sourceName: string) => {
    if (!confirm(`Удалить источник "${sourceName}"?\n\nЭто удалит:\n• Все посты канала из базы данных\n• Все отобранные посты канала\n• Все медиафайлы канала\n• Папку с медиа канала`)) {
      return;
    }
    
    try {
      const result = await removeSource(id);
      setRemoveSuccess(result);
      // Автоматически скрываем уведомление через 10 секунд
      setTimeout(() => setRemoveSuccess(null), 10000);
    } catch (error) {
      // Ошибка уже обработана в хуке
    }
  };

  const handleParseAll = async () => {
    try {
      setParsing(true);
      await parseAllSources();
    } catch (error) {
      // Ошибка уже обработана в хуке
    } finally {
      setParsing(false);
    }
  };

  const handleReloadChannels = async () => {
    setChannelsLoading(true);
    try {
      await loadChannels();
    } finally {
      setChannelsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
            Источники
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Управляйте каналами для парсинга контента
          </p>
        </div>
        
        {/* <div className="flex space-x-3">
          <button
            onClick={loadSources}
            disabled={loading}
            className="bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="font-medium">Обновить источники</span>
          </button>
          
          <button
            onClick={handleReloadChannels}
            disabled={channelsLoading}
            className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${channelsLoading ? 'animate-spin' : ''}`} />
            <span className="font-medium">Обновить каналы</span>
          </button>
        </div> */}
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
      {removeSuccess && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-green-600 font-medium mb-2">{removeSuccess.message}</p>
            {removeSuccess.details && (
              <div className="text-green-700 dark:text-green-300 text-sm space-y-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    <span>Удалено постов: {removeSuccess.details.deleted_posts}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    <span>Удалено избранных: {removeSuccess.details.deleted_selected_posts}</span>
                  </div>
                </div>
                {removeSuccess.details.deleted_media_folders.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Удалены папки медиа:</p>
                    <ul className="list-disc list-inside ml-2">
                      {removeSuccess.details.deleted_media_folders.map((folder: string, index: number) => (
                        <li key={index} className="text-xs">{folder}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {removeSuccess.details.freed_space_mb > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    💾 Освобождено: {removeSuccess.details.freed_space_mb} MB
                  </p>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setRemoveSuccess(null)}
            className="ml-auto text-green-400 hover:text-green-600"
          >
            ×
          </button>
        </div>
      )}

      {/* Sources List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Активные источники ({sources.length})
            </h3>
            
            {sources.length > 0 && (
              <button
                onClick={handleParseAll}
                disabled={parsing || loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                {parsing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Парсим...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Парсить</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Поиск по источникам */}
          {/* <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Поиск источников по названию, @username или ID..."
              value={searchSources}
              onChange={(e) => setSearchSources(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchSources && (
              <button
                onClick={() => setSearchSources('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div> */}
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700 overflow-y-auto">
          {sources.length === 0 ? (
            <div className="p-8 text-center">
              <Radio className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Нет источников
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Выберите каналы из списка ниже для начала парсинга контента
              </p>
            </div>
          ) : (
            sources.map((source) => (
              <div key={source.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <Radio className="w-5 h-5 text-green-600" />
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {source.channel_title || source.channel_name}
                      </h4>
                      {source.channel_username && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                          <Hash className="w-3 h-3 mr-1" />
                          {source.channel_username}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Активен</span>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSource(source.id, source.channel_title || source.channel_name);
                      }}
                      disabled={loading}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Channels List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Доступные каналы {channels.length > 0 && `(${channels.length})`}
            </h3>
            <button
              onClick={handleReloadChannels}
              disabled={channelsLoading}
              className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${channelsLoading ? 'animate-spin' : ''}`} />
              <span className="font-medium">Обновить</span>
            </button>
          </div>

          {/* Поиск по каналам */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Поиск каналов по названию"
              value={searchChannels}
              onChange={(e) => setSearchChannels(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchChannels && (
              <button
                onClick={() => setSearchChannels('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {channelsLoading || searchLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                {searchChannels ? 'Поиск каналов...' : 'Загрузка каналов...'}
              </p>
            </div>
          ) : channels.length === 0 ? (
            <div className="text-center py-8">
              <Radio className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Каналы не найдены
              </p>
              <button
                onClick={handleReloadChannels}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Попробовать снова
              </button>
            </div>
          ) : (
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {channels.map((channel) => {
                const isAlreadyAdded = sources.some(source => source.channel_id === channel.id);
                const channelId = typeof channel.id === 'string' ? parseInt(channel.id) : channel.id;
                const isAdding = addingChannelIds.has(channelId);
                
                return (
                  <div
                    key={channel.id}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <Hash className="w-5 h-5 text-blue-600" />
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {channel.title}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          {channel.username && (
                            <span>@{channel.username}</span>
                          )}
                          {channel.members_count && (
                            <div className="flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              {formatNumber(channel.members_count)}
                            </div>
                          )}
                          <span className="capitalize">{channel.type}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isAlreadyAdded ? (
                        <span className="text-green-600 text-sm flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Добавлен
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAddSource(channel)}
                          disabled={isAdding}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          {isAdding ? 'Добавление...' : 'Добавить'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 