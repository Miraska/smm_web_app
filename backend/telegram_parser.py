import os
import asyncio
from datetime import datetime, timezone
from typing import List, Optional
from pyrogram import Client
from pyrogram.types import Message
from pyrogram.errors import (
    SessionPasswordNeeded, 
    PhoneCodeInvalid, 
    PhoneCodeExpired,
    FloodWait,
    ChatAdminRequired,
    UsernameNotOccupied,
    PeerIdInvalid
)
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from models import Source, Post
from db import get_session

load_dotenv()

class TelegramParser:
    def __init__(self):
        self.api_id = os.getenv('TELEGRAM_API_ID')
        self.api_hash = os.getenv('TELEGRAM_API_HASH')
        self.session_name = "smm_bot_session"
        self.client = None
        self._initialized = False
        
    async def initialize_client(self):
        """Инициализация клиента Telegram"""
        if self._initialized and self.client:
            return
            
        if not self.api_id or not self.api_hash:
            raise ValueError("TELEGRAM_API_ID и TELEGRAM_API_HASH должны быть указаны в .env файле")
        
        # Создаем директорию для сессий если её нет
        os.makedirs("sessions", exist_ok=True)
        
        self.client = Client(
            self.session_name,
            api_id=int(self.api_id),
            api_hash=self.api_hash,
            workdir="sessions/"
        )
        self._initialized = True
        
    async def start_session(self, phone_number: str):
        """Начать новую сессию с номером телефона"""
        if not self.client:
            await self.initialize_client()
            
        try:
            if not self.client.is_connected:
                await self.client.start()
            return {"status": "success", "message": "Сессия успешно запущена"}
        except Exception as e:
            return {"status": "error", "message": f"Ошибка при запуске сессии: {str(e)}"}
    
    async def send_phone_code(self, phone_number: str):
        """Отправить код подтверждения на телефон"""
        if not self.client:
            await self.initialize_client()
            
        try:
            if not self.client.is_connected:
                await self.client.connect()
            sent_code = await self.client.send_code(phone_number)
            return {
                "status": "success", 
                "message": "Код отправлен на телефон",
                "phone_code_hash": sent_code.phone_code_hash
            }
        except Exception as e:
            return {"status": "error", "message": f"Ошибка отправки кода: {str(e)}"}
    
    async def verify_phone_code(self, phone_number: str, phone_code: str, phone_code_hash: str):
        """Подтвердить код из SMS"""
        try:
            if not self.client.is_connected:
                await self.client.connect()
            await self.client.sign_in(phone_number, phone_code_hash, phone_code)
            return {"status": "success", "message": "Успешная авторизация"}
        except SessionPasswordNeeded:
            return {"status": "need_password", "message": "Требуется двухфакторная аутентификация"}
        except (PhoneCodeInvalid, PhoneCodeExpired) as e:
            return {"status": "error", "message": f"Неверный или истёкший код: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"Ошибка верификации: {str(e)}"}
    
    async def verify_password(self, password: str):
        """Подтвердить пароль двухфакторной аутентификации"""
        try:
            if not self.client.is_connected:
                await self.client.connect()
            await self.client.check_password(password)
            return {"status": "success", "message": "Успешная авторизация"}
        except Exception as e:
            return {"status": "error", "message": f"Неверный пароль: {str(e)}"}
    
    async def is_authorized(self):
        """Проверить, авторизован ли пользователь"""
        try:
            if not self.client:
                await self.initialize_client()
            
            # Проверяем, есть ли файл сессии
            session_file = f"sessions/{self.session_name}.session"
            if not os.path.exists(session_file):
                return False
            
            # Если клиент не подключен, пытаемся подключиться
            if not self.client.is_connected:
                await self.client.connect()
            
            # Проверяем авторизацию через API запрос
            try:
                me = await self.client.get_me()
                return me is not None
            except Exception:
                return False
                
        except Exception as e:
            print(f"Ошибка проверки авторизации: {e}")
            return False
    
    async def get_user_channels(self):
        """Получить список каналов/чатов пользователя"""
        try:
            if not self.client:
                await self.initialize_client()
            
            # Проверяем авторизацию
            if not await self.is_authorized():
                return {"status": "error", "message": "Не авторизован в Telegram"}
            
            # Убеждаемся, что клиент подключен
            if not self.client.is_connected:
                await self.client.connect()
            
            channels = []
            
            # Получаем все диалоги пользователя
            async for dialog in self.client.get_dialogs():
                chat = dialog.chat
                
                # Фильтруем только каналы и супергруппы
                if chat.type.name in ['CHANNEL', 'SUPERGROUP']:
                    channel_info = {
                        "id": str(chat.id),
                        "title": chat.title,
                        "username": getattr(chat, 'username', None),
                        "type": chat.type.name.lower(),
                        "members_count": getattr(chat, 'members_count', None),
                        "is_creator": getattr(dialog, 'is_creator', False),
                        "is_admin": getattr(dialog, 'is_admin', False),
                        "can_send_messages": getattr(chat, 'can_send_messages', True)
                    }
                    channels.append(channel_info)
            
            return {
                "status": "success",
                "channels": channels,
                "total": len(channels)
            }
            
        except Exception as e:
            return {"status": "error", "message": f"Ошибка получения каналов: {str(e)}"}
    
    async def get_channel_info(self, channel_id: str):
        """Получение информации о канале"""
        try:
            # Убеждаемся, что клиент подключен
            if not self.client.is_connected:
                await self.client.connect()
            
            # Получаем чат по ID
            chat = await self.client.get_chat(channel_id)
            
            print(f"Найден чат: {chat.title}, тип: {chat.type}")
            
            return {
                "id": chat.id,
                "title": chat.title,
                "username": getattr(chat, 'username', None),
                "type": str(chat.type),
                "member_count": getattr(chat, 'members_count', 0),
                "description": getattr(chat, 'description', None)
            }
        except (UsernameNotOccupied, PeerIdInvalid) as e:
            print(f"Канал {channel_id} не найден: {e}")
            return None
        except Exception as e:
            print(f"Ошибка получения информации о канале {channel_id}: {e}")
            return None
    
    async def parse_channel_posts(self, channel_id: str, limit: int = 50):
        """Парсинг постов из канала"""
        try:
            if not self.client:
                await self.initialize_client()
            
            # Проверяем авторизацию
            if not await self.is_authorized():
                return {"status": "error", "message": "Не авторизован в Telegram"}
            
            # Убеждаемся, что клиент подключен
            if not self.client.is_connected:
                await self.client.connect()
            
            posts_data = []
            processed_albums = set()  # Отслеживаем обработанные альбомы
            
            # Получаем информацию о канале
            channel_info = await self.get_channel_info(channel_id)
            if not channel_info:
                return {"status": "error", "message": f"Канал {channel_id} не найден"}
            
            # Создаем папку для медиа файлов (используем абсолютный путь)
            media_dir = os.path.abspath(f"../frontend/public/media/{channel_id.replace('-', '')}")
            os.makedirs(media_dir, exist_ok=True)
            print(f"Создана папка для медиа: {media_dir}")
            
            # Парсим сообщения
            message_count = 0
            async for message in self.client.get_chat_history(channel_id, limit=limit):
                try:
                    message_count += 1
                    print(f"Обрабатываем сообщение {message_count}/{limit}: {message.id}")
                    
                    # Получаем текст сообщения
                    text = message.text or message.caption or ""
                    
                    # Обрабатываем альбомы (группы медиа)
                    if hasattr(message, 'media_group_id') and message.media_group_id:
                        if message.media_group_id not in processed_albums:
                            print(f"Обрабатываем альбом: {message.media_group_id}")
                            album_posts = await self._parse_album(message, channel_info, media_dir, channel_id)
                            posts_data.extend(album_posts)
                            processed_albums.add(message.media_group_id)
                        continue
                    
                    # Определяем тип медиа и скачиваем файл
                    media_info = await self._parse_media(message, media_dir, channel_id)
                    
                    # Включаем посты только с текстом, даже без медиа
                    if not text.strip() and not media_info:
                        print(f"Пропускаем пустое сообщение {message.id}")
                        continue
                    
                    post_data = {
                        "message_id": message.id,
                        "channel_id": str(channel_info["id"]),
                        "channel_name": channel_info["title"],
                        "text": text,
                        "media_type": media_info.get("type") if media_info else None,
                        "media_url": media_info.get("url") if media_info else None,
                        "post_date": message.date,
                    }
                    
                    # Добавляем дополнительную информацию о медиа
                    if media_info:
                        post_data.update({
                            "media_size": media_info.get("size"),
                            "media_filename": media_info.get("filename"),
                            "media_duration": media_info.get("duration"),
                            "media_width": media_info.get("width"),
                            "media_height": media_info.get("height"),
                        })
                    
                    posts_data.append(post_data)
                    print(f"Добавлен пост {message.id}, медиа: {media_info.get('type') if media_info else 'нет'}")
                    
                except Exception as e:
                    print(f"Ошибка обработки сообщения {message.id}: {e}")
                    continue
                
            print(f"Обработано {len(posts_data)} постов из {message_count} сообщений")
            
            return {
                "status": "success", 
                "message": f"Спарсено {len(posts_data)} постов из канала {channel_info['title']}",
                "posts": posts_data,
                "channel_info": channel_info
            }
            
        except FloodWait as e:
            return {"status": "error", "message": f"Rate limit. Подождите {e.value} секунд"}
        except ChatAdminRequired:
            return {"status": "error", "message": "Нет доступа к каналу"}
        except Exception as e:
            print(f"Критическая ошибка парсинга канала {channel_id}: {e}")
            return {"status": "error", "message": f"Ошибка парсинга: {str(e)}"}

    async def _parse_media(self, message: Message, media_dir: str, channel_id: str):
        """Парсинг и скачивание медиа из сообщения"""
        try:
            media_info = None
            channel_clean = channel_id.replace('-', '')
            
            if message.photo:
                # Фото
                try:
                    file_path = await self.client.download_media(
                        message.photo,
                        file_name=f"{media_dir}/photo_{message.id}.jpg"
                    )
                    if file_path and os.path.exists(file_path) and os.path.getsize(file_path) > 0:
                        media_info = {
                            "type": "photo",
                            "url": f"/media/{channel_clean}/photo_{message.id}.jpg",
                            "filename": f"photo_{message.id}.jpg",
                            "width": getattr(message.photo, 'width', None),
                            "height": getattr(message.photo, 'height', None),
                            "size": getattr(message.photo, 'file_size', None)
                        }
                        print(f"Скачано фото: {file_path}, размер файла: {os.path.getsize(file_path)} байт")
                    else:
                        print(f"Ошибка скачивания фото {message.id}: файл не создан или пустой")
                        # Удаляем неудачный файл если он существует
                        temp_file = f"{media_dir}/photo_{message.id}.jpg"
                        if os.path.exists(temp_file):
                            os.remove(temp_file)
                except Exception as e:
                    print(f"Ошибка скачивания фото {message.id}: {e}")
                
            elif message.video:
                # Видео
                try:
                    file_extension = "mp4"
                    if hasattr(message.video, 'mime_type') and message.video.mime_type:
                        ext_map = {"video/mp4": "mp4", "video/mov": "mov", "video/avi": "avi", "video/webm": "webm"}
                        file_extension = ext_map.get(message.video.mime_type, "mp4")
                    
                    video_size = getattr(message.video, 'file_size', 0)
                    print(f"Начинаю скачивание видео {message.id}, ожидаемый размер: {video_size} байт")
                    
                    file_path = await self.client.download_media(
                        message.video,
                        file_name=f"{media_dir}/video_{message.id}.{file_extension}"
                    )
                    if file_path and os.path.exists(file_path) and os.path.getsize(file_path) > 0:
                        actual_size = os.path.getsize(file_path)
                        media_info = {
                            "type": "video",
                            "url": f"/media/{channel_clean}/video_{message.id}.{file_extension}",
                            "filename": f"video_{message.id}.{file_extension}",
                            "duration": getattr(message.video, 'duration', None),
                            "width": getattr(message.video, 'width', None),
                            "height": getattr(message.video, 'height', None),
                            "size": video_size
                        }
                        print(f"Скачано видео: {file_path}, размер файла: {actual_size} байт")
                    else:
                        print(f"Ошибка скачивания видео {message.id}: файл не создан или пустой")
                        # Удаляем неудачный файл если он существует
                        temp_file = f"{media_dir}/video_{message.id}.{file_extension}"
                        if os.path.exists(temp_file):
                            os.remove(temp_file)
                except Exception as e:
                    print(f"Ошибка скачивания видео {message.id}: {e}")
                
            elif message.animation:
                # GIF анимация
                try:
                    file_path = await self.client.download_media(
                        message.animation,
                        file_name=f"{media_dir}/animation_{message.id}.gif"
                    )
                    if file_path and os.path.exists(file_path) and os.path.getsize(file_path) > 0:
                        media_info = {
                            "type": "animation",
                            "url": f"/media/{channel_clean}/animation_{message.id}.gif",
                            "filename": f"animation_{message.id}.gif",
                            "duration": getattr(message.animation, 'duration', None),
                            "width": getattr(message.animation, 'width', None),
                            "height": getattr(message.animation, 'height', None),
                            "size": getattr(message.animation, 'file_size', None)
                        }
                        print(f"Скачана анимация: {file_path}, размер файла: {os.path.getsize(file_path)} байт")
                    else:
                        print(f"Ошибка скачивания анимации {message.id}: файл не создан или пустой")
                        temp_file = f"{media_dir}/animation_{message.id}.gif"
                        if os.path.exists(temp_file):
                            os.remove(temp_file)
                except Exception as e:
                    print(f"Ошибка скачивания анимации {message.id}: {e}")
                
            elif message.voice:
                # Голосовое сообщение
                try:
                    file_path = await self.client.download_media(
                        message.voice,
                        file_name=f"{media_dir}/voice_{message.id}.ogg"
                    )
                    if file_path and os.path.exists(file_path) and os.path.getsize(file_path) > 0:
                        media_info = {
                            "type": "voice",
                            "url": f"/media/{channel_clean}/voice_{message.id}.ogg",
                            "filename": f"voice_{message.id}.ogg",
                            "duration": getattr(message.voice, 'duration', None),
                            "size": getattr(message.voice, 'file_size', None)
                        }
                        print(f"Скачано голосовое: {file_path}, размер файла: {os.path.getsize(file_path)} байт")
                    else:
                        print(f"Ошибка скачивания голосового {message.id}: файл не создан или пустой")
                        temp_file = f"{media_dir}/voice_{message.id}.ogg"
                        if os.path.exists(temp_file):
                            os.remove(temp_file)
                except Exception as e:
                    print(f"Ошибка скачивания голосового {message.id}: {e}")
                
            elif message.audio:
                # Аудио файл
                try:
                    file_extension = "mp3"
                    if hasattr(message.audio, 'mime_type') and message.audio.mime_type:
                        ext_map = {"audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/ogg": "ogg"}
                        file_extension = ext_map.get(message.audio.mime_type, "mp3")
                    
                    file_path = await self.client.download_media(
                        message.audio,
                        file_name=f"{media_dir}/audio_{message.id}.{file_extension}"
                    )
                    if file_path and os.path.exists(file_path) and os.path.getsize(file_path) > 0:
                        media_info = {
                            "type": "audio",
                            "url": f"/media/{channel_clean}/audio_{message.id}.{file_extension}",
                            "filename": f"audio_{message.id}.{file_extension}",
                            "duration": getattr(message.audio, 'duration', None),
                            "title": getattr(message.audio, 'title', None),
                            "performer": getattr(message.audio, 'performer', None),
                            "size": getattr(message.audio, 'file_size', None)
                        }
                        print(f"Скачано аудио: {file_path}, размер файла: {os.path.getsize(file_path)} байт")
                    else:
                        print(f"Ошибка скачивания аудио {message.id}: файл не создан или пустой")
                        temp_file = f"{media_dir}/audio_{message.id}.{file_extension}"
                        if os.path.exists(temp_file):
                            os.remove(temp_file)
                except Exception as e:
                    print(f"Ошибка скачивания аудио {message.id}: {e}")
                
            elif message.document:
                # Документ
                try:
                    file_name = getattr(message.document, 'file_name', None) or f"document_{message.id}"
                    # Убираем небезопасные символы из имени файла
                    safe_file_name = "".join(c for c in file_name if c.isalnum() or c in ".-_").rstrip()
                    
                    file_path = await self.client.download_media(
                        message.document,
                        file_name=f"{media_dir}/{safe_file_name}"
                    )
                    if file_path and os.path.exists(file_path) and os.path.getsize(file_path) > 0:
                        media_info = {
                            "type": "document",
                            "url": f"/media/{channel_clean}/{safe_file_name}",
                            "filename": safe_file_name,
                            "mime_type": getattr(message.document, 'mime_type', None),
                            "size": getattr(message.document, 'file_size', None)
                        }
                        print(f"Скачан документ: {file_path}, размер файла: {os.path.getsize(file_path)} байт")
                    else:
                        print(f"Ошибка скачивания документа {message.id}: файл не создан или пустой")
                        temp_file = f"{media_dir}/{safe_file_name}"
                        if os.path.exists(temp_file):
                            os.remove(temp_file)
                except Exception as e:
                    print(f"Ошибка скачивания документа {message.id}: {e}")
                
            elif message.sticker:
                # Стикер
                try:
                    file_extension = "webp"
                    if hasattr(message.sticker, 'is_animated') and message.sticker.is_animated:
                        file_extension = "tgs"
                    elif hasattr(message.sticker, 'is_video') and message.sticker.is_video:
                        file_extension = "webm"
                        
                    file_path = await self.client.download_media(
                        message.sticker,
                        file_name=f"{media_dir}/sticker_{message.id}.{file_extension}"
                    )
                    if file_path and os.path.exists(file_path) and os.path.getsize(file_path) > 0:
                        media_info = {
                            "type": "sticker",
                            "url": f"/media/{channel_clean}/sticker_{message.id}.{file_extension}",
                            "filename": f"sticker_{message.id}.{file_extension}",
                            "is_animated": getattr(message.sticker, 'is_animated', False),
                            "is_video": getattr(message.sticker, 'is_video', False),
                            "emoji": getattr(message.sticker, 'emoji', None),
                            "size": getattr(message.sticker, 'file_size', None)
                        }
                        print(f"Скачан стикер: {file_path}, размер файла: {os.path.getsize(file_path)} байт")
                    else:
                        print(f"Ошибка скачивания стикера {message.id}: файл не создан или пустой")
                        temp_file = f"{media_dir}/sticker_{message.id}.{file_extension}"
                        if os.path.exists(temp_file):
                            os.remove(temp_file)
                except Exception as e:
                    print(f"Ошибка скачивания стикера {message.id}: {e}")
            
            return media_info
            
        except Exception as e:
            print(f"Критическая ошибка скачивания медиа для сообщения {message.id}: {e}")
            return None

    async def _parse_album(self, message: Message, channel_info: dict, media_dir: str, channel_id: str):
        """Парсинг альбома (группы медиа файлов)"""
        try:
            print(f"Начинаем парсинг альбома {message.media_group_id}")
            
            # Получаем все сообщения из альбома
            album_messages = []
            
            # Ищем другие сообщения с тем же media_group_id (ограничиваем поиск)
            async for msg in self.client.get_chat_history(message.chat.id, limit=100):
                if (hasattr(msg, 'media_group_id') and 
                    msg.media_group_id == message.media_group_id):
                    album_messages.append(msg)
                    
                # Если нашли достаточно и дошли до более старых сообщений
                if len(album_messages) >= 10:  # Максимум 10 элементов в альбоме
                    break
            
            # Сортируем по ID сообщения
            album_messages.sort(key=lambda x: x.id)
            print(f"Найдено {len(album_messages)} элементов в альбоме")
            
            # Создаем посты для каждого элемента альбома
            album_posts = []
            album_text = ""
            
            # Собираем весь текст из всех сообщений альбома
            for msg in album_messages:
                msg_text = msg.text or msg.caption or ""
                if msg_text and not album_text:  # Берем первый непустой текст
                    album_text = msg_text
            
            for i, msg in enumerate(album_messages):
                media_info = await self._parse_media(msg, media_dir, channel_id)
                
                post_data = {
                    "message_id": msg.id,
                    "channel_id": str(channel_info["id"]),
                    "channel_name": channel_info["title"],
                    "text": album_text,  # Весь текст альбома для каждого элемента
                    "media_type": media_info.get("type") if media_info else None,
                    "media_url": media_info.get("url") if media_info else None,
                    "post_date": msg.date,
                    "album_id": message.media_group_id,
                    "album_position": i + 1,
                    "album_total": len(album_messages)
                }
                
                # Добавляем дополнительную информацию о медиа
                if media_info:
                    post_data.update({
                        "media_size": media_info.get("size"),
                        "media_filename": media_info.get("filename"),
                        "media_duration": media_info.get("duration"),
                        "media_width": media_info.get("width"),
                        "media_height": media_info.get("height"),
                    })
                
                album_posts.append(post_data)
                print(f"Добавлен элемент альбома {i+1}/{len(album_messages)}: {msg.id}")
            
            print(f"Альбом {message.media_group_id} обработан: {len(album_posts)} элементов")
            return album_posts
            
        except Exception as e:
            print(f"Ошибка обработки альбома {message.media_group_id}: {e}")
            return []
    
    async def parse_all_sources(self, db: Session):
        """Парсинг всех активных источников"""
        if not await self.is_authorized():
            return {"status": "error", "message": "Не авторизован в Telegram"}
        
        # Получаем активные источники
        sources = db.query(Source).filter(Source.is_active == True).all()
        if not sources:
            return {"status": "error", "message": "Нет активных источников для парсинга"}
        
        total_posts = 0
        results = []
        
        for source in sources:
            try:
                # Парсим канал
                result = await self.parse_channel_posts(source.channel_id, limit=20)
                
                if result["status"] == "success":
                    posts_data = result["posts"]
                    new_posts = 0
                    
                    # Сохраняем посты в базу данных
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
                            print(f"Ошибка при сохранении поста {post_data.get('message_id', 'unknown')} из канала {source.channel_name}: {e}")
                            continue
                    
                    try:
                        db.commit()
                    except Exception as e:
                        print(f"Ошибка при коммите для канала {source.channel_name}: {e}")
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
                                print(f"Ошибка при сохранении поста {post_data.get('message_id', 'unknown')} из канала {source.channel_name}: {post_error}")
                                db.rollback()
                                continue
                    
                    total_posts += new_posts
                    
                    results.append({
                        "channel": source.channel_name,
                        "status": "success",
                        "new_posts": new_posts,
                        "total_parsed": len(posts_data)
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
            "status": "success",
            "message": f"Парсинг завершен. Добавлено {total_posts} новых постов",
            "total_new_posts": total_posts,
            "results": results
        }
    
    async def stop(self):
        """Остановить клиент"""
        if self.client and self.client.is_connected:
            await self.client.stop()

# Глобальный экземпляр парсера
telegram_parser = TelegramParser() 