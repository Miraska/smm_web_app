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
        self._auth_cache = None
        self._auth_cache_time = None
        
    async def initialize_client(self):
        """Инициализация клиента Telegram"""
        print(f"🔄 Инициализация клиента... Уже инициализирован: {self._initialized}")
        
        if self._initialized and self.client:
            print("ℹ️ Клиент уже инициализирован")
            return
            
        if not self.api_id or not self.api_hash:
            raise ValueError("TELEGRAM_API_ID и TELEGRAM_API_HASH должны быть указаны в .env файле")
        
        print("📁 Создаем директорию для сессий...")
        # Создаем директорию для сессий если её нет
        os.makedirs("sessions", exist_ok=True)
        
        print("🔧 Создаем новый клиент Telegram...")
        self.client = Client(
            self.session_name,
            api_id=int(self.api_id),
            api_hash=self.api_hash,
            workdir="sessions/"
        )
        self._initialized = True
        print("✅ Клиент создан и инициализирован")
        
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
        print(f"📞 Начинаем отправку кода для номера: {phone_number}")
        
        if not self.client:
            print("🔄 Инициализируем клиент...")
            await self.initialize_client()
            
        try:
            print(f"🔌 Проверяем подключение клиента...")
            if not self.client.is_connected:
                print("🔗 Подключаемся к Telegram...")
                await self.client.connect()
                print("✅ Подключение установлено")
            else:
                print("ℹ️ Клиент уже подключен")
                
            print(f"📤 Отправляем код на номер {phone_number}...")
            sent_code = await self.client.send_code(phone_number)
            print(f"✅ Код успешно отправлен, hash: {sent_code.phone_code_hash[:10]}...")
            
            return {
                "status": "success", 
                "message": "Код отправлен на телефон",
                "phone_code_hash": sent_code.phone_code_hash
            }
        except Exception as e:
            print(f"❌ Ошибка отправки кода: {str(e)}")
            return {"status": "error", "message": f"Ошибка отправки кода: {str(e)}"}
    
    async def verify_phone_code(self, phone_number: str, phone_code: str, phone_code_hash: str):
        """Проверка кода подтверждения"""
        try:
            if not self.client:
                await self.initialize_client()
            
            # Очищаем кэш для проверки авторизации
            self.clear_auth_cache()
            
            print(f"📱 Проверяем код {phone_code} для номера {phone_number}")
            
            # Убеждаемся, что клиент подключен
            if not self.client.is_connected:
                print("🔌 Подключаемся к Telegram...")
                await self.client.connect()
            
            # Увеличиваем timeout для подписания
            try:
                # Подписываем код с расширенным timeout
                signed_in = await asyncio.wait_for(
                    self.client.sign_in(phone_number, phone_code_hash, phone_code),
                    timeout=30.0  # Увеличен timeout до 30 секунд
                )
                
                print(f"✅ Успешная авторизация пользователя: {signed_in.first_name}")
                
                # Проверяем авторизацию
                if await self.is_authorized():
                    print("✅ Авторизация подтверждена")
                    return {
                        "status": "success",
                        "message": "Код подтвержден успешно",
                        "user_info": {
                            "first_name": signed_in.first_name,
                            "last_name": signed_in.last_name,
                            "phone_number": signed_in.phone_number
                        }
                    }
                else:
                    print("❌ Не удалось подтвердить авторизацию")
                    return {"status": "error", "message": "Не удалось подтвердить авторизацию"}
                
            except asyncio.TimeoutError:
                print("⏱️ Timeout при проверке кода")
                return {"status": "error", "message": "Время ожидания истекло. Попробуйте еще раз."}
                
        except PhoneCodeExpired:
            print("⏱️ Код истек")
            return {"status": "error", "message": "Код истёк. Запросите новый код."}
        except PhoneCodeInvalid:
            print("❌ Неверный код")
            return {"status": "error", "message": "Неверный код. Проверьте и попробуйте еще раз."}
        except SessionPasswordNeeded:
            print("🔐 Требуется двухфакторная аутентификация")
            return {"status": "password_required", "message": "Требуется пароль двухфакторной аутентификации"}
        except Exception as e:
            error_message = str(e)
            print(f"❌ Ошибка проверки кода: {error_message}")
            
            # Специальная обработка для разных типов ошибок
            if "PHONE_CODE_EXPIRED" in error_message:
                return {"status": "error", "message": "Код истёк. Запросите новый код."}
            elif "PHONE_CODE_INVALID" in error_message:
                return {"status": "error", "message": "Неверный код. Проверьте и попробуйте еще раз."}
            elif "SESSION_PASSWORD_NEEDED" in error_message:
                return {"status": "password_required", "message": "Требуется пароль двухфакторной аутентификации"}
            else:
                return {"status": "error", "message": f"Ошибка: {error_message}"}
    
    async def verify_password(self, password: str):
        """Подтвердить пароль двухфакторной аутентификации"""
        try:
            if not self.client.is_connected:
                await self.client.connect()
            await self.client.check_password(password)
            
            # Очищаем кэш авторизации для принудительной проверки
            self._auth_cache = None
            self._auth_cache_time = None
            
            return {"status": "success", "message": "Успешная авторизация"}
        except Exception as e:
            return {"status": "error", "message": f"Неверный пароль: {str(e)}"}
    
    async def is_authorized(self):
        """Проверить, авторизован ли пользователь"""
        print("🔍 Проверяем статус авторизации...")
        
        # Используем кэш на 10 секунд (уменьшили с 30 для более быстрого обнаружения проблем)
        now = datetime.now()
        if (self._auth_cache is not None and 
            self._auth_cache_time and 
            (now - self._auth_cache_time).total_seconds() < 10):
            print(f"📋 Используем кэшированный статус: {self._auth_cache}")
            return self._auth_cache
            
        try:
            if not self.client:
                await self.initialize_client()
            
            # Проверяем, есть ли файл сессии
            session_file = f"sessions/{self.session_name}.session"
            if not os.path.exists(session_file):
                self._auth_cache = False
                self._auth_cache_time = now
                return False
            
            # Если клиент не подключен, пытаемся подключиться
            if not self.client.is_connected:
                try:
                    await self.client.connect()
                except Exception as e:
                    print(f"Ошибка подключения Telegram клиента: {e}")
                    # Если клиент был завершен, создаем новый
                    if "already terminated" in str(e).lower() or "already stopped" in str(e).lower():
                        print("🔄 Клиент был завершен, переинициализируем...")
                        self._initialized = False  # Сбрасываем флаг инициализации
                        await self.initialize_client()
                        try:
                            print("🔗 Переподключаемся после переинициализации...")
                            await self.client.connect()
                            print("✅ Переподключение после переинициализации успешно")
                        except Exception as reinit_error:
                            print(f"❌ Ошибка переинициализации клиента: {reinit_error}")
                            self._auth_cache = False
                            self._auth_cache_time = now
                            return False
                    else:
                        self._auth_cache = False
                        self._auth_cache_time = now
                        return False
            
            # Проверяем авторизацию через API запрос с повторными попытками
            for attempt in range(3):
                try:
                    print(f"🔍 Попытка {attempt + 1}/3: Проверяем авторизацию через get_me()...")
                    me = await self.client.get_me()
                    if me is not None:
                        print(f"✅ Пользователь авторизован: {me.first_name if hasattr(me, 'first_name') else 'Unknown'}")
                        self._auth_cache = True
                        self._auth_cache_time = now
                        return True
                    print("❌ get_me() вернул None")
                    self._auth_cache = False
                    self._auth_cache_time = now
                    return False
                except Exception as e:
                    error_str = str(e)
                    print(f"⚠️ Попытка {attempt + 1}/3 проверки авторизации не удалась: {error_str}")
                    
                    # Различные типы ошибок сессии
                    session_errors = [
                        "AUTH_KEY_UNREGISTERED", 
                        "AUTH_KEY_INVALID",
                        "SESSION_REVOKED",
                        "USER_DEACTIVATED",
                        "SESSION_EXPIRED"
                    ]
                    
                    # Если сессия повреждена или истекла, удаляем файл сессии
                    if any(err in error_str for err in session_errors):
                        print(f"🗑️ Обнаружена проблема с сессией ({error_str}), удаляем файл...")
                        await self._reset_session()
                        self._auth_cache = False
                        self._auth_cache_time = now
                        return False
                    
                    # Обработка проблем с подключением
                    connection_errors = [
                        "Connection refused",
                        "Connection reset",
                        "Network is unreachable",
                        "Timeout"
                    ]
                    
                    if any(err in error_str for err in connection_errors):
                        print(f"🌐 Проблема с сетью: {error_str}")
                        if attempt < 2:
                            print(f"⏳ Ждем {(attempt + 1) * 2} секунд перед повторной попыткой...")
                            await asyncio.sleep((attempt + 1) * 2)
                            continue
                    
                    if attempt < 2:
                        # Переподключаемся для следующей попытки
                        try:
                            print("🔄 Переподключаемся для следующей попытки...")
                            await self.client.disconnect()
                            await asyncio.sleep(1)
                            await self.client.connect()
                        except Exception as reconnect_error:
                            print(f"⚠️ Ошибка переподключения: {reconnect_error}")
                        await asyncio.sleep(1)
                    else:
                        print(f"❌ Все попытки исчерпаны. Последняя ошибка: {error_str}")
                        self._auth_cache = False
                        self._auth_cache_time = now
                        return False
                        
        except Exception as e:
            print(f"Критическая ошибка проверки авторизации: {e}")
            self._auth_cache = False
            self._auth_cache_time = now
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
            print(f"Канал {channel_id} не найден через get_chat: {e}")
            
            # Попытаемся найти среди пользовательских каналов
            try:
                channels_response = await self.get_user_channels()
                if channels_response["status"] == "success":
                    for channel in channels_response["channels"]:
                        if str(channel["id"]) == str(channel_id):
                            print(f"Найден канал в списке пользователя: {channel['title']}")
                            return {
                                "id": channel["id"],
                                "title": channel["title"],
                                "username": channel.get("username"),
                                "type": channel.get("type", "channel"),
                                "member_count": channel.get("members_count", 0),
                                "description": None
                            }
                print(f"Канал {channel_id} не найден в списке пользователя")
                return None
            except Exception as fallback_error:
                print(f"Ошибка поиска канала в списке пользователя: {fallback_error}")
                return None
        except Exception as e:
            print(f"Ошибка получения информации о канале {channel_id}: {e}")
            return None
    
    async def parse_channel_posts(self, channel_id: str, limit: int = 50, until_date=None, offset: int = 0):
        """Парсинг постов из канала"""
        print(f"🔄 Начинаем парсинг канала {channel_id} с лимитом {limit}")
        print(f"🔍 until_date = {until_date} (тип: {type(until_date).__name__})")
        if until_date:
            print(f"⏰ Парсим до даты: {until_date}")
        else:
            print(f"⏰ Парсим БЕЗ ограничений по дате")
        if offset > 0:
            print(f"⏭️ Пропускаем первые {offset} постов")
        
        try:
            if not self.client:
                await self.initialize_client()
            
            # Проверяем авторизацию
            if not await self.is_authorized():
                print(f"❌ Не авторизован в Telegram для канала {channel_id}")
                return {"status": "error", "message": "Не авторизован в Telegram"}
            
            # Убеждаемся, что клиент подключен
            if not self.client.is_connected:
                print(f"🔌 Подключаемся к Telegram...")
                await self.client.connect()
            
            posts_data = []
            processed_albums = set()  # Отслеживаем обработанные альбомы
            
            # Получаем информацию о канале
            print(f"📋 Получаем информацию о канале {channel_id}")
            channel_info = await self.get_channel_info(channel_id)
            if not channel_info:
                print(f"❌ Канал {channel_id} не найден")
                return {"status": "error", "message": f"Канал {channel_id} не найден"}
            
            print(f"✅ Канал найден: {channel_info.get('title', 'Без названия')}")
            
            # Создаем папку для медиа файлов (используем абсолютный путь)
            media_dir = os.path.abspath(f"../frontend/public/media/{channel_id.replace('-', '')}")
            os.makedirs(media_dir, exist_ok=True)
            print(f"📁 Создана папка для медиа: {media_dir}")
            
            # Парсим сообщения
            message_count = 0
            skipped_count = 0
            print(f"📥 Начинаем получение сообщений из канала {channel_id}")
            
            try:
                # Увеличиваем лимит на offset чтобы получить нужные посты после пропуска
                total_limit = limit + offset
                async for message in self.client.get_chat_history(channel_id, limit=total_limit):
                    try:
                        message_count += 1
                        
                        # Пропускаем первые offset сообщений
                        if skipped_count < offset:
                            skipped_count += 1
                            print(f"⏭️ Пропускаем сообщение {skipped_count}/{offset}: {message.id}")
                            continue
                        
                        # Если уже набрали нужное количество постов, прерываем
                        if len(posts_data) >= limit:
                            print(f"🔢 Достигнут лимит {limit} постов, прерываем парсинг")
                            break
                        
                        # Оптимизация: пропускаем посты старше until_date (если указана)
                        if until_date is not None and message.date <= until_date:
                            print(f"⏰ Пропускаем пост {message.id} (дата {message.date} <= {until_date})")
                            continue
                        
                        print(f"📝 Обрабатываем сообщение {len(posts_data)+1}/{limit}: {message.id}")
                        
                        # Получаем текст сообщения
                        text = message.text or message.caption or ""
                        
                        # Обрабатываем альбомы (группы медиа)
                        if hasattr(message, 'media_group_id') and message.media_group_id:
                            if message.media_group_id not in processed_albums:
                                print(f"🎞️ Обрабатываем альбом: {message.media_group_id}")
                                album_posts = await self._parse_album(message, channel_info, media_dir, channel_id)
                                posts_data.extend(album_posts)
                                processed_albums.add(message.media_group_id)
                            continue
                        
                        # Определяем тип медиа и скачиваем файл
                        media_info = await self._parse_media(message, media_dir, channel_id)
                        
                        # Включаем посты только с текстом, даже без медиа
                        if not text.strip() and not media_info:
                            print(f"⏭️ Пропускаем пустое сообщение {message.id}")
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
                        print(f"✅ Добавлен пост {message.id}, текст: {len(text)} символов, медиа: {media_info.get('type') if media_info else 'нет'}")
                        
                    except Exception as e:
                        print(f"❌ Ошибка обработки сообщения {message.id}: {e}")
                        continue
                        
            except Exception as e:
                print(f"❌ Ошибка при получении истории чата {channel_id}: {e}")
                return {"status": "error", "message": f"Ошибка получения сообщений: {str(e)}"}
                
            print(f"🎯 Парсинг завершен! Обработано {len(posts_data)} постов из {message_count} сообщений")
            
            return {
                "status": "success", 
                "message": f"Спарсено {len(posts_data)} постов из канала {channel_info['title']}",
                "posts": posts_data,
                "channel_info": channel_info
            }
            
        except FloodWait as e:
            wait_time = e.value
            print(f"⏳ Rate limit от Telegram: нужно подождать {wait_time} секунд")
            if wait_time <= 60:  # Ждем только если меньше минуты
                print(f"⏱️ Ждем {wait_time} секунд...")
                await asyncio.sleep(wait_time)
                # Повторяем попытку парсинга после ожидания
                try:
                    return await self.parse_channel_posts(channel_id, limit, until_date, offset)
                except Exception as retry_error:
                    print(f"❌ Ошибка повторной попытки: {retry_error}")
                    return {"status": "error", "message": f"Ошибка после ожидания rate limit: {str(retry_error)}"}
            else:
                return {"status": "error", "message": f"Rate limit слишком большой: {wait_time} секунд"}
        except ChatAdminRequired:
            return {"status": "error", "message": "Нет доступа к каналу"}
        except Exception as e:
            error_str = str(e)
            print(f"❌ Критическая ошибка парсинга канала {channel_id}: {error_str}")
            
            # Проверяем, связана ли ошибка с авторизацией
            auth_errors = [
                "AUTH_KEY_UNREGISTERED", 
                "AUTH_KEY_INVALID",
                "SESSION_REVOKED",
                "USER_DEACTIVATED"
            ]
            
            if any(err in error_str for err in auth_errors):
                print(f"🔄 Обнаружена ошибка авторизации при парсинге: {error_str}")
                # Сбрасываем кэш авторизации
                self._auth_cache = None
                self._auth_cache_time = None
                return {"status": "error", "message": f"Потеря авторизации: {error_str}"}
            
            return {"status": "error", "message": f"Ошибка парсинга: {error_str}"}

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
                result = await self.parse_channel_posts(source.channel_id, limit=5)
                
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
    
    async def parse_all_sources_limited(self, db: Session, limit: int = 5):
        """Ограниченный парсинг всех активных источников (только указанное количество постов)"""
        if not await self.is_authorized():
            return {"status": "error", "message": "Не авторизован в Telegram"}
        
        # Получаем активные источники
        sources = db.query(Source).filter(Source.is_active == True).all()
        if not sources:
            return {"status": "error", "message": "Нет активных источников для парсинга"}
        
        total_posts = 0
        results = []
        posts_found = 0
        
        for source in sources:
            try:
                # Парсим канал с ограниченным количеством постов
                result = await self.parse_channel_posts(source.channel_id, limit=limit)
                
                if result["status"] == "success":
                    posts_data = result["posts"]
                    new_posts = 0
                    
                    # Сохраняем посты в базу данных
                    for post_data in posts_data:
                        if posts_found >= limit:  # Ограничиваем общее количество
                            break
                            
                        try:
                            # Проверяем, не существует ли уже этот пост
                            existing_post = db.query(Post).filter(
                                Post.channel_id == post_data["channel_id"],
                                Post.message_id == post_data["message_id"]
                            ).first()
                            
                            if not existing_post:
                                new_post = Post(**post_data)
                                db.add(new_post)
                                db.commit()  # Коммитим сразу для потоковой загрузки
                                new_posts += 1
                                posts_found += 1
                                print(f"💾 Сохранен пост {post_data.get('message_id')} из {source.channel_name}")
                        except Exception as e:
                            print(f"Ошибка при сохранении поста {post_data.get('message_id', 'unknown')}: {e}")
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
                
                # Прерываем если достигли лимита
                if posts_found >= limit:
                    break
                    
                # Небольшая задержка между каналами
                await asyncio.sleep(0.5)
                
            except Exception as e:
                results.append({
                    "channel": source.channel_name,
                    "status": "error",
                    "message": f"Ошибка: {str(e)}"
                })
        
        return {
            "status": "success",
            "message": f"Ограниченный парсинг завершен. Добавлено {total_posts} новых постов",
            "total_new_posts": total_posts,
            "results": results
        }
    
    async def stop(self):
        """Безопасно остановить клиент"""
        try:
            if self.client and hasattr(self.client, 'is_connected'):
                if self.client.is_connected:
                    print("🔌 Отключаем Telegram клиент...")
                    await self.client.stop()
                    print("✅ Telegram клиент отключен")
                else:
                    print("ℹ️ Telegram клиент уже отключен")
            else:
                print("ℹ️ Telegram клиент не инициализирован")
        except Exception as e:
            if "already terminated" in str(e).lower() or "already stopped" in str(e).lower():
                print("ℹ️ Telegram клиент уже завершен")
            else:
                print(f"⚠️ Ошибка при остановке клиента: {e}")
                raise

    async def _reset_session(self):
        """Внутренний метод для сброса сессии при ошибках"""
        try:
            # Останавливаем клиент
            if self.client and hasattr(self.client, 'is_connected'):
                try:
                    if self.client.is_connected:
                        await self.client.stop()
                except:
                    pass
            
            # Удаляем файл сессии
            session_file = f"sessions/{self.session_name}.session"
            if os.path.exists(session_file):
                try:
                    os.remove(session_file)
                    print(f"✅ Файл сессии {session_file} удален")
                except Exception as remove_error:
                    print(f"❌ Ошибка удаления файла сессии: {remove_error}")
            
            # Переинициализируем клиент
            print("🔄 Переинициализируем клиент после сброса сессии...")
            self._initialized = False
            await self.initialize_client()
            print("✅ Клиент переинициализирован")
            
        except Exception as e:
            print(f"❌ Ошибка при сбросе сессии: {e}")

    def clear_auth_cache(self):
        """Очистить кэш авторизации и удалить файл сессии"""
        self._auth_cache = None
        self._auth_cache_time = None
        
        # Удаляем файл сессии для полного выхода
        try:
            session_file = f"sessions/{self.session_name}.session"
            if os.path.exists(session_file):
                os.remove(session_file)
                print(f"🗑️ Файл сессии удален: {session_file}")
        except Exception as e:
            print(f"⚠️ Ошибка при удалении файла сессии: {e}")

# Глобальный экземпляр парсера
telegram_parser = TelegramParser() 