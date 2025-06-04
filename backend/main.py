import os
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
from models import Source, Post, SelectedPost
from telegram_parser import telegram_parser

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
        await telegram_parser.initialize_client()
        print("Telegram parser initialized")
    except Exception as e:
        print(f"Ошибка инициализации Telegram parser: {e}")

@app.on_event("shutdown") 
async def shutdown_event():
    """Очистка при завершении работы"""
    try:
        await telegram_parser.stop()
        print("Telegram parser stopped")
    except Exception as e:
        print(f"Ошибка при остановке Telegram parser: {e}")

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
def get_sources(db: Session = Depends(get_session)):
    """Получить список всех источников"""
    sources = db.query(Source).filter(Source.is_active == True).all()
    return [SourceResponse.from_orm(source) for source in sources]

@app.post("/api/sources", response_model=SourceResponse)
def add_source(source: SourceCreate, db: Session = Depends(get_session)):
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

@app.delete("/api/sources/{source_id}")
def remove_source(source_id: int, db: Session = Depends(get_session)):
    """Удалить источник"""
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Источник не найден")
    
    source.is_active = False
    db.commit()
    return {"message": "Источник удален"}

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

# === TELEGRAM СЕССИЯ ===
@app.get("/api/telegram/status")
async def get_telegram_status():
    """Проверить статус авторизации в Telegram"""
    is_authorized = await telegram_parser.is_authorized()
    return {"authorized": is_authorized}

@app.get("/api/telegram/channels")
async def get_telegram_channels():
    """Получить список каналов пользователя из Telegram"""
    result = await telegram_parser.get_user_channels()
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@app.post("/api/telegram/send-code")
async def send_phone_code(phone_request: PhoneRequest):
    """Отправить код подтверждения на телефон"""
    result = await telegram_parser.send_phone_code(phone_request.phone_number)
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@app.post("/api/telegram/verify-code")
async def verify_phone_code(verification: CodeVerification):
    """Подтвердить код из SMS"""
    result = await telegram_parser.verify_phone_code(
        verification.phone_number,
        verification.phone_code,
        verification.phone_code_hash
    )
    return result

@app.post("/api/telegram/verify-password")
async def verify_password(password_verification: PasswordVerification):
    """Подтвердить пароль двухфакторной аутентификации"""
    result = await telegram_parser.verify_password(password_verification.password)
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    return result

# === ПАРСИНГ ===
@app.post("/api/parse")
async def parse_channels(db: Session = Depends(get_session)):
    """Запустить парсинг всех активных каналов"""
    result = await telegram_parser.parse_all_sources(db)
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@app.post("/api/parse/channel/{channel_id}")
async def parse_single_channel(channel_id: str, db: Session = Depends(get_session)):
    """Парсинг одного конкретного канала"""
    is_authorized = await telegram_parser.is_authorized()
    if not is_authorized:
        raise HTTPException(status_code=401, detail="Не авторизован в Telegram")
    
    result = await telegram_parser.parse_channel_posts(channel_id, limit=50)
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
    is_authorized = await telegram_parser.is_authorized()
    if not is_authorized:
        raise HTTPException(status_code=401, detail="Не авторизован в Telegram")
    
    try:
        # Получаем информацию о канале
        channel_info = await telegram_parser.get_channel_info(channel_id)
        if not channel_info:
            raise HTTPException(status_code=404, detail=f"Канал {channel_id} не найден или недоступен")
        
        # Создаем папку для медиа файлов
        media_dir = os.path.abspath(f"../frontend/public/media/{channel_id.replace('-', '')}")
        os.makedirs(media_dir, exist_ok=True)
        
        # Получаем конкретное сообщение
        if not telegram_parser.client.is_connected:
            await telegram_parser.client.connect()
            
        try:
            # Используем get_messages для получения конкретного сообщения
            messages = await telegram_parser.client.get_messages(channel_id, message_ids=[message_id])
            if not messages or not messages[0]:
                raise HTTPException(status_code=404, detail=f"Сообщение {message_id} не найдено")
            
            message = messages[0]
            
            # Пытаемся скачать медиа
            media_info = await telegram_parser._parse_media(message, media_dir, channel_id)
            
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