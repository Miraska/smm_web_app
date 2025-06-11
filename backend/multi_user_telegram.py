import os
import asyncio
from datetime import datetime
from typing import Dict, Optional
from pyrogram import Client
from pyrogram.errors import SessionPasswordNeeded, PhoneCodeInvalid, PhoneCodeExpired
from sqlalchemy.orm import Session

from telegram_parser import TelegramParser
from models import User

class MultiUserTelegramManager:
    """Менеджер для работы с несколькими пользователями Telegram"""
    
    def __init__(self):
        self.user_parsers: Dict[str, TelegramParser] = {}  # phone_number -> TelegramParser
        self.api_id = os.getenv('TELEGRAM_API_ID')
        self.api_hash = os.getenv('TELEGRAM_API_HASH')
        
    def get_session_name(self, phone_number: str) -> str:
        """Генерирует имя файла сессии для пользователя"""
        # Убираем специальные символы из номера телефона
        clean_phone = phone_number.replace('+', '').replace(' ', '').replace('-', '')
        return f"user_session_{clean_phone}"
    
    async def get_parser_for_user(self, phone_number: str) -> TelegramParser:
        """Получает или создает парсер для пользователя"""
        if phone_number not in self.user_parsers:
            # Создаем новый парсер для пользователя
            parser = TelegramParser()
            # Переопределяем имя сессии
            parser.session_name = self.get_session_name(phone_number)
            parser._initialized = False  # Сброс флага инициализации
            
            self.user_parsers[phone_number] = parser
            
        return self.user_parsers[phone_number]
    
    async def get_current_user_parser(self, db: Session) -> Optional[TelegramParser]:
        """Получает парсер для текущего авторизованного пользователя"""
        # Ищем любого активного пользователя с последним логином
        user = db.query(User).filter(
            User.is_active == True,
            User.last_login.isnot(None)
        ).order_by(User.last_login.desc()).first()
        
        if user:
            return await self.get_parser_for_user(user.phone_number)
        
        # Если нет активных пользователей, возвращаем первого доступного парсера
        if self.user_parsers:
            return list(self.user_parsers.values())[0]
        
        return None
    
    async def send_phone_code(self, phone_number: str):
        """Отправляет код подтверждения пользователю"""
        parser = await self.get_parser_for_user(phone_number)
        return await parser.send_phone_code(phone_number)
    
    async def verify_phone_code(self, phone_number: str, phone_code: str, phone_code_hash: str, db: Session):
        """Подтверждает код и создает/обновляет пользователя"""
        parser = await self.get_parser_for_user(phone_number)
        result = await parser.verify_phone_code(phone_number, phone_code, phone_code_hash)
        
        if result["status"] == "success":
            # Получаем информацию о пользователе из Telegram
            try:
                if await parser.is_authorized():
                    me = await parser.client.get_me()
                    
                    # Создаем или обновляем пользователя в БД
                    user = db.query(User).filter(User.phone_number == phone_number).first()
                    if not user:
                        user = User(
                            name=f"{me.first_name} {me.last_name or ''}".strip(),
                            phone_number=phone_number,
                            telegram_id=str(me.id),
                            session_file=f"sessions/{parser.session_name}.session",
                            last_login=datetime.utcnow()
                        )
                        db.add(user)
                    else:
                        user.name = f"{me.first_name} {me.last_name or ''}".strip()
                        user.telegram_id = str(me.id)
                        user.session_file = f"sessions/{parser.session_name}.session"
                        user.last_login = datetime.utcnow()
                        user.is_active = True
                    
                    db.commit()
                    print(f"✅ Пользователь {user.name} ({phone_number}) авторизован и сохранен в БД")
                    
            except Exception as e:
                print(f"⚠️ Ошибка сохранения пользователя: {e}")
        
        return result
    
    async def verify_password(self, phone_number: str, password: str, db: Session):
        """Подтверждает двухфакторную аутентификацию"""
        parser = await self.get_parser_for_user(phone_number)
        result = await parser.verify_password(password)
        
        if result["status"] == "success":
            # Обновляем информацию о пользователе
            try:
                if await parser.is_authorized():
                    me = await parser.client.get_me()
                    
                    user = db.query(User).filter(User.phone_number == phone_number).first()
                    if user:
                        user.last_login = datetime.utcnow()
                        user.is_active = True
                        db.commit()
                        print(f"✅ Пользователь {user.name} прошел двухфакторную аутентификацию")
                        
            except Exception as e:
                print(f"⚠️ Ошибка обновления пользователя: {e}")
        
        return result
    
    async def logout_user(self, phone_number: str, db: Session):
        """Выход пользователя из системы"""
        try:
            # Деактивируем пользователя в БД
            user = db.query(User).filter(User.phone_number == phone_number).first()
            if user:
                user.is_active = False
                db.commit()
                print(f"🔒 Пользователь {user.name} деактивирован в БД")
            
            # Останавливаем парсер и удаляем из памяти
            if phone_number in self.user_parsers:
                parser = self.user_parsers[phone_number]
                await parser.stop()
                
                # Удаляем файл сессии
                session_file = f"sessions/{parser.session_name}.session"
                if os.path.exists(session_file):
                    os.remove(session_file)
                    print(f"🗑️ Файл сессии удален: {session_file}")
                
                del self.user_parsers[phone_number]
                print(f"✅ Парсер для пользователя {phone_number} остановлен и удален")
            
            return {"status": "success", "message": "Выход выполнен успешно"}
            
        except Exception as e:
            print(f"❌ Ошибка при выходе пользователя: {e}")
            return {"status": "error", "message": f"Ошибка выхода: {str(e)}"}
    
    async def get_user_channels(self, phone_number: str):
        """Получает каналы пользователя"""
        parser = await self.get_parser_for_user(phone_number)
        return await parser.get_user_channels()
    
    async def cleanup_inactive_sessions(self, db: Session):
        """Очищает неактивные сессии"""
        try:
            # Получаем неактивных пользователей
            inactive_users = db.query(User).filter(User.is_active == False).all()
            
            for user in inactive_users:
                if user.session_file and os.path.exists(user.session_file):
                    try:
                        os.remove(user.session_file)
                        print(f"🗑️ Удален файл сессии неактивного пользователя: {user.session_file}")
                    except Exception as e:
                        print(f"⚠️ Ошибка удаления файла сессии {user.session_file}: {e}")
                
                # Убираем пользователя из памяти
                if user.phone_number in self.user_parsers:
                    try:
                        parser = self.user_parsers[user.phone_number]
                        await parser.stop()
                        del self.user_parsers[user.phone_number]
                    except Exception as e:
                        print(f"⚠️ Ошибка остановки парсера для {user.phone_number}: {e}")
            
        except Exception as e:
            print(f"❌ Ошибка очистки неактивных сессий: {e}")
    
    async def stop_all(self):
        """Останавливает всех парсеров"""
        for phone_number, parser in self.user_parsers.items():
            try:
                await parser.stop()
                print(f"✅ Парсер для {phone_number} остановлен")
            except Exception as e:
                print(f"⚠️ Ошибка остановки парсера для {phone_number}: {e}")

# Глобальный экземпляр менеджера
multi_user_manager = MultiUserTelegramManager() 