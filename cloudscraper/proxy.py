import ssl
from mitmproxy import http, options
from mitmproxy.tools.dump import DumpMaster
import cloudscraper
import asyncio
import requests
from requests.adapters import HTTPAdapter, PoolManager
import os


upstream_proxy = os.getenv("UPSTREAM_PROXY")

proxies = {
    "http": upstream_proxy,
    "https": upstream_proxy,
}


scraper = cloudscraper.create_scraper()


class CloudflareProxy:
    async def request(self, flow: http.HTTPFlow) -> None:
        try:
            method = flow.request.method
            url = flow.request.url
            data = flow.request.content if method == "POST" else None

            # Отправка запроса через cloudscraper
            response = (
                scraper.post(url, data=data)
                if method == "POST"
                else scraper.get(url)
            )

            # Фильтруем заголовки
            safe_headers = {
                key: value for key, value in response.headers.items()
                if key.lower() not in ["content-encoding", "transfer-encoding", "content-length"]
            }

            # Возвращаем корректный ответ
            flow.response = http.Response.make(
                response.status_code,
                response.content,
                safe_headers
            )
        except Exception as e:
            flow.response = http.Response.make(500, f"Proxy error: {str(e)}")

async def start_proxy():
    opts = options.Options(listen_port=8080)
    m = DumpMaster(opts)
    m.addons.add(CloudflareProxy())
    await m.run()

if __name__ == "__main__":
    asyncio.run(start_proxy())
