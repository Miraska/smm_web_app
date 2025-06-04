import asyncio, logging, os
from telegram import Update, InlineKeyboardMarkup, InlineKeyboardButton, Bot, WebAppInfo
from telegram.constants import ParseMode
from telegram.ext import ContextTypes, Application, CommandHandler, MessageHandler, filters
from models import Channel, Post
from db import get_session
from sqlalchemy.orm import Session
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv('BOT_TOKEN')
WEBAPP_HOST = os.getenv('WEBAPP_HOST')
WEBAPP_URL = os.getenv("WEBAPP_URL")

app = (
    Application.builder()
    .token(BOT_TOKEN)
    .build()
)

bot = Bot(BOT_TOKEN)

# /start shows web‑app button
async def start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "Привет! Используйте кнопку меню, чтобы открыть редактор.",
        reply_markup={
            "keyboard": [[{"text": "Открыть редактор", "web_app": {"url": WEBAPP_URL}}]],
            "resize_keyboard": True
        }
    )

app.add_handler(CommandHandler('start', start))

# Save every channel_post where bot is admin
async def save_channel_post(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    msg = update.channel_post
    if not msg:
        return
    
    # Use synchronous database session
    db = next(get_session())
    try:
        # ensure channel exists
        ch = db.query(Channel).filter(Channel.id == str(msg.chat.id)).first()
        if not ch:
            ch = Channel(id=str(msg.chat.id), title=msg.chat.title, username=msg.chat.username)
            db.add(ch)
            db.commit()
        
        html_content = msg.html_text or (msg.caption_html if msg.caption else '')
        media_type, file_id = None, None
        if msg.photo:
            media_type, file_id = 'photo', msg.photo[-1].file_id
        elif msg.video:
            media_type, file_id = 'video', msg.video.file_id
        elif msg.animation:
            media_type, file_id = 'animation', msg.animation.file_id
        elif msg.document:
            media_type, file_id = 'document', msg.document.file_id
        
        post = Post(
            channel_id=ch.id, 
            html=html_content, 
            media_type=media_type, 
            file_id=file_id
        )
        db.add(post)
        db.commit()
    finally:
        db.close()

app.add_handler(MessageHandler(filters.UpdateType.CHANNEL_POST, save_channel_post))

async def handle_post_publish(channel_id: str, text: str, media_type: str = None, file_id: str = None, db: Session = None):
    """Publish post to channel."""
    if media_type and file_id:
        if media_type == "photo":
            await bot.send_photo(channel_id, file_id, caption=text, parse_mode="HTML")
        elif media_type == "video":
            await bot.send_video(channel_id, file_id, caption=text, parse_mode="HTML")
        elif media_type == "animation":
            await bot.send_animation(channel_id, file_id, caption=text, parse_mode="HTML")
    else:
        await bot.send_message(channel_id, text, parse_mode="HTML")