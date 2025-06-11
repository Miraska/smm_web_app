# 🚀 SMM Web App

Веб-приложение для управления социальными медиа с интеграцией Telegram API.

## ✨ Особенности

- 🔐 Многопользовательская авторизация через Telegram
- 📊 Парсинг постов из Telegram каналов
- 🗄️ Хранение данных в SQLite
- 🌐 REST API на FastAPI
- ⚡ Современный веб-интерфейс

## 🛠️ Технологии

- **Backend**: FastAPI, Python 3.8+
- **Database**: SQLite + SQLAlchemy
- **Telegram API**: Pyrogram
- **Frontend**: HTML, CSS, JavaScript

## 📦 Установка

### 1. Клонирование репозитория
```bash
git clone https://github.com/yourusername/smm_web_app.git
cd smm_web_app
```

### 2. Создание виртуального окружения
```bash
python -m venv venv
source venv/bin/activate  # На macOS/Linux
# или
venv\Scripts\activate     # На Windows
```

### 3. Установка зависимостей
```bash
pip install -r requirements.txt
```

### 4. Настройка Telegram API
1. Зарегистрируйтесь на https://my.telegram.org/
2. Создайте новое приложение
3. Создайте файл `.env` в корне проекта:
```env
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
```

### 5. Запуск приложения
```bash
# Запуск backend
cd backend
python main.py

# Приложение будет доступно по адресу http://localhost:8000
```

## 🎯 Использование

1. **Авторизация**: Откройте http://localhost:8000 и авторизуйтесь через Telegram
2. **Добавление каналов**: Добавьте каналы для парсинга постов
3. **Парсинг**: Используйте кнопки парсинга для получения постов

## 📚 API Endpoints

### Пользователи
- `GET /api/users` - Список пользователей
- `GET /api/telegram/status` - Статус текущего пользователя

### Авторизация
- `POST /api/telegram/send-code` - Отправка кода авторизации
- `POST /api/telegram/verify-code` - Подтверждение кода
- `POST /api/telegram/logout` - Выход из системы

### Каналы и посты
- `GET /api/telegram/channels` - Список каналов
- `POST /api/posts/parse-all` - Парсинг всех постов
- `POST /api/posts/parse-more` - Парсинг новых постов

## 🔧 Конфигурация

### Переменные окружения (.env)
```env
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
DATABASE_URL=sqlite:///posts.db
LOG_LEVEL=INFO
```

## 🚨 Безопасность

⚠️ **ВАЖНО**: Файлы сессий Telegram (`sessions/`) содержат конфиденциальную информацию и НЕ должны загружаться в Git репозиторий. Они автоматически исключены через `.gitignore`.

## 🤝 Многопользовательский режим

Приложение поддерживает работу нескольких пользователей:

- Каждый пользователь имеет свою сессию Telegram
- Переключение между пользователями через API
- Автоматическое сохранение сессий между перезапусками

## 📝 Логи и отладка

- Логи сохраняются в консоли при запуске
- Используйте `check_sessions.py` для проверки состояния сессий
- API документация доступна по адресу http://localhost:8000/docs

## 🛠️ Разработка

### Структура проекта
```
smm_web_app/
├── backend/
│   ├── main.py              # Основной файл приложения
│   ├── models.py            # Модели базы данных
│   ├── telegram_parser.py   # Парсер Telegram
│   └── multi_user_telegram.py # Многопользовательская система
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── scripts.js
├── requirements.txt
├── .env.example
└── README.md
```

### Тестирование
```bash
python test_multiuser.py
```

## 📄 Лицензия

MIT License

## 🆘 Поддержка

При возникновении проблем:
1. Проверьте логи приложения
2. Убедитесь в правильности настройки Telegram API
3. Проверьте состояние сессий с помощью `check_sessions.py` 