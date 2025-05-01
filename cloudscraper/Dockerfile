FROM python:3.13-slim

# Устанавливаем системные зависимости (если нужны)
RUN apt-get update && apt-get install -y \
    build-essential \
    && pip install --upgrade pip \
    && rm -rf /var/lib/apt/lists/*

# Устанавливаем зависимости из requirements.txt
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем только нужные файлы
WORKDIR /app
COPY . .

# Открываем порт
EXPOSE 8080

# Запуск скрипта
CMD ["python", "proxy.py"]
