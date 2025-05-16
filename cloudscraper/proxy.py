import asyncio
from urllib.parse import urlparse
from mitmproxy import http, options
from mitmproxy.tools.dump import DumpMaster
import requests


class FlexibleHostProxy:
    async def request(self, flow: http.HTTPFlow) -> None:
        try:
            method = flow.request.method
            original_url = flow.request.pretty_url

            parsed = urlparse(original_url)
            original_host = parsed.hostname

            # Только если домен оканчивается на volleystation.com — проксируем
            if original_host and original_host.endswith("volleystation.com"):
                rewritten_url = original_url.replace(original_host, "134.209.133.175")

                # Удалим оригинальный Host из заголовков, если есть
                headers = {
                    **{k: v for k, v in flow.request.headers.items() if k.lower() != "host"},
                    "Host": original_host
                }

                response = requests.request(
                    method=method,
                    url=rewritten_url,
                    headers=headers,
                    data=flow.request.content if method in ["POST", "PUT", "PATCH"] else None,
                    params=flow.request.query,
                    verify=False,
                    timeout=10
                )

                safe_headers = {
                    key: value for key, value in response.headers.items()
                    if key.lower() not in ["content-encoding", "transfer-encoding", "content-length"]
                }

                flow.response = http.Response.make(
                    response.status_code,
                    response.content,
                    safe_headers
                )
            else:
                # Не вмешиваемся в другие домены
                return

        except Exception as e:
            flow.response = http.Response.make(500, f"Proxy error: {str(e)}")


async def start_proxy():
    opts = options.Options(listen_port=8080)
    m = DumpMaster(opts)
    m.addons.add(FlexibleHostProxy())
    await m.run()


if __name__ == "__main__":
    asyncio.run(start_proxy())
