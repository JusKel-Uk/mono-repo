"""Local Plaid sandbox explorer — proxies API using secrets.env (never exposed to browser)."""

from __future__ import annotations

import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote

UI_ROOT = Path(__file__).resolve().parent
SANDBOX_ROOT = UI_ROOT.parent
sys.path.insert(0, str(SANDBOX_ROOT))

from plaid_client import ENDPOINTS, GROUPS, load_secrets, call_endpoint  # noqa: E402

PORT = int(__import__("os").environ.get("PLAID_UI_PORT", "8766"))


def json_response(handler: BaseHTTPRequestHandler, status: int, payload: dict) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def serve_file(handler: BaseHTTPRequestHandler, rel_path: str, content_type: str) -> None:
    path = UI_ROOT / rel_path
    if not path.is_file():
        handler.send_error(404)
        return
    data = path.read_bytes()
    handler.send_response(200)
    handler.send_header("Content-Type", content_type)
    handler.send_header("Content-Length", str(len(data)))
    handler.end_headers()
    handler.wfile.write(data)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        print(f"[plaid-ui] {self.address_string()} {fmt % args}")

    def do_GET(self) -> None:
        path = unquote(self.path.split("?", 1)[0])

        if path in ("/", "/index.html"):
            serve_file(self, "index.html", "text/html; charset=utf-8")
            return

        if path.startswith("/assets/"):
            rel = path[1:]
            ext = Path(rel).suffix.lower()
            mime = {
                ".css": "text/css; charset=utf-8",
                ".js": "application/javascript; charset=utf-8",
            }.get(ext, "application/octet-stream")
            serve_file(self, rel, mime)
            return

        if path == "/api/meta":
            try:
                env = load_secrets()
                token = env.get("PLAID_ACCESS_TOKEN", "").strip()
                json_response(
                    self,
                    200,
                    {
                        "provider": "plaid",
                        "environment": "sandbox",
                        "baseUrl": env.get("PLAID_API_BASE_URL", "https://sandbox.plaid.com"),
                        "hasAccessToken": bool(token),
                        "products": env.get("PLAID_PRODUCTS", "transactions,auth"),
                        "groups": GROUPS,
                        "endpoints": ENDPOINTS,
                    },
                )
            except FileNotFoundError as exc:
                json_response(self, 500, {"error": str(exc)})
            return

        self.send_error(404)

    def do_POST(self) -> None:
        path = unquote(self.path.split("?", 1)[0])
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b"{}"
        try:
            body = json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            json_response(self, 400, {"error": "Invalid JSON body"})
            return

        if path == "/api/request":
            endpoint_id = body.get("endpointId", "")
            if not endpoint_id:
                json_response(self, 400, {"error": "endpointId required"})
                return
            try:
                env = load_secrets()
                # Reload after setup may have updated secrets.env
                ok, result = call_endpoint(env, endpoint_id)
                if endpoint_id.startswith("setup"):
                    env = load_secrets()
                    result["hasAccessToken"] = bool(env.get("PLAID_ACCESS_TOKEN", "").strip())
                status = 200 if ok else 400
                json_response(self, status, {"ok": ok, **result})
            except FileNotFoundError as exc:
                json_response(self, 500, {"error": str(exc)})
            except KeyError as exc:
                json_response(self, 500, {"error": f"Missing secret: {exc}"})
            return

        self.send_error(404)


def main() -> None:
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"Plaid sandbox UI → http://127.0.0.1:{PORT}")
    print("Secrets from ../secrets.env (server-side only)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
