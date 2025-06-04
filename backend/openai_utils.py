import os, logging, openai, html
from dotenv import load_dotenv

load_dotenv()

openai.api_key = os.getenv('OPENAI_API_KEY')

REWRITE_PROMPT = (
    "Перепиши немного пост своими словами не меняя его сути, сохраняя теги <b>,<i>,<u>,<s>,<tg-spoiler>,<a>,<code>,<pre>,<blockquote>. "
    "Ссылки оберни в <a href='URL'>URL</a>. Удали упоминания @username и хвост t.me/…"
)
CONDENSE_PROMPT = (
    "Сократи текст до лимита, сохранив основную мысль и ссылки."
)

async def rewrite(html_text: str, truncate: int | None = None) -> str:
    if not html_text:
        return ''
    try:
        chat = await openai.chat.completions.acreate(
            model='gpt-4o-mini',
            messages=[
                {"role": "system", "content": REWRITE_PROMPT},
                {"role": "user", "content": html.unescape(html_text)}
            ],
            max_tokens=800,
            temperature=0.7,
        )
        out = chat.choices[0].message.content.strip()
        if truncate and len(out) > truncate:
            chat2 = await openai.chat.completions.acreate(
                model='gpt-4o-mini',
                messages=[
                    {"role": "system", "content": CONDENSE_PROMPT},
                    {"role": "user", "content": out}
                ],
                max_tokens=800,
                temperature=0.4,
            )
            out = chat2.choices[0].message.content.strip()
        return out
    except Exception as e:
        logging.exception(e)
        return html_text

async def rewrite_text(text: str, max_length: int = None) -> str:
    """
    Rewrite text using OpenAI GPT model
    """
    try:
        prompt = f"Перепиши следующий текст, сделав его более привлекательным для социальных сетей:\n\n{text}"
        
        if max_length:
            prompt += f"\n\nМаксимальная длина: {max_length} символов"
        
        response = openai.Completion.create(
            engine="text-davinci-003",
            prompt=prompt,
            max_tokens=max_length or 1024,
            temperature=0.7,
            n=1,
            stop=None
        )
        
        return response.choices[0].text.strip()
    
    except Exception as e:
        print(f"Error rewriting text: {e}")
        return f"Ошибка при обработке текста: {str(e)}"