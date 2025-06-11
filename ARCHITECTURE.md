# SMM Bot - Архитектура проекта

## Обзор

SMM Bot - это современное веб-приложение для управления контентом в социальных сетях через Telegram. Проект построен с использованием современных технологий и следует принципам clean architecture.

## Структура проекта

```
smm_web_app/
├── frontend/                 # React TypeScript приложение
│   ├── src/
│   │   ├── components/       # Переиспользуемые компоненты (legacy)
│   │   │   ├── pages/
│   │   │   └── components/
│   │   │   ├── features/         # Feature-based модули
│   │   │   │   ├── auth/         # Авторизация
│   │   │   │   └── sources/      # Управление источниками
│   │   │   └── settings/     # Настройки
│   │   ├── hooks/            # Кастомные React хуки
│   │   ├── layouts/          # Компоненты лейаута
│   │   ├── pages/            # Основные страницы
│   │   ├── services/         # API сервисы
│   │   ├── store/            # Состояние приложения (будущее)
│   │   ├── styles/           # Стили
│   │   ├── types/            # TypeScript типы
│   │   ├── utils/            # Утилитарные функции
│   │   └── constants/        # Константы
│   ├── public/
│   └── package.json
├── backend/                  # FastAPI Python приложение
│   ├── app/
│   │   ├── api/              # API роуты
│   │   ├── core/             # Основная конфигурация
│   │   ├── database/         # Подключение к БД
│   │   ├── models/           # SQLAlchemy модели
│   │   ├── schemas/          # Pydantic схемы
│   │   ├── services/         # Бизнес-логика
│   │   └── utils/            # Утилиты
│   ├── tests/                # Тесты
│   ├── main.py              # Точка входа (legacy)
│   └── requirements.txt
└── README.md
```

## Frontend архитектура

### Технологический стек
- **React 19** - UI библиотека
- **TypeScript** - Типизация
- **Vite** - Сборщик
- **TailwindCSS** - Стили
- **Lucide React** - Иконки
- **Axios** - HTTP клиент

### Архитектурные принципы

#### 1. Feature-based структура
Каждая функциональность выделена в отдельный модуль:
- `features/auth/` - Авторизация
- `features/sources/` - Управление источниками
- `features/posts/` - Работа с постами
- `features/settings/` - Настройки

#### 2. Разделение ответственности
- **Pages** - Страницы приложения
- **Components** - Переиспользуемые компоненты
- **Hooks** - Кастомная логика
- **Services** - API взаимодействие
- **Utils** - Утилитарные функции
- **Types** - TypeScript типы

#### 3. Кастомные хуки
- `useAuth` - Управление авторизацией
- `useTheme` - Управление темой
- `useApi` - API запросы (планируется)

### Ключевые компоненты

#### Лейауты
- `AppLayout` - Основной лейаут с хедером
- `Navigation` - Нижняя навигация

#### Страницы
- `HomePage` - Главная страница с роутингом
- `AuthPage` - Авторизация
- `SourcesPage` - Управление источниками
- `PostsPage` - Лента постов
- `SelectedPostsPage` - Отобранные посты
- `SettingsPage` - Настройки

## Backend архитектура

### Технологический стек
- **FastAPI** - Web фреймворк
- **SQLAlchemy** - ORM
- **Pydantic** - Валидация данных
- **SQLite** - База данных
- **Telethon** - Telegram API
- **OpenAI** - AI интеграция

### Архитектурные принципы

#### 1. Layered Architecture
- **API Layer** - HTTP endpoints
- **Service Layer** - Бизнес-логика
- **Data Layer** - Работа с БД
- **External Layer** - Внешние API

#### 2. Dependency Injection
Использование FastAPI DI для управления зависимостями

#### 3. Schema-first подход
Pydantic схемы для валидации и сериализации

### Структура модулей

#### Core
- `config.py` - Конфигурация приложения
- `security.py` - Безопасность (планируется)

#### Database
- `connection.py` - Подключение к БД
- `models/` - SQLAlchemy модели

#### API
- `router.py` - Главный роутер
- `auth/` - Авторизация
- `sources/` - Источники
- `posts/` - Посты

#### Services
- `telegram_service.py` - Работа с Telegram
- `openai_service.py` - AI сервис
- `parser_service.py` - Парсинг контента

## Принципы разработки

### 1. Type Safety
- Полная типизация TypeScript на frontend
- Pydantic схемы на backend
- Строгие типы для API контрактов

### 2. Error Handling
- Централизованная обработка ошибок
- Пользовательские сообщения об ошибках
- Логирование ошибок

### 3. Performance
- Lazy loading компонентов
- Оптимизация запросов к API
- Кэширование данных

### 4. Accessibility
- Семантическая разметка
- Поддержка клавиатуры
- ARIA атрибуты

### 5. Responsive Design
- Mobile-first подход
- Адаптивная верстка
- Touch-friendly интерфейс

## API Design

### RESTful принципы
- Четкие URL паттерны
- HTTP методы по назначению
- Статус коды по стандарту

### Схема API
```
/api/
├── /auth/
│   ├── POST /status
│   ├── POST /send-code
│   ├── POST /verify-code
│   └── POST /logout
├── /sources/
│   ├── GET /
│   ├── POST /
│   └── DELETE /{id}
├── /posts/
│   ├── GET /
│   └── POST /select
└── /selected-posts/
    ├── GET /
    ├── PUT /{id}
    └── DELETE /{id}
```

## Безопасность

### Frontend
- Валидация пользовательского ввода
- Санитизация данных
- HTTPS only

### Backend
- Валидация Pydantic схем
- SQL injection защита
- Rate limiting (планируется)

## Тестирование

### Frontend
- Unit тесты для утилит
- Component тесты
- E2E тесты (планируется)

### Backend
- Unit тесты для сервисов
- Integration тесты для API
- Database тесты

## Развертывание

### Development
```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
pip install -r requirements.txt
python app/main.py
```

### Production
- Docker контейнеры
- Nginx reverse proxy
- SSL сертификаты
- Мониторинг

## Миграция с legacy кода

### Этапы миграции
1. ✅ Создание новой архитектуры
2. ✅ Базовые компоненты и хуки
3. 🔄 Перенос функциональности по модулям
4. 📋 Рефакторинг API
5. 📋 Оптимизация и тестирование

### Legacy компоненты
Старые компоненты остаются в `components/` до полной миграции:
- `PostsList.tsx`
- `PostCard.tsx`
- `MediaRenderer.tsx`
- `AlbumRenderer.tsx`
- `ChannelSelect.tsx`

## Roadmap

### Ближайшие задачи
- [ ] Завершить миграцию компонентов
- [ ] Добавить state management (Zustand/Redux)
- [ ] Реализовать real-time обновления
- [ ] Добавить offline support

### Долгосрочные цели
- [ ] Микросервисная архитектура
- [ ] GraphQL API
- [ ] PWA функциональность
- [ ] Мобильное приложение

## Заключение

Новая архитектура обеспечивает:
- **Масштабируемость** - легко добавлять новые функции
- **Поддерживаемость** - четкое разделение ответственности
- **Типобезопасность** - минимум runtime ошибок
- **Developer Experience** - удобная разработка
- **Performance** - оптимизированная работа 