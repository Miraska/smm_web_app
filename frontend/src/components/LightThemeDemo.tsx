import React from 'react';
import { Button } from './Button';
import { StatusMessage } from './StatusMessage';
import { Star, Heart, Share, Download, Settings } from 'lucide-react';

export const LightThemeDemo: React.FC = () => {
  return (
    <div className="space-y-8 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold light-theme-text-accent mb-2">
          Улучшенная светлая тема
        </h1>
        <p className="light-theme-text-secondary">
          Демонстрация всех новых улучшений интерфейса
        </p>
      </div>

      {/* Кнопки */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold light-theme-text-primary text-white">Кнопки</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" leftIcon={<Star className="w-4 h-4" />}>
            Основная
          </Button>
          <Button variant="secondary" leftIcon={<Heart className="w-4 h-4" />}>
            Вторичная
          </Button>
          <Button variant="success" leftIcon={<Download className="w-4 h-4" />}>
            Успех
          </Button>
          <Button variant="warning" leftIcon={<Settings className="w-4 h-4" />}>
            Предупреждение
          </Button>
          <Button variant="error" leftIcon={<Share className="w-4 h-4" />}>
            Ошибка
          </Button>
          <Button variant="outline">Контур</Button>
          <Button variant="ghost">Призрак</Button>
          <Button loading>Загрузка...</Button>
        </div>
      </section>

      {/* Статусные сообщения */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold light-theme-text-primary text-white">Статусные сообщения</h2>
        <div className="space-y-3">
          <StatusMessage
            type="success"
            title="Успешно!"
            message="Операция выполнена успешно. Все данные сохранены."
          />
          <StatusMessage
            type="error"
            title="Ошибка"
            message="Не удалось выполнить операцию. Проверьте соединение."
          />
          <StatusMessage
            type="warning"
            title="Внимание"
            message="Действие требует подтверждения перед выполнением."
          />
          <StatusMessage
            type="info"
            title="Информация"
            message="Новые обновления доступны для загрузки."
          />
          <StatusMessage
            type="loading"
            message="Загрузка данных, пожалуйста подождите..."
          />
        </div>
      </section>

      {/* Карточки */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold light-theme-text-primary text-white">Карточки</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="tg-card p-6">
            <h3 className="font-semibold light-theme-text-primary mb-2">Обычная карточка</h3>
            <p className="light-theme-text-secondary text-sm">
              Карточка с улучшенными эффектами стекла и тенями для светлой темы.
            </p>
            <div className="mt-4">
              <Button variant="primary" size="sm">Действие</Button>
            </div>
          </div>
          
          <div className="light-theme-card p-6">
            <h3 className="font-semibold light-theme-text-primary mb-2">Стеклянная карточка</h3>
            <p className="light-theme-text-secondary text-sm">
              Карточка с эффектом стекла и размытием фона.
            </p>
            <div className="mt-4">
              <Button variant="secondary" size="sm">Попробовать</Button>
            </div>
          </div>
          
          <div className="light-theme-glass p-6 rounded-lg">
            <h3 className="font-semibold light-theme-text-primary mb-2">Полное стекло</h3>
            <p className="light-theme-text-secondary text-sm">
              Полноценный стеклянный эффект с максимальной прозрачностью.
            </p>
            <div className="mt-4">
              <Button variant="outline" size="sm">Изучить</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Поля ввода */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold light-theme-text-primary text-white">Поля ввода</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Обычное поле ввода"
            className="tg-input px-4 py-2 rounded-lg border"
          />
          <input
            type="text"
            placeholder="Улучшенное поле"
            className="light-theme-input px-4 py-2 rounded-lg"
          />
        </div>
      </section>

      {/* Эффекты наведения */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold light-theme-text-primary text-white">Интерактивные эффекты</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="light-theme-hover-lift tg-card p-6 cursor-pointer">
            <h3 className="font-semibold light-theme-text-primary mb-2">Hover эффект</h3>
            <p className="light-theme-text-secondary text-sm">
              Наведите мышь для анимации подъема.
            </p>
          </div>
          
          <div className="light-theme-accent-pulse light-theme-card p-6">
            <h3 className="font-semibold light-theme-text-primary mb-2">Пульсация</h3>
            <p className="light-theme-text-secondary text-sm">
              Анимированная пульсация акцентного цвета.
            </p>
          </div>
          
          <div className="tg-card p-6 light-theme-shadow-xl">
            <h3 className="font-semibold light-theme-text-primary mb-2">Улучшенные тени</h3>
            <p className="light-theme-text-secondary text-sm">
              Многослойные тени для глубины.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}; 