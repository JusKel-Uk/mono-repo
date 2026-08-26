"""Companies House Document API helpers (metadata + binary content)."""

from __future__ import annotations

import base64
import importlib.util
import json
import re
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

_ROOT = Path(__file__).resolve().parent
_spec = importlib.util.spec_from_file_location("ch_explore", _ROOT / "explore-spec.py")
ch_explore = importlib.util.module_from_spec(_spec)
assert _spec.loader is not None
_spec.loader.exec_module(ch_explore)
ch_get = ch_explore.ch_get

DOCUMENT_API_BASE_URL = "https://document-api.company-information.service.gov.uk"
DOCUMENT_ID_RE = re.compile(r"/document/([^/?#]+)")


def auth_header(api_key: str) -> str:
    token = base64.b64encode(f"{api_key}:".encode()).decode()
    return f"Basic {token}"


def document_id_from_link(link: str | None) -> str | None:
    if not link:
        return None
    path = link
    if link.startswith("http"):
        path = urllib.parse.urlparse(link).path
    match = DOCUMENT_ID_RE.search(path)
    return match.group(1) if match else None


def auth_header(api_key: str) -> str:
    token = base64.b64encode(f"{api_key}:".encode()).decode()
    return f"Basic {token}"


def is_presigned_storage_url(url: str) -> bool:
    """Signed S3 URLs reject an Authorization header alongside query auth."""
    lower = url.lower()
    return "x-amz-" in lower or "amazonaws.com" in lower


def http_get(
    url: str,
    accept: str = "application/json",
    authorization: str | None = None,
    method: str = "GET",
    follow_redirects: bool = True,
    timeout: int = 60,
) -> tuple[int, dict[str, str], bytes]:
    """Return (status, headers dict, body bytes)."""
    headers: dict[str, str] = {"Accept": accept}
    if authorization:
        headers["Authorization"] = authorization

    req = urllib.request.Request(url, method=method, headers=headers)

    if follow_redirects:
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                resp_headers = {k.lower(): v for k, v in resp.headers.items()}
                return resp.status, resp_headers, resp.read()
        except urllib.error.HTTPError as exc:
            body = exc.read()
            exc.body = body
            raise

    class NoRedirect(urllib.request.HTTPErrorProcessor):
        def http_response(self, request, response):  # noqa: ARG002
            return response

        def https_response(self, request, response):  # noqa: ARG002
            return response

    opener = urllib.request.build_opener(NoRedirect)
    try:
        resp = opener.open(req, timeout=timeout)
        resp_headers = {k.lower(): v for k, v in resp.headers.items()}
        return resp.status, resp_headers, resp.read()
    except urllib.error.HTTPError as exc:
        body = exc.read()
        exc.headers_dict = {k.lower(): v for k, v in exc.headers.items()}
        exc.body = body
        raise


def ch_http(
    api_key: str,
    url: str,
    accept: str = "application/json",
    method: str = "GET",
    follow_redirects: bool = True,
    timeout: int = 60,
) -> tuple[int, dict[str, str], bytes]:
    auth = None if is_presigned_storage_url(url) else auth_header(api_key)
    return http_get(
        url,
        accept=accept,
        authorization=auth,
        method=method,
        follow_redirects=follow_redirects,
        timeout=timeout,
    )


def fetch_document_metadata(api_key: str, document_id: str, base_url: str = DOCUMENT_API_BASE_URL) -> Any:
    url = base_url.rstrip("/") + f"/document/{urllib.parse.quote(document_id, safe='')}"
    status, _, body = ch_http(api_key, url, accept="application/json")
    if status != 200:
        raise urllib.error.HTTPError(url, status, "metadata fetch failed", None, None)
    return json.loads(body.decode())


def fetch_document_content(
    api_key: str,
    document_id: str,
    content_type: str = "application/pdf",
    base_url: str = DOCUMENT_API_BASE_URL,
) -> tuple[bytes, str]:
    """Fetch document bytes; follows 302 from Document API to signed S3 URL."""
    url = base_url.rstrip("/") + f"/document/{urllib.parse.quote(document_id, safe='')}/content"
    auth = auth_header(api_key)

    try:
        status, headers, body = http_get(
            url,
            accept=content_type,
            authorization=auth,
            follow_redirects=False,
        )
    except urllib.error.HTTPError as exc:
        if exc.code == 302:
            location = exc.headers.get("Location")
            if not location:
                raise
            _, dl_headers, body = http_get(
                location,
                accept=content_type,
                authorization=None,
                follow_redirects=True,
            )
            resolved = dl_headers.get("content-type", content_type).split(";")[0].strip()
            return body, resolved
        raise

    if status == 302:
        location = headers.get("location")
        if not location:
            raise ValueError("302 without Location header")
        _, dl_headers, body = http_get(
            location,
            accept=content_type,
            authorization=None,
            follow_redirects=True,
        )
        resolved_type = dl_headers.get("content-type", content_type).split(";")[0].strip()
        return body, resolved_type

    resolved_type = headers.get("content-type", content_type).split(";")[0].strip()
    return body, resolved_type


def collect_filing_documents(
    public_api_base: str,
    api_key: str,
    company_number: str,
    max_pages: int = 50,
    items_per_page: int = 100,
) -> dict[str, Any]:
    """Walk filing history and collect every item with a document_metadata link."""
    collected: list[dict[str, Any]] = []
    start_index = 0
    total_count = 0
    pages = 0

    while pages < max_pages:
        query = {
            "items_per_page": str(items_per_page),
            "start_index": str(start_index),
        }
        data = ch_get(
            public_api_base,
            api_key,
            f"/company/{company_number}/filing-history",
            query,
        )
        total_count = int(data.get("total_count") or 0)
        batch = data.get("items") or []
        if not batch:
            break

        for item in batch:
            links = item.get("links") or {}
            meta_link = links.get("document_metadata")
            doc_id = document_id_from_link(meta_link)
            if not doc_id:
                continue
            collected.append(
                {
                    "transaction_id": item.get("transaction_id"),
                    "date": item.get("date"),
                    "type": item.get("type"),
                    "description": item.get("description"),
                    "category": item.get("category"),
                    "paper_filed": item.get("paper_filed"),
                    "document_id": doc_id,
                    "document_metadata_url": meta_link,
                }
            )

        start_index += len(batch)
        pages += 1
        if start_index >= total_count:
            break

    return {
        "company_number": company_number,
        "total_filings": total_count,
        "documents_found": len(collected),
        "pages_scanned": pages,
        "items": collected,
    }
