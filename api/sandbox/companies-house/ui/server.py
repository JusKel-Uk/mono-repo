#!/usr/bin/env python3
"""Local Companies House API tester — reads secrets.env server-side only."""

from __future__ import annotations

import importlib.util
import json
import mimetypes
import re
import sys
import urllib.error
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

from endpoint_catalog import ENDPOINTS, GROUPS

UI_ROOT = Path(__file__).resolve().parent
SANDBOX_ROOT = UI_ROOT.parent
PORT = int(__import__("os").environ.get("COMPANIES_HOUSE_UI_PORT", "8765"))

_doc_spec = importlib.util.spec_from_file_location("ch_document", SANDBOX_ROOT / "document_api.py")
ch_document = importlib.util.module_from_spec(_doc_spec)
assert _doc_spec.loader is not None
_doc_spec.loader.exec_module(ch_document)

_spec = importlib.util.spec_from_file_location("ch_explore", SANDBOX_ROOT / "explore-spec.py")
ch_explore = importlib.util.module_from_spec(_spec)
assert _spec.loader is not None
_spec.loader.exec_module(ch_explore)

LIVE_BASE_URL = ch_explore.LIVE_BASE_URL
SANDBOX_BASE_URL = ch_explore.SANDBOX_BASE_URL
ch_get = ch_explore.ch_get
load_secrets = ch_explore.load_secrets
resolve_base_url = ch_explore.resolve_base_url
probe_auth = ch_explore.probe_auth

DOCUMENT_API_BASE_URL = ch_document.DOCUMENT_API_BASE_URL
collect_filing_documents = ch_document.collect_filing_documents
document_id_from_link = ch_document.document_id_from_link
fetch_document_content = ch_document.fetch_document_content
fetch_document_metadata = ch_document.fetch_document_metadata

PATH_PARAM_RE = re.compile(r"\{(\w+)\}")


def serialize_endpoint(key: str, meta: dict[str, Any]) -> dict[str, Any]:
    path_params = list(PATH_PARAM_RE.findall(meta["path"]))
    if "company_number" in path_params and meta.get("scope") == "company":
        path_params = [p for p in path_params if p != "company_number"]
    return {
        "id": key,
        "label": meta["label"],
        "group": meta["group"],
        "scope": meta["scope"],
        "path": meta["path"],
        "pathParams": path_params,
        "queryParams": meta.get("queryParams", []),
        "drill": meta.get("drill"),
        "optional404": bool(meta.get("optional_404")),
        "description": meta.get("description"),
        "synthetic": meta.get("synthetic"),
    }


def build_request(
    endpoint_id: str,
    params: dict[str, str],
    base_url: str,
) -> tuple[str, dict[str, str] | None, str]:
    meta = ENDPOINTS[endpoint_id]
    path = meta["path"]
    query = dict(meta.get("query") or {})

    for match in PATH_PARAM_RE.findall(path):
        value = (params.get(match) or "").strip()
        if not value:
            raise ValueError(f"Missing path parameter: {match}")
        path = path.replace(f"{{{match}}}", urllib.parse.quote(value, safe=""))

    for qp in meta.get("queryParams", []):
        value = (params.get(qp) or "").strip()
        if value:
            query[qp] = value

    if endpoint_id == "search-companies" and "q" not in query and params.get("q"):
        query["q"] = params["q"].strip()

    display_url = base_url.rstrip("/") + path
    if query:
        display_url += "?" + urllib.parse.urlencode(query)

    return path, query or None, display_url


def json_response(handler: BaseHTTPRequestHandler, status: int, payload: Any) -> None:
    body = json.dumps(payload, indent=2, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def serve_static(handler: BaseHTTPRequestHandler, rel_path: str) -> None:
    path = UI_ROOT / rel_path
    if not path.is_file():
        handler.send_error(404)
        return
    content = path.read_bytes()
    mime, _ = mimetypes.guess_type(str(path))
    handler.send_response(200)
    handler.send_header("Content-Type", mime or "application/octet-stream")
    handler.send_header("Content-Length", str(len(content)))
    handler.end_headers()
    handler.wfile.write(content)


def binary_response(handler: BaseHTTPRequestHandler, status: int, body: bytes, content_type: str) -> None:
    handler.send_response(status)
    handler.send_header("Content-Type", content_type)
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Cache-Control", "private, max-age=300")
    handler.end_headers()
    handler.wfile.write(body)


class Handler(BaseHTTPRequestHandler):
    secrets: dict[str, str] = {}
    base_url: str = LIVE_BASE_URL
    search_base_url: str = LIVE_BASE_URL
    document_base_url: str = DOCUMENT_API_BASE_URL
    api_key: str = ""

    def log_message(self, fmt: str, *args: Any) -> None:
        print(f"[ui] {self.address_string()} {fmt % args}")

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        route = parsed.path

        if route in ("/", "/index.html"):
            serve_static(self, "index.html")
            return

        if route.startswith("/assets/"):
            serve_static(self, route[1:])
            return

        if route == "/api/meta":
            env_label = "sandbox" if "sandbox" in self.base_url else "live"
            search_label = "sandbox" if "sandbox" in self.search_base_url else "live"
            json_response(
                self,
                200,
                {
                    "baseUrl": self.base_url,
                    "searchBaseUrl": self.search_base_url,
                    "documentApiBaseUrl": self.document_base_url,
                    "environment": env_label,
                    "searchEnvironment": search_label,
                    "localProxy": f"http://127.0.0.1:{PORT}",
                    "groups": GROUPS,
                    "endpoints": [serialize_endpoint(k, v) for k, v in ENDPOINTS.items()],
                    "defaults": {
                        "companyNumber": self.secrets.get("COMPANIES_HOUSE_TEST_COMPANY_NUMBER", "00000006"),
                        "searchQuery": self.secrets.get("COMPANIES_HOUSE_TEST_SEARCH", "BBC"),
                    },
                },
            )
            return

        if route == "/api/suggest":
            q = urllib.parse.parse_qs(parsed.query).get("q", [""])[0].strip()
            if len(q) < 2:
                json_response(self, 200, {"items": [], "upstreamUrl": None})
                return
            query = {"q": q, "items_per_page": "8"}
            path = "/search/companies"
            upstream = self.search_base_url
            display_url = upstream.rstrip("/") + path + "?" + urllib.parse.urlencode(query)
            try:
                data = ch_get(upstream, self.api_key, path, query)
                items = [
                    {
                        "company_number": i.get("company_number"),
                        "title": i.get("title"),
                        "company_status": i.get("company_status"),
                    }
                    for i in (data.get("items") or [])
                ]
                json_response(
                    self,
                    200,
                    {
                        "items": items,
                        "total_results": data.get("total_results"),
                        "upstreamUrl": display_url,
                        "searchBaseUrl": upstream,
                        "message": (
                            "No companies matched. Try a longer name or check your API key."
                            if not items
                            else None
                        ),
                    },
                )
            except urllib.error.HTTPError as exc:
                err_body = getattr(exc, "body", None) or exc.read().decode(errors="replace")
                json_response(
                    self,
                    exc.code,
                    {
                        "error": err_body,
                        "items": [],
                        "upstreamUrl": display_url,
                        "searchBaseUrl": upstream,
                    },
                )
            return

        doc_content_match = re.match(r"^/api/documents/([^/]+)/content$", route)
        if doc_content_match:
            document_id = urllib.parse.unquote(doc_content_match.group(1))
            query = urllib.parse.parse_qs(parsed.query)
            accept = query.get("accept", ["application/pdf"])[0].strip() or "application/pdf"
            display_url = (
                self.document_base_url.rstrip("/")
                + f"/document/{document_id}/content"
            )
            try:
                body_bytes, content_type = fetch_document_content(
                    self.api_key,
                    document_id,
                    content_type=accept,
                    base_url=self.document_base_url,
                )
                if content_type == "application/pdf":
                    self.send_response(200)
                    self.send_header("Content-Type", content_type)
                    self.send_header("Content-Length", str(len(body_bytes)))
                    self.send_header("Cache-Control", "private, max-age=300")
                    self.send_header("Content-Disposition", "inline")
                    self.end_headers()
                    self.wfile.write(body_bytes)
                else:
                    binary_response(self, 200, body_bytes, content_type)
            except urllib.error.HTTPError as exc:
                err_body = getattr(exc, "body", None) or b""
                if isinstance(err_body, bytes):
                    err_text = err_body.decode(errors="replace")
                else:
                    err_text = str(err_body)
                json_response(
                    self,
                    exc.code,
                    {
                        "ok": False,
                        "error": err_text or f"HTTP {exc.code} from Document API",
                        "request": {"method": "GET", "url": display_url, "accept": accept},
                    },
                )
            return

        self.send_error(404)

    def do_POST(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path != "/api/request":
            self.send_error(404)
            return

        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b"{}"
        try:
            body = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            json_response(self, 400, {"error": "Invalid JSON body"})
            return

        endpoint_id = str(body.get("endpointId") or body.get("endpoint") or "").strip()
        if not endpoint_id:
            json_response(self, 400, {"ok": False, "error": "Missing endpointId in request body"})
            return
        params = body.get("params") or {}
        if body.get("companyNumber"):
            params.setdefault("company_number", str(body.get("companyNumber")).strip())
        if body.get("searchQuery"):
            params.setdefault("q", str(body.get("searchQuery")).strip())

        self._proxy(endpoint_id, params)

    def _proxy(self, endpoint_id: str, params: dict[str, Any]) -> None:
        if endpoint_id not in ENDPOINTS:
            json_response(self, 400, {"error": f"Unknown endpoint: {endpoint_id}"})
            return

        meta = ENDPOINTS[endpoint_id]
        str_params = {k: str(v).strip() for k, v in params.items() if v is not None}

        if meta.get("scope") == "company" and not str_params.get("company_number"):
            json_response(self, 400, {"error": "company_number is required"})
            return

        if meta.get("scope") == "document" and not str_params.get("document_id"):
            json_response(self, 400, {"error": "document_id is required"})
            return

        if meta.get("synthetic") == "filing-documents-index":
            company_number = str_params["company_number"]
            display_url = (
                self.base_url.rstrip("/")
                + f"/company/{company_number}/filing-history (all pages)"
            )
            try:
                data = collect_filing_documents(self.base_url, self.api_key, company_number)
                json_response(
                    self,
                    200,
                    {
                        "ok": True,
                        "endpointId": endpoint_id,
                        "request": {
                            "method": "GET",
                            "url": display_url,
                            "auth": "Basic (API key as username, blank password)",
                        },
                        "data": data,
                    },
                )
            except urllib.error.HTTPError as exc:
                err_body = getattr(exc, "body", None) or exc.read().decode(errors="replace")
                json_response(
                    self,
                    exc.code,
                    {
                        "ok": False,
                        "endpointId": endpoint_id,
                        "request": {"method": "GET", "url": display_url},
                        "error": err_body or f"HTTP {exc.code} from Companies House",
                        "status": exc.code,
                    },
                )
            return

        try:
            if meta.get("scope") == "search":
                upstream = self.search_base_url
            elif meta.get("scope") == "document":
                upstream = self.document_base_url
            else:
                upstream = self.base_url
            path, query, display_url = build_request(endpoint_id, str_params, upstream)
        except ValueError as exc:
            json_response(self, 400, {"error": str(exc)})
            return

        try:
            if meta.get("scope") == "document":
                document_id = str_params["document_id"]
                data = fetch_document_metadata(
                    self.api_key,
                    document_id,
                    base_url=self.document_base_url,
                )
            else:
                data = ch_get(upstream, self.api_key, path, query)
            json_response(
                self,
                200,
                {
                    "ok": True,
                    "endpointId": endpoint_id,
                    "request": {
                        "method": "GET",
                        "url": display_url,
                        "auth": "Basic (API key as username, blank password)",
                    },
                    "data": data,
                },
            )
        except urllib.error.HTTPError as exc:
            err_body = getattr(exc, "body", None) or exc.read().decode(errors="replace")
            if exc.code == 404 and meta.get("optional_404"):
                json_response(
                    self,
                    200,
                    {
                        "ok": True,
                        "empty": True,
                        "upstreamStatus": 404,
                        "endpointId": endpoint_id,
                        "message": f"No {meta['label'].lower()} on file for this company.",
                        "hint": "Companies House returns HTTP 404 when this sub-resource does not exist — not a bug in the explorer.",
                        "request": {
                            "method": "GET",
                            "url": display_url,
                            "auth": "Basic (API key as username, blank password)",
                        },
                        "data": None,
                    },
                )
                return
            json_response(
                self,
                exc.code,
                {
                    "ok": False,
                    "endpointId": endpoint_id,
                    "request": {"method": "GET", "url": display_url},
                    "error": err_body or f"HTTP {exc.code} from Companies House",
                    "status": exc.code,
                },
            )


def resolve_search_base_url(api_key: str, company_base_url: str) -> str:
    """Company search needs LIVE data; sandbox often returns empty matches."""
    try:
        data = ch_get(company_base_url, api_key, "/search/companies", {"q": "BBC", "items_per_page": "1"})
        if data.get("items"):
            return company_base_url
    except urllib.error.HTTPError:
        pass

    if company_base_url.rstrip("/") != LIVE_BASE_URL.rstrip("/"):
        ok, status = probe_auth(LIVE_BASE_URL, api_key)
        if ok:
            print(f"Search/autocomplete will use LIVE API ({LIVE_BASE_URL})")
            return LIVE_BASE_URL
        print(f"LIVE search unavailable (HTTP {status}) — keeping {company_base_url}")

    return company_base_url


def main() -> None:
    secrets = load_secrets()
    api_key = secrets.get("COMPANIES_HOUSE_API_KEY", "")
    if not api_key or api_key == "your-api-key-here":
        print("Set COMPANIES_HOUSE_API_KEY in secrets.env first.")
        sys.exit(1)

    preferred = secrets.get("COMPANIES_HOUSE_BASE_URL")
    print("Checking Companies House auth…")
    try:
        base_url = resolve_base_url(api_key, preferred)
    except SystemExit:
        base_url = (preferred or LIVE_BASE_URL).rstrip("/")
        print(f"\nWarning: auth preflight failed — starting UI anyway with {base_url}")
        print("Fix secrets.env or IP allowlist in the CH developer portal if requests fail.\n")
    search_base_url = resolve_search_base_url(api_key, base_url)

    Handler.secrets = secrets
    Handler.api_key = api_key
    Handler.base_url = base_url
    Handler.search_base_url = search_base_url
    Handler.document_base_url = (
        secrets.get("COMPANIES_HOUSE_DOCUMENT_API_BASE_URL", "").strip()
        or DOCUMENT_API_BASE_URL
    )

    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"Companies House tester UI → http://127.0.0.1:{PORT}")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
        server.server_close()


if __name__ == "__main__":
    main()
