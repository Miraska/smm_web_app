#!/usr/bin/env python3
import os
import requests
import json

def check_missing_media():
    """Проверяет недостающие медиафайлы и пытается их перезагрузить"""
    
    # Получаем список всех постов
    try:
        response = requests.get('http://localhost:8000/api/posts')
        posts = response.json()
        print(f"Найдено {len(posts)} постов")
    except Exception as e:
        print(f"Ошибка получения постов: {e}")
        return
    
    missing_files = []
    media_base_path = "../frontend/public/media"
    
    # Проверяем каждый пост с медиа
    for post in posts:
        if post.get('media_url') and post.get('media_type'):
            # Формируем путь к файлу
            channel_clean = post['channel_id'].replace('-', '')
            media_url = post['media_url']
            filename = media_url.split('/')[-1]  # Извлекаем имя файла из URL
            
            file_path = os.path.join(media_base_path, channel_clean, filename)
            
            # Проверяем существование файла
            if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
                missing_files.append({
                    'post_id': post['id'],
                    'message_id': post['message_id'],
                    'channel_id': post['channel_id'],
                    'media_type': post['media_type'],
                    'media_url': post['media_url'],
                    'expected_path': file_path
                })
                print(f"❌ Отсутствует файл: {file_path}")
            else:
                print(f"✅ Файл найден: {file_path} ({os.path.getsize(file_path)} байт)")
    
    print(f"\nОбнаружено {len(missing_files)} недостающих файлов")
    
    # Пытаемся перезагрузить недостающие файлы
    if missing_files:
        print("\nПытаемся перезагрузить недостающие файлы...")
        
        for missing in missing_files:
            try:
                url = f"http://localhost:8000/api/redownload-media/{missing['channel_id']}/{missing['message_id']}"
                print(f"Загружаем: {missing['media_type']} для сообщения {missing['message_id']}")
                
                response = requests.post(url)
                result = response.json()
                
                if response.status_code == 200 and result.get('status') == 'success':
                    print(f"  ✅ Успешно загружен")
                else:
                    print(f"  ❌ Ошибка: {result.get('message', 'Неизвестная ошибка')}")
                    
            except Exception as e:
                print(f"  ❌ Исключение при загрузке: {e}")
    
    print("\nПроверка завершена!")

if __name__ == "__main__":
    check_missing_media() 