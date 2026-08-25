"""Plaid sandbox client — shared by test.sh patterns and local UI server."""

from __future__ import annotations

import json
import re
import urllib.error
import urllib.request
from datetime import date, timedelta
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
DEFAULT_BASE = "https://sandbox.plaid.com"
SIMPLE_INSTITUTION = "ins_109508"
UK_INSTITUTION = "ins_116834"

ENDPOINTS: list[dict[str, Any]] = [
    {"id": "setup-simple", "label": "Connect sandbox (simple)", "group": "setup", "needsToken": False},
    {"id": "setup-uk", "label": "Connect sandbox (UK bank)", "group": "setup", "needsToken": False},
    {"id": "accounts", "label": "Accounts", "group": "data", "needsToken": True},
    {"id": "balances", "label": "Balances (auth)", "group": "data", "needsToken": True},
    {"id": "transactions", "label": "Transactions", "group": "data", "needsToken": True},
    {"id": "institutions", "label": "UK institutions list", "group": "meta", "needsToken": False},
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
            "Missing secrets.env — copy secrets.env.example and set PLAID_CLIENT_ID / PLAID_SECRET"
        )
    env: dict[str, str] = {}
    for line in secrets_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        key, _, value = line.partition("=")
        env[key.strip()] = value.strip()
    return env


def persist_access_token(token: str) -> None:
    secrets_path = ROOT / "secrets.env"
    text = secrets_path.read_text()
    if re.search(r"^PLAID_ACCESS_TOKEN=", text, re.MULTILINE):
        text = re.sub(
            r"^PLAID_ACCESS_TOKEN=.*",
            f"PLAID_ACCESS_TOKEN={token}",
            text,
            count=1,
            flags=re.MULTILINE,
        )
    else:
        text = text.rstrip() + f"\nPLAID_ACCESS_TOKEN={token}\n"
    secrets_path.write_text(text)


def _products_list(env: dict[str, str]) -> list[str]:
    raw = env.get("PLAID_PRODUCTS", "transactions,auth")
    return [p.strip() for p in raw.split(",") if p.strip()]


def plaid_post(base_url: str, body: dict[str, Any]) -> dict[str, Any]:
    endpoint = body.get("_endpoint", "")
    payload_body = {k: v for k, v in body.items() if k != "_endpoint"}
    url = base_url.rstrip("/") + "/" + endpoint
    payload = json.dumps(payload_body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        method="POST",
        headers={"Content-Type": "application/json", "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode(errors="replace")
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {"error_type": "HTTP_ERROR", "error_code": str(exc.code), "error_message": raw}


def base_credentials(env: dict[str, str]) -> dict[str, str]:
    return {
        "client_id": env["PLAID_CLIENT_ID"],
        "secret": env["PLAID_SECRET"],
    }


def build_public_token_body(env: dict[str, str], institution_id: str) -> dict[str, Any]:
    return {
        **base_credentials(env),
        "institution_id": institution_id,
        "initial_products": _products_list(env),
        "options": {
            "override_username": env.get("PLAID_SANDBOX_USERNAME", "user_good"),
            "override_password": env.get("PLAID_SANDBOX_PASSWORD", "pass_good"),
        },
    }


def setup_access_token(env: dict[str, str], institution_id: str) -> tuple[bool, dict[str, Any]]:
    base_url = env.get("PLAID_API_BASE_URL", DEFAULT_BASE)
    create_body = build_public_token_body(env, institution_id)
    create_body["_endpoint"] = "sandbox/public_token/create"
    create_resp = plaid_post(base_url, create_body)
    if create_resp.get("error_code"):
        return False, {
            "step": "sandbox/public_token/create",
            "institution_id": institution_id,
            "plaid": create_resp,
        }

    public_token = create_resp.get("public_token")
    if not public_token:
        return False, {"step": "sandbox/public_token/create", "plaid": create_resp}

    exchange_body = {
        **base_credentials(env),
        "public_token": public_token,
        "_endpoint": "item/public_token/exchange",
    }
    exchange_resp = plaid_post(base_url, exchange_body)
    if exchange_resp.get("error_code"):
        return False, {
            "step": "item/public_token/exchange",
            "institution_id": institution_id,
            "plaid": exchange_resp,
        }

    access = exchange_resp.get("access_token")
    if not access:
        return False, {"step": "item/public_token/exchange", "plaid": exchange_resp}

    persist_access_token(access)
    return True, {
        "access_token": access,
        "item_id": exchange_resp.get("item_id"),
        "institution_id": institution_id,
        "message": "Access token saved to secrets.env as PLAID_ACCESS_TOKEN",
    }


def call_endpoint(env: dict[str, str], endpoint_id: str) -> tuple[bool, dict[str, Any]]:
    base_url = env.get("PLAID_API_BASE_URL", DEFAULT_BASE)

    if endpoint_id == "setup-simple":
        ok, data = setup_access_token(env, SIMPLE_INSTITUTION)
        return ok, {"endpointId": endpoint_id, "data": data, "request": {"institution_id": SIMPLE_INSTITUTION}}

    if endpoint_id == "setup-uk":
        inst = env.get("PLAID_SANDBOX_INSTITUTION_ID", UK_INSTITUTION)
        ok, data = setup_access_token(env, inst)
        return ok, {"endpointId": endpoint_id, "data": data, "request": {"institution_id": inst}}

    if endpoint_id == "institutions":
        country = env.get("PLAID_COUNTRY_CODES", "GB")
        body = {
            **base_credentials(env),
            "country_codes": [country],
            "count": 10,
            "offset": 0,
            "_endpoint": "institutions/get",
        }
        data = plaid_post(base_url, body)
        ok = not data.get("error_code")
        return ok, {
            "endpointId": endpoint_id,
            "request": {"method": "POST", "path": "/institutions/get", "country_codes": [country]},
            "data": data,
        }

    token = env.get("PLAID_ACCESS_TOKEN", "").strip()
    if not token:
        return False, {
            "endpointId": endpoint_id,
            "error": "No PLAID_ACCESS_TOKEN — run Connect sandbox (simple) first.",
        }

    body_base = {**base_credentials(env), "access_token": token}

    if endpoint_id == "accounts":
        body = {**body_base, "_endpoint": "accounts/get"}
        data = plaid_post(base_url, body)
        ok = not data.get("error_code")
        return ok, {"endpointId": endpoint_id, "request": {"method": "POST", "path": "/accounts/get"}, "data": data}

    if endpoint_id == "balances":
        body = {**body_base, "_endpoint": "auth/get"}
        data = plaid_post(base_url, body)
        ok = not data.get("error_code")
        return ok, {"endpointId": endpoint_id, "request": {"method": "POST", "path": "/auth/get"}, "data": data}

    if endpoint_id == "transactions":
        days = int(env.get("PLAID_TRANSACTIONS_DAYS", "90"))
        end = date.today()
        start = end - timedelta(days=days)
        body = {
            **body_base,
            "_endpoint": "transactions/get",
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
        }
        data = plaid_post(base_url, body)
        ok = not data.get("error_code")
        return ok, {
            "endpointId": endpoint_id,
            "request": {
                "method": "POST",
                "path": "/transactions/get",
                "start_date": start.isoformat(),
                "end_date": end.isoformat(),
            },
            "data": data,
        }

    return False, {"error": f"Unknown endpoint: {endpoint_id}"}
