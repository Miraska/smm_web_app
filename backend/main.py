import os
import asyncio
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from dotenv import load_dotenv

from db import engine, Base, get_session
from models import Source, Post, SelectedPost, User
from telegram_parser import telegram_parser
from multi_user_telegram import multi_user_manager

load_dotenv()

app = FastAPI(title='SMM Bot Web App')

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Статические файлы для медиа
media_path = os.path.abspath("../frontend/public/media")
os.makedirs(media_path, exist_ok=True)  # Создаем папку если её нет
print(f"Медиа папка: {media_path}")

# Создаем кастомный обработчик для медиафайлов
@app.get("/media/{channel_id}/{filename}")
async def get_media_file(channel_id: str, filename: str):
    """Обработка запросов к медиафайлам"""
    # Убираем минусы из channel_id для поиска файла
    channel_clean = channel_id.replace('-', '')
    file_path = os.path.join(media_path, channel_clean, filename)
    
    # Также проверяем путь с оригинальным channel_id
    if not os.path.exists(file_path):
        file_path = os.path.join(media_path, channel_id, filename)
    
    if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
        return FileResponse(file_path)
    else:
        print(f"Файл не найден: {file_path}")
        print(f"Проверяли пути: {os.path.join(media_path, channel_clean, filename)} и {os.path.join(media_path, channel_id, filename)}")
        
        # Возвращаем JSON с информацией о недостающем файле вместо 404
        return {
            "error": "file_not_found",
            "message": "Медиафайл недоступен",
            "filename": filename,
            "channel_id": channel_id,
            "suggestion": "Файл мог быть удален из канала или недоступен для скачивания"
        }

# Create database tables
Base.metadata.create_all(bind=engine)

@app.on_event("startup")
async def startup_event():
    """Инициализация при запуске приложения"""
    try:
        # Инициализируем старый парсер для обратной совместимости
        await telegram_parser.initialize_client()
        print("🔧 Старый Telegram parser инициализирован (для совместимости)")
        
        print("🚀 Многопользовательский менеджер Telegram готов")
    except Exception as e:
        print(f"❌ Ошибка инициализации: {e}")

@app.on_event("shutdown") 
async def shutdown_event():
    """Очистка при завершении работы - НЕ удаляем файлы сессий!"""
    try:
        print("🔌 Завершаем работу приложения...")
        
        # Останавливаем старый парсер (для совместимости)
        await telegram_parser.stop()
        telegram_parser._auth_cache = None
        telegram_parser._auth_cache_time = None
        
        # Останавливаем всех пользователей
        await multi_user_manager.stop_all()
        
        print("✅ Все парсеры остановлены, сессии сохранены")
    except Exception as e:
        print(f"⚠️ Предупреждение при остановке: {e}")

# Pydantic models
class SourceCreate(BaseModel):
    channel_id: str
    channel_name: str
    channel_username: Optional[str] = None

class SourceResponse(BaseModel):
    id: int
    channel_id: str
    channel_name: str
    channel_username: Optional[str]
    is_active: bool
    added_at: datetime
    
    class Config:
        orm_mode = True

class PostResponse(BaseModel):
    id: int
    message_id: int
    channel_id: str
    channel_name: str
    text: str
    media_type: Optional[str]
    media_url: Optional[str]
    media_size: Optional[int]
    media_filename: Optional[str]
    media_duration: Optional[int]
    media_width: Optional[int]
    media_height: Optional[int]
    album_id: Optional[str]
    album_position: Optional[int]
    album_total: Optional[int]
    post_date: datetime
    is_selected: bool
    
    class Config:
        orm_mode = True

class SelectedPostResponse(BaseModel):
    id: int
    post_id: int
    original_text: str
    edited_text: Optional[str]
    status: str
    selected_at: datetime
    notes: Optional[str]
    
    class Config:
        orm_mode = True

class PostSelect(BaseModel):
    post_id: int
    notes: Optional[str] = None

class PostEdit(BaseModel):
    edited_text: str
    status: Optional[str] = "draft"
    notes: Optional[str] = None

# Telegram session models
class PhoneRequest(BaseModel):
    phone_number: str

class CodeVerification(BaseModel):
    phone_number: str
    phone_code: str
    phone_code_hash: str

class PasswordVerification(BaseModel):
    password: str

# === ИСТОЧНИКИ (Sources) ===
@app.get("/api/sources", response_model=List[SourceResponse])
def get_sources(search: str = None, db: Session = Depends(get_session)):
    """Получить список всех источников с возможностью поиска"""
    query = db.query(Source).filter(Source.is_active == True)
    
    if search:
        # Поиск по названию канала, username или ID
        search_pattern = f"%{search.lower()}%"
        query = query.filter(
            (Source.channel_name.ilike(search_pattern)) |
            (Source.channel_username.ilike(search_pattern)) |
            (Source.channel_id.ilike(search_pattern))
        )
    
    sources = query.order_by(Source.added_at.desc()).all()
    return [SourceResponse.from_orm(source) for source in sources]

@app.post("/api/sources", response_model=SourceResponse)
async def add_source(source: SourceCreate, db: Session = Depends(get_session)):
    """Добавить новый источник"""
    # Проверяем, не существует ли уже такой канал
    existing = db.query(Source).filter(Source.channel_id == source.channel_id).first()
    if existing:
        if not existing.is_active:
            existing.is_active = True
            db.commit()
            db.refresh(existing)
            return SourceResponse.from_orm(existing)
        raise HTTPException(status_code=400, detail="Канал уже добавлен")
    
    # Создаем новый источник
    source_data = source.dict()
    new_source = Source(**source_data)
    db.add(new_source)
    db.commit()
    db.refresh(new_source)
    
    return SourceResponse.from_orm(new_source)

async def parse_new_posts_for_source(channel_id: str, db: Session, current_parser=None):
    """Оптимизированный парсер новых постов для конкретного источника"""
    try:
        # Если парсер не передан, получаем текущего пользователя
        if not current_parser:
            current_parser = await multi_user_manager.get_current_user_parser(db)
            if not current_parser:
                print(f"⚠️ Нет авторизованных пользователей, пропускаем парсинг для {channel_id}")
                return
        
        is_authorized = await current_parser.is_authorized()
        if not is_authorized:
            print(f"⚠️ Не авторизован в Telegram, пропускаем парсинг для {channel_id}")
            return
        
        # Получаем последний пост для этого конкретного канала
        last_post_in_channel = db.query(Post).filter(
            Post.channel_id == channel_id
        ).order_by(Post.post_date.desc()).first()
        
        last_message_id = last_post_in_channel.message_id if last_post_in_channel else 0
        last_date = last_post_in_channel.post_date if last_post_in_channel else None
        
        print(f"📊 Оптимизированный автопарсинг {channel_id}: последний message_id={last_message_id}, дата={last_date}")
        
        # Умная проверка - парсим только новее последнего поста
        check_limit = 15  # Проверяем 15 последних постов из канала
        result = await current_parser.parse_channel_posts(
            channel_id, 
            limit=check_limit,
            until_date=last_date  # Парсим только новее последнего поста в БД
        )
        
        if result["status"] == "error":
            print(f"❌ Ошибка парсинга канала {channel_id}: {result['message']}")
            return
        
        posts_data = result.get("posts", [])
        print(f"📝 Получено {len(posts_data)} постов для проверки из канала {channel_id}")
        
        # Фильтруем только действительно новые посты
        new_posts_count = 0
        max_new_posts = 10  # Ограничиваем количество новых постов
        
        for post_data in posts_data:
            if new_posts_count >= max_new_posts:
                break
                
            try:
                message_id = post_data.get("message_id")
                post_date = post_data.get("post_date")
                
                # Быстрая проверка по message_id - пропускаем старые
                if message_id <= last_message_id:
                    continue
                
                # Проверяем, не существует ли уже этот пост (для надежности)
                existing_post = db.query(Post).filter(
                    Post.channel_id == post_data["channel_id"],
                    Post.message_id == message_id
                ).first()
                
                if not existing_post:
                    new_post = Post(**post_data)
                    db.add(new_post)
                    new_posts_count += 1
                    print(f"  ✅ Добавлен новый пост: message_id={message_id}, дата={post_date}")
                else:
                    print(f"  ⚠️ Пост {message_id} уже существует в БД")
                    
            except Exception as e:
                print(f"❌ Ошибка при сохранении поста {post_data.get('message_id', 'unknown')}: {e}")
                continue
        
        if new_posts_count > 0:
            try:
                db.commit()
                print(f"✅ Оптимизированный автопарсинг - добавлено {new_posts_count} новых постов для канала {channel_id}")
            except Exception as e:
                print(f"❌ Ошибка при коммите: {e}")
                db.rollback()
        else:
            print(f"📭 Новых постов не найдено для канала {channel_id}")
                
    except Exception as e:
        print(f"❌ Общая ошибка при оптимизированном парсинге канала {channel_id}: {e}")

@app.delete("/api/sources/{source_id}")
def remove_source(source_id: int, db: Session = Depends(get_session)):
    """Удалить источник со всеми связанными данными"""
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Источник не найден")
    
    channel_id = source.channel_id
    channel_name = source.channel_name
    
    try:
        # 1. Удаляем все отобранные посты связанные с этим каналом
        # Сначала получаем ID постов этого канала
        post_ids = db.query(Post.id).filter(Post.channel_id == channel_id).all()
        post_ids_list = [post_id[0] for post_id in post_ids]
        
        # Подсчитываем количество отобранных постов для отчета
        selected_count = db.query(SelectedPost).filter(SelectedPost.post_id.in_(post_ids_list)).count()
        
        # Удаляем отобранные посты одним запросом
        db.query(SelectedPost).filter(SelectedPost.post_id.in_(post_ids_list)).delete(synchronize_session=False)
        
        # 2. Удаляем все посты этого канала
        posts_count = db.query(Post).filter(Post.channel_id == channel_id).count()
        db.query(Post).filter(Post.channel_id == channel_id).delete(synchronize_session=False)
        
        # 3. Удаляем сам источник
        db.delete(source)
        
        # 4. Удаляем папку с медиафайлами канала
        import os
        import shutil
        
        media_path = os.path.abspath("../frontend/public/media")
        
        # Пробуем разные варианты названий папок
        possible_folders = [
            channel_id,
            channel_id.replace('-', ''),
            channel_id.replace('@', ''),
            channel_id.replace('/', '_'),
            channel_name.replace(' ', '_') if channel_name else None,
        ]
        
        deleted_folders = []
        freed_space = 0
        
        for folder_name in possible_folders:
            if folder_name:
                folder_path = os.path.join(media_path, folder_name)
                if os.path.exists(folder_path) and os.path.isdir(folder_path):
                    try:
                        # Подсчитываем размер папки перед удалением
                        folder_size = 0
                        for dirpath, dirnames, filenames in os.walk(folder_path):
                            for filename in filenames:
                                filepath = os.path.join(dirpath, filename)
                                try:
                                    folder_size += os.path.getsize(filepath)
                                except (OSError, FileNotFoundError):
                                    pass
                        
                        # Удаляем папку
                        shutil.rmtree(folder_path)
                        deleted_folders.append(folder_name)
                        freed_space += folder_size
                        print(f"📁 Удалена папка медиа: {folder_path} ({folder_size / 1024 / 1024:.2f} MB)")
                        
                    except Exception as e:
                        print(f"⚠️ Ошибка при удалении папки {folder_path}: {e}")
        
        # Коммитим изменения в базе данных
        db.commit()
        
        return {
            "message": f"Источник '{channel_name}' удален",
            "details": {
                "deleted_posts": posts_count,
                "deleted_selected_posts": selected_count,
                "deleted_media_folders": deleted_folders,
                "freed_space_mb": round(freed_space / 1024 / 1024, 2)
            }
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ Ошибка при удалении источника: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка при удалении источника: {str(e)}")

@app.post("/api/sources/parse-all")
async def parse_all_sources(db: Session = Depends(get_session)):
    """Парсинг всех активных источников"""
    # Получаем парсер для текущего пользователя
    current_parser = await multi_user_manager.get_current_user_parser(db)
    
    if not current_parser:
        raise HTTPException(status_code=401, detail="Нет авторизованных пользователей")
    
    is_authorized = await current_parser.is_authorized()
    if not is_authorized:
        raise HTTPException(status_code=401, detail="Не авторизован в Telegram")
    
    result = await current_parser.parse_all_sources_limited(db, limit=10)
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@app.post("/api/sources/parse-new/{channel_id}")
async def parse_new_source(channel_id: str, db: Session = Depends(get_session)):
    """Оптимизированный быстрый парсинг для нового источника"""
    print(f"🚀 Оптимизированный автопарсинг нового источника: {channel_id}")
    
    # Получаем парсер для текущего пользователя
    current_parser = await multi_user_manager.get_current_user_parser(db)
    
    if not current_parser:
        return {"message": "Нет авторизованных пользователей", "new_posts": 0}
    
    is_authorized = await current_parser.is_authorized()
    if not is_authorized:
        return {"message": "Не авторизован в Telegram", "new_posts": 0}
    
    try:
        # Получаем последний пост из этого канала
        last_post_in_channel = db.query(Post).filter(
            Post.channel_id == channel_id
        ).order_by(Post.post_date.desc()).first()
        
        last_message_id = last_post_in_channel.message_id if last_post_in_channel else 0
        last_date = last_post_in_channel.post_date if last_post_in_channel else None
        
        print(f"📊 Последний пост в БД для канала {channel_id}: message_id={last_message_id}, дата={last_date}")
        
        # Парсим только новые посты
        check_limit = 20  # Проверяем 20 последних постов из канала
        result = await current_parser.parse_channel_posts(
            channel_id, 
            limit=check_limit,
            until_date=last_date  # Парсим только новее последнего поста в БД
        )
        
        if result["status"] == "error":
            return {"message": f"Ошибка парсинга: {result['message']}", "new_posts": 0}
        
        posts_data = result.get("posts", [])
        new_posts_count = 0
        
        print(f"📝 Получено {len(posts_data)} постов для проверки")
        
        for post_data in posts_data:
            message_id = post_data.get("message_id")
            post_date = post_data.get("post_date")
            
            # Быстрая проверка по message_id - пропускаем старые
            if message_id <= last_message_id:
                continue
            
            # Быстрая проверка на дубликат в БД
            existing_post = db.query(Post).filter(
                Post.channel_id == post_data["channel_id"],
                Post.message_id == message_id
            ).first()
            
            if not existing_post:
                try:
                    new_post = Post(**post_data)
                    db.add(new_post)
                    new_posts_count += 1
                    print(f"  ✅ Добавлен новый пост: message_id={message_id}, дата={post_date}")
                except Exception as e:
                    print(f"❌ Ошибка при сохранении поста {message_id}: {e}")
                    continue
            else:
                print(f"  ⚠️ Пост {message_id} уже существует в БД")
        
        if new_posts_count > 0:
            try:
                db.commit()
                print(f"✅ Добавлено {new_posts_count} новых постов для канала {channel_id}")
            except Exception as e:
                print(f"❌ Ошибка при коммите: {e}")
                db.rollback()
                new_posts_count = 0
        else:
            print(f"📭 Новых постов не найдено для канала {channel_id}")
        
        return {
            "message": f"Оптимизированный автопарсинг завершен. Добавлено {new_posts_count} постов",
            "new_posts": new_posts_count,
            "optimization": "enabled"
        }
        
    except Exception as e:
        print(f"❌ Ошибка при оптимизированном автопарсинге канала {channel_id}: {e}")
        return {"message": f"Ошибка: {str(e)}", "new_posts": 0}

# === ПОСТЫ ===
@app.get("/api/posts", response_model=List[PostResponse])
def get_posts(db: Session = Depends(get_session)):
    """Получить все посты с активных источников"""
    # Получаем ID активных источников
    active_sources = db.query(Source).filter(Source.is_active == True).all()
    if not active_sources:
        return []
    
    source_ids = [s.channel_id for s in active_sources]
    posts = db.query(Post).filter(Post.channel_id.in_(source_ids)).order_by(Post.post_date.desc()).all()
    return [PostResponse.from_orm(post) for post in posts]

@app.get("/api/posts/paginated")
def get_posts_paginated(
    offset: int = 0, 
    limit: int = 10, 
    db: Session = Depends(get_session)
):
    """Получить посты с пагинацией"""
    # Получаем активные источники
    active_sources = db.query(Source).filter(Source.is_active == True).all()
    if not active_sources:
        return {"posts": [], "has_more": False, "total": 0}
    
    source_ids = [s.channel_id for s in active_sources]
    
    # Создаем базовый запрос
    query = db.query(Post).filter(Post.channel_id.in_(source_ids))
    
    # Получаем общее количество постов
    total_posts = query.count()
    
    # Получаем посты с пагинацией, сортировка по дате (новые сверху)
    posts = query.order_by(Post.post_date.desc()).offset(offset).limit(limit).all()
    
    # Проверяем есть ли еще посты в БД
    has_more = offset + len(posts) < total_posts
    
    print(f"📊 Пагинация: offset={offset}, limit={limit}, загружено={len(posts)}, всего={total_posts}, has_more={has_more}")
    
    return {
        "posts": [PostResponse.from_orm(post) for post in posts],
        "has_more": has_more,
        "total": total_posts,
        "offset": offset,
        "limit": limit,
        "loaded_count": len(posts)
    }

@app.post("/api/posts/select")
def select_post(post_select: PostSelect, db: Session = Depends(get_session)):
    """Отобрать пост для дальнейшей работы"""
    post = db.query(Post).filter(Post.id == post_select.post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Пост не найден")
    
    # Проверяем, не отобран ли уже этот пост
    existing = db.query(SelectedPost).filter(SelectedPost.post_id == post_select.post_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Пост уже отобран")
    
    # Создаем отобранный пост
    selected_post = SelectedPost(
        post_id=post.id,
        original_text=post.text,
        notes=post_select.notes
    )
    db.add(selected_post)
    
    # Отмечаем пост как отобранный
    post.is_selected = True
    db.commit()
    
    return {"message": "Пост отобран"}

# === ОТОБРАННЫЕ ПОСТЫ ===
@app.get("/api/selected-posts", response_model=List[SelectedPostResponse])
def get_selected_posts(db: Session = Depends(get_session)):
    """Получить все отобранные посты"""
    selected_posts = db.query(SelectedPost).order_by(SelectedPost.selected_at.desc()).all()
    return [SelectedPostResponse.from_orm(post) for post in selected_posts]

@app.put("/api/selected-posts/{selected_post_id}")
def edit_selected_post(selected_post_id: int, post_edit: PostEdit, db: Session = Depends(get_session)):
    """Редактировать отобранный пост"""
    selected_post = db.query(SelectedPost).filter(SelectedPost.id == selected_post_id).first()
    if not selected_post:
        raise HTTPException(status_code=404, detail="Отобранный пост не найден")
    
    selected_post.edited_text = post_edit.edited_text
    if post_edit.status:
        selected_post.status = post_edit.status
    if post_edit.notes:
        selected_post.notes = post_edit.notes
    
    db.commit()
    return {"message": "Пост обновлен"}

@app.delete("/api/selected-posts/{selected_post_id}")
def remove_selected_post(selected_post_id: int, db: Session = Depends(get_session)):
    """Удалить из отобранных"""
    selected_post = db.query(SelectedPost).filter(SelectedPost.id == selected_post_id).first()
    if not selected_post:
        raise HTTPException(status_code=404, detail="Отобранный пост не найден")
    
    # Снимаем отметку с оригинального поста
    original_post = db.query(Post).filter(Post.id == selected_post.post_id).first()
    if original_post:
        original_post.is_selected = False
    
    db.delete(selected_post)
    db.commit()
    return {"message": "Пост удален из отобранных"}

@app.delete("/api/posts/clear-all")
async def clear_all_posts(db: Session = Depends(get_session)):
    """Полная очистка всех постов из базы данных"""
    try:
        print("🛑 Безопасно завершаем Telegram клиент перед очисткой постов...")
        # Безопасно завершаем Telegram клиент
        try:
            await telegram_parser.stop()
        except Exception as stop_error:
            print(f"⚠️ Предупреждение при остановке клиента: {stop_error}")
        
        # Очищаем кэш авторизации
        telegram_parser.clear_auth_cache()
        print("🗑️ Кэш авторизации очищен")
        
        # Подсчитываем количество постов перед удалением
        total_posts = db.query(Post).count()
        total_selected = db.query(SelectedPost).count()
        
        print(f"📊 Найдено {total_posts} постов и {total_selected} отобранных постов для удаления")
        
        # Удаляем все отобранные посты
        db.query(SelectedPost).delete()
        
        # Удаляем все посты
        db.query(Post).delete()
        
        db.commit()
        
        print(f"✅ Удаление завершено: {total_posts} постов и {total_selected} отобранных постов")
        
        return {
            "status": "success",
            "message": f"Удалено {total_posts} постов и {total_selected} отобранных постов",
            "deleted_posts": total_posts,
            "deleted_selected": total_selected
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ Ошибка при очистке постов: {e}")
        return {
            "status": "error",
            "message": f"Ошибка при очистке постов: {str(e)}"
        }

# === TELEGRAM СЕССИЯ ===
@app.get("/api/telegram/status")
async def get_telegram_status(db: Session = Depends(get_session)):
    """Проверить статус авторизации текущего пользователя"""
    try:
        # Получаем парсер для текущего пользователя
        current_parser = await multi_user_manager.get_current_user_parser(db)
        
        if not current_parser:
            return {
                "authorized": False,
                "message": "Нет активных пользователей",
                "timestamp": datetime.now().isoformat()
            }
        
        # Проверяем авторизацию (используем кэш для уменьшения нагрузки на API)
        is_authorized = await current_parser.is_authorized()
        
        # Диагностическая информация
        session_file = f"sessions/{current_parser.session_name}.session"
        session_exists = os.path.exists(session_file)
        client_connected = current_parser.client.is_connected if current_parser.client else False
        client_initialized = current_parser._initialized
        
        # Информация о текущем пользователе
        current_user = db.query(User).filter(
            User.is_active == True,
            User.last_login.isnot(None)
        ).order_by(User.last_login.desc()).first()
        
        user_info = None
        if current_user:
            user_info = {
                "name": current_user.name,
                "phone_number": current_user.phone_number,
                "last_login": current_user.last_login.isoformat() if current_user.last_login else None
            }
        
        return {
            "authorized": is_authorized,
            "current_user": user_info,
            "session_file_exists": session_exists,
            "client_connected": client_connected,
            "client_initialized": client_initialized,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"❌ Ошибка проверки статуса Telegram: {e}")
        return {
            "authorized": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.get("/api/users")
async def get_users(db: Session = Depends(get_session)):
    """Получить список всех пользователей"""
    users = db.query(User).order_by(User.last_login.desc()).all()
    return [
        {
            "id": user.id,
            "name": user.name,
            "phone_number": user.phone_number,
            "is_active": user.is_active,
            "last_login": user.last_login.isoformat() if user.last_login else None,
            "created_at": user.created_at.isoformat()
        }
        for user in users
    ]

@app.post("/api/telegram/send-code")
async def send_phone_code(phone_request: PhoneRequest):
    """Отправить код подтверждения на телефон"""
    try:
        result = await multi_user_manager.send_phone_code(phone_request.phone_number)
        if result["status"] == "error":
            error_message = result["message"]
            
            # Специальная обработка FLOOD_WAIT ошибок
            if "FLOOD_WAIT" in error_message:
                # Извлекаем время ожидания из сообщения
                import re
                wait_match = re.search(r'wait of (\d+) seconds', error_message)
                if wait_match:
                    wait_seconds = int(wait_match.group(1))
                    wait_minutes = wait_seconds // 60
                    wait_hours = wait_minutes // 60
                    
                    if wait_hours > 0:
                        wait_text = f"{wait_hours} час(ов) {wait_minutes % 60} минут"
                    else:
                        wait_text = f"{wait_minutes} минут"
                    
                    friendly_message = (
                        f"Telegram временно заблокировал отправку кодов на ваш номер. "
                        f"Нужно подождать {wait_text}. "
                        f"Это происходит при частых запросах авторизации. "
                        f"Попробуйте позже или используйте другой номер телефона."
                    )
                    
                    raise HTTPException(
                        status_code=429,  # Too Many Requests
                        detail={
                            "error": "FLOOD_WAIT",
                            "message": friendly_message,
                            "wait_seconds": wait_seconds,
                            "wait_minutes": wait_minutes,
                            "wait_hours": wait_hours if wait_hours > 0 else None
                        }
                    )
            
            raise HTTPException(status_code=400, detail=result["message"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        error_message = str(e)
        if "FLOOD_WAIT" in error_message:
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "FLOOD_WAIT", 
                    "message": "Telegram временно заблокировал отправку кодов. Попробуйте позже."
                }
            )
        raise HTTPException(status_code=500, detail=f"Неожиданная ошибка: {error_message}")

@app.post("/api/telegram/verify-code")
async def verify_phone_code(verification: CodeVerification, db: Session = Depends(get_session)):
    """Подтвердить код из SMS"""
    result = await multi_user_manager.verify_phone_code(
        verification.phone_number,
        verification.phone_code,
        verification.phone_code_hash,
        db
    )
    return result

@app.post("/api/telegram/verify-password")
async def verify_password(password_verification: PasswordVerification, db: Session = Depends(get_session)):
    """Подтвердить пароль двухфакторной аутентификации"""
    # Нужно получить номер телефона текущего пользователя (можно добавить в запрос)
    # Пока используем последнего неактивного пользователя, который проходил авторизацию
    current_user = db.query(User).order_by(User.created_at.desc()).first()
    if not current_user:
        raise HTTPException(status_code=400, detail="Пользователь не найден")
    
    result = await multi_user_manager.verify_password(
        current_user.phone_number,
        password_verification.password,
        db
    )
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@app.post("/api/telegram/logout")
async def logout(db: Session = Depends(get_session)):
    """Выход текущего пользователя из системы"""
    try:
        # Получаем текущего активного пользователя
        current_user = db.query(User).filter(
            User.is_active == True,
            User.last_login.isnot(None)
        ).order_by(User.last_login.desc()).first()
        
        if not current_user:
            return {"status": "success", "message": "Нет активных пользователей для выхода"}
        
        result = await multi_user_manager.logout_user(current_user.phone_number, db)
        return result
        
    except Exception as e:
        print(f"❌ Ошибка при выходе: {e}")
        return {"status": "error", "message": f"Ошибка выхода: {str(e)}"}

@app.post("/api/telegram/switch-user/{user_id}")
async def switch_user(user_id: int, db: Session = Depends(get_session)):
    """Переключение на другого пользователя"""
    try:
        # Деактивируем текущих пользователей
        db.query(User).filter(User.is_active == True).update({"is_active": False})
        
        # Активируем выбранного пользователя
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        
        target_user.is_active = True
        target_user.last_login = datetime.utcnow()
        db.commit()
        
        # Проверяем авторизацию
        parser = await multi_user_manager.get_parser_for_user(target_user.phone_number)
        is_authorized = await parser.is_authorized()
        
        return {
            "status": "success",
            "message": f"Переключено на пользователя {target_user.name}",
            "authorized": is_authorized,
            "user": {
                "name": target_user.name,
                "phone_number": target_user.phone_number
            }
        }
        
    except Exception as e:
        print(f"❌ Ошибка переключения пользователя: {e}")
        raise HTTPException(status_code=400, detail=f"Ошибка переключения: {str(e)}")

# Совместимость: старые эндпоинты
@app.post("/api/telegram/clear-auth-cache")
async def clear_auth_cache():
    """Очистить кэш авторизации для принудительной проверки"""
    telegram_parser.clear_auth_cache()
    return {"status": "success", "message": "Кэш авторизации очищен"}

@app.post("/api/telegram/clear-session")
async def clear_session():
    """Очистить файл сессии и переинициализировать клиент"""
    try:
        # Используем новый метод logout() для корректного выхода
        await telegram_parser.logout()
        
        # Переинициализируем клиент
        await telegram_parser.initialize_client()
        
        return {"status": "success", "message": "Сессия очищена и клиент переинициализирован"}
    except Exception as e:
        return {"status": "error", "message": f"Ошибка очистки сессии: {str(e)}"}

@app.get("/api/telegram/channels")
async def get_telegram_channels(search: str = None, db: Session = Depends(get_session)):
    """Получить список каналов текущего пользователя"""
    # Получаем парсер для текущего пользователя
    current_parser = await multi_user_manager.get_current_user_parser(db)
    
    if not current_parser:
        raise HTTPException(status_code=401, detail="Нет авторизованных пользователей")
    
    result = await current_parser.get_user_channels()
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    
    # Фильтрация по поиску
    if search and result.get("channels"):
        search_lower = search.lower()
        filtered_channels = []
        
        for channel in result["channels"]:
            title = channel.get("title", "").lower()
            username = channel.get("username", "").lower() if channel.get("username") else ""
            
            if (search_lower in title or 
                search_lower in username or 
                search_lower in str(channel.get("id", ""))):
                filtered_channels.append(channel)
        
        result["channels"] = filtered_channels
        result["message"] = f"Найдено {len(filtered_channels)} каналов по запросу '{search}'"
    
    return result

# === ПАРСИНГ ===
@app.post("/api/parse")
async def parse_channels(db: Session = Depends(get_session)):
    """Запустить парсинг всех активных каналов"""
    # Получаем парсер для текущего пользователя
    current_parser = await multi_user_manager.get_current_user_parser(db)
    
    if not current_parser:
        raise HTTPException(status_code=401, detail="Нет авторизованных пользователей")
    
    result = await current_parser.parse_all_sources(db)
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@app.post("/api/parse-limited")
async def parse_channels_limited(db: Session = Depends(get_session)):
    """Запустить ограниченный парсинг (только 5 постов)"""
    # Получаем парсер для текущего пользователя
    current_parser = await multi_user_manager.get_current_user_parser(db)
    
    if not current_parser:
        raise HTTPException(status_code=401, detail="Нет авторизованных пользователей")
    
    result = await current_parser.parse_all_sources_limited(db, limit=5)
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@app.post("/api/parse/channel/{channel_id}")
async def parse_single_channel(channel_id: str, db: Session = Depends(get_session)):
    """Парсинг одного конкретного канала"""
    # Получаем парсер для текущего пользователя
    current_parser = await multi_user_manager.get_current_user_parser(db)
    
    if not current_parser:
        raise HTTPException(status_code=401, detail="Нет авторизованных пользователей")
    
    is_authorized = await current_parser.is_authorized()
    if not is_authorized:
        raise HTTPException(status_code=401, detail="Не авторизован в Telegram")
    
    result = await current_parser.parse_channel_posts(channel_id, limit=10)
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    
    # Сохраняем посты в базу данных
    posts_data = result["posts"]
    new_posts = 0
    
    for post_data in posts_data:
        try:
            # Проверяем, не существует ли уже этот пост
            existing_post = db.query(Post).filter(
                Post.channel_id == post_data["channel_id"],
                Post.message_id == post_data["message_id"]
            ).first()
            
            if not existing_post:
                new_post = Post(**post_data)
                db.add(new_post)
                new_posts += 1
        except Exception as e:
            print(f"Ошибка при сохранении поста {post_data.get('message_id', 'unknown')}: {e}")
            continue
    
    try:
        db.commit()
    except Exception as e:
        print(f"Ошибка при коммите в базу данных: {e}")
        db.rollback()
        # Пытаемся сохранить посты по одному
        new_posts = 0
        for post_data in posts_data:
            try:
                existing_post = db.query(Post).filter(
                    Post.channel_id == post_data["channel_id"],
                    Post.message_id == post_data["message_id"]
                ).first()
                
                if not existing_post:
                    new_post = Post(**post_data)
                    db.add(new_post)
                    db.commit()
                    new_posts += 1
            except Exception as post_error:
                print(f"Ошибка при сохранении поста {post_data.get('message_id', 'unknown')}: {post_error}")
                db.rollback()
                continue
    
    return {
        "status": "success",
        "message": f"Добавлено {new_posts} новых постов из {len(posts_data)} спарсенных",
        "new_posts": new_posts,
        "total_parsed": len(posts_data)
    }

@app.post("/api/redownload-media/{channel_id}/{message_id}")
async def redownload_media(channel_id: str, message_id: int, db: Session = Depends(get_session)):
    """Повторное скачивание медиафайла для конкретного сообщения"""
    # Получаем парсер для текущего пользователя
    current_parser = await multi_user_manager.get_current_user_parser(db)
    
    if not current_parser:
        raise HTTPException(status_code=401, detail="Нет авторизованных пользователей")
    
    is_authorized = await current_parser.is_authorized()
    if not is_authorized:
        raise HTTPException(status_code=401, detail="Не авторизован в Telegram")
    
    try:
        # Получаем информацию о канале
        channel_info = await current_parser.get_channel_info(channel_id)
        if not channel_info:
            raise HTTPException(status_code=404, detail=f"Канал {channel_id} не найден или недоступен")
        
        # Создаем папку для медиа файлов
        media_dir = os.path.abspath(f"../frontend/public/media/{channel_id.replace('-', '')}")
        os.makedirs(media_dir, exist_ok=True)
        
        # Получаем конкретное сообщение
        if not current_parser.client.is_connected:
            await current_parser.client.connect()
            
        try:
            # Используем get_messages для получения конкретного сообщения
            messages = await current_parser.client.get_messages(channel_id, message_ids=[message_id])
            if not messages or not messages[0]:
                raise HTTPException(status_code=404, detail=f"Сообщение {message_id} не найдено")
            
            message = messages[0]
            
            # Пытаемся скачать медиа
            media_info = await current_parser._parse_media(message, media_dir, channel_id)
            
            if media_info:
                # Обновляем информацию о медиа в базе данных
                post = db.query(Post).filter(
                    Post.channel_id == channel_id,
                    Post.message_id == message_id
                ).first()
                
                if post:
                    post.media_type = media_info.get("type")
                    post.media_url = media_info.get("url")
                    post.media_size = media_info.get("size")
                    post.media_filename = media_info.get("filename")
                    post.media_duration = media_info.get("duration")
                    post.media_width = media_info.get("width")
                    post.media_height = media_info.get("height")
                    db.commit()
                
                return {
                    "status": "success",
                    "message": f"Медиафайл для сообщения {message_id} успешно скачан",
                    "media_info": media_info
                }
            else:
                return {
                    "status": "error", 
                    "message": f"Не удалось скачать медиафайл для сообщения {message_id}"
                }
                
        except Exception as msg_error:
            raise HTTPException(status_code=500, detail=f"Ошибка получения сообщения: {str(msg_error)}")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при скачивании медиа: {str(e)}")

@app.post("/api/cleanup-media")
async def cleanup_media(db: Session = Depends(get_session)):
    """Полная очистка всех медиафайлов"""
    import os
    import shutil
    
    try:
        print("🛑 Безопасно завершаем Telegram клиенты перед очисткой медиа...")
        # Безопасно завершаем всех Telegram клиентов
        try:
            await multi_user_manager.stop_all()
        except Exception as stop_error:
            print(f"⚠️ Предупреждение при остановке клиентов: {stop_error}")
        
        print("🗑️ Клиенты остановлены")
        
        # Удаляем все отобранные посты (так как очищаем все медиа)
        total_selected = db.query(SelectedPost).count()
        print(f"📊 Найдено {total_selected} отобранных постов для удаления")
        
        if total_selected > 0:
            # Снимаем флаг selected со всех постов
            db.query(Post).filter(Post.is_selected == True).update({"is_selected": False})
            
            # Удаляем все отобранные посты
            db.query(SelectedPost).delete()
            db.commit()
            print(f"✅ Удалено {total_selected} отобранных постов")
        else:
            print("📭 Отобранных постов для удаления не найдено")
        
        # Получаем директорию media
        media_dir = "../frontend/public/media"
        if not os.path.exists(media_dir):
            return {"status": "success", "message": "Директория media не существует", "deleted_files": 0, "freed_space": 0}
        
        deleted_files = 0
        freed_space = 0
        
        # Проходим по всем поддиректориям каналов
        for channel_dir in os.listdir(media_dir):
            channel_path = os.path.join(media_dir, channel_dir)
            if not os.path.isdir(channel_path):
                continue
            
            # Удаляем всю директорию канала со всеми файлами
            try:
                # Подсчитываем размер директории перед удалением
                for root, dirs, files in os.walk(channel_path):
                    for file in files:
                        file_path = os.path.join(root, file)
                        try:
                            file_size = os.path.getsize(file_path)
                            freed_space += file_size
                            deleted_files += 1
                        except:
                            pass
                
                # Удаляем всю директорию
                shutil.rmtree(channel_path)
                print(f"Удалена директория канала: {channel_path}")
                
            except Exception as e:
                print(f"Ошибка при удалении директории {channel_path}: {e}")
        
        # Форматируем размер в человекочитаемый вид
        def format_size(size_bytes):
            if size_bytes < 1024:
                return f"{size_bytes} B"
            elif size_bytes < 1024**2:
                return f"{size_bytes/1024:.1f} KB"
            elif size_bytes < 1024**3:
                return f"{size_bytes/(1024**2):.1f} MB"
            else:
                return f"{size_bytes/(1024**3):.1f} GB"
        
        return {
            "status": "success",
            "message": f"Полная очистка завершена: удалено {deleted_files} файлов, {total_selected} отобранных постов, освобождено {format_size(freed_space)}",
            "deleted_files": deleted_files,
            "deleted_selected_posts": total_selected,
            "freed_space": freed_space,
            "freed_space_formatted": format_size(freed_space)
        }
        
    except Exception as e:
        print(f"Ошибка при очистке медиафайлов: {e}")
        return {
            "status": "error",
            "message": f"Ошибка при очистке медиафайлов: {str(e)}",
            "deleted_files": 0,
            "freed_space": 0
        }

@app.post("/api/posts/check-new")
async def check_and_parse_new_posts(db: Session = Depends(get_session)):
    """Ультра-оптимизированный эндпоинт с предварительной проверкой по дате"""
    return await check_and_parse_new_posts_ultra_optimized(db)

@app.post("/api/posts/parse-more")
async def parse_more_posts(limit: int = 5, db: Session = Depends(get_session)):
    """Спарсить еще несколько старых постов со всех активных источников"""
    # Получаем парсер для текущего пользователя
    current_parser = await multi_user_manager.get_current_user_parser(db)
    
    if not current_parser:
        raise HTTPException(status_code=401, detail="Нет авторизованных пользователей")
    
    is_authorized = await current_parser.is_authorized()
    if not is_authorized:
        raise HTTPException(status_code=401, detail="Пользователь не авторизован в Telegram")
    
    # Получаем активные источники
    sources = db.query(Source).filter(Source.is_active == True).all()
    if not sources:
        return {"message": "Нет активных источников для парсинга", "new_posts": 0}
    
    total_posts = 0
    results = []
    
    for source in sources:
        try:
            # Получаем количество постов в БД для этого канала
            posts_count = db.query(Post).filter(Post.channel_id == source.channel_id).count()
            
            # Парсим с offset равным количеству постов в БД, без ограничений по дате
            result = await current_parser.parse_channel_posts(source.channel_id, limit=limit, offset=posts_count, until_date=None)
            
            if result["status"] == "success":
                posts_data = result["posts"]
                new_posts = 0
                
                for post_data in posts_data:
                    try:
                        # Проверяем, не существует ли уже этот пост
                        existing_post = db.query(Post).filter(
                            Post.channel_id == post_data["channel_id"],
                            Post.message_id == post_data["message_id"]
                        ).first()
                        
                        if not existing_post:
                            new_post = Post(**post_data)
                            db.add(new_post)
                            new_posts += 1
                    except Exception as e:
                        print(f"Ошибка при сохранении поста {post_data.get('message_id', 'unknown')}: {e}")
                        continue
                
                if new_posts > 0:
                    db.commit()
                    total_posts += new_posts
                    
                results.append({
                    "channel": source.channel_name,
                    "new_posts": new_posts,
                    "status": "success"
                })
            else:
                results.append({
                    "channel": source.channel_name,
                    "status": "error",
                    "message": result["message"]
                })
                
            # Небольшая задержка между каналами
            await asyncio.sleep(1)
            
        except Exception as e:
            results.append({
                "channel": source.channel_name,
                "status": "error",
                "message": f"Ошибка: {str(e)}"
            })
    
    return {
        "message": f"Парсинг завершен. Найдено {total_posts} новых постов",
        "new_posts": total_posts,
        "parsed_channels": results
    }

# Frontend fallback
@app.get("/{path:path}", response_class=HTMLResponse)
async def spa_fallback(path: str):
    static_file = '../frontend/dist/index.html'
    if os.path.exists(static_file):
        return FileResponse(static_file)
    return HTMLResponse("Frontend not built. Run 'npm run build' in frontend directory.")

@app.get("/api/media-status")
def get_media_status(db: Session = Depends(get_session)):
    """Получить статистику по медиафайлам"""
    # Получаем все посты с медиа
    posts_with_media = db.query(Post).filter(Post.media_url.isnot(None)).all()
    
    total_media = len(posts_with_media)
    missing_files = []
    existing_files = []
    
    for post in posts_with_media:
        if post.media_url and post.media_type:
            # Формируем путь к файлу
            channel_clean = post.channel_id.replace('-', '')
            filename = post.media_url.split('/')[-1]
            file_path = os.path.join(media_path, channel_clean, filename)
            
            # Также проверяем путь с оригинальным channel_id
            if not os.path.exists(file_path):
                file_path = os.path.join(media_path, post.channel_id, filename)
            
            if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
                existing_files.append({
                    "post_id": post.id,
                    "message_id": post.message_id,
                    "channel_id": post.channel_id,
                    "media_type": post.media_type,
                    "file_size": os.path.getsize(file_path)
                })
            else:
                missing_files.append({
                    "post_id": post.id,
                    "message_id": post.message_id,
                    "channel_id": post.channel_id,
                    "channel_name": post.channel_name,
                    "media_type": post.media_type,
                    "media_url": post.media_url,
                    "expected_path": file_path
                })
    
    return {
        "total_media_posts": total_media,
        "existing_files": len(existing_files),
        "missing_files": len(missing_files),
        "missing_details": missing_files[:10],  # Показываем первые 10
        "statistics": {
            "missing_photos": len([f for f in missing_files if f["media_type"] == "photo"]),
            "missing_videos": len([f for f in missing_files if f["media_type"] == "video"]),
            "missing_voice": len([f for f in missing_files if f["media_type"] == "voice"]),
            "missing_audio": len([f for f in missing_files if f["media_type"] == "audio"]),
        }
    }

@app.post("/api/posts/check-new-optimized")
async def check_and_parse_new_posts_optimized(db: Session = Depends(get_session)):
    """Оптимизированная проверка новых постов - парсим только те, которых нет в БД"""
    print(f"🔍 Запуск оптимизированной проверки новых постов")
    
    # Получаем парсер для текущего пользователя
    current_parser = await multi_user_manager.get_current_user_parser(db)
    
    if not current_parser:
        raise HTTPException(status_code=401, detail="Нет авторизованных пользователей")
    
    is_authorized = await current_parser.is_authorized()
    if not is_authorized:
        raise HTTPException(status_code=401, detail="Не авторизован в Telegram")
    
    # Получаем активные источники
    active_sources = db.query(Source).filter(Source.is_active == True).all()
    if not active_sources:
        return {"message": "Нет активных источников", "new_posts": 0}
    
    total_new_posts = 0
    parsed_channels = []
    
    for source in active_sources:
        print(f"🔄 Проверяем канал: {source.channel_name}")
        try:
            # Получаем последний пост для этого канала из БД
            last_post_in_db = db.query(Post).filter(
                Post.channel_id == source.channel_id
            ).order_by(Post.post_date.desc()).first()
            
            last_message_id_in_db = last_post_in_db.message_id if last_post_in_db else 0
            last_date_in_db = last_post_in_db.post_date if last_post_in_db else None
            
            print(f"📊 Последний пост в БД для {source.channel_name}: message_id={last_message_id_in_db}, дата={last_date_in_db}")
            
            # Проверяем, есть ли новые посты (парсим небольшое количество для проверки)
            check_limit = 20  # Проверяем 20 последних постов из канала
            result = await current_parser.parse_channel_posts(
                source.channel_id, 
                limit=check_limit,
                until_date=last_date_in_db  # Парсим только новее последнего поста в БД
            )
            
            if result["status"] == "error":
                print(f"❌ Ошибка парсинга канала {source.channel_name}: {result['message']}")
                continue
            
            posts_data = result.get("posts", [])
            print(f"📝 Получено {len(posts_data)} постов для проверки из {source.channel_name}")
            
            # Фильтруем только действительно новые посты
            new_posts_data = []
            for post_data in posts_data:
                message_id = post_data.get("message_id")
                post_date = post_data.get("post_date")
                
                # Пропускаем посты, которые точно есть в БД (по message_id)
                if message_id <= last_message_id_in_db:
                    continue
                
                # Дополнительная проверка в БД (на случай если message_id не по порядку)
                existing_post = db.query(Post).filter(
                    Post.channel_id == post_data["channel_id"],
                    Post.message_id == message_id
                ).first()
                
                if not existing_post:
                    new_posts_data.append(post_data)
                    print(f"  ✅ Новый пост найден: message_id={message_id}, дата={post_date}")
                else:
                    print(f"  ⚠️ Пост {message_id} уже существует в БД")
            
            # Сохраняем только новые посты
            channel_new_posts = 0
            for post_data in new_posts_data:
                try:
                    new_post = Post(**post_data)
                    db.add(new_post)
                    channel_new_posts += 1
                except Exception as e:
                    print(f"❌ Ошибка при сохранении поста {post_data.get('message_id')}: {e}")
                    continue
            
            if channel_new_posts > 0:
                try:
                    db.commit()
                    total_new_posts += channel_new_posts
                    parsed_channels.append({
                        "channel_name": source.channel_name,
                        "new_posts": channel_new_posts
                    })
                    print(f"✅ Сохранено {channel_new_posts} новых постов для канала {source.channel_name}")
                except Exception as e:
                    print(f"❌ Ошибка при коммите для канала {source.channel_name}: {e}")
                    db.rollback()
            else:
                print(f"📭 Новых постов не найдено для канала {source.channel_name}")
                
        except Exception as e:
            print(f"❌ Ошибка при проверке канала {source.channel_name}: {e}")
            continue
    
    message = f"Оптимизированная проверка завершена. Найдено {total_new_posts} новых постов"
    if total_new_posts == 0:
        message = "Проверка завершена. Новых постов не найдено"
    
    return {
        "message": message,
        "new_posts": total_new_posts,
        "parsed_channels": parsed_channels,
        "optimization": "enabled"
    }

@app.post("/api/posts/check-new-ultra-optimized")
async def check_and_parse_new_posts_ultra_optimized(db: Session = Depends(get_session)):
    """Ультра-оптимизированная проверка новых постов с быстрой предварительной проверкой по дате"""
    print(f"🚀 Запуск УЛЬТРА-оптимизированной проверки новых постов")
    
    # Получаем парсер для текущего пользователя
    current_parser = await multi_user_manager.get_current_user_parser(db)
    
    if not current_parser:
        raise HTTPException(status_code=401, detail="Нет авторизованных пользователей")
    
    is_authorized = await current_parser.is_authorized()
    if not is_authorized:
        raise HTTPException(status_code=401, detail="Не авторизован в Telegram")
    
    # Получаем активные источники
    active_sources = db.query(Source).filter(Source.is_active == True).all()
    if not active_sources:
        return {"message": "Нет активных источников", "new_posts": 0}
    
    total_new_posts = 0
    parsed_channels = []
    channels_to_parse = []  # Только каналы с новыми постами
    
    print(f"📊 Этап 1: Быстрая проверка {len(active_sources)} каналов по дате...")
    
    # ЭТАП 1: Быстрая проверка всех каналов по дате (экономим время)
    for source in active_sources:
        try:
            # Получаем последний пост для этого канала из БД
            last_post_in_db = db.query(Post).filter(
                Post.channel_id == source.channel_id
            ).order_by(Post.post_date.desc()).first()
            
            last_date_in_db = last_post_in_db.post_date if last_post_in_db else None
            
            print(f"📅 Последний пост в БД для {source.channel_name}: дата={last_date_in_db}")
            
            # Быстрая проверка только по дате
            check_result = await current_parser.quick_check_new_posts(
                source.channel_id, 
                last_date_in_db
            )
            
            if check_result["status"] == "success" and check_result.get("has_new_posts", False):
                print(f"✅ {source.channel_name}: НАЙДЕНЫ новые посты!")
                channels_to_parse.append({
                    "source": source,
                    "last_date_in_db": last_date_in_db,
                    "latest_info": check_result
                })
            else:
                print(f"📭 {source.channel_name}: новых постов НЕТ")
                
        except Exception as e:
            print(f"❌ Ошибка быстрой проверки канала {source.channel_name}: {e}")
            # В случае ошибки проверки, добавляем канал для полного парсинга
            channels_to_parse.append({
                "source": source,
                "last_date_in_db": None,
                "latest_info": None
            })
    
    print(f"🎯 Этап 1 завершен: {len(channels_to_parse)} из {len(active_sources)} каналов имеют новые посты")
    
    if not channels_to_parse:
        return {
            "message": "Быстрая проверка завершена. Новых постов не найдено", 
            "new_posts": 0,
            "checked_channels": len(active_sources),
            "channels_with_new_posts": 0,
            "optimization": "ultra-enabled"
        }
    
    print(f"📥 Этап 2: Полный парсинг только каналов с новыми постами...")
    
    # ЭТАП 2: Полный парсинг только каналов с новыми постами
    for channel_info in channels_to_parse:
        source = channel_info["source"]
        last_date_in_db = channel_info["last_date_in_db"]
        
        print(f"🔄 Парсим канал с новыми постами: {source.channel_name}")
        
        try:
            # Получаем последний message_id из БД для более точной фильтрации
            last_post_in_db = db.query(Post).filter(
                Post.channel_id == source.channel_id
            ).order_by(Post.post_date.desc()).first()
            
            last_message_id_in_db = last_post_in_db.message_id if last_post_in_db else 0
            
            # Парсим с ограничением по дате
            check_limit = 20  # Проверяем больше постов, так как знаем что есть новые
            result = await current_parser.parse_channel_posts(
                source.channel_id, 
                limit=check_limit,
                until_date=last_date_in_db  # Парсим только новее последнего поста в БД
            )
            
            if result["status"] == "error":
                print(f"❌ Ошибка парсинга канала {source.channel_name}: {result['message']}")
                continue
            
            posts_data = result.get("posts", [])
            print(f"📝 Получено {len(posts_data)} постов для обработки из {source.channel_name}")
            
            # Фильтруем только действительно новые посты
            channel_new_posts = 0
            for post_data in posts_data:
                message_id = post_data.get("message_id")
                post_date = post_data.get("post_date")
                
                # Пропускаем посты, которые точно есть в БД (по message_id)
                if message_id <= last_message_id_in_db:
                    continue
                
                # Дополнительная проверка в БД
                existing_post = db.query(Post).filter(
                    Post.channel_id == post_data["channel_id"],
                    Post.message_id == message_id
                ).first()
                
                if not existing_post:
                    try:
                        new_post = Post(**post_data)
                        db.add(new_post)
                        channel_new_posts += 1
                        print(f"  ✅ Добавлен новый пост: message_id={message_id}, дата={post_date}")
                    except Exception as e:
                        print(f"❌ Ошибка при сохранении поста {message_id}: {e}")
                        continue
                else:
                    print(f"  ⚠️ Пост {message_id} уже существует в БД")
            
            if channel_new_posts > 0:
                try:
                    db.commit()
                    total_new_posts += channel_new_posts
                    parsed_channels.append({
                        "channel_name": source.channel_name,
                        "new_posts": channel_new_posts
                    })
                    print(f"✅ Сохранено {channel_new_posts} новых постов для канала {source.channel_name}")
                except Exception as e:
                    print(f"❌ Ошибка при коммите для канала {source.channel_name}: {e}")
                    db.rollback()
            else:
                print(f"📭 После фильтрации новых постов не найдено для канала {source.channel_name}")
                
        except Exception as e:
            print(f"❌ Ошибка при парсинге канала {source.channel_name}: {e}")
            continue
    
    print(f"🎯 Этап 2 завершен: обработано {len(channels_to_parse)} каналов")
    
    message = f"Ультра-оптимизированная проверка завершена. Найдено {total_new_posts} новых постов"
    if total_new_posts == 0:
        message = "Ультра-проверка завершена. После детального анализа новых постов не найдено"
    
    return {
        "message": message,
        "new_posts": total_new_posts,
        "parsed_channels": parsed_channels,
        "checked_channels": len(active_sources),
        "channels_with_new_posts": len(channels_to_parse),
        "optimization": "ultra-enabled",
        "performance": {
            "quick_check_completed": True,
            "full_parse_only_needed_channels": True,
            "time_saved": f"Проверили {len(active_sources)} каналов, парсили только {len(channels_to_parse)}"
        }
    }