"""Local Yapily sandbox explorer — proxies API + OAuth callback."""

from __future__ import annotations

import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote

UI_ROOT = Path(__file__).resolve().parent
SANDBOX_ROOT = UI_ROOT.parent
sys.path.insert(0, str(SANDBOX_ROOT))

from yapily_client import (  # noqa: E402
    ENDPOINTS,
    GROUPS,
    callback_url,
    load_secrets,
    persist_consent_token,
    call_endpoint,
)

PORT = int(__import__("os").environ.get("YAPILY_UI_PORT", "8768"))


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
        print(f"[yapily-ui] {self.address_string()} {fmt % args}")

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
            consent = (qs.get("consent") or [""])[0]
            error = (qs.get("error") or [""])[0]
            if consent:
                persist_consent_token(consent)
                html_response(
                    self,
                    200,
                    f"""<!DOCTYPE html><html><head><meta charset="utf-8"><title>Connected</title></head>
<body style="font-family:system-ui;padding:2rem">
<h1>Yapily consent saved</h1>
<p>Consent token written to <code>secrets.env</code>. Return to the explorer and fetch accounts.</p>
<p><a href="/">Open explorer</a></p>
</body></html>""",
                )
                return
            html_response(
                self,
                400,
                f"""<!DOCTYPE html><html><body style="font-family:system-ui;padding:2rem">
<h1>Callback without consent</h1>
<p>error={error or "none"}</p>
<p><a href="/">Back</a></p></body></html>""",
            )
            return

        if path == "/api/meta":
            try:
                env = load_secrets()
                consent = env.get("YAPILY_CONSENT_TOKEN", "").strip()
                json_response(
                    self,
                    200,
                    {
                        "provider": "yapily",
                        "environment": "sandbox",
                        "baseUrl": env.get("YAPILY_API_BASE_URL", "https://api.yapily.com"),
                        "hasConsentToken": bool(consent),
                        "callbackUrl": callback_url(env),
                        "institutionId": env.get("YAPILY_INSTITUTION_ID", "modelo-sandbox"),
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
                result["hasConsentToken"] = bool(env.get("YAPILY_CONSENT_TOKEN", "").strip())
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
    print(f"Yapily sandbox UI → http://127.0.0.1:{PORT}")
    print(f"Callback URL → http://127.0.0.1:{PORT}/callback (add to Yapily Console + secrets.env)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
