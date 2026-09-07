"""TrueLayer Data API sandbox client — shared by test.sh and local UI server."""

from __future__ import annotations

import json
import re
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, timedelta
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
CONNECTIONS_PATH = ROOT / "connections.json"
DEFAULT_API_BASE = "https://api.truelayer-sandbox.com"
DEFAULT_AUTH_BASE_LIVE = "https://auth.truelayer.com"
DEFAULT_AUTH_BASE_SANDBOX = "https://auth.truelayer-sandbox.com"
DEFAULT_REDIRECT_LIVE = "https://console.truelayer.com/redirect-page"
DEFAULT_REDIRECT_SANDBOX = "https://console.truelayer-sandbox.com/redirect-page"
DEFAULT_LOCAL_CALLBACK = "http://127.0.0.1:8767/callback"
DEFAULT_SCOPES = "info accounts balance transactions offline_access"

ENDPOINTS: list[dict[str, Any]] = [
    {"id": "auth-link", "label": "Get auth link (Mock Bank)", "group": "setup", "needsToken": False},
    {"id": "exchange", "label": "Exchange code → token", "group": "setup", "needsToken": False},
    {"id": "accounts", "label": "Accounts", "group": "data", "needsToken": True},
    {"id": "balances", "label": "Balances", "group": "data", "needsToken": True},
    {"id": "transactions", "label": "Transactions", "group": "data", "needsToken": True},
]

GROUPS = [
    {"id": "setup", "label": "Setup"},
    {"id": "data", "label": "Bank data"},
]


def load_secrets() -> dict[str, str]:
    secrets_path = ROOT / "secrets.env"
    if not secrets_path.is_file():
        raise FileNotFoundError(
            "Missing secrets.env — copy secrets.env.example and set TRUELAYER_CLIENT_ID / TRUELAYER_CLIENT_SECRET"
        )
    env: dict[str, str] = {}
    for line in secrets_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        key, _, value = line.partition("=")
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
            value = value[1:-1]
        env[key.strip()] = value
    return env


def _persist_secret(key: str, value: str) -> None:
    secrets_path = ROOT / "secrets.env"
    text = secrets_path.read_text()
    pattern = f"^{re.escape(key)}="
    if re.search(pattern, text, re.MULTILINE):
        text = re.sub(
            f"^{re.escape(key)}=.*",
            f"{key}={value}",
            text,
            count=1,
            flags=re.MULTILINE,
        )
    else:
        text = text.rstrip() + f"\n{key}={value}\n"
    secrets_path.write_text(text)


def persist_access_token(token: str) -> None:
    _persist_secret("TRUELAYER_ACCESS_TOKEN", token)


def persist_refresh_token(token: str) -> None:
    _persist_secret("TRUELAYER_REFRESH_TOKEN", token)


def load_connections() -> dict[str, dict[str, str]]:
    if not CONNECTIONS_PATH.is_file():
        return {}
    try:
        data = json.loads(CONNECTIONS_PATH.read_text())
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        return {}


def save_connection(
    institution_id: str,
    institution_name: str,
    access_token: str,
    refresh_token: str | None = None,
) -> None:
    connections = load_connections()
    entry: dict[str, str] = {
        "institutionId": institution_id,
        "institutionName": institution_name,
        "accessToken": access_token,
    }
    if refresh_token:
        entry["refreshToken"] = refresh_token
    connections[institution_id] = entry
    CONNECTIONS_PATH.write_text(json.dumps(connections, indent=2) + "\n")


def resolve_institution_from_accounts(accounts_resp: dict[str, Any]) -> tuple[str, str]:
    results = accounts_resp.get("results") or []
    if not results:
        return ("unknown", "Unknown bank")
    provider = results[0].get("provider") or {}
    provider_id = provider.get("provider_id") or results[0].get("account_id") or "unknown"
    display_name = provider.get("display_name") or results[0].get("display_name") or provider_id
    return (str(provider_id), str(display_name))


def resolve_access_token(env: dict[str, str], institution_id: str | None = None) -> str:
    if institution_id:
        connection = load_connections().get(institution_id)
        if connection and connection.get("accessToken"):
            return connection["accessToken"].strip()
    return env.get("TRUELAYER_ACCESS_TOKEN", "").strip()


def api_base(env: dict[str, str]) -> str:
    return env.get("TRUELAYER_API_BASE_URL", DEFAULT_API_BASE).rstrip("/")


def _is_sandbox_client(env: dict[str, str]) -> bool:
    return env.get("TRUELAYER_CLIENT_ID", "").startswith("sandbox-")


def auth_base(env: dict[str, str]) -> str:
    explicit = env.get("TRUELAYER_AUTH_BASE_URL", "").strip()
    if explicit:
        return explicit.rstrip("/")
    return DEFAULT_AUTH_BASE_SANDBOX if _is_sandbox_client(env) else DEFAULT_AUTH_BASE_LIVE


def redirect_uri(env: dict[str, str]) -> str:
    explicit = env.get("TRUELAYER_REDIRECT_URI", "").strip()
    if explicit:
        return explicit
    # Local /callback (like QuickBooks sandbox) — console.truelayer-sandbox.com often fails DNS.
    return DEFAULT_LOCAL_CALLBACK if _is_sandbox_client(env) else DEFAULT_REDIRECT_LIVE


def scopes(env: dict[str, str]) -> str:
    return env.get("TRUELAYER_SCOPES", DEFAULT_SCOPES)


def http_request(
    url: str,
    method: str = "GET",
    headers: dict[str, str] | None = None,
    data: dict[str, str] | None = None,
    json_body: dict[str, Any] | None = None,
) -> dict[str, Any]:
    hdrs = dict(headers or {})
    payload: bytes | None = None
    if json_body is not None:
        payload = json.dumps(json_body).encode("utf-8")
        hdrs.setdefault("Content-Type", "application/json")
    elif data is not None:
        payload = urllib.parse.urlencode(data).encode("utf-8")
        hdrs.setdefault("Content-Type", "application/x-www-form-urlencoded")
    req = urllib.request.Request(url, data=payload, method=method, headers=hdrs)
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
    except urllib.error.URLError as exc:
        return {"error": "NETWORK_ERROR", "message": str(exc.reason)}


def build_auth_link(env: dict[str, str]) -> str:
    params = {
        "response_type": "code",
        "client_id": env["TRUELAYER_CLIENT_ID"],
        "redirect_uri": redirect_uri(env),
        "scope": scopes(env),
        "state": env.get("TRUELAYER_STATE", "juskel-sandbox"),
        "providers": env.get("TRUELAYER_SANDBOX_PROVIDER", "uk-cs-mock"),
    }
    return f"{auth_base(env)}/?{urllib.parse.urlencode(params)}"


def exchange_code(env: dict[str, str], code: str) -> tuple[bool, dict[str, Any]]:
    url = f"{auth_base(env)}/connect/token"
    data = {
        "grant_type": "authorization_code",
        "client_id": env["TRUELAYER_CLIENT_ID"],
        "client_secret": env["TRUELAYER_CLIENT_SECRET"],
        "redirect_uri": redirect_uri(env),
        "code": code,
    }
    resp = http_request(url, method="POST", data=data)
    if resp.get("error") or not resp.get("access_token"):
        return False, resp
    persist_access_token(resp["access_token"])
    if resp.get("refresh_token"):
        persist_refresh_token(resp["refresh_token"])

    env["TRUELAYER_ACCESS_TOKEN"] = resp["access_token"]
    accounts = bearer_get(env, "/data/v1/accounts", resp["access_token"])
    institution_id, institution_name = resolve_institution_from_accounts(accounts)
    save_connection(
        institution_id,
        institution_name,
        resp["access_token"],
        resp.get("refresh_token"),
    )

    return True, {
        "access_token_saved": True,
        "expires_in": resp.get("expires_in"),
        "institutionId": institution_id,
        "institutionName": institution_name,
        "connectionCount": len(load_connections()),
        "message": "Access token saved to secrets.env and connections.json",
    }


def bearer_get(env: dict[str, str], path: str, token: str | None = None) -> dict[str, Any]:
    resolved = token or resolve_access_token(env)
    url = f"{api_base(env)}{path}"
    return http_request(
        url,
        headers={"Authorization": f"Bearer {resolved}", "Accept": "application/json"},
    )


def first_account_id(accounts_resp: dict[str, Any]) -> str | None:
    results = accounts_resp.get("results") or []
    if not results:
        return None
    return results[0].get("account_id")


def call_endpoint(env: dict[str, str], endpoint_id: str, body: dict[str, Any] | None = None) -> tuple[bool, dict[str, Any]]:
    body = body or {}

    if endpoint_id == "auth-link":
        link = build_auth_link(env)
        return True, {
            "endpointId": endpoint_id,
            "data": {
                "auth_link": link,
                "environment": "sandbox" if _is_sandbox_client(env) else "live",
                "auth_base": auth_base(env),
                "redirect_uri": redirect_uri(env),
                "mock_bank_login": env.get("TRUELAYER_MOCK_USERNAME", "john")
                + " / "
                + env.get("TRUELAYER_MOCK_PASSWORD", "doe"),
                "steps": [
                    "Open auth_link in browser",
                    "Choose Mock Bank, log in",
                    "Copy code from sandbox redirect page",
                    "Run exchange with TRUELAYER_AUTH_CODE or UI Exchange button",
                ],
            },
        }

    if endpoint_id == "exchange":
        code = body.get("code") or env.get("TRUELAYER_AUTH_CODE", "").strip()
        if not code:
            return False, {"error": "No auth code — set TRUELAYER_AUTH_CODE or POST { \"code\": \"...\" }"}
        ok, data = exchange_code(env, code)
        return ok, {"endpointId": endpoint_id, "data": data}

    token = resolve_access_token(env, body.get("institutionId"))
    if not token:
        return False, {
            "endpointId": endpoint_id,
            "error": "No access token — complete auth-link + exchange first.",
        }

    env = dict(env)
    env["TRUELAYER_ACCESS_TOKEN"] = token

    if endpoint_id == "accounts":
        data = bearer_get(env, "/data/v1/accounts")
        ok = "error" not in data and "results" in data
        return ok, {
            "endpointId": endpoint_id,
            "request": {"method": "GET", "path": "/data/v1/accounts"},
            "data": data,
        }

    if endpoint_id == "balances":
        accounts = bearer_get(env, "/data/v1/accounts")
        account_id = body.get("accountId") or first_account_id(accounts)
        if not account_id:
            return False, {"error": "No accounts found", "accounts": accounts}
        path = f"/data/v1/accounts/{account_id}/balance"
        data = bearer_get(env, path)
        ok = "error" not in data
        return ok, {
            "endpointId": endpoint_id,
            "request": {"method": "GET", "path": path, "account_id": account_id},
            "data": data,
        }

    if endpoint_id == "transactions":
        days = int(env.get("TRUELAYER_TRANSACTIONS_DAYS", "90"))
        end = date.today()
        start = end - timedelta(days=days)
        accounts = bearer_get(env, "/data/v1/accounts")
        account_id = body.get("accountId") or first_account_id(accounts)
        if not account_id:
            return False, {"error": "No accounts found", "accounts": accounts}
        qs = urllib.parse.urlencode({"from": start.isoformat(), "to": end.isoformat()})
        path = f"/data/v1/accounts/{account_id}/transactions?{qs}"
        data = bearer_get(env, path)
        ok = "error" not in data
        return ok, {
            "endpointId": endpoint_id,
            "request": {
                "method": "GET",
                "path": path,
                "account_id": account_id,
                "from": start.isoformat(),
                "to": end.isoformat(),
            },
            "data": data,
        }

    return False, {"error": f"Unknown endpoint: {endpoint_id}"}
