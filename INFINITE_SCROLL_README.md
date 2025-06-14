# 📱 Лента постов с ограниченным парсингом

## 🎯 Описание функциональности

Реализована умная лента с автоматической загрузкой 10 последних постов при открытии и ручным парсингом **только 5 постов** по кнопке. При открытии ленты сразу загружаются последние 10 постов из базы данных, а дальнейшая загрузка происходит по кнопке с ограниченным парсингом при необходимости.

## ✨ Особенности

- **Автозагрузка**: При открытии сразу загружаются 10 последних постов из базы данных
- **Автопарсинг**: Если в базе нет постов, автоматически парсятся 5 новых постов
- **Ручное управление**: Дальнейшая загрузка только по кнопке для полного контроля
- **Ограниченный парсинг**: Парсится только 5 постов за раз для быстрой загрузки
- **Потоковая загрузка**: Посты появляются сразу после обработки каждого
- **Умная кнопка**: Меняет текст с "Загрузить еще 5 постов" на "Парсить 5 новых постов"
- **Индикаторы состояния**: Отдельные индикаторы для загрузки и парсинга
- **Полная очистка сервера**: Кнопка для удаления всех спаршенных постов и медиафайлов
- **Случайные каналы**: Для каждой порции выбираются до 3 случайных каналов
- **Хронологический порядок**: Новые посты сверху, старые снизу
- **Уникальные ключи**: Исправлены дублирующиеся ключи React

## 🔧 Технические детали

### Backend API

**Основные эндпоинты:**

1. `GET /api/posts/paginated` - загрузка постов из базы
2. `POST /api/parse-limited` - ограниченный парсинг (только 5 постов)

**Параметры для `/api/posts/paginated`:**
- `offset` (int): Смещение для пагинации (по умолчанию: 0)
- `limit` (int): Количество постов для загрузки (по умолчанию: 5)
- `random_channels` (bool): Использовать случайный выбор каналов (по умолчанию: true)

**Ответ:**
```json
{
  "posts": [...],
  "has_more": true,
  "total": 150,
  "offset": 0,
  "limit": 5
}
```

**Ответ от `/api/parse-limited`:**
```json
{
  "status": "success",
  "message": "Ограниченный парсинг завершен. Добавлено 3 новых постов",
  "total_new_posts": 3,
  "results": [...]
}
```

### Frontend компоненты

1. **PostsList** - обновлен с поддержкой infinite scroll
2. **FeedTab** - новый компонент для ленты
3. **App** - добавлена новая вкладка "Лента"

## 🚀 Как использовать

1. **Запустите backend:**
   ```bash
   cd backend
   python main.py
   ```

2. **Запустите frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Откройте приложение** и перейдите на вкладку "Посты"

4. **Автоматически загрузятся 10 последних постов** из базы данных (если база пуста, автоматически запустится парсинг 5 постов)

5. **Нажимайте кнопку "Загрузить еще 5 постов"** для загрузки дополнительных постов из базы

6. **Когда посты в базе закончатся**, кнопка изменится на "Парсить 5 новых постов" и будет запускать ограниченный парсинг

7. **Используйте кнопку "Очистить сервер"** для полного удаления всех данных с сервера

## 🧪 Тестирование

Запустите тестовые скрипты для проверки API:

```bash
# Тестирование ограниченного парсинга
python test_limited_parsing.py

# Общее тестирование API
python test_api.py
```

## 📊 Алгоритм работы

1. **Выбор каналов**: Из всех активных источников случайно выбираются до 3 каналов
2. **Загрузка постов**: С каждого выбранного канала берутся последние посты
3. **Сортировка**: Все посты сортируются по дате (новые сначала)
4. **Ограничение**: Возвращается только запрошенное количество постов
5. **Пагинация**: Следующие запросы используют offset для получения новых постов

## 🎨 UI/UX особенности

- **Статистика**: Показывается количество загруженных и общих постов
- **Индикаторы**: Спиннеры загрузки и текстовые подсказки
- **Адаптивность**: Работает на всех размерах экранов
- **Темная тема**: Поддержка светлой и темной темы

## 🔄 Обновление ленты

- Кнопка "Обновить ленту" сбрасывает все загруженные посты и начинает заново
- Автоматическое обновление при изменении источников

## 🎯 Преимущества

1. **Производительность**: Загружаются только нужные посты
2. **Разнообразие**: Случайный выбор каналов обеспечивает разнообразный контент
3. **UX**: Плавная загрузка без перезагрузки страницы
4. **Масштабируемость**: Работает с любым количеством источников и постов

## 🛠️ Настройки

Можно легко изменить:
- Количество постов на страницу (параметр `limit`)
- Количество случайных каналов (в коде backend)
- Режим отображения (grid, list, compact, telegram)
- Порог для Intersection Observer

## 🐛 Отладка

Включите режим отладки в PostsList для просмотра дополнительной информации:
- Количество загруженных постов
- Статус infinite scroll
- Информация о фильтрах 