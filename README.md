# 🏐 Win Factor - Volleyball Monitoring System

Система мониторинга волейбольных матчей с автоматическим парсингом данных с Volleystation и уведомлениями через Telegram-бота.

## 🎯 Что делает система

- 🔄 **Автоматический парсинг** данных с Volleystation.com
- 👥 **Мониторинг игроков** - отслеживание конкретных спортсменов
- 📊 **Статистика** игроков и команд  
- 📱 **Telegram-уведомления** о заявках и стартовых составах

## 🚀 Быстрый запуск

### Требования
- Docker и Docker Compose
- Токен Telegram бота
- ID Telegram канала для уведомлений


### 2. Настройка .env
```env
# Обязательные параметры
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHANNEL_ID=your_channel_id_here

# MongoDB
MONGODB_USERNAME=root
MONGODB_PASSWORD=your_secure_password

# Остальные параметры можно оставить по умолчанию
```

### 3. Запуск
```bash
# Разработка (с hot reload)
docker compose -f docker-compose.dev.yml up --watch --build parser

# Продакшен
docker-compose -f docker-compose.prod.yml up -d --build
```

## 🤖 Использование Telegram бота

1. Отправьте `/start` боту
2. Выберите турниры для мониторинга
3. Добавьте команды и игроков в отслеживание
4. Получайте автоматические уведомления о:
   - Объявлении заявок на матч
   - Определении стартовых составов
   - Статистике игроков с рейтингами

## 🔧 Архитектура

```
Volleystation.com → Cloudflare Proxy → Parser Service → MongoDB/Redis
                                          ↓
                                    Telegram Bot → Users
```

**Компоненты:**
- **Parser Service** (NestJS) - основная логика парсинга и мониторинга
- **Telegram Bot** (Grammy) - интерактивный интерфейс для пользователей  
- **Cloudflare Proxy** (Python) - обход защиты сайта
- **MongoDB** - хранение данных мониторинга
- **Redis** - кэширование

## 📋 Основные возможности

- ✅ Кэширование запросов
- ✅ Обход Cloudflare защиты
- ✅ Система уведомлений через Telegram
- ✅ Мониторинг игроков и команд
- ✅ Интерактивные меню в Telegram боте
- ✅ Автоматическое отслеживание матчей каждые 5-10 секунд
