from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from db import Base

class Source(Base):
    """Каналы-источники для парсинга"""
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True)
    channel_id = Column(String, unique=True)  # ID канала в Telegram
    channel_name = Column(String)  # Название канала
    channel_username = Column(String, nullable=True)  # @username канала
    is_active = Column(Boolean, default=True)
    added_at = Column(DateTime, default=datetime.utcnow)

class Post(Base):
    """Все посты с каналов-источников"""
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True)
    message_id = Column(Integer)  # ID сообщения в Telegram
    channel_id = Column(String)  # ID канала
    channel_name = Column(String)  # Название канала
    text = Column(Text)  # Текст поста
    media_type = Column(String, nullable=True)  # photo, video, document, audio, voice, animation, sticker
    media_url = Column(String, nullable=True)  # URL медиа
    media_size = Column(Integer, nullable=True)  # Размер файла в байтах
    media_filename = Column(String, nullable=True)  # Имя файла
    media_duration = Column(Integer, nullable=True)  # Длительность в секундах для видео/аудио
    media_width = Column(Integer, nullable=True)  # Ширина для изображений/видео
    media_height = Column(Integer, nullable=True)  # Высота для изображений/видео
    album_id = Column(String, nullable=True)  # ID альбома (media_group_id)
    album_position = Column(Integer, nullable=True)  # Позиция в альбоме
    album_total = Column(Integer, nullable=True)  # Общее количество элементов в альбоме
    post_date = Column(DateTime)  # Дата поста
    parsed_at = Column(DateTime, default=datetime.utcnow)  # Когда спарсили
    is_selected = Column(Boolean, default=False)  # Отобран ли пост

class SelectedPost(Base):
    """Отобранные посты для дальнейшей работы"""
    __tablename__ = "selected_posts"

    id = Column(Integer, primary_key=True)
    post_id = Column(Integer)  # Ссылка на Post.id
    original_text = Column(Text)  # Оригинальный текст
    edited_text = Column(Text, nullable=True)  # Отредактированный текст
    status = Column(String, default="draft")  # draft, ready, published
    selected_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)  # Заметки