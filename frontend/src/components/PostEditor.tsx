import { useState } from 'react';
import { rewrite, publish } from '../api';
import MediaRenderer from './MediaRenderer';

interface Props { post: any; clear: () => void }

export default function PostEditor({ post, clear }: Props) {
  const [text, setText] = useState(post.html || post.text || '');
  const [busy, setBusy] = useState(false);

  async function handleRewrite() {
    setBusy(true);
    setText('⏳ GPT генерирует…');
    setText(await rewrite(post.html || post.text || '', 1024));
    setBusy(false);
  }

  async function handlePublish() {
    setBusy(true);
    await publish({ 
      channel_id: post.channel_id, 
      text, 
      media_type: post.media_type, 
      file_id: post.file_id 
    });
    setBusy(false);
    (window as any).Telegram?.WebApp?.showAlert('Отправлено!');
    clear();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-tg-dark-800 rounded-2xl shadow-tg-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4 m-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-tg-blue-900 dark:text-white">
            Редактор поста
          </h3>
          <button 
            onClick={clear} 
            className="text-tg-gray-500 hover:text-tg-gray-700 dark:text-tg-gray-400 dark:hover:text-tg-gray-200 text-xl"
          >
            ✕
          </button>
        </div>

        {post.media_type && (
          <div className="mb-4">
            <MediaRenderer post={post} compact={false} />
          </div>
        )}
        
        <textarea
          className="w-full border border-tg-blue-100 dark:border-tg-dark-700 rounded-xl p-4 h-48 bg-tg-blue-50 dark:bg-tg-dark-700 text-tg-dark-800 dark:text-white placeholder-tg-blue-400 focus:border-tg-blue-500 focus:ring-2 focus:ring-tg-blue-500/20 resize-none"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Текст поста..."
        />
        
        <div className="flex gap-3 justify-end">
          <button 
            onClick={handleRewrite} 
            disabled={busy} 
            className="px-4 py-2 rounded-xl bg-tg-purple-500 hover:bg-tg-purple-600 disabled:bg-tg-gray-400 text-white font-medium transition-colors"
          >
            {busy ? '⏳' : '🤖'} GPT
          </button>
          <button 
            onClick={handlePublish} 
            disabled={busy} 
            className="px-4 py-2 rounded-xl bg-tg-blue-500 hover:bg-tg-blue-600 disabled:bg-tg-gray-400 text-white font-medium transition-colors"
          >
            {busy ? '⏳' : '📤'} Опубликовать
          </button>
        </div>
      </div>
    </div>
  );
}