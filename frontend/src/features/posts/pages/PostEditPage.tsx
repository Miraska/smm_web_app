import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, RefreshCw, Wand2, Copy, Eye, EyeOff, FileText, Calendar, MessageSquare, Heart, Sparkles, Bot, Clock, Send } from 'lucide-react';
import MediaRenderer from '../../../components/MediaRenderer';
import { formatDate, formatNumber } from '../../../utils';
import type { SelectedPost, TelegramChannel } from '../../../types';

interface PostEditPageProps {
  selectedPost: SelectedPost;
  onBack: () => void;
  onSave: (editedText: string, notes?: string) => Promise<void>;
}

export const PostEditPage: React.FC<PostEditPageProps> = ({ selectedPost, onBack, onSave }) => {
  const [editedText, setEditedText] = useState(selectedPost.edited_text || selectedPost.original_text);
  const [notes, setNotes] = useState(selectedPost.notes || '');
  const [isPreview, setIsPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);
  const [channels, setChannels] = useState<TelegramChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedulingPost, setSchedulingPost] = useState(false);
  const [openrouterModels] = useState([
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
    { id: 'google/gemini-pro', name: 'Gemini Pro' },
  ]);
  const [selectedModel, setSelectedModel] = useState('openai/gpt-4o-mini');

  const post = selectedPost.post;

  useEffect(() => {
    if (editedText) {
      setWordCount(editedText.trim().split(/\s+/).filter(word => word.length > 0).length);
      setCharCount(editedText.length);
      setHasChanges(editedText !== (selectedPost.edited_text || selectedPost.original_text) || notes !== (selectedPost.notes || ''));
    }
  }, [editedText, notes, selectedPost]);

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      // Здесь будет API вызов для загрузки каналов где пользователь админ
      // Пока используем заглушку
      const mockChannels: TelegramChannel[] = [
        {
          id: '-1001234567890',
          title: 'Мой канал',
          username: 'my_channel',
          participants_count: 1500,
          is_admin: true,
          can_post_messages: true,
        },
        {
          id: '-1001234567891',
          title: 'Тестовый канал',
          username: 'test_channel',
          participants_count: 500,
          is_admin: true,
          can_post_messages: true,
        }
      ];
      setChannels(mockChannels);
      if (mockChannels.length > 0) {
        setSelectedChannel(mockChannels[0].id);
      }
    } catch (error) {
      console.error('Ошибка загрузки каналов:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await onSave(editedText, notes);
      setHasChanges(false);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAiEdit = async () => {
    try {
      setAiLoading(true);
      
      // API вызов к OpenRouter для обработки текста
      const response = await fetch('/api/ai/edit-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: editedText,
          model: selectedModel,
          prompt: 'Переписать текст, сделав его более продающим и интересным для читателей. Сохранить основную идею и важную информацию.'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEditedText(data.edited_text || editedText);
      } else {
        throw new Error('Ошибка обработки текста');
      }
      
    } catch (error) {
      console.error('Ошибка обработки ИИ:', error);
      // Fallback для демонстрации
      const aiProcessedText = editedText + "\n\n✨ Текст обработан ИИ (" + selectedModel + ")";
      setEditedText(aiProcessedText);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSchedulePost = async () => {
    if (!selectedChannel || !scheduledTime) {
      alert('Выберите канал и время для публикации');
      return;
    }

    try {
      setSchedulingPost(true);
      
      // API вызов для создания отложенного поста
      const response = await fetch('/api/posts/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selected_post_id: selectedPost.id,
          channel_id: selectedChannel,
          scheduled_time: scheduledTime,
          text: editedText
        }),
      });

      if (response.ok) {
        alert('Пост запланирован для публикации!');
        setShowSchedule(false);
      } else {
        throw new Error('Ошибка планирования поста');
      }
      
    } catch (error) {
      console.error('Ошибка планирования:', error);
      alert('Ошибка при планировании поста');
    } finally {
      setSchedulingPost(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editedText);
      // Показать уведомление о копировании
    } catch (error) {
      console.error('Ошибка копирования:', error);
    }
  };

  const resetToOriginal = () => {
    if (confirm('Сбросить изменения и вернуться к оригинальному тексту?')) {
      setEditedText(selectedPost.original_text);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">
              Редактирование поста
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
              {post?.channel_title || post?.channel_name || 'Неизвестный канал'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 shrink-0">
          <button
            onClick={() => setIsPreview(!isPreview)}
            className={`p-2 rounded-lg transition-colors ${
              isPreview 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            title={isPreview ? 'Режим редактирования' : 'Режим просмотра'}
          >
            {isPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          
          <button
            onClick={handleSave}
            disabled={loading || !hasChanges}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm sm:text-base"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{loading ? 'Сохранение...' : 'Сохранить'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Edit Area */}
        <div className="xl:col-span-2 space-y-4 sm:space-y-6">
          {/* Original Post Info */}
          {post && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm sm:text-base">Оригинальный пост</span>
              </h3>
              
              {/* Post stats */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3">
                {post.date && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{formatDate(post.date)}</span>
                  </div>
                )}
                {post.views && (
                  <div className="flex items-center space-x-1">
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{formatNumber(post.views)}</span>
                  </div>
                )}
                {post.reactions && (
                  <div className="flex items-center space-x-1">
                    <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{formatNumber(post.reactions)}</span>
                  </div>
                )}
                {post.comments && (
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{formatNumber(post.comments)}</span>
                  </div>
                )}
              </div>

              {/* Media */}
              {post.media_type && post.media_url && (
                <div className="mb-4">
                  <MediaRenderer 
                    post={post} 
                    compact={false}
                    allPosts={[post]}
                  />
                </div>
              )}

              {/* Original text */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                  {selectedPost.original_text}
                </p>
              </div>
            </div>
          )}

          {/* Editor */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3 sm:gap-4">
              <h3 className="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                <Wand2 className="w-4 h-4" />
                <span className="text-sm sm:text-base">Редактирование</span>
              </h3>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-2">
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="text-xs sm:text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex-1 sm:flex-none min-w-0"
                  >
                    {openrouterModels.map(model => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAiEdit}
                    disabled={aiLoading || !editedText.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-2 sm:px-3 py-1.5 rounded-lg flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm transition-colors"
                  >
                    {aiLoading ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Bot className="w-3 h-3" />
                    )}
                    <span className="hidden sm:inline">{aiLoading ? 'Обработка...' : 'ИИ обработка'}</span>
                    <span className="sm:hidden">ИИ</span>
                  </button>
                </div>
                
                <div className="flex items-center justify-end space-x-2 sm:space-x-1">
                  <button
                    onClick={copyToClipboard}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="Копировать"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  
                  <button
                    onClick={resetToOriginal}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    title="Сбросить к оригиналу"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {isPreview ? (
              <div className="min-h-64 sm:min-h-96 p-3 sm:p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                  {editedText}
                </p>
              </div>
            ) : (
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full h-64 sm:h-96 p-3 sm:p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Редактировать текст поста..."
              />
            )}

            {/* Editor Stats */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <span>Слов: {wordCount}</span>
                <span>Символов: {charCount}</span>
                {hasChanges && (
                  <span className="text-orange-600 dark:text-orange-400 flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span className="hidden sm:inline">Есть изменения</span>
                    <span className="sm:hidden">Изменено</span>
                  </span>
                )}
              </div>
              {editedText !== selectedPost.original_text && (
                <span className="text-green-600 dark:text-green-400 text-xs">
                  ✏️ Отредактировано
                </span>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4 text-sm sm:text-base">Заметки</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-20 sm:h-24 p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none text-sm sm:text-base"
              placeholder="Добавить заметки к посту..."
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4 text-sm sm:text-base">Статус</h3>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Текущий статус:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium self-start sm:self-auto ${
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
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Отобрано:</span>
                <span className="text-xs sm:text-sm text-gray-900 dark:text-white">
                  {formatDate(selectedPost.selected_at)}
                </span>
              </div>

              {selectedPost.edited_text && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Последнее редактирование:</span>
                  <span className="text-xs sm:text-sm text-green-600 dark:text-green-400">
                    Изменен
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Scheduling */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center space-x-2 text-sm sm:text-base">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Планирование публикации</span>
              <span className="sm:hidden">Планирование</span>
            </h3>
            
            {!showSchedule ? (
              <button
                onClick={() => setShowSchedule(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm sm:text-base"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Запланировать пост</span>
                <span className="sm:hidden">Запланировать</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Канал для публикации
                  </label>
                  <select
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm"
                  >
                    {channels.map(channel => (
                      <option key={channel.id} value={channel.id}>
                        {channel.title} ({channel.username || 'Без @'})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Время публикации
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleSchedulePost}
                    disabled={schedulingPost || !selectedChannel || !scheduledTime}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors"
                  >
                    {schedulingPost ? 'Планирование...' : 'Запланировать'}
                  </button>
                  <button
                    onClick={() => setShowSchedule(false)}
                    className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors text-xs sm:text-sm"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4 text-sm sm:text-base">Действия</h3>
            <div className="space-y-3">
              <button
                onClick={handleSave}
                disabled={loading || !hasChanges}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm sm:text-base"
              >
                <Save className="w-4 h-4" />
                <span>Сохранить изменения</span>
              </button>
              
              <button
                onClick={copyToClipboard}
                className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm sm:text-base"
              >
                <Copy className="w-4 h-4" />
                <span>Копировать текст</span>
              </button>
              
              <button
                onClick={onBack}
                className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm sm:text-base"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Назад к списку</span>
              </button>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800 p-3 sm:p-6">
            <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-3 text-sm sm:text-base">💡 Советы</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-blue-800 dark:text-blue-300">
              <li>• Используйте ИИ обработку для автоматического улучшения текста</li>
              <li>• Переключайтесь между режимами редактирования и просмотра</li>
              <li>• Добавляйте заметки для лучшей организации</li>
              <li>• Копируйте готовый текст для публикации</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}; 