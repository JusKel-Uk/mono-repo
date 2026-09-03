"""Local QuickBooks sandbox explorer — proxies Intuit using secrets.env."""

from __future__ import annotations

import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote

UI_ROOT = Path(__file__).resolve().parent
SANDBOX_ROOT = UI_ROOT.parent
sys.path.insert(0, str(SANDBOX_ROOT))

from quickbooks_client import (  # noqa: E402
    ENDPOINTS,
    GROUPS,
    call_endpoint,
    exchange_code,
    load_secrets,
    redirect_uri,
)

PORT = int(__import__("os").environ.get("QUICKBOOKS_UI_PORT", "8769"))


def json_response(handler: BaseHTTPRequestHandler, status: int, payload: dict) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def html_response(handler: BaseHTTPRequestHandler, status: int, html: str) -> None:
    body = html.encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "text/html; charset=utf-8")
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
        print(f"[quickbooks-ui] {self.address_string()} {fmt % args}")

    def do_GET(self) -> None:
        raw_path = self.path
        path = unquote(raw_path.split("?", 1)[0])

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

        if path == "/callback":
            qs = parse_qs(raw_path.split("?", 1)[1] if "?" in raw_path else "")
            code = (qs.get("code") or [""])[0]
            realm_id = (qs.get("realmId") or qs.get("realmID") or [""])[0]
            error = (qs.get("error") or [""])[0]
            if code:
                try:
                    env = load_secrets()
                    ok, data = exchange_code(env, code, realm_id)
                    if ok:
                        html_response(
                            self,
                            200,
                            """<!DOCTYPE html><html><head><meta charset="utf-8"><title>Connected</title></head>
<body style="font-family:system-ui;padding:2rem;color:#1e3a5f;background:#f4f7fb">
<h1>QuickBooks connected</h1>
<p>Access token and Realm ID saved to <code>secrets.env</code>.</p>
<p><a href="/">Open explorer</a></p>
</body></html>""",
                        )
                    else:
                        html_response(
                            self,
                            400,
                            f"""<!DOCTYPE html><html><body style="font-family:system-ui;padding:2rem">
<h1>Token exchange failed</h1><pre>{json.dumps(data, indent=2)}</pre>
<p><a href="/">Back</a></p></body></html>""",
                        )
                except Exception as exc:
                    html_response(self, 500, f"<pre>{exc}</pre>")
                return
            html_response(
                self,
                400,
                f"""<!DOCTYPE html><html><body style="font-family:system-ui;padding:2rem">
<h1>Callback without code</h1><p>error={error or "none"}</p>
<p><a href="/">Back</a></p></body></html>""",
            )
            return

        if path == "/api/meta":
            try:
                env = load_secrets()
                token = env.get("QUICKBOOKS_ACCESS_TOKEN", "").strip()
                realm = env.get("QUICKBOOKS_REALM_ID", "").strip()
                json_response(
                    self,
                    200,
                    {
                        "provider": "quickbooks",
                        "environment": "sandbox",
                        "apiBase": env.get("QUICKBOOKS_API_BASE_URL", "https://sandbox-quickbooks.api.intuit.com/v3/company"),
                        "hasAccessToken": bool(token and realm),
                        "hasRealmId": bool(realm),
                        "redirectUri": redirect_uri(env),
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
                ok, result = call_endpoint(env, endpoint_id, body)
                env = load_secrets()
                result["hasAccessToken"] = bool(
                    env.get("QUICKBOOKS_ACCESS_TOKEN", "").strip()
                    and env.get("QUICKBOOKS_REALM_ID", "").strip()
                )
                status = 200 if ok else 400
                json_response(self, status, {"ok": ok, **result})
            except FileNotFoundError as exc:
                json_response(self, 500, {"error": str(exc)})
            except KeyError as exc:
                json_response(self, 500, {"error": f"Missing secret: {exc}"})
            except OSError as exc:
                json_response(self, 500, {"error": f"Network error: {exc}"})
            return

        self.send_error(404)


def main() -> None:
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"QuickBooks sandbox UI → http://127.0.0.1:{PORT}")
    print(f"OAuth callback → http://127.0.0.1:{PORT}/callback")
    print("Whitelist that exact redirect URI in Intuit Developer → Keys & OAuth (Development)")
    print("Secrets from ../secrets.env (server-side only)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
