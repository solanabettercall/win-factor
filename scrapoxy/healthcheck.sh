#!/bin/sh

FLAG_FILE="/tmp/healthcheck_passed"

# Если уже успешно проходили — быстро выйти
if [ -f "$FLAG_FILE" ]; then
  exit 0
fi

# Настройка прокси
export http_proxy="http://$SCRAPOXY_USERNAME:$SCRAPOXY_PASSWORD@$SCRAPOXY_HOST:$SCRAPOXY_PORT"
export https_proxy="http://$SCRAPOXY_USERNAME:$SCRAPOXY_PASSWORD@$SCRAPOXY_HOST:$SCRAPOXY_PORT"

# Проверка доступа через прокси
if wget -qO- --timeout=5 api.ipify.org >/dev/null 2>&1; then
  touch "$FLAG_FILE"
  exit 0
else
  exit 1
fi
