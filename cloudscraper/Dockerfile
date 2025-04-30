FROM python:3.10-slim

RUN pip install --upgrade pip \
    && pip install cloudscraper mitmproxy

WORKDIR /app
COPY . .

EXPOSE 8080

CMD ["python", "proxy.py"]
