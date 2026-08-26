"""Yapily Open Banking sandbox client — shared by test.sh and local UI server."""

from __future__ import annotations

import base64
import json
import re
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, timedelta
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
DEFAULT_BASE = "https://api.yapily.com"
DEFAULT_INSTITUTION = "modelo-sandbox"
DEFAULT_CALLBACK = "http://127.0.0.1:8768/callback"

ENDPOINTS: list[dict[str, Any]] = [
    {"id": "institutions", "label": "Institutions", "group": "meta", "needsToken": False},
    {"id": "connect", "label": "Start connect (Modelo)", "group": "setup", "needsToken": False},
    {"id": "accounts", "label": "Accounts", "group": "data", "needsToken": True},
    {"id": "transactions", "label": "Transactions", "group": "data", "needsToken": True},
]

GROUPS = [
    {"id": "setup", "label": "Setup"},
    {"id": "data", "label": "Bank data"},
    {"id": "meta", "label": "Reference"},
]


def load_secrets() -> dict[str, str]:
    secrets_path = ROOT / "secrets.env"
    if not secrets_path.is_file():
        raise FileNotFoundError(
            "Missing secrets.env — copy secrets.env.example and set YAPILY_APPLICATION_ID / YAPILY_APPLICATION_SECRET"
        )
    env: dict[str, str] = {}
    for line in secrets_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        key, _, value = line.partition("=")
        env[key.strip()] = value.strip()
    return env


def persist_consent_token(token: str) -> None:
    secrets_path = ROOT / "secrets.env"
    text = secrets_path.read_text()
    if re.search(r"^YAPILY_CONSENT_TOKEN=", text, re.MULTILINE):
        text = re.sub(
            r"^YAPILY_CONSENT_TOKEN=.*",
            f"YAPILY_CONSENT_TOKEN={token}",
            text,
            count=1,
            flags=re.MULTILINE,
        )
    else:
        text = text.rstrip() + f"\nYAPILY_CONSENT_TOKEN={token}\n"
    secrets_path.write_text(text)


def api_base(env: dict[str, str]) -> str:
    return env.get("YAPILY_API_BASE_URL", DEFAULT_BASE).rstrip("/")


def basic_auth_header(env: dict[str, str]) -> str:
    app_id = env["YAPILY_APPLICATION_ID"]
    secret = env["YAPILY_APPLICATION_SECRET"]
    token = base64.b64encode(f"{app_id}:{secret}".encode()).decode()
    return f"Basic {token}"


def yapily_request(
    env: dict[str, str],
    path: str,
    method: str = "GET",
    json_body: dict[str, Any] | None = None,
) -> dict[str, Any]:
    url = f"{api_base(env)}{path}"
    headers = {
        "Authorization": basic_auth_header(env),
        "Accept": "application/json",
    }
    payload: bytes | None = None
    if json_body is not None:
        payload = json.dumps(json_body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=payload, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            raw = resp.read().decode()
            if not raw:
                return {}
            return json.loads(raw)
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode(errors="replace")
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {"error": "HTTP_ERROR", "status": exc.code, "message": raw}


def callback_url(env: dict[str, str]) -> str:
    return env.get("YAPILY_CALLBACK_URL", DEFAULT_CALLBACK)


def institution_id(env: dict[str, str]) -> str:
    return env.get("YAPILY_INSTITUTION_ID", DEFAULT_INSTITUTION)


def application_user_id(env: dict[str, str]) -> str:
    return env.get("YAPILY_APPLICATION_USER_ID", "juskel-sandbox-user")


def create_connect_request(env: dict[str, str]) -> tuple[bool, dict[str, Any]]:
    body: dict[str, Any] = {
        "applicationUserId": application_user_id(env),
        "institutionId": institution_id(env),
        "callback": callback_url(env),
    }
    resp = yapily_request(env, "/account-auth-requests", method="POST", json_body=body)
    data = resp.get("data") or {}
    if not data.get("authorisationUrl"):
        return False, {"yapily": resp}
    return True, {
        "authorisationUrl": data.get("authorisationUrl"),
        "id": data.get("id"),
        "status": data.get("status"),
        "institutionId": data.get("institutionId"),
        "callback": callback_url(env),
        "sandbox_login": f"{env.get('YAPILY_SANDBOX_USERNAME', 'mits')} / {env.get('YAPILY_SANDBOX_PASSWORD', 'mits')}",
        "message": "Open authorisationUrl → login → consent returns to callback with consent token",
    }


def first_account_id(accounts_resp: dict[str, Any]) -> str | None:
    accounts = accounts_resp.get("data") or []
    if not accounts:
        return None
    return accounts[0].get("id")


def call_endpoint(env: dict[str, str], endpoint_id: str, body: dict[str, Any] | None = None) -> tuple[bool, dict[str, Any]]:
    body = body or {}

    if endpoint_id == "institutions":
        data = yapily_request(env, "/institutions")
        ok = "data" in data
        return ok, {
            "endpointId": endpoint_id,
            "request": {"method": "GET", "path": "/institutions"},
            "data": data,
        }

    if endpoint_id == "connect":
        ok, data = create_connect_request(env)
        return ok, {"endpointId": endpoint_id, "data": data}

    consent = env.get("YAPILY_CONSENT_TOKEN", "").strip()
    if not consent:
        return False, {
            "endpointId": endpoint_id,
            "error": "No YAPILY_CONSENT_TOKEN — run Connect and complete bank login (or paste consent from callback).",
        }

    if endpoint_id == "accounts":
        qs = urllib.parse.urlencode({"consent": consent})
        data = yapily_request(env, f"/accounts?{qs}")
        ok = "data" in data
        return ok, {
            "endpointId": endpoint_id,
            "request": {"method": "GET", "path": "/accounts"},
            "data": data,
        }

    if endpoint_id == "transactions":
        days = int(env.get("YAPILY_TRANSACTIONS_DAYS", "90"))
        end = date.today()
        start = end - timedelta(days=days)
        accounts_resp = yapily_request(env, f"/accounts?{urllib.parse.urlencode({'consent': consent})}")
        account_id = body.get("accountId") or first_account_id(accounts_resp)
        if not account_id:
            return False, {"error": "No accounts in consent", "accounts": accounts_resp}
        qs = urllib.parse.urlencode(
            {
                "consent": consent,
                "from": start.isoformat(),
                "before": end.isoformat(),
            }
        )
        path = f"/accounts/{account_id}/transactions?{qs}"
        data = yapily_request(env, path)
        ok = "data" in data
        return ok, {
            "endpointId": endpoint_id,
            "request": {
                "method": "GET",
                "path": path,
                "account_id": account_id,
                "from": start.isoformat(),
                "before": end.isoformat(),
            },
            "data": data,
        }

    return False, {"error": f"Unknown endpoint: {endpoint_id}"}
