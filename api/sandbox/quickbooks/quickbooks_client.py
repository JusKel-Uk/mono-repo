"""QuickBooks Online sandbox client — shared by test.sh and the local explorer UI."""

from __future__ import annotations

import base64
import json
import re
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
DEFAULT_API_BASE = "https://sandbox-quickbooks.api.intuit.com/v3/company"
AUTH_URL = "https://appcenter.intuit.com/connect/oauth2"
TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"
DEFAULT_SCOPE = "com.intuit.quickbooks.accounting"
DEFAULT_REDIRECT = "http://127.0.0.1:8769/callback"
DEFAULT_MINOR = "65"

ENDPOINTS: list[dict[str, Any]] = [
    {"id": "auth-link", "label": "Connect sandbox company", "group": "setup", "needsToken": False},
    {"id": "exchange", "label": "Exchange code → token", "group": "setup", "needsToken": False},
    {"id": "refresh", "label": "Refresh access token", "group": "setup", "needsToken": False},
    {"id": "accounting-assessment", "label": "Accounting profile assessment (PDF)", "group": "assessment", "needsToken": True},
    {"id": "companyinfo", "label": "Company info", "group": "data", "needsToken": True},
    {"id": "profit-and-loss", "label": "Profit and loss (current period)", "group": "data", "needsToken": True},
    {"id": "profit-and-loss-prior", "label": "Profit and loss (prior year)", "group": "data", "needsToken": True},
    {"id": "balance-sheet", "label": "Balance sheet", "group": "data", "needsToken": True},
    {"id": "aged-receivables", "label": "Aged receivables", "group": "data", "needsToken": True},
    {"id": "aged-payables", "label": "Aged payables", "group": "data", "needsToken": True},
    {"id": "cash-flow", "label": "Cash flow statement", "group": "data", "needsToken": True},
    {"id": "accounts", "label": "Chart of accounts (sample)", "group": "data", "needsToken": True},
    {"id": "accounts-all", "label": "Chart of accounts (paginated)", "group": "data", "needsToken": True},
    {"id": "loan-accounts", "label": "Loan / borrowing accounts", "group": "data", "needsToken": True},
]

GROUPS = [
    {"id": "setup", "label": "Setup"},
    {"id": "assessment", "label": "PDF accounting assessment"},
    {"id": "data", "label": "Individual reports"},
]


def load_secrets() -> dict[str, str]:
    secrets_path = ROOT / "secrets.env"
    if not secrets_path.is_file():
        raise FileNotFoundError(
            "Missing secrets.env — copy secrets.env.example and set QUICKBOOKS_CLIENT_ID / QUICKBOOKS_CLIENT_SECRET"
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


def persist_tokens(*, access_token: str | None = None, refresh_token: str | None = None, realm_id: str | None = None) -> None:
    if access_token:
        _persist_secret("QUICKBOOKS_ACCESS_TOKEN", access_token)
    if refresh_token:
        _persist_secret("QUICKBOOKS_REFRESH_TOKEN", refresh_token)
    if realm_id:
        _persist_secret("QUICKBOOKS_REALM_ID", realm_id)


def api_base(env: dict[str, str]) -> str:
    return env.get("QUICKBOOKS_API_BASE_URL", DEFAULT_API_BASE).rstrip("/")


def redirect_uri(env: dict[str, str]) -> str:
    # Process env wins so a one-shot ngrok URL does not have to be written into secrets.env.
    from_process = __import__("os").environ.get("QUICKBOOKS_REDIRECT_URI", "").strip()
    if from_process:
        return from_process
    return env.get("QUICKBOOKS_REDIRECT_URI", DEFAULT_REDIRECT).strip() or DEFAULT_REDIRECT


def minor_version(env: dict[str, str]) -> str:
    return env.get("QUICKBOOKS_MINOR_VERSION", DEFAULT_MINOR).strip() or DEFAULT_MINOR


def report_dates(env: dict[str, str]) -> tuple[str, str]:
    start = env.get("QUICKBOOKS_REPORT_START_DATE", "2026-01-01").strip() or "2026-01-01"
    end = env.get("QUICKBOOKS_REPORT_END_DATE", "2026-12-31").strip() or "2026-12-31"
    return start, end


def prior_report_dates(env: dict[str, str]) -> tuple[str, str]:
    from datetime import date

    start, end = report_dates(env)
    s = date.fromisoformat(start)
    e = date.fromisoformat(end)
    return s.replace(year=s.year - 1).isoformat(), e.replace(year=e.year - 1).isoformat()


def _basic_auth(env: dict[str, str]) -> str:
    raw = f"{env['QUICKBOOKS_CLIENT_ID']}:{env['QUICKBOOKS_CLIENT_SECRET']}"
    return base64.b64encode(raw.encode()).decode()


def http_request(
    url: str,
    method: str = "GET",
    headers: dict[str, str] | None = None,
    data: dict[str, str] | None = None,
) -> dict[str, Any]:
    hdrs = dict(headers or {})
    payload: bytes | None = None
    if data is not None:
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
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            parsed = {"error": "HTTP_ERROR", "message": raw}
        parsed.setdefault("status", exc.code)
        parsed.setdefault("error", parsed.get("fault") or parsed.get("Fault") or "HTTP_ERROR")
        return parsed
    except urllib.error.URLError as exc:
        return {"error": "NETWORK_ERROR", "message": str(exc.reason)}


def build_auth_link(env: dict[str, str]) -> str:
    params = {
        "client_id": env["QUICKBOOKS_CLIENT_ID"],
        "response_type": "code",
        "scope": env.get("QUICKBOOKS_SCOPE", DEFAULT_SCOPE),
        "redirect_uri": redirect_uri(env),
        "state": env.get("QUICKBOOKS_STATE", "juskel-qb-sandbox"),
    }
    return f"{AUTH_URL}?{urllib.parse.urlencode(params)}"


def exchange_code(env: dict[str, str], code: str, realm_id: str = "") -> tuple[bool, dict[str, Any]]:
    resp = http_request(
        TOKEN_URL,
        method="POST",
        headers={
            "Accept": "application/json",
            "Authorization": f"Basic {_basic_auth(env)}",
        },
        data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri(env),
        },
    )
    if resp.get("error") or not resp.get("access_token"):
        return False, resp
    persist_tokens(
        access_token=resp["access_token"],
        refresh_token=resp.get("refresh_token"),
        realm_id=realm_id or None,
    )
    return True, {
        "access_token_saved": True,
        "expires_in": resp.get("expires_in"),
        "realm_id": realm_id or env.get("QUICKBOOKS_REALM_ID", ""),
        "message": "Tokens saved to secrets.env. You can now fetch company info and reports.",
    }


def refresh_access_token(env: dict[str, str]) -> tuple[bool, dict[str, Any]]:
    refresh = env.get("QUICKBOOKS_REFRESH_TOKEN", "").strip()
    if not refresh:
        return False, {"error": "No QUICKBOOKS_REFRESH_TOKEN — connect a sandbox company first."}
    resp = http_request(
        TOKEN_URL,
        method="POST",
        headers={
            "Accept": "application/json",
            "Authorization": f"Basic {_basic_auth(env)}",
        },
        data={"grant_type": "refresh_token", "refresh_token": refresh},
    )
    if resp.get("error") or not resp.get("access_token"):
        return False, resp
    persist_tokens(access_token=resp["access_token"], refresh_token=resp.get("refresh_token"))
    return True, {
        "access_token_saved": True,
        "expires_in": resp.get("expires_in"),
        "message": "Access token refreshed and saved to secrets.env.",
    }


def _is_ok(data: dict[str, Any]) -> bool:
    return not data.get("error") and "Fault" not in data and "fault" not in data


def bearer_get(env: dict[str, str], path: str) -> dict[str, Any]:
    token = env.get("QUICKBOOKS_ACCESS_TOKEN", "").strip()
    url = f"{api_base(env)}{path}"
    return http_request(
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        },
    )


def _maybe_refresh_and_retry(env: dict[str, str], path: str, data: dict[str, Any]) -> tuple[dict[str, str], dict[str, Any]]:
    status = data.get("status")
    if status not in (401, 403):
        return env, data
    ok, _ = refresh_access_token(env)
    if not ok:
        return env, data
    env = load_secrets()
    return env, bearer_get(env, path)


def call_endpoint(env: dict[str, str], endpoint_id: str, body: dict[str, Any] | None = None) -> tuple[bool, dict[str, Any]]:
    body = body or {}

    if endpoint_id == "auth-link":
        link = build_auth_link(env)
        return True, {
            "endpointId": endpoint_id,
            "data": {
                "auth_link": link,
                "redirect_uri": redirect_uri(env),
                "scope": env.get("QUICKBOOKS_SCOPE", DEFAULT_SCOPE),
                "steps": [
                    "Whitelist the redirect URI in Intuit Developer → Keys & OAuth (Development)",
                    "Open the auth link and sign in to a sandbox company",
                    "You return here; tokens are saved to secrets.env",
                ],
            },
        }

    if endpoint_id == "exchange":
        code = (body.get("code") or "").strip()
        realm_id = (body.get("realmId") or "").strip()
        if not code:
            return False, {"error": "No auth code — complete Connect, or paste the code from the Intuit redirect."}
        ok, data = exchange_code(env, code, realm_id)
        return ok, {"endpointId": endpoint_id, "data": data}

    if endpoint_id == "refresh":
        ok, data = refresh_access_token(env)
        return ok, {"endpointId": endpoint_id, "data": data}

    token = env.get("QUICKBOOKS_ACCESS_TOKEN", "").strip()
    realm = env.get("QUICKBOOKS_REALM_ID", "").strip()
    if not token or not realm:
        return False, {
            "endpointId": endpoint_id,
            "error": "No access token / realm ID — click Connect sandbox company first.",
        }

    if endpoint_id == "accounting-assessment":
        from accounting_probe import run_assessment

    assessment = run_assessment(env)
    if assessment.get("error"):
        return False, {"endpointId": endpoint_id, "error": assessment["error"]}
    if assessment.get("summary", {}).get("apiErrors") and assessment.get("company", {}).get("name") is None:
        auth_errors = [e for e in assessment["summary"]["apiErrors"] if "401" in e or "Token expired" in e or "AUTHENTICATION" in e]
        if auth_errors:
            assessment["authRequired"] = True
            assessment["authHelp"] = (
                "Access token expired. Run: cd ui && ./run-ui.sh — open http://127.0.0.1:8769 "
                "and click Connect sandbox company (tokens save to secrets.env automatically)."
            )
    return True, {"endpointId": endpoint_id, "data": assessment}

    minor = minor_version(env)
    start, end = report_dates(env)
    prior_start, prior_end = prior_report_dates(env)

    paths = {
        "companyinfo": f"/{realm}/companyinfo/{realm}?minorversion={minor}",
        "profit-and-loss": (
            f"/{realm}/reports/ProfitAndLoss"
            f"?start_date={start}&end_date={end}&minorversion={minor}"
        ),
        "profit-and-loss-prior": (
            f"/{realm}/reports/ProfitAndLoss"
            f"?start_date={prior_start}&end_date={prior_end}&minorversion={minor}"
        ),
        "balance-sheet": f"/{realm}/reports/BalanceSheet?date={end}&minorversion={minor}",
        "aged-receivables": f"/{realm}/reports/AgedReceivables?report_date={end}&minorversion={minor}",
        "aged-payables": f"/{realm}/reports/AgedPayables?report_date={end}&minorversion={minor}",
        "cash-flow": (
            f"/{realm}/reports/CashFlow"
            f"?start_date={start}&end_date={end}&minorversion={minor}"
        ),
        "accounts": (
            f"/{realm}/query?query="
            + urllib.parse.quote("select * from Account maxresults 25")
            + f"&minorversion={minor}"
        ),
    }
    path = paths.get(endpoint_id)
    if path:
        data = bearer_get(env, path)
        env, data = _maybe_refresh_and_retry(env, path, data)
        return _is_ok(data), {
            "endpointId": endpoint_id,
            "request": {"method": "GET", "path": path},
            "data": data,
        }

    if endpoint_id == "accounts-all":
        from accounting_probe import fetch_all_accounts

        env, accounts, errors = fetch_all_accounts(env, realm, minor)
        return (not errors), {
            "endpointId": endpoint_id,
            "data": {
                "accountCount": len(accounts),
                "errors": errors,
                "QueryResponse": {"Account": accounts},
            },
        }

    if endpoint_id == "loan-accounts":
        from accounting_probe import LOAN_ACCOUNT_SUBTYPES, LOAN_ACCOUNT_TYPES, fetch_all_accounts

        env, accounts, errors = fetch_all_accounts(env, realm, minor)
        loans = [
            acc
            for acc in accounts
            if (acc.get("AccountType") in LOAN_ACCOUNT_TYPES or acc.get("AccountSubType") in LOAN_ACCOUNT_SUBTYPES)
            and acc.get("AccountSubType") not in {"AccountsPayable", "PayrollTaxPayable"}
        ]
        return (not errors), {
            "endpointId": endpoint_id,
            "data": {
                "loanAccountCount": len(loans),
                "errors": errors,
                "accounts": loans,
            },
        }

    return False, {"error": f"Unknown endpoint: {endpoint_id}"}
