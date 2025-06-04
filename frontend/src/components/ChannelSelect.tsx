import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Radio, Loader2 } from 'lucide-react';
import { getChannels } from '../api';

interface Props { 
  value: string | null; 
  onChange: (id: string) => void;
}

export default function ChannelSelect({ value, onChange }: Props) {
  const { data, isLoading, error } = useQuery({ 
    queryKey: ['channels'], 
    queryFn: getChannels 
  });
  
  if (isLoading) {
    return (
      <div className="w-full p-4 rounded-tg bg-white dark:bg-tg-dark-800 border border-tg-gray-200 dark:border-tg-dark-700 flex items-center justify-center space-x-2">
        <Loader2 className="w-4 h-4 animate-spin text-tg-blue-500" />
        <span className="text-tg-gray-600 dark:text-tg-gray-400 text-sm">Загружаем каналы...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="w-full p-4 rounded-tg bg-tg-red/10 border border-tg-red/20 text-tg-red text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-tg-red rounded-full flex items-center justify-center">
            <span className="text-white text-xs">!</span>
          </div>
          <span>Ошибка загрузки каналов</span>
        </div>
      </div>
    );
  }
  
  if (!data || !Array.isArray(data)) {
    return (
      <div className="w-full p-4 rounded-tg bg-tg-yellow/10 border border-tg-yellow/20 text-tg-dark-700 dark:text-tg-gray-300 text-sm">
        <div className="flex items-center space-x-2">
          <Radio className="w-4 h-4 text-tg-yellow" />
          <span>Нет доступных каналов</span>
        </div>
      </div>
    );
  }
  
  const selectedChannel = data.find((c: any) => c.id === value);
  
  return (
    <div className="relative">
      <div className="relative">
        <select
          className="tg-input w-full p-4 pr-12 rounded-tg shadow-tg bg-white dark:bg-tg-dark-800 border border-tg-gray-200 dark:border-tg-dark-700 text-tg-dark-800 dark:text-white focus:border-tg-blue-500 focus:ring-2 focus:ring-tg-blue-500/20 transition-all duration-200 appearance-none cursor-pointer"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled className="text-tg-gray-500">
            Выберите канал для публикации...
          </option>
          {data.map((channel: any) => (
            <option 
              key={channel.id} 
              value={channel.id}
              className="py-2"
            >
              {channel.title || channel.username || `ID: ${channel.id}`}
            </option>
          ))}
        </select>
        
        {/* Custom dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
          <ChevronDown className="w-5 h-5 text-tg-gray-400 transition-transform" />
        </div>
      </div>
      
      {/* Selected channel info */}
      {selectedChannel && (
        <div className="mt-3 p-3 rounded-tg-sm bg-tg-blue-50 dark:bg-tg-blue-900/20 border border-tg-blue-200 dark:border-tg-blue-800">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-tg-blue-500 to-tg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-semibold">
                {(selectedChannel.title || selectedChannel.username || 'T').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-tg-blue-700 dark:text-tg-blue-300 truncate">
                {selectedChannel.title || selectedChannel.username || `ID: ${selectedChannel.id}`}
              </p>
              {selectedChannel.username && (
                <p className="text-xs text-tg-blue-600 dark:text-tg-blue-400">
                  @{selectedChannel.username}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-tg-green rounded-full animate-pulse"></div>
              <span className="text-xs text-tg-green font-medium">Активен</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}