#!/bin/bash

echo "🔧 Запуск SMM приложения с максимальными правами"

# Остановить все процессы
echo "🛑 Останавливаем старые процессы..."
pkill -f "uvicorn\|python.*main.py" 2>/dev/null || true

# Создать рабочую директорию в /tmp
echo "📁 Создаем рабочую директорию в /tmp..."
mkdir -p /tmp/smm_work
chmod 777 /tmp/smm_work
cd /tmp/smm_work

# Скопировать проект если его нет
if [ ! -d "smm_web_app" ]; then
    echo "📋 Копируем проект в /tmp..."
    cp -r /home/incube/Documents/smm_web_app .
    chmod -R 777 smm_web_app
fi

cd smm_web_app/backend

# Удалить все старые базы и сессии
echo "🗑️ Очищаем старые данные..."
rm -f /tmp/smm_app.db*
rm -rf sessions/
mkdir -p sessions
chmod 777 sessions

# Установить umask для создания файлов с полными правами
umask 000

# Проверить виртуальное окружение
if [ ! -d "venv" ]; then
    echo "🐍 Создаем виртуальное окружение..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    echo "🐍 Активируем виртуальное окружение..."
    source venv/bin/activate
fi

# Установить переменные окружения
export DATABASE_URL="sqlite:////tmp/smm_app.db"
export PYTHONPATH="/tmp/smm_work/smm_web_app/backend"

# Дать права на базу данных
touch /tmp/smm_app.db
chmod 666 /tmp/smm_app.db

echo "🚀 Запускаем приложение..."
echo "📍 Рабочая директория: $(pwd)"
echo "💾 База данных: /tmp/smm_app.db"
echo "📁 Сессии: $(pwd)/sessions/"

# Запустить приложение
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload --log-level debug 